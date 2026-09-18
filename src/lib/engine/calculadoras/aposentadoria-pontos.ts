/**
 * CALC-103 — Regra de transição por pontos (EC nº 103/2019, art. 15).
 *
 * **A calculadora responde duas coisas, e a segunda é a que importa:** se os
 * requisitos já estão cumpridos hoje e, se não estão, em que ano eles serão —
 * mantida a contribuição.
 *
 * Três armadilhas que a conta precisa respeitar:
 *
 * 1. **pontos não bastam**: o art. 15 exige, cumulativamente, a pontuação E o
 *    tempo mínimo de contribuição (30 anos para mulher, 35 para homem). Quem
 *    soma pontos com idade alta e pouco tempo de contribuição não se aposenta
 *    por esta regra;
 * 2. **a exigência sobe um ponto por ano** até o teto — de modo que esperar um
 *    ano rende dois pontos (um de idade, um de contribuição) e custa um;
 * 3. **as frações contam** (§ 2º): meses entram na soma, e é por isso que a
 *    entrada aceita anos e meses.
 *
 * A regra é de TRANSIÇÃO: vale para quem já era filiado ao Regime Geral em
 * 13/11/2019. Quem se filiou depois segue a regra permanente — CALC-107.
 *
 * **A projeção é mês a mês desde 18/09/2026** — ver `aposentadoria-comum.ts`.
 * A versão anual errava por um ano quando o cumprimento caía no meio do ano.
 */

