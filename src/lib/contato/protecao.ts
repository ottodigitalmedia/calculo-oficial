/**
 * As defesas de `api/contato` que não são validação de conteúdo.
 *
 * **Nasceram da auditoria de segurança de 14/10/2026 (§7.100)**, que provou
 * localmente quatro coisas contra a rota:
 *
 * 1. **Corpo sem limite.** `request.json()` lia tudo antes de validar: um POST
 *    de 150 MB levou o processo de 98 MB a 731 MB. Poucos em paralelo derrubam
 *    o contêiner — que é único — e com ele o site inteiro.
 * 2. **Chave do limite falsificável.** O limite usava o PRIMEIRO endereço de
 *    `x-forwarded-for`, que é o que o cliente escreve. O proxy do painel
 *    (Traefik) ACRESCENTA o endereço real no fim; é esse que vale.
 * 3. **Envio a partir de outro site.** Sem conferir origem nem tipo, qualquer
 *    página de terceiro podia fazer o navegador de seus visitantes enviar
 *    mensagens — cada uma de um endereço diferente, por baixo do limite.
 * 4. **JSON fora do formato derrubava a rota** com erro 500 (`null`, ou campos
 *    que não são texto).
 *
 * Funções puras sobre cabeçalhos e valores, para que cada uma tenha teste.
 */

/** O formulário tem três campos de texto curtos; 16 KB sobram com folga. */
export const CORPO_MAXIMO_EM_BYTES = 16 * 1024

/**
 * Lê o corpo até o limite, e desiste no primeiro byte além dele.
 *
 * O `content-length` declarado recusa cedo o caso honesto; a leitura com teto
 * recusa o desonesto, que omite o cabeçalho ou mente nele.
 */
export async function lerCorpoLimitado(
  request: Request,
  limite: number = CORPO_MAXIMO_EM_BYTES,
): Promise<string | null> {
  const declarado = Number(request.headers.get('content-length') ?? '0')
  if (declarado > limite) return null
  if (!request.body) return ''

  const leitor = request.body.getReader()
  const partes: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await leitor.read()
    if (done) break
    total += value.byteLength
    if (total > limite) {
      await leitor.cancel()
      return null
    }
    partes.push(value)
  }
  const tudo = new Uint8Array(total)
  let posicao = 0
  for (const p of partes) {
    tudo.set(p, posicao)
    posicao += p.byteLength
  }
  return new TextDecoder().decode(tudo)
}

/**
 * A requisição veio do formulário deste site?
 *
 * Exige `content-type: application/json` — o que o formulário envia, e o que
 * um `<form>` de outro site não consegue enviar sem disparar a checagem prévia
 * do navegador. E, quando o navegador informa, exige mesma origem: em
 * `sec-fetch-site` e em `origin`. Cliente que não informa nenhum dos dois não é
 * navegador de terceiro; segue para as outras defesas.
 */
export function origemAceita(cabecalhos: Headers): boolean {
  const tipo = cabecalhos.get('content-type') ?? ''
  if (!/^application\/json\b/i.test(tipo)) return false

  const site = cabecalhos.get('sec-fetch-site')
  if (site !== null && site !== 'same-origin') return false

  const origem = cabecalhos.get('origin')
  if (origem !== null) {
    const hospedeiro = cabecalhos.get('x-forwarded-host') ?? cabecalhos.get('host') ?? ''
    try {
      if (new URL(origem).host !== hospedeiro) return false
    } catch {
      return false
    }
  }
  return true
}

/**
 * O endereço de quem envia, para o limite de frequência.
 *
 * O ÚLTIMO de `x-forwarded-for`: o proxy acrescenta o endereço real no fim, e
 * o que vem antes foi escrito por quem fez a requisição. Sem cabeçalho, uma
 * chave fixa — o limite passa a valer para o site inteiro, que é conservador
 * na direção certa.
 */
export function chaveDeOrigem(cabecalhos: Headers): string {
  const encaminhado = cabecalhos.get('x-forwarded-for') ?? ''
  const enderecos = encaminhado
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e !== '')
  return enderecos.at(-1) ?? 'sem-endereco'
}

/** Os campos que a rota aceita, sempre como texto — ou vazios. */
export interface CamposRecebidos {
  readonly motivo: string
  readonly mensagem: string
  readonly email: string
  readonly calculadora: string
  readonly site: string
  readonly decorridoMs: number
}

/**
 * Converte o JSON recebido nos campos esperados, sem confiar no formato.
 *
 * `null`, lista, número, ou campo que não é texto viram vazio — e a validação
 * de conteúdo recusa com a mensagem de sempre, em vez de a rota cair com 500.
 */
export function camposDe(json: unknown): CamposRecebidos {
  const objeto =
    typeof json === 'object' && json !== null && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : {}
  const texto = (id: string) => (typeof objeto[id] === 'string' ? (objeto[id] as string) : '')
  const decorrido = objeto['decorridoMs']
  return {
    motivo: texto('motivo'),
    mensagem: texto('mensagem'),
    email: texto('email'),
    calculadora: texto('calculadora'),
    site: texto('site'),
    decorridoMs: typeof decorrido === 'number' && Number.isFinite(decorrido) ? decorrido : 0,
  }
}

/**
 * Limite de frequência em memória: por endereço e para o site inteiro.
 *
 * **Em memória de propósito**, e não em banco: `ADR-002` não abre exceção para
 * antispam. O contêiner é único, então um mapa no processo cobre o caso real.
 *
 * O teto GLOBAL existe porque o limite por endereço sozinho não segura quem
 * tem muitos endereços. Passando dele, a rota recusa por uma hora — o custo é
 * uma mensagem legítima adiada, contra uma caixa de entrada inundada.
 *
 * O mapa é limitado e descarta os endereços MAIS ANTIGOS, um a um. A versão
 * anterior zerava tudo ao passar do teto — o que zerava também o limite de
 * quem estava abusando.
 */
export class LimiteDeFrequencia {
  private readonly porEndereco = new Map<string, number[]>()
  private global: number[] = []

  constructor(
    private readonly janelaMs: number,
    private readonly maximoPorEndereco: number,
    private readonly janelaGlobalMs: number,
    private readonly maximoGlobal: number,
    private readonly tetoDeEnderecos: number,
  ) {}

  excedeu(chave: string, agora: number): boolean {
    this.global = this.global.filter((t) => agora - t < this.janelaGlobalMs)
    if (this.global.length >= this.maximoGlobal) return true

    const recentes = (this.porEndereco.get(chave) ?? []).filter((t) => agora - t < this.janelaMs)
    // Reinserir põe a chave no fim da ordem — a mais recente.
    this.porEndereco.delete(chave)
    if (recentes.length >= this.maximoPorEndereco) {
      this.porEndereco.set(chave, recentes)
      return true
    }
    recentes.push(agora)
    this.porEndereco.set(chave, recentes)
    this.global.push(agora)

    while (this.porEndereco.size > this.tetoDeEnderecos) {
      const maisAntiga = this.porEndereco.keys().next().value
      if (maisAntiga === undefined) break
      this.porEndereco.delete(maisAntiga)
    }
    return false
  }
}
