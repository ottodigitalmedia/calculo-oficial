/**
 * Canal de contato — validação e antispam, puros.
 *
 * ## POR QUE ISTO EXISTE, E O QUE CUSTOU
 *
 * Até 07/08/2026 o site não tinha canal de contato nenhum, e a página de
 * privacidade dizia, em texto publicado: *"Não pedimos nome, e-mail, telefone ou
 * documento em nenhum ponto. Você não pode se identificar aqui, e isso é
 * deliberado."*
 *
 * O mantenedor decidiu ter formulário próprio sabendo que isso **torna aquela
 * frase falsa** e obriga a reescrevê-la. A página foi reescrita no mesmo commit
 * — política que descreve um produto que não existe mais é pior que política
 * nenhuma, e essa regra já estava escrita no cabeçalho daquela página.
 *
 * ## O QUE ESTE MÓDULO NÃO DEIXA ACONTECER
 *
 * **`RN-030` continua inviolável, e o risco aqui é real.** O site põe o estado
 * do formulário na query (`RF-006`), então a URL de quem está numa calculadora
 * carrega salário, pensão e saldo de FGTS. Anexar "a página de onde veio" a um
 * relato de erro seria a coisa mais natural do mundo a fazer — e mandaria o
 * holerite da pessoa por e-mail sem ela pedir.
 *
 * Por isso o único vínculo com a calculadora é o **slug**, validado contra o
 * catálogo. Não há campo de URL, não há referenciador, e o slug que não existir
 * é descartado em vez de repassado.
 *
 * ## O MÍNIMO NECESSÁRIO, E NADA ALÉM
 *
 * Não se pede nome. Não se pede telefone. O e-mail é **opcional** e serve a uma
 * finalidade só: responder. Quem não quiser resposta pode relatar um erro de
 * cálculo sem se identificar de forma alguma — que é o caso de uso que mais
 * importa para este produto.
 */

import { porSlug } from '../calculadoras'

export type MotivoDeContato = 'erro-de-calculo' | 'comercial' | 'outro'

const MOTIVOS: readonly MotivoDeContato[] = ['erro-de-calculo', 'comercial', 'outro']

/**
 * Limites do texto.
 *
 * O mínimo não é burocracia: um relato de erro com cinco caracteres não permite
 * conferir nada, e responder a ele custa uma ida e volta que a pessoa
 * provavelmente não vai completar. O máximo existe para o corpo do e-mail não
 * virar vetor de abuso.
 */
const MENSAGEM_MINIMA = 20
const MENSAGEM_MAXIMA = 5_000
const EMAIL_MAXIMO = 254

export interface MensagemBruta {
  readonly motivo: string
  readonly mensagem: string
  readonly email: string
  readonly calculadora: string
  /** Campo-armadilha: invisível na tela, preenchido por robô. */
  readonly site: string
  /** Milissegundos desde que o formulário foi montado. */
  readonly decorridoMs: number
}

export interface MensagemValida {
  readonly motivo: MotivoDeContato
  readonly mensagem: string
  /** Vazio quando a pessoa optou por não se identificar. */
  readonly email: string
  /** Vazio quando o relato não veio de uma calculadora. */
  readonly calculadora: string
}

export type Veredito =
  | { readonly tipo: 'valida'; readonly mensagem: MensagemValida }
  | { readonly tipo: 'invalida'; readonly erros: readonly string[] }
  /**
   * Robô. **Tratado como sucesso na resposta**, e não como erro.
   *
   * Devolver "spam detectado" ensina o robô a contornar: ele ajusta e tenta de
   * novo até passar. Devolver sucesso e descartar não ensina nada. O custo é
   * que um humano que caísse aqui por acaso ficaria sem saber — e é por isso que
   * as duas armadilhas são de coisas que humano não faz: preencher campo
   * invisível e enviar em menos de três segundos.
   */
  | { readonly tipo: 'descartar'; readonly motivo: string }

/** Menos de três segundos entre abrir e enviar não é leitura, é script. */
const TEMPO_MINIMO_MS = 3_000

/**
 * Aceita o que parece endereço e recusa o que claramente não é.
 *
 * Deliberadamente frouxa. Validar e-mail por expressão regular é um problema
 * conhecidamente mal resolvido, e o custo de recusar um endereço válido — perder
 * o contato de alguém que quis falar — é maior que o de aceitar um inválido, que
 * apenas faz a resposta voltar.
 */
function pareceEmail(valor: string): boolean {
  if (valor.length > EMAIL_MAXIMO) return false
  return /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(valor)
}

/**
 * Quebra de linha e caractere de controle fora do texto.
 *
 * O assunto e os cabeçalhos do e-mail são montados com estes valores. Um `\r\n`
 * dentro do e-mail de resposta permitiria injetar cabeçalho — acrescentar um
 * `Bcc:`, por exemplo, e transformar o formulário em relé de spam.
 */
function limpoParaCabecalho(valor: string): string {
  // eslint-disable-next-line no-control-regex -- é justamente o que se remove
  return valor.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').trim()
}

export function validarMensagem(bruta: MensagemBruta): Veredito {
  if (bruta.site.trim() !== '') {
    return { tipo: 'descartar', motivo: 'campo-armadilha preenchido' }
  }
  if (bruta.decorridoMs < TEMPO_MINIMO_MS) {
    return { tipo: 'descartar', motivo: `enviado em ${bruta.decorridoMs}ms` }
  }

  const erros: string[] = []

  const motivo = MOTIVOS.find((m) => m === bruta.motivo)
  if (!motivo) erros.push('Escolha o assunto da mensagem.')

  const texto = bruta.mensagem.trim()
  if (texto.length < MENSAGEM_MINIMA) {
    erros.push(
      `A mensagem precisa de pelo menos ${MENSAGEM_MINIMA} caracteres — descreva o que aconteceu.`,
    )
  }
  if (texto.length > MENSAGEM_MAXIMA) {
    erros.push(`A mensagem passa de ${MENSAGEM_MAXIMA} caracteres.`)
  }

  const email = limpoParaCabecalho(bruta.email)
  if (email !== '' && !pareceEmail(email)) {
    erros.push('O e-mail informado não parece válido. Deixe em branco se não quiser resposta.')
  }

  if (erros.length > 0) return { tipo: 'invalida', erros }

  /**
   * O slug entra só se existir no catálogo.
   *
   * Sem esta conferência, qualquer texto viajaria para o corpo do e-mail vindo
   * direto do cliente. Validar contra o catálogo faz o campo ser uma escolha
   * entre valores conhecidos, e não uma caixa de texto disfarçada.
   */
  const calculadora = porSlug(bruta.calculadora.trim()) ? bruta.calculadora.trim() : ''

  return {
    tipo: 'valida',
    // `motivo` é garantidamente definido aqui: `erros` estaria preenchido se não fosse.
    mensagem: { motivo: motivo as MotivoDeContato, mensagem: texto, email, calculadora },
  }
}

export const LIMITES = {
  mensagemMinima: MENSAGEM_MINIMA,
  mensagemMaxima: MENSAGEM_MAXIMA,
  tempoMinimoMs: TEMPO_MINIMO_MS,
} as const

export const ROTULO_DO_MOTIVO: Readonly<Record<MotivoDeContato, string>> = {
  'erro-de-calculo': 'Erro em um cálculo',
  comercial: 'Assunto comercial',
  outro: 'Outro assunto',
}