import { citar, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import {
  MESES_MAXIMO,
  MESES_NO_ANO,
  inteiroDe,
  mesAdiante,
  primeiroMesQueCumpre,
  rotuloDoMes,
  type Sexo,
} from './aposentadoria-comum'

export type { Sexo }

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

export interface EntradaRegraDePontos {
  readonly sexo: Sexo
  readonly idadeAnos: number
  readonly idadeMeses: number
  readonly tempoContribuicaoAnos: number
  readonly tempoContribuicaoMeses: number
}

export interface SaidaRegraDePontos {
  /** Pontos de hoje, em centésimos de ponto. */
  readonly pontosAtuaisCentesimos: number
  readonly pontosExigidos: number
  readonly tempoMinimoExigido: number
  readonly cumpreOsPontos: boolean
  readonly cumpreOTempo: boolean
  readonly cumpreTudo: boolean
  /** Ano em que os dois requisitos passam a ser cumpridos, mantida a contribuição. */
  readonly anoDeCumprimento: number | null
  /** Mês (1 a 12) do cumprimento, no mesmo ano. */
  readonly mesDeCumprimento: number | null
  /** Quantos meses faltam até lá. Zero quando já cumpre. */
  readonly mesesAteLa: number | null
  /** Pontuação exigida no ano de cumprimento. */
  readonly pontosExigidosNoAno: number | null
}

export function calcularRegraDePontos(
  entrada: EntradaRegraDePontos,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaRegraDePontos> {
  const camposInteiros = [
    entrada.idadeAnos,
    entrada.idadeMeses,
    entrada.tempoContribuicaoAnos,
    entrada.tempoContribuicaoMeses,
  ]
  if (camposInteiros.some((n) => !Number.isInteger(n) || n < 0)) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Idade e tempo de contribuição precisam ser inteiros sem sinal.' }
  }
  if (entrada.idadeMeses > MESES_MAXIMO || entrada.tempoContribuicaoMeses > MESES_MAXIMO) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os meses vão de 0 a 11 — o resto são anos.' }
  }
  if (entrada.idadeAnos === 0 || entrada.tempoContribuicaoAnos + entrada.tempoContribuicaoMeses === 0) {
    return {
      ok: false,
      motivo: 'entrada_incompleta',
      detalhe: 'Informe a sua idade e o tempo de contribuição já cumprido.',
    }
  }
  if (
    entrada.tempoContribuicaoAnos * MESES_NO_ANO + entrada.tempoContribuicaoMeses >
    entrada.idadeAnos * MESES_NO_ANO + entrada.idadeMeses
  ) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O tempo de contribuição não pode ser maior que a sua idade.',
    }
  }

  const idPontos = entrada.sexo === 'mulher' ? 'aposentadoria-pontos-mulher' : 'aposentadoria-pontos-homem'
  const idTempo =
    entrada.sexo === 'mulher' ? 'aposentadoria-tempo-minimo-mulher' : 'aposentadoria-tempo-minimo-homem'

  const pontos = inteiroDe(registro, idPontos, dataReferencia)
  const tempoMinimo = inteiroDe(registro, idTempo, dataReferencia)
  if (pontos === null || tempoMinimo === null) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'A regra de transição por pontos vale a partir de 13/11/2019 — não há pontuação cadastrada para a data informada.',
    }
  }

  const idadeEmMeses = entrada.idadeAnos * MESES_NO_ANO + entrada.idadeMeses
  const tempoEmMeses = entrada.tempoContribuicaoAnos * MESES_NO_ANO + entrada.tempoContribuicaoMeses
  const pontosEmMeses = idadeEmMeses + tempoEmMeses
  const pontosAtuaisCentesimos = Math.round((pontosEmMeses * CENTESIMOS_POR_UNIDADE) / MESES_NO_ANO)

  const cumpreOsPontos = pontosEmMeses >= pontos.valor * MESES_NO_ANO
  const cumpreOTempo = tempoEmMeses >= tempoMinimo.valor * MESES_NO_ANO
  const cumpreTudo = cumpreOsPontos && cumpreOTempo

  const etapas: Etapa[] = [
    {
      rotulo: 'Pontos de hoje — idade mais tempo de contribuição',
      formula: `${entrada.idadeAnos} anos e ${entrada.idadeMeses} meses de idade + ${entrada.tempoContribuicaoAnos} anos e ${entrada.tempoContribuicaoMeses} meses de contribuição`,
      resultado: centavos(pontosAtuaisCentesimos),
      unidade: 'numero',
      justificativa: 'As frações entram na conta: o § 2º do art. 15 manda apurar idade e tempo em dias.',
    },
    {
      rotulo: `Pontuação exigida — ${pontos.valor} pontos`,
      formula: `${cumpreOsPontos ? 'alcançada' : 'ainda não alcançada'} na data de referência`,
      resultado: centavos(pontos.valor * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(pontos.resolvida),
      justificativa:
        'A exigência sobe um ponto a cada ano, até o teto da Emenda. Cada ano que passa dá dois pontos a quem continua contribuindo — e cobra um a mais.',
    },
    {
      rotulo: `Tempo mínimo de contribuição — ${tempoMinimo.valor} anos`,
      formula: `${cumpreOTempo ? 'cumprido' : 'ainda não cumprido'}: ${entrada.tempoContribuicaoAnos} anos e ${entrada.tempoContribuicaoMeses} meses`,
      resultado: centavos(tempoMinimo.valor * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(tempoMinimo.resolvida),
      justificativa:
        'Os dois requisitos são cumulativos: pontuação alta com pouco tempo de contribuição não abre a aposentadoria por esta regra.',
    },
  ]

  // -------------------------------------------------------------------------
  // Projeção: em que MÊS os dois requisitos se cumprem
  // -------------------------------------------------------------------------
  let mesesAteLa: number | null
  let pontosExigidosNoAno: number | null = null

  if (cumpreTudo) {
    mesesAteLa = 0
    pontosExigidosNoAno = pontos.valor
  } else {
    mesesAteLa = primeiroMesQueCumpre(dataReferencia, (k, data) => {
      const exigido = inteiroDe(registro, idPontos, data)
      if (exigido === null) return false
      // Cada mês soma um mês de idade e um de contribuição — dois na conta de pontos.
      const cumpre = pontosEmMeses + 2 * k >= exigido.valor * MESES_NO_ANO && tempoEmMeses + k >= tempoMinimo.valor * MESES_NO_ANO
      if (cumpre) pontosExigidosNoAno = exigido.valor
      return cumpre
    })

    if (mesesAteLa !== null && pontosExigidosNoAno !== null) {
      const quando = mesAdiante(dataReferencia, mesesAteLa)
      etapas.push({
        rotulo: `Projeção — requisitos cumpridos em ${rotuloDoMes(quando)}`,
        formula: `mantida a contribuição, a exigência naquele ano é de ${pontosExigidosNoAno} pontos`,
        resultado: centavos(pontosExigidosNoAno * CENTESIMOS_POR_UNIDADE),
        unidade: 'numero',
        justificativa:
          'A projeção supõe contribuição sem interrupção: cada mês acrescenta um mês de idade e um de contribuição. Interrupções adiam o resultado.',
      })
    }
  }

  const cumprimento = mesesAteLa === null ? null : mesAdiante(dataReferencia, mesesAteLa)

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [pontos.resolvida.vigencia.id, tempoMinimo.resolvida.vigencia.id],
  }

  return {
    ok: true,
    valores: {
      pontosAtuaisCentesimos,
      pontosExigidos: pontos.valor,
      tempoMinimoExigido: tempoMinimo.valor,
      cumpreOsPontos,
      cumpreOTempo,
      cumpreTudo,
      anoDeCumprimento: cumprimento?.ano ?? null,
      mesDeCumprimento: cumprimento?.mes ?? null,
      mesesAteLa,
      pontosExigidosNoAno,
    },
    traco,
  }
}
