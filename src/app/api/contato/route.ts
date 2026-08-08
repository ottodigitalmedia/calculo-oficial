import { createTransport } from 'nodemailer'

import { porSlug } from '@/lib/calculadoras'
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
 * Limite de frequência por endereço, em memória.
 *
 * **Em memória de propósito**, e não em banco: `ADR-002` não abre exceção para
 * antispam. O contêiner é único, então um mapa no processo cobre o caso real.
 * Reiniciar zera o histórico — o que é aceitável, porque o custo de um envio a
 * mais é um e-mail, não um dano.
 *
 * O mapa é **limitado**: sem teto, uma enxurrada de endereços distintos viraria
 * consumo de memória sem fim, que é o próprio ataque que ele deveria conter.
 */
const JANELA_MS = 10 * 60 * 1_000
const MAXIMO_NA_JANELA = 3
const TETO_DE_ENDERECOS = 5_000
const historico = new Map<string, number[]>()

function excedeuFrequencia(chave: string, agora: number): boolean {
  if (historico.size > TETO_DE_ENDERECOS) historico.clear()

  const recentes = (historico.get(chave) ?? []).filter((t) => agora - t < JANELA_MS)
  if (recentes.length >= MAXIMO_NA_JANELA) {
    historico.set(chave, recentes)
    return true
  }
  recentes.push(agora)
  historico.set(chave, recentes)
  return false
}

/**
 * O identificador de quem envia, para o limite de frequência.
 *
 * Atrás do proxy do painel, o endereço real vem em `x-forwarded-for`. Cai para
 * uma chave fixa quando não há cabeçalho: nesse caso o limite passa a valer para
 * o site inteiro, que é conservador na direção certa.
 */
function chaveDeOrigem(request: Request): string {
  const encaminhado = request.headers.get('x-forwarded-for') ?? ''
  return encaminhado.split(',')[0]?.trim() || 'sem-endereco'
}

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
  let bruta: unknown
  try {
    bruta = await request.json()
  } catch {
    return json({ ok: false, erros: ['Não foi possível ler o formulário.'] }, 400)
  }

  const c = bruta as Record<string, unknown>
  const veredito = validarMensagem(
    {
      motivo: String(c['motivo'] ?? ''),
      mensagem: String(c['mensagem'] ?? ''),
      email: String(c['email'] ?? ''),
      calculadora: String(c['calculadora'] ?? ''),
      site: String(c['site'] ?? ''),
      decorridoMs: Number(c['decorridoMs'] ?? 0),
    },
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

  if (excedeuFrequencia(chaveDeOrigem(request), Date.now())) {
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
