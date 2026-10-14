import { createTransport } from 'nodemailer'

import { porSlug } from '@/lib/calculadoras'
import {
  camposDe,
  chaveDeOrigem,
  lerCorpoLimitado,
  LimiteDeFrequencia,
  origemAceita,
} from '@/lib/contato/protecao'
import {
  ROTULO_DO_MOTIVO,
  validarMensagem,
  type MensagemValida,
} from '@/lib/contato/mensagem'

/**
 * `EP-017` — recebe a mensagem do formulário de contato e a envia por e-mail.
 *
 * ## A ÚNICA ROTA DESTE SITE QUE RECEBE TEXTO DE USUÁRIO
 *
 * Até 07/08/2026 nenhuma existia, e a página de privacidade dizia isso em letra.
 * O mantenedor decidiu ter formulário próprio; a página foi reescrita no mesmo
 * commit.
 *
 * **Nada é guardado.** Não há banco (`ADR-002`), e esta rota não escreve em
 * disco: ela valida, monta um e-mail e entrega ao servidor de correio. O destino
 * final da mensagem é a caixa de entrada do mantenedor, e é lá — não aqui — que
 * ela passa a existir.
 *
 * ## O QUE NÃO ENTRA NO E-MAIL, E POR QUÊ
 *
 * **Nem endereço de IP, nem `User-Agent`, nem referenciador.** É tentador
 * anexá-los "para ajudar a depurar", e seria coleta de dado que ninguém pediu,
 * numa mensagem que a pessoa pode ter escrito justamente por não querer se
 * identificar. O IP é usado **em memória**, para limitar frequência, e nunca é
 * transmitido nem persistido.
 *
 * **Nem a URL de origem.** `RF-006` põe o estado do formulário na query, então a
 * página de onde a pessoa veio carrega salário e saldo de FGTS. O vínculo com a
 * calculadora é o slug, validado contra o catálogo em `lib/contato/mensagem.ts`.
 *
 * ## SEM SMTP CONFIGURADO, A ROTA DIZ ISSO — E NÃO FINGE QUE ENVIOU
 *
 * `RNF-007` manda o produto funcionar com integração bloqueada, e aqui o
 * equivalente honesto não é "aceitar em silêncio": é responder que o canal está
 * indisponível e mostrar o endereço direto. Uma mensagem engolida é pior que um
 * formulário que se declara fora do ar.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface Correio {
  readonly host: string
  readonly porta: number
  readonly usuario: string
  readonly senha: string
  readonly de: string
  readonly para: string
}

/** Lida a cada requisição — ver a nota equivalente em `api/health`. */
function correio(): Correio | null {
  const host = process.env.SMTP_HOST ?? ''
  const usuario = process.env.SMTP_USER ?? ''
  const senha = process.env.SMTP_PASSWORD ?? ''
  const para = process.env.CONTATO_DESTINO ?? ''
  if (host === '' || usuario === '' || senha === '' || para === '') return null

  return {
    host,
    porta: Number(process.env.SMTP_PORT ?? '587'),
    usuario,
    senha,
    de: process.env.CONTATO_REMETENTE ?? usuario,
    para,
  }
}

/**
 * Limite de frequência — ver `lib/contato/protecao.ts`.
 *
 * Três mensagens por endereço a cada dez minutos, trinta por hora no site
 * inteiro, e até cinco mil endereços lembrados.
 */
const limite = new LimiteDeFrequencia(10 * 60 * 1_000, 3, 60 * 60 * 1_000, 30, 5_000)

function corpoDoEmail(m: MensagemValida): string {
  const linhas = [
    `Assunto: ${ROTULO_DO_MOTIVO[m.motivo]}`,
    m.calculadora === '' ? null : `Calculadora: ${m.calculadora}`,
    m.email === '' ? 'Resposta: não informou e-mail' : `Responder para: ${m.email}`,
    '',
    m.mensagem,
  ]
  return linhas.filter((l) => l !== null).join('\n')
}

function json(corpo: unknown, status: number): Response {
  return Response.json(corpo, {
    status,
    headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  })
}

export async function POST(request: Request): Promise<Response> {
  // Só o formulário deste site, e nunca um corpo maior que o formulário
  // consegue produzir (§7.100).
  if (!origemAceita(request.headers)) {
    return json({ ok: false, erros: ['Envie a mensagem pelo formulário do site.'] }, 403)
  }
  const texto = await lerCorpoLimitado(request)
  if (texto === null) {
    return json({ ok: false, erros: ['A mensagem é grande demais.'] }, 413)
  }

  let bruta: unknown
  try {
    bruta = JSON.parse(texto)
  } catch {
    return json({ ok: false, erros: ['Não foi possível ler o formulário.'] }, 400)
  }

  const veredito = validarMensagem(
    camposDe(bruta),
    /**
     * O catálogo entra AQUI, e não em `lib/contato/mensagem.ts`.
     *
     * Aquele módulo é importado pelo formulário, que é componente de cliente —
     * e o `import` do registro punha as 76 definições, o motor e as tabelas
     * legais no pacote de `/contato`: 328,4 kB para três campos. Do lado do
     * servidor o registro já está carregado e não custa nada.
     */
    (slug) => porSlug(slug) !== undefined,
  )

  /**
   * Robô recebe SUCESSO. Ver a nota do tipo `Veredito`: devolver "spam
   * detectado" é o retorno que ensina o robô a ajustar até passar.
   */
  if (veredito.tipo === 'descartar') return json({ ok: true }, 200)
  if (veredito.tipo === 'invalida') return json({ ok: false, erros: veredito.erros }, 422)

  if (limite.excedeu(chaveDeOrigem(request.headers), Date.now())) {
    return json(
      {
        ok: false,
        erros: ['Você enviou muitas mensagens em pouco tempo. Tente de novo em alguns minutos.'],
      },
      429,
    )
  }

  const config = correio()
  if (!config) {
    return json(
      {
        ok: false,
        indisponivel: true,
        erros: ['O envio pelo formulário está indisponível no momento.'],
      },
      503,
    )
  }

  try {
    const transporte = createTransport({
      host: config.host,
      port: config.porta,
      secure: config.porta === 465,
      auth: { user: config.usuario, pass: config.senha },
    })

    await transporte.sendMail({
      from: config.de,
      to: config.para,
      subject: `[Cálculo Oficial] ${ROTULO_DO_MOTIVO[veredito.mensagem.motivo]}`,
      text: corpoDoEmail(veredito.mensagem),
      /**
       * `replyTo` só quando há endereço — e ele já veio limpo de quebra de
       * linha por `limpoParaCabecalho`, que é o que impede injeção de cabeçalho.
       */
      ...(veredito.mensagem.email === '' ? {} : { replyTo: veredito.mensagem.email }),
    })

    return json({ ok: true }, 200)
  } catch {
    /**
     * O erro do servidor de correio NÃO volta para o cliente.
     *
     * Ele costuma trazer host, usuário e motivo da recusa — configuração que
     * `07-security` manda não enumerar. E o conteúdo da mensagem tampouco entra
     * em log: seria `RN-030` invertido, com o texto que a pessoa escreveu indo
     * parar no registro do servidor.
     */
    return json(
      {
        ok: false,
        indisponivel: true,
        erros: ['Não foi possível enviar agora. Tente de novo ou escreva direto por e-mail.'],
      },
      502,
    )
  }
}
