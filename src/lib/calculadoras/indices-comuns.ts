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
}

export const INDICES: Readonly<Record<string, IndiceDisponivel>> = {
  ipca: { serie: 'ipca-mensal', nome: 'IPCA' },
  inpc: { serie: 'inpc-mensal', nome: 'INPC' },
  igpm: { serie: 'igpm-mensal', nome: 'IGP-M' },
}

/** Série vazia — o caso de primeira execução sem cache (`06-api-spec` §4.2). */
export const SERIE_VAZIA = { inicio: '', valores: [] as readonly number[] }

export function indiceEscolhido(chave: string): IndiceDisponivel {
  return INDICES[chave] ?? { serie: 'ipca-mensal', nome: 'IPCA' }
}

export function serieDoIndice(chave: string) {
  return SERIES_COMPACTAS[indiceEscolhido(chave).serie] ?? SERIE_VAZIA
}

/**
 * As opções do campo de seleção.
 *
 * Selic e TR entram **desabilitadas**, e não omitidas: as duas são séries
 * diárias na origem, e transformá-las em fator mensal exige uma convenção que
 * ainda não foi decidida. `indisponivel` existe para declarar o que falta em vez
 * de sugerir cobertura que não há — e omitir simplesmente faria o usuário
 * procurar o que não está lá.
 */
export const OPCOES_DE_INDICE: readonly OpcaoSelecao[] = [
  { valor: 'ipca', rotulo: 'IPCA — a inflação oficial' },
  { valor: 'inpc', rotulo: 'INPC — usado em reajuste salarial' },
  { valor: 'igpm', rotulo: 'IGP-M — usado em aluguel' },
  { valor: 'selic', rotulo: 'Selic', indisponivel: true },
  { valor: 'tr', rotulo: 'TR', indisponivel: true },
]

/** O mês (`AAAA-MM`) de um campo de data, que chega em `AAAA-MM-DD`. */
export function mesDe(valor: string): string {
  return valor.slice(0, 7)
}
