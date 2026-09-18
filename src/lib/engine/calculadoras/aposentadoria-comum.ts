/**
 * Peças comuns às regras de acesso à aposentadoria da EC nº 103/2019 —
 * CALC-103 a CALC-108.
 *
 * **A projeção é MÊS A MÊS.** A primeira versão de CALC-103 projetava ano a
 * ano, testando sempre o mesmo mês do calendário — e errava por um ano sempre
 * que o cumprimento caía no meio do ano. Mulher com 55 anos e 30 de
 * contribuição em junho de 2026 alcança os 100 pontos em DEZEMBRO de 2033; a
 * projeção anual dizia 2034. Quem cumpre os requisitos num mês já cumpriu: a
 * exigência do ano seguinte não desfaz o que foi alcançado.
 *
 * **Idade e tempo em meses inteiros**, que é o grão da entrada. A exigência de
 * cada mês é resolvida no registro pela data do primeiro dia daquele mês — as
 * escadas da Emenda mudam em 1º de janeiro, então o dia dentro do mês não muda
 * nada.
 */

import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

export type Sexo = 'mulher' | 'homem'

/** Meses de um ano. Unidade do calendário, não parâmetro legal. */
export const MESES_NO_ANO = 12

/** Os meses da entrada vão de 0 a 11 — o resto são anos. */
export const MESES_MAXIMO = MESES_NO_ANO - 1

/**
 * Até onde as projeções procuram: sessenta anos. Limite de busca, não
 * parâmetro legal — cobre quem começa a contribuir na adolescência.
 */
export const HORIZONTE_EM_MESES = 60 * MESES_NO_ANO

export type Resolvido = { readonly valor: number; readonly resolvida: VigenciaResolvida } | null

export function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

export function percentualDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { valor: r.resolvida.vigencia.valor.aliquotaBp, resolvida: r.resolvida }
}

export interface MesDoCalendario {
  readonly ano: number
  /** De 1 a 12. */
  readonly mes: number
}

/** O mês do calendário `meses` depois da data de referência. */
export function mesAdiante(dataReferencia: DataISO, meses: number): MesDoCalendario {
  const ano = Number(dataReferencia.slice(0, 4))
  const mes = Number(dataReferencia.slice(5, 7))
  const indice = ano * MESES_NO_ANO + (mes - 1) + meses
  return { ano: Math.floor(indice / MESES_NO_ANO), mes: (indice % MESES_NO_ANO) + 1 }
}

/** Data em que se resolve a exigência de um mês: o primeiro dia dele. */
export function primeiroDia(m: MesDoCalendario): DataISO {
  return `${m.ano}-${String(m.mes).padStart(2, '0')}-01` as DataISO
}

export function rotuloDoMes(m: MesDoCalendario): string {
  return `${String(m.mes).padStart(2, '0')}/${m.ano}`
}

/**
 * Primeiro mês, a partir do seguinte ao da referência, em que `cumpre` é
 * verdadeiro. `null` se nada cumprir dentro do horizonte.
 *
 * `cumpre` recebe quantos meses se passaram e a data em que a exigência
 * daquele mês deve ser resolvida.
 */
export function primeiroMesQueCumpre(
  dataReferencia: DataISO,
  cumpre: (mesesAdiante: number, data: DataISO) => boolean,
): number | null {
  for (let k = 1; k <= HORIZONTE_EM_MESES; k += 1) {
    if (cumpre(k, primeiroDia(mesAdiante(dataReferencia, k)))) return k
  }
  return null
}

/** "33 anos e 6 meses", "1 ano", "5 meses". */
export function descreverMeses(meses: number): string {
  const anos = Math.floor(meses / MESES_NO_ANO)
  const resto = meses % MESES_NO_ANO
  const a = anos === 1 ? '1 ano' : `${anos} anos`
  const m = resto === 1 ? '1 mês' : `${resto} meses`
  if (anos === 0) return m
  if (resto === 0) return a
  return `${a} e ${m}`
}

/**
 * Tempo em MEIOS meses — o grão do pedágio de 50%, que é metade de um número
 * inteiro de meses e por isso pode terminar em meio mês.
 */
export function descreverMeiosMeses(meiosMeses: number): string {
  const inteiros = Math.floor(meiosMeses / 2)
  const temMeio = meiosMeses % 2 === 1
  if (!temMeio) return descreverMeses(inteiros)
  if (inteiros === 0) return 'meio mês'
  return `${descreverMeses(inteiros)} e meio`
}

export interface EntradaIdadeETempo {
  readonly idadeAnos: number
  readonly idadeMeses: number
  readonly tempoAnos: number
  readonly tempoMeses: number
}

export type Validacao = { readonly ok: true } | { readonly ok: false; readonly motivo: 'entrada_invalida' | 'entrada_incompleta'; readonly detalhe: string }

/** Anos e meses inteiros sem sinal, com os meses de 0 a 11. */
export function validarAnosEMeses(pares: readonly (readonly [number, number])[]): Validacao {
  for (const [anos, meses] of pares) {
    if (!Number.isInteger(anos) || !Number.isInteger(meses) || anos < 0 || meses < 0) {
      return { ok: false, motivo: 'entrada_invalida', detalhe: 'Idade e tempo de contribuição precisam ser inteiros sem sinal.' }
    }
    if (meses > MESES_MAXIMO) {
      return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os meses vão de 0 a 11 — o resto são anos.' }
    }
  }
  return { ok: true }
}

export function emMeses(anos: number, meses: number): number {
  return anos * MESES_NO_ANO + meses
}
