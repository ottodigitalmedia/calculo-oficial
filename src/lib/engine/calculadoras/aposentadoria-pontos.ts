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
 * 13/11/2019. Quem se filiou depois segue a regra permanente, que esta
 * calculadora não cobre e declara.
 */

import { citar, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/** Meses de um ano. Unidade do calendário, não parâmetro legal. */
const MESES_NO_ANO = 12

/** Até quantos anos à frente a projeção procura o ano de cumprimento. */
const HORIZONTE_DE_PROJECAO = 40

export type Sexo = 'mulher' | 'homem'

type Resolvido = { readonly valor: number; readonly resolvida: VigenciaResolvida } | null

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

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
  /** Quantos anos faltam até lá. Zero quando já cumpre. */
  readonly anosAteLa: number
  /** Pontuação exigida no ano de cumprimento. */
  readonly pontosExigidosNoAno: number | null
}

const MESES_MAXIMO = 11

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
  // Projeção: em que ano os dois requisitos se cumprem
  // -------------------------------------------------------------------------
  let anoDeCumprimento: number | null = null
  let pontosExigidosNoAno: number | null = null
  const anoDeReferencia = Number(dataReferencia.slice(0, 4))

  if (cumpreTudo) {
    anoDeCumprimento = anoDeReferencia
    pontosExigidosNoAno = pontos.valor
  } else {
    for (let adiante = 1; adiante <= HORIZONTE_DE_PROJECAO; adiante += 1) {
      const ano = anoDeReferencia + adiante
      const exigido = inteiroDe(registro, idPontos, `${ano}-12-31` as DataISO)
      if (exigido === null) break
      const pontosNoAno = pontosEmMeses + adiante * 2 * MESES_NO_ANO
      const tempoNoAno = tempoEmMeses + adiante * MESES_NO_ANO
      if (pontosNoAno >= exigido.valor * MESES_NO_ANO && tempoNoAno >= tempoMinimo.valor * MESES_NO_ANO) {
        anoDeCumprimento = ano
        pontosExigidosNoAno = exigido.valor
        break
      }
    }

    if (anoDeCumprimento !== null && pontosExigidosNoAno !== null) {
      etapas.push({
        rotulo: `Projeção — requisitos cumpridos em ${anoDeCumprimento}`,
        formula: `mantida a contribuição, a exigência naquele ano é de ${pontosExigidosNoAno} pontos`,
        resultado: centavos(pontosExigidosNoAno * CENTESIMOS_POR_UNIDADE),
        unidade: 'numero',
        justificativa:
          'A projeção supõe contribuição sem interrupção: cada ano acrescenta um ano de idade e um de contribuição. Interrupções adiam o resultado.',
      })
    }
  }

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
      anoDeCumprimento,
      anosAteLa: anoDeCumprimento === null ? 0 : Math.max(0, anoDeCumprimento - anoDeReferencia),
      pontosExigidosNoAno,
    },
    traco,
  }
}
