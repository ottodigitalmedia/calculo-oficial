/**
 * Estado do formulário na query string — `RF-006`, `06-api-spec` §2.3.
 *
 * É o que entrega "salvar cálculo" **sem banco e sem conta**, e é o que torna
 * `ADR-002` sustentável: a URL carrega o cenário inteiro, é copiável,
 * compartilhável e salvável nos favoritos.
 *
 * A query contém salário e dados de contrato. Duas consequências, ambas
 * tratadas em `07-security` §4.3:
 *
 *   - página com query recebe `noindex`, para não ser indexada com dados de
 *     alguém;
 *   - a query **nunca** é transmitida a terceiro (regra R-2) — nem à ferramenta
 *     de análise, nem ao registro de erro.
 */

import type { Campo, ValoresFormulario } from './calculadoras/tipos'

/** Nome do parâmetro de data de referência. */
export const PARAM_REFERENCIA = 'ref'

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/

/**
 * Lê o estado a partir de uma query string.
 *
 * Parâmetro desconhecido é ignorado em silêncio; valor fora do domínio cai no
 * padrão do campo. Nunca lança: uma URL adulterada é situação esperada, não
 * defeito, e derrubar a página por causa dela puniria quem só clicou num link.
 */
export function lerDaUrl(
  campos: readonly Campo[],
  busca: string,
): { readonly valores: ValoresFormulario; readonly referencia: string | null } {
  const params = new URLSearchParams(busca)
  const valores: Record<string, number | string> = {}

  for (const campo of campos) {
    const bruto = params.get(campo.id)
    if (bruto === null) continue

    if (campo.tipo === 'selecao') {
      // Só aceita opção declarada. Valor inventado cai no padrão.
      if (campo.opcoes?.some((o) => o.valor === bruto && !o.indisponivel)) {
        valores[campo.id] = bruto
      }
      continue
    }

    // Monetário e percentual viajam em unidade inteira — centavos e basis
    // points —, sem separador. É a mesma unidade do motor, então não há
    // conversão no caminho e não há como perder um centavo aqui.
    const n = Number(bruto)
    if (!Number.isInteger(n) || n < 0) continue
    if (campo.maximo !== undefined && n > campo.maximo) continue
    valores[campo.id] = n
  }

  const ref = params.get(PARAM_REFERENCIA)
  return {
    valores,
    referencia: ref !== null && FORMATO_DATA.test(ref) ? ref : null,
  }
}

/**
 * Monta a query string do estado atual.
 *
 * Campo em valor padrão é omitido: a URL de um formulário recém-aberto fica
 * limpa, e o link compartilhado carrega só o que a pessoa de fato informou.
 */
export function escreverNaUrl(
  campos: readonly Campo[],
  valores: ValoresFormulario,
  referencia: string | null,
  referenciaPadrao: string | null = null,
): string {
  const params = new URLSearchParams()

  for (const campo of campos) {
    const v = valores[campo.id]
    if (v === undefined) continue
    const padrao = campo.padrao ?? (campo.tipo === 'selecao' ? '' : 0)
    if (v === padrao) continue
    if (v === 0 || v === '') continue
    params.set(campo.id, String(v))
  }

  // Só entra quando o usuário TROCOU o período. Escrever a referência padrão
  // daria query a toda página recém-aberta — e query implica `noindex`, o que
  // tiraria do índice todas as calculadoras. O único canal de aquisição do
  // produto é a busca orgânica, então o defeito seria fatal e silencioso.
  if (referencia !== null && referencia !== referenciaPadrao) {
    params.set(PARAM_REFERENCIA, referencia)
  }

  const s = params.toString()
  return s === '' ? '' : `?${s}`
}

/**
 * Aplica ou remove `noindex` conforme a query.
 *
 * A página é gerada estaticamente, então a query não existe no build e o
 * `noindex` não pode vir do servidor. Feito no cliente, que é onde a query
 * aparece — e os buscadores executam JavaScript.
 *
 * A canônica continua apontando para a rota **sem** query, definida no
 * servidor por `generateMetadata`.
 */
export function ajustarIndexacao(temQuery: boolean): void {
  if (typeof document === 'undefined') return

  const existente = document.querySelector('meta[name="robots"][data-query]')
  if (temQuery) {
    if (existente) return
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'robots')
    meta.setAttribute('content', 'noindex, follow')
    meta.setAttribute('data-query', '1')
    document.head.appendChild(meta)
  } else {
    existente?.remove()
  }
}
