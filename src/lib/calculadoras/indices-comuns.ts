/**
 * O que CALC-060, CALC-061, CALC-063 e CALC-037 têm em comum.
 *
 * As quatro fazem a mesma conta — multiplicar índices mensais sobre um valor — e
 * respondem perguntas diferentes: quanto um valor vale hoje, quanto o dinheiro
 * perdeu, quanto o salário deveria ter subido, quanto o aluguel passa a ser.
 *
 * **Separar o que é comum aqui não é higiene, é o que impede divergência.** Se
 * cada uma montasse o próprio mapa de índices, quatro listas do mesmo conjunto
 * passariam a existir — e `indice.ts` já é o registro vivo de que duas listas do
 * mesmo conjunto divergem. Um índice novo entra em um lugar só.
 */

import { SERIES_COMPACTAS } from '../series/dados/compacto'
import type { OpcaoSelecao } from './tipos'

export interface IndiceDisponivel {
  readonly serie: string
  readonly nome: string
  /**
   * O QUE O ÍNDICE MEDE — DECLARADO, PARA QUE UM TESTE POSSA COBRAR.
   *
   * Sem este campo, "a lista de inflação só tem índice de inflação" seria um
   * comentário, e comentário não reprova ninguém. Com ele, acrescentar a Selic
   * à lista que `poder-de-compra` consome quebra a suíte na hora.
   *
   * A distinção não é acadêmica: preço e juro andam em patamares diferentes, e
   * corrigir por Selic uma pergunta de poder de compra devolve um número muito
   * maior, com a mesma aparência de resposta.
   */
  readonly mede: 'inflacao' | 'juro'
}

export const INDICES: Readonly<Record<string, IndiceDisponivel>> = {
  ipca: { serie: 'ipca-mensal', nome: 'IPCA', mede: 'inflacao' },
  inpc: { serie: 'inpc-mensal', nome: 'INPC', mede: 'inflacao' },
  igpm: { serie: 'igpm-mensal', nome: 'IGP-M', mede: 'inflacao' },
  selic: { serie: 'selic-mensal', nome: 'Selic', mede: 'juro' },
}

/** Série vazia — o caso de primeira execução sem cache (`06-api-spec` §4.2). */
export const SERIE_VAZIA = { inicio: '', valores: [] as readonly number[] }

export function indiceEscolhido(chave: string): IndiceDisponivel {
  return INDICES[chave] ?? { serie: 'ipca-mensal', nome: 'IPCA', mede: 'inflacao' }
}

export function serieDoIndice(chave: string) {
  return SERIES_COMPACTAS[indiceEscolhido(chave).serie] ?? SERIE_VAZIA
}

/**
 * As opções de **índice de inflação** — só elas.
 *
 * Quem usa esta lista pergunta quanto os preços subiram: `poder-de-compra`,
 * `reajuste-aluguel`, `reajuste-salarial` e `valor-futuro`. Nenhuma delas tem
 * resposta em Selic, que é taxa de juro e não medida de preço.
 *
 * ATÉ 07/08/2026 A SELIC ESTAVA AQUI, DESABILITADA, E ISSO ERA PIOR QUE OMITIR.
 *
 * Uma opção marcada "Em breve" promete que um dia ela responderá àquela
 * pergunta. Numa tela que pergunta *quanto meu dinheiro perdeu de poder de
 * compra*, a Selic nunca será a resposta — a promessa era de algo que não devia
 * chegar. Foi o que apareceu ao investigar a convenção que supostamente
 * faltava: o problema não era técnico, era de significado, e ele só se enxerga
 * olhando **quem** consome a lista, não a lista.
 *
 * Onde a Selic corrige de verdade é em `OPCOES_DE_CORRECAO`, abaixo.
 */
export const OPCOES_DE_INDICE: readonly OpcaoSelecao[] = [
  { valor: 'ipca', rotulo: 'IPCA — a inflação oficial' },
  { valor: 'inpc', rotulo: 'INPC — usado em reajuste salarial' },
  { valor: 'igpm', rotulo: 'IGP-M — usado em aluguel' },
]

/**
 * As opções de CALC-060, que corrige um valor por um índice qualquer.
 *
 * O catálogo nomeia essa calculadora *"Correção de valor por índice (IPCA,
 * INPC, IGP-M, SELIC, TR)"*: as cinco são escopo declarado, e só ali. Ela é a
 * única das cinco telas cuja pergunta — *quanto este valor virou* — admite um
 * critério que não seja inflação.
 *
 * A TR segue desabilitada, e agora por um motivo **medido** em vez de suposto:
 * a série 226 do Banco Central devolve uma observação por dia, cada uma com o
 * período mensal que começa naquele dia. Escolher qual dia vale é convenção do
 * contrato, não do site. A medição está no cadastro da série, em `series/tipos`.
 */
export const OPCOES_DE_CORRECAO: readonly OpcaoSelecao[] = [
  ...OPCOES_DE_INDICE,
  { valor: 'selic', rotulo: 'Selic — usada para atualizar débito federal' },
  { valor: 'tr', rotulo: 'TR', indisponivel: true },
]

/**
 * O acumulado dos últimos `n` meses publicados de um índice, em basis points.
 *
 * Serve de **referência** para as calculadoras de projeção, que pedem ao usuário
 * uma inflação futura: mostrar quanto o índice de fato acumulou nos últimos doze
 * meses dá lastro à premissa sem transformá-la em previsão do produto.
 *
 * Devolve `null` quando não há série — e nesse caso a referência simplesmente
 * não aparece, como manda `06-api-spec` §4.2.
 */
export function acumuladoDosUltimos(chave: string, n: number): number | null {
  const serie = serieDoIndice(chave)
  if (serie.valores.length === 0) return null

  const janela = serie.valores.slice(-n)
  if (janela.length === 0) return null

  // Mesma escala e mesma composição do motor: os índices se multiplicam.
  let fator = 1_000_000_000_000n
  for (const valor of janela) {
    fator = (fator * (1_000_000n + BigInt(valor))) / 1_000_000n
  }
  return Number(((fator - 1_000_000_000_000n) * 10_000n) / 1_000_000_000_000n)
}

/** O último mês publicado do índice, em `AAAA-MM`. */
export function ultimoMesDoIndice(chave: string): string | null {
  const serie = serieDoIndice(chave)
  if (serie.valores.length === 0 || serie.inicio === '') return null
  const [ano, mes] = serie.inicio.split('-').map(Number) as [number, number]
  const total = ano * 12 + (mes - 1) + serie.valores.length - 1
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

/** O mês (`AAAA-MM`) de um campo de data, que chega em `AAAA-MM-DD`. */
export function mesDe(valor: string): string {
  return valor.slice(0, 7)
}
