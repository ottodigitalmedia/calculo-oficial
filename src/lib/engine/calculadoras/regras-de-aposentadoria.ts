/**
 * CALC-104 a CALC-108 — as demais regras de acesso à aposentadoria da EC nº
 * 103/2019, e o comparador que as põe lado a lado.
 *
 * | Calculadora | Regra | Artigo |
 * |---|---|---|
 * | CALC-104 | idade progressiva | 16 |
 * | CALC-105 | pedágio de 50% | 17 |
 * | CALC-106 | pedágio de 100% | 20 |
 * | CALC-107 | idade — transição (filiado até 13/11/2019) ou permanente | 18 e 19 |
 * | CALC-108 | comparador de todas, com a de pontos (CALC-103) | 15 a 20 |
 *
 * **Todas respondem a mesma pergunta — quando —, e por isso todas devolvem o
 * MÊS de cumprimento**, com a projeção mês a mês de `aposentadoria-comum.ts`.
 *
 * Três cuidados que a conta respeita:
 *
 * 1. **os requisitos são cumulativos** em todas as regras: idade sem tempo, ou
 *    tempo sem idade, não abre nada;
 * 2. **o pedágio de 50% tem porta de entrada**: só para quem tinha MAIS de 28
 *    (mulher) ou 33 (homem) anos de contribuição em 13/11/2019. Com exatamente
 *    28, a regra não se aplica;
 * 3. **o pedágio é calculado sobre o tempo que faltava na data da Emenda**, e
 *    não sobre o que falta hoje. Metade de um número ímpar de meses dá meio
 *    mês, e é por isso que o pedágio de 50% trabalha em MEIOS meses — sem
 *    arredondar a lei. Só a data de cumprimento, que é um mês do calendário,
 *    arredonda o meio mês para cima.
 *
 * **O que NÃO está aqui:** professor, atividade especial, pessoa com
 * deficiência e o VALOR do benefício. As páginas dizem isso.
 */

import { citar, type Etapa, type Resultado, type Traco } from '../traco'
import { centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import {
  MESES_NO_ANO,
  descreverMeiosMeses,
  descreverMeses,
  emMeses,
  inteiroDe,
  mesAdiante,
  percentualDe,
  primeiroMesQueCumpre,
  rotuloDoMes,
  validarAnosEMeses,
  type Resolvido,
  type Sexo,
} from './aposentadoria-comum'
import { calcularRegraDePontos } from './aposentadoria-pontos'

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/** Um inteiro em basis points. Unidade, não parâmetro legal (ADR-004 A-2). */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-2)
const BP_POR_INTEIRO = 10_000

/** Data a partir da qual as regras da Emenda existem — início das vigências. */
const SEM_VIGENCIA =
  'As regras de acesso da Emenda Constitucional nº 103/2019 valem a partir de 13/11/2019 — não há parâmetros cadastrados para a data informada.'

// ---------------------------------------------------------------------------
// Saída comum
// ---------------------------------------------------------------------------

export interface Cumprimento {
  readonly cumpreHoje: boolean
  /** Meses até o cumprimento. Zero quando já cumpre; `null` fora do horizonte. */
  readonly mesesAteCumprir: number | null
  readonly anoDeCumprimento: number | null
  /** De 1 a 12. */
  readonly mesDeCumprimento: number | null
}

function cumprimento(dataReferencia: DataISO, meses: number | null): Cumprimento {
  if (meses === null) return { cumpreHoje: false, mesesAteCumprir: null, anoDeCumprimento: null, mesDeCumprimento: null }
  const m = mesAdiante(dataReferencia, meses)
  return { cumpreHoje: meses === 0, mesesAteCumprir: meses, anoDeCumprimento: m.ano, mesDeCumprimento: m.mes }
}

/** Anos com duas casas, a partir de meses — 59 anos e 6 meses vira 59,50. */
function anosEmCentesimos(meses: number): number {
  return Math.round((meses * CENTESIMOS_POR_UNIDADE) / MESES_NO_ANO)
}

function etapaDeProjecao(dataReferencia: DataISO, meses: number, detalhe: string): Etapa {
  return {
    rotulo: `Projeção — requisitos cumpridos em ${rotuloDoMes(mesAdiante(dataReferencia, meses))}`,
    formula: `${descreverMeses(meses)} a partir da data de referência; ${detalhe}`,
    resultado: centavos(meses * CENTESIMOS_POR_UNIDADE),
    unidade: 'numero',
    justificativa:
      'A projeção supõe contribuição sem interrupção: cada mês acrescenta um mês de idade e um de contribuição. Interrupções adiam o resultado.',
  }
}

// ---------------------------------------------------------------------------
// Idade + tempo mínimo (arts. 16, 18 e 19)
// ---------------------------------------------------------------------------

export interface EntradaIdadeETempo {
  readonly sexo: Sexo
  readonly idadeAnos: number
  readonly idadeMeses: number
  readonly tempoAnos: number
  readonly tempoMeses: number
}

export interface SaidaIdadeETempo extends Cumprimento {
  readonly idadeExigidaMeses: number
  readonly tempoMinimoAnos: number
  readonly cumpreIdade: boolean
  readonly cumpreTempo: boolean
  /** Idade exigida no mês de cumprimento — muda quando a escada sobe. */
  readonly idadeExigidaNoCumprimentoMeses: number | null
}

interface RegraDeIdade {
  readonly idIdade: string
  readonly idTempo: string
  readonly justificativaIdade: string
}

function validarIdadeETempo(e: EntradaIdadeETempo) {
  const v = validarAnosEMeses([
    [e.idadeAnos, e.idadeMeses],
    [e.tempoAnos, e.tempoMeses],
  ])
  if (!v.ok) return v
  if (e.idadeAnos === 0) {
    return { ok: false as const, motivo: 'entrada_incompleta' as const, detalhe: 'Informe a sua idade.' }
  }
  if (emMeses(e.tempoAnos, e.tempoMeses) > emMeses(e.idadeAnos, e.idadeMeses)) {
    return { ok: false as const, motivo: 'entrada_invalida' as const, detalhe: 'O tempo de contribuição não pode ser maior que a sua idade.' }
  }
  return { ok: true as const }
}

function avaliarIdadeETempo(
  regra: RegraDeIdade,
  entrada: EntradaIdadeETempo,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaIdadeETempo> {
  const valida = validarIdadeETempo(entrada)
  if (!valida.ok) return valida

  const idade = inteiroDe(registro, regra.idIdade, dataReferencia)
  const tempo = inteiroDe(registro, regra.idTempo, dataReferencia)
  if (idade === null || tempo === null) return { ok: false, motivo: 'vigencia_ausente', detalhe: SEM_VIGENCIA }

  const idadeMeses = emMeses(entrada.idadeAnos, entrada.idadeMeses)
  const tempoMeses = emMeses(entrada.tempoAnos, entrada.tempoMeses)
  const tempoExigido = tempo.valor * MESES_NO_ANO
  const cumpreIdade = idadeMeses >= idade.valor
  const cumpreTempo = tempoMeses >= tempoExigido

  const etapas: Etapa[] = [
    {
      rotulo: `Idade exigida — ${descreverMeses(idade.valor)}`,
      formula: `${descreverMeses(idadeMeses)} de idade: ${cumpreIdade ? 'alcançada' : 'ainda não alcançada'}`,
      resultado: centavos(anosEmCentesimos(idade.valor)),
      unidade: 'numero',
      parametro: citar(idade.resolvida),
      justificativa: regra.justificativaIdade,
    },
    {
      rotulo: `Tempo mínimo de contribuição — ${tempo.valor} anos`,
      formula: `${descreverMeses(tempoMeses)} de contribuição: ${cumpreTempo ? 'cumprido' : 'ainda não cumprido'}`,
      resultado: centavos(tempo.valor * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(tempo.resolvida),
      justificativa: 'Os requisitos são cumulativos: idade sem o tempo mínimo, ou tempo sem a idade, não abre a aposentadoria por esta regra.',
    },
  ]

  let meses: number | null
  let idadeNoCumprimento: number | null = null
  if (cumpreIdade && cumpreTempo) {
    meses = 0
    idadeNoCumprimento = idade.valor
  } else {
    meses = primeiroMesQueCumpre(dataReferencia, (k, data) => {
      const exigida = inteiroDe(registro, regra.idIdade, data)
      if (exigida === null) return false
      const cumpre = idadeMeses + k >= exigida.valor && tempoMeses + k >= tempoExigido
      if (cumpre) idadeNoCumprimento = exigida.valor
      return cumpre
    })
    if (meses !== null && idadeNoCumprimento !== null) {
      etapas.push(etapaDeProjecao(dataReferencia, meses, `idade exigida naquele mês: ${descreverMeses(idadeNoCumprimento)}`))
    }
  }

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [idade.resolvida.vigencia.id, tempo.resolvida.vigencia.id],
  }
  return {
    ok: true,
    valores: {
      idadeExigidaMeses: idade.valor,
      tempoMinimoAnos: tempo.valor,
      cumpreIdade,
      cumpreTempo,
      idadeExigidaNoCumprimentoMeses: idadeNoCumprimento,
      ...cumprimento(dataReferencia, meses),
    },
    traco,
  }
}

/** CALC-104 — idade progressiva (EC nº 103/2019, art. 16). */
export function calcularIdadeProgressiva(
  entrada: EntradaIdadeETempo,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaIdadeETempo> {
  const mulher = entrada.sexo === 'mulher'
  return avaliarIdadeETempo(
    {
      idIdade: mulher ? 'aposentadoria-idade-progressiva-mulher' : 'aposentadoria-idade-progressiva-homem',
      idTempo: mulher ? 'aposentadoria-idade-progressiva-tempo-mulher' : 'aposentadoria-idade-progressiva-tempo-homem',
      justificativaIdade:
        'A idade mínima sobe seis meses a cada 1º de janeiro desde 2020, até o teto da Emenda — a exigência do ano é a da data de referência.',
    },
    entrada,
    dataReferencia,
    registro,
  )
}

export interface EntradaPorIdade extends EntradaIdadeETempo {
  /** Filiado ao Regime Geral até 13/11/2019 — decide entre o art. 18 e o 19. */
  readonly filiadoAntesDaEmenda: boolean
}

/** CALC-107 — aposentadoria por idade: art. 18 (transição) ou art. 19 (permanente). */
export function calcularAposentadoriaPorIdade(
  entrada: EntradaPorIdade,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaIdadeETempo> {
  const mulher = entrada.sexo === 'mulher'
  const regra: RegraDeIdade = entrada.filiadoAntesDaEmenda
    ? {
        idIdade: mulher ? 'aposentadoria-idade-transicao-mulher' : 'aposentadoria-idade-transicao-homem',
        idTempo: 'aposentadoria-idade-transicao-tempo',
        justificativaIdade: mulher
          ? 'Para quem já era filiado em 13/11/2019 (art. 18). A idade da mulher subiu seis meses por ano desde 2020, até o teto alcançado em 2023.'
          : 'Para quem já era filiado em 13/11/2019 (art. 18). A idade do homem não mudou com a Emenda.',
      }
    : {
        idIdade: mulher ? 'aposentadoria-permanente-idade-mulher' : 'aposentadoria-permanente-idade-homem',
        idTempo: mulher ? 'aposentadoria-permanente-tempo-mulher' : 'aposentadoria-permanente-tempo-homem',
        justificativaIdade: 'Regra permanente, para quem se filiou ao Regime Geral depois de 13/11/2019 (art. 19).',
      }
  return avaliarIdadeETempo(regra, entrada, dataReferencia, registro)
}

// ---------------------------------------------------------------------------
// Pedágios (arts. 17 e 20)
// ---------------------------------------------------------------------------

export interface EntradaPedagio {
  readonly sexo: Sexo
  /** Tempo de contribuição em 13/11/2019. */
  readonly tempoNaEmendaAnos: number
  readonly tempoNaEmendaMeses: number
  /** Tempo de contribuição hoje. */
  readonly tempoAnos: number
  readonly tempoMeses: number
}

function validarPedagio(e: EntradaPedagio) {
  const v = validarAnosEMeses([
    [e.tempoNaEmendaAnos, e.tempoNaEmendaMeses],
    [e.tempoAnos, e.tempoMeses],
  ])
  if (!v.ok) return v
  if (emMeses(e.tempoNaEmendaAnos, e.tempoNaEmendaMeses) === 0) {
    return {
      ok: false as const,
      motivo: 'entrada_incompleta' as const,
      detalhe: 'Informe o tempo de contribuição que você tinha em 13/11/2019 — é sobre ele que o pedágio é calculado.',
    }
  }
  if (emMeses(e.tempoNaEmendaAnos, e.tempoNaEmendaMeses) > emMeses(e.tempoAnos, e.tempoMeses)) {
    return {
      ok: false as const,
      motivo: 'entrada_invalida' as const,
      detalhe: 'O tempo de contribuição de hoje não pode ser menor que o de 13/11/2019.',
    }
  }
  return { ok: true as const }
}

export interface SaidaPedagio50 extends Cumprimento {
  readonly corteAnos: number
  readonly tempoMinimoAnos: number
  /** O que faltava em 13/11/2019 para o tempo mínimo, em meses. */
  readonly faltavaNaEmendaMeses: number
  /** O pedágio, em MEIOS meses. */
  readonly pedagioMeiosMeses: number
  /** Tempo total exigido — mínimo mais pedágio —, em meios meses. */
  readonly exigidoMeiosMeses: number
  /** O que falta hoje, em meios meses. */
  readonly faltaMeiosMeses: number
}

/** CALC-105 — pedágio de 50% (EC nº 103/2019, art. 17). */
export function calcularPedagio50(
  entrada: EntradaPedagio,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaPedagio50> {
  const valida = validarPedagio(entrada)
  if (!valida.ok) return valida

  const mulher = entrada.sexo === 'mulher'
  const corte = inteiroDe(registro, mulher ? 'aposentadoria-pedagio-50-corte-mulher' : 'aposentadoria-pedagio-50-corte-homem', dataReferencia)
  const tempo = inteiroDe(registro, mulher ? 'aposentadoria-pedagio-50-tempo-mulher' : 'aposentadoria-pedagio-50-tempo-homem', dataReferencia)
  const percentual = percentualDe(registro, 'aposentadoria-pedagio-50-percentual', dataReferencia)
  if (corte === null || tempo === null || percentual === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: SEM_VIGENCIA }
  }

  const naEmenda = emMeses(entrada.tempoNaEmendaAnos, entrada.tempoNaEmendaMeses)
  if (naEmenda <= corte.valor * MESES_NO_ANO) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        `Esta regra não se aplica: ela é só para quem tinha MAIS de ${corte.valor} anos de contribuição em 13/11/2019, ` +
        `e você informou ${descreverMeses(naEmenda)}. Veja as regras de pontos, da idade progressiva e do pedágio de 100%.`,
    }
  }

  const minimo = tempo.valor * MESES_NO_ANO
  const faltava = Math.max(0, minimo - naEmenda)
  // Meios meses: metade de 13 meses são 13 meios meses, sem arredondar a lei.
  const pedagioMeios = Math.ceil((faltava * 2 * percentual.valor) / BP_POR_INTEIRO)
  const exigidoMeios = minimo * 2 + pedagioMeios
  const atualMeios = emMeses(entrada.tempoAnos, entrada.tempoMeses) * 2
  const faltaMeios = Math.max(0, exigidoMeios - atualMeios)
  const meses = Math.ceil(faltaMeios / 2)

  const etapas: Etapa[] = [
    {
      rotulo: `Porta de entrada — mais de ${corte.valor} anos em 13/11/2019`,
      formula: `${descreverMeses(naEmenda)} de contribuição na data da Emenda: regra aplicável`,
      resultado: centavos(corte.valor * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(corte.resolvida),
      justificativa: 'A Emenda diz "mais de": com exatamente esse tempo, a regra não se aplica.',
    },
    {
      rotulo: 'Tempo que faltava em 13/11/2019, em meses',
      formula: `${tempo.valor} anos − ${descreverMeses(naEmenda)} = ${descreverMeses(faltava)}`,
      resultado: centavos(faltava * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(tempo.resolvida),
      justificativa: 'O pedágio é calculado sobre o que faltava NA DATA DA EMENDA — não sobre o que falta hoje.',
    },
    {
      rotulo: 'Pedágio, em meses',
      formula: `metade de ${descreverMeses(faltava)} = ${descreverMeiosMeses(pedagioMeios)}`,
      resultado: centavos((pedagioMeios * CENTESIMOS_POR_UNIDADE) / 2),
      unidade: 'numero',
      parametro: citar(percentual.resolvida),
      justificativa: 'Metade de um número ímpar de meses termina em meio mês, e a conta o mantém — sem arredondar.',
    },
    {
      rotulo: 'Tempo total exigido, em meses',
      formula: `${tempo.valor} anos + ${descreverMeiosMeses(pedagioMeios)} = ${descreverMeiosMeses(exigidoMeios)}; falta ${descreverMeiosMeses(faltaMeios)}`,
      resultado: centavos((exigidoMeios * CENTESIMOS_POR_UNIDADE) / 2),
      unidade: 'numero',
      justificativa: 'Não há idade mínima nesta regra. Em compensação, o valor leva o fator previdenciário (parágrafo único do art. 17).',
    },
  ]
  if (meses > 0) {
    etapas.push(etapaDeProjecao(dataReferencia, meses, 'meio mês que sobre conta como mês inteiro, porque o cumprimento é um mês do calendário'))
  }

  return {
    ok: true,
    valores: {
      corteAnos: corte.valor,
      tempoMinimoAnos: tempo.valor,
      faltavaNaEmendaMeses: faltava,
      pedagioMeiosMeses: pedagioMeios,
      exigidoMeiosMeses: exigidoMeios,
      faltaMeiosMeses: faltaMeios,
      ...cumprimento(dataReferencia, meses),
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [corte.resolvida.vigencia.id, tempo.resolvida.vigencia.id, percentual.resolvida.vigencia.id],
    },
  }
}

export interface EntradaPedagio100 extends EntradaPedagio {
  readonly idadeAnos: number
  readonly idadeMeses: number
}

export interface SaidaPedagio100 extends Cumprimento {
  readonly idadeExigidaMeses: number
  readonly tempoMinimoAnos: number
  readonly faltavaNaEmendaMeses: number
  /** Tempo total exigido — mínimo mais pedágio —, em meses. */
  readonly exigidoMeses: number
  readonly faltaTempoMeses: number
  readonly faltaIdadeMeses: number
}

/** CALC-106 — pedágio de 100% (EC nº 103/2019, art. 20). */
export function calcularPedagio100(
  entrada: EntradaPedagio100,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaPedagio100> {
  const valida = validarPedagio(entrada)
  if (!valida.ok) return valida
  const validaIdade = validarAnosEMeses([[entrada.idadeAnos, entrada.idadeMeses]])
  if (!validaIdade.ok) return validaIdade
  if (entrada.idadeAnos === 0) return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe a sua idade.' }
  const idadeMeses = emMeses(entrada.idadeAnos, entrada.idadeMeses)
  const tempoMeses = emMeses(entrada.tempoAnos, entrada.tempoMeses)
  if (tempoMeses > idadeMeses) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O tempo de contribuição não pode ser maior que a sua idade.' }
  }

  const mulher = entrada.sexo === 'mulher'
  const idade: Resolvido = inteiroDe(registro, mulher ? 'aposentadoria-pedagio-100-idade-mulher' : 'aposentadoria-pedagio-100-idade-homem', dataReferencia)
  const tempo: Resolvido = inteiroDe(registro, mulher ? 'aposentadoria-pedagio-100-tempo-mulher' : 'aposentadoria-pedagio-100-tempo-homem', dataReferencia)
  if (idade === null || tempo === null) return { ok: false, motivo: 'vigencia_ausente', detalhe: SEM_VIGENCIA }

  const naEmenda = emMeses(entrada.tempoNaEmendaAnos, entrada.tempoNaEmendaMeses)
  const minimo = tempo.valor * MESES_NO_ANO
  const faltava = Math.max(0, minimo - naEmenda)
  const exigido = minimo + faltava
  const faltaTempo = Math.max(0, exigido - tempoMeses)
  const faltaIdade = Math.max(0, idade.valor - idadeMeses)
  // Os dois correm juntos, um mês por mês: vale o que demorar mais.
  const meses = Math.max(faltaTempo, faltaIdade)

  const etapas: Etapa[] = [
    {
      rotulo: `Idade mínima — ${descreverMeses(idade.valor)}`,
      formula: `${descreverMeses(idadeMeses)} de idade: ${faltaIdade === 0 ? 'alcançada' : `faltam ${descreverMeses(faltaIdade)}`}`,
      resultado: centavos(anosEmCentesimos(idade.valor)),
      unidade: 'numero',
      parametro: citar(idade.resolvida),
      justificativa: 'Idade fixa — ao contrário da idade progressiva, não sobe com os anos.',
    },
    {
      rotulo: 'Tempo que faltava em 13/11/2019, em meses',
      formula: `${tempo.valor} anos − ${descreverMeses(naEmenda)} = ${descreverMeses(faltava)}`,
      resultado: centavos(faltava * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(tempo.resolvida),
      justificativa: 'O pedágio é o tempo que faltava na data da Emenda, inteiro — e não o que falta hoje.',
    },
    {
      rotulo: 'Tempo total exigido, em meses',
      formula: `${tempo.valor} anos + ${descreverMeses(faltava)} = ${descreverMeses(exigido)}; ${faltaTempo === 0 ? 'cumprido' : `faltam ${descreverMeses(faltaTempo)}`}`,
      resultado: centavos(exigido * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      justificativa: 'Tempo mínimo mais o pedágio. Idade e tempo são cumulativos, e correm juntos — o cumprimento é o que chegar por último.',
    },
  ]
  if (meses > 0) etapas.push(etapaDeProjecao(dataReferencia, meses, faltaIdade >= faltaTempo ? 'a idade é o que chega por último' : 'o tempo de contribuição é o que chega por último'))

  return {
    ok: true,
    valores: {
      idadeExigidaMeses: idade.valor,
      tempoMinimoAnos: tempo.valor,
      faltavaNaEmendaMeses: faltava,
      exigidoMeses: exigido,
      faltaTempoMeses: faltaTempo,
      faltaIdadeMeses: faltaIdade,
      ...cumprimento(dataReferencia, meses),
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [idade.resolvida.vigencia.id, tempo.resolvida.vigencia.id],
    },
  }
}

// ---------------------------------------------------------------------------
// CALC-108 — comparador
// ---------------------------------------------------------------------------

export type IdDaRegra = 'pontos' | 'idade-progressiva' | 'pedagio-50' | 'pedagio-100' | 'idade' | 'permanente'

export type SituacaoDaRegra = 'cumpre' | 'cumprira' | 'fora_do_horizonte' | 'nao_se_aplica' | 'falta_dado'

export interface AvaliacaoDaRegra {
  readonly id: IdDaRegra
  readonly nome: string
  readonly situacao: SituacaoDaRegra
  readonly mesesAteCumprir: number | null
  readonly anoDeCumprimento: number | null
  readonly mesDeCumprimento: number | null
  /** Por que a regra não entra — só quando `nao_se_aplica` ou `falta_dado`. */
  readonly motivo: string | null
}

export interface EntradaComparador {
  readonly sexo: Sexo
  readonly idadeAnos: number
  readonly idadeMeses: number
  readonly tempoAnos: number
  readonly tempoMeses: number
  readonly filiadoAntesDaEmenda: boolean
  /** Zero quando não informado — os pedágios ficam de fora, com o motivo. */
  readonly tempoNaEmendaAnos: number
  readonly tempoNaEmendaMeses: number
}

export interface SaidaComparador {
  readonly regras: readonly AvaliacaoDaRegra[]
  /** A regra que se cumpre primeiro; `null` se nenhuma se cumpre no horizonte. */
  readonly maisCedo: AvaliacaoDaRegra | null
}

const NOMES: Readonly<Record<IdDaRegra, string>> = {
  pontos: 'Regra de pontos',
  'idade-progressiva': 'Idade progressiva',
  'pedagio-50': 'Pedágio de 50%',
  'pedagio-100': 'Pedágio de 100%',
  idade: 'Aposentadoria por idade',
  permanente: 'Regra permanente',
}

function deCumprimento(id: IdDaRegra, c: Cumprimento): AvaliacaoDaRegra {
  return {
    id,
    nome: NOMES[id],
    situacao: c.mesesAteCumprir === null ? 'fora_do_horizonte' : c.cumpreHoje ? 'cumpre' : 'cumprira',
    mesesAteCumprir: c.mesesAteCumprir,
    anoDeCumprimento: c.anoDeCumprimento,
    mesDeCumprimento: c.mesDeCumprimento,
    motivo: null,
  }
}

function fora(id: IdDaRegra, situacao: 'nao_se_aplica' | 'falta_dado', motivo: string): AvaliacaoDaRegra {
  return { id, nome: NOMES[id], situacao, mesesAteCumprir: null, anoDeCumprimento: null, mesDeCumprimento: null, motivo }
}

function comPrefixo(nome: string, etapas: readonly Etapa[]): Etapa[] {
  return etapas.map((e) => ({ ...e, rotulo: `${nome} · ${e.rotulo}` }))
}

/** CALC-108 — todas as regras de acesso, lado a lado. */
export function compararRegras(
  entrada: EntradaComparador,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaComparador> {
  const base: EntradaIdadeETempo = {
    sexo: entrada.sexo,
    idadeAnos: entrada.idadeAnos,
    idadeMeses: entrada.idadeMeses,
    tempoAnos: entrada.tempoAnos,
    tempoMeses: entrada.tempoMeses,
  }
  const valida = validarIdadeETempo(base)
  if (!valida.ok) return valida
  const validaEmenda = validarAnosEMeses([[entrada.tempoNaEmendaAnos, entrada.tempoNaEmendaMeses]])
  if (!validaEmenda.ok) return validaEmenda
  const naEmenda = emMeses(entrada.tempoNaEmendaAnos, entrada.tempoNaEmendaMeses)
  if (naEmenda > emMeses(entrada.tempoAnos, entrada.tempoMeses)) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O tempo de contribuição de hoje não pode ser menor que o de 13/11/2019.' }
  }

  const regras: AvaliacaoDaRegra[] = []
  const etapas: Etapa[] = []
  const vigencias: string[] = []
  const somar = (nome: string, t: Traco) => {
    etapas.push(...comPrefixo(nome, t.etapas))
    vigencias.push(...t.vigenciasAplicadas)
  }

  if (!entrada.filiadoAntesDaEmenda) {
    const r = calcularAposentadoriaPorIdade({ ...base, filiadoAntesDaEmenda: false }, dataReferencia, registro)
    if (!r.ok) return r
    regras.push(deCumprimento('permanente', r.valores))
    somar(NOMES.permanente, r.traco)
    const motivo = 'Só para quem já era filiado ao Regime Geral em 13/11/2019.'
    for (const id of ['pontos', 'idade-progressiva', 'pedagio-50', 'pedagio-100', 'idade'] as const) {
      regras.push(fora(id, 'nao_se_aplica', motivo))
    }
  } else {
    const pontos = calcularRegraDePontos(
      {
        sexo: entrada.sexo,
        idadeAnos: entrada.idadeAnos,
        idadeMeses: entrada.idadeMeses,
        tempoContribuicaoAnos: entrada.tempoAnos,
        tempoContribuicaoMeses: entrada.tempoMeses,
      },
      dataReferencia,
      registro,
    )
    if (!pontos.ok) {
      // Sem tempo de contribuição a regra de pontos pede o dado — as demais
      // ainda respondem, e dizem o que falta.
      if (pontos.motivo !== 'entrada_incompleta') return pontos
      regras.push(fora('pontos', 'falta_dado', 'Informe o tempo de contribuição.'))
    } else {
      const p = pontos.valores
      regras.push(
        deCumprimento('pontos', {
          cumpreHoje: p.cumpreTudo,
          mesesAteCumprir: p.mesesAteLa,
          anoDeCumprimento: p.anoDeCumprimento,
          mesDeCumprimento: p.mesDeCumprimento,
        }),
      )
      somar(NOMES.pontos, pontos.traco)
    }

    const progressiva = calcularIdadeProgressiva(base, dataReferencia, registro)
    if (!progressiva.ok) return progressiva
    regras.push(deCumprimento('idade-progressiva', progressiva.valores))
    somar(NOMES['idade-progressiva'], progressiva.traco)

    if (naEmenda === 0) {
      const motivo = 'Informe o tempo de contribuição que você tinha em 13/11/2019.'
      regras.push(fora('pedagio-50', 'falta_dado', motivo), fora('pedagio-100', 'falta_dado', motivo))
    } else {
      const pedagio = {
        sexo: entrada.sexo,
        tempoNaEmendaAnos: entrada.tempoNaEmendaAnos,
        tempoNaEmendaMeses: entrada.tempoNaEmendaMeses,
        tempoAnos: entrada.tempoAnos,
        tempoMeses: entrada.tempoMeses,
      }
      const p50 = calcularPedagio50(pedagio, dataReferencia, registro)
      if (p50.ok) {
        regras.push(deCumprimento('pedagio-50', p50.valores))
        somar(NOMES['pedagio-50'], p50.traco)
      } else if (p50.motivo === 'entrada_invalida') {
        // A única recusa possível aqui é a porta de entrada — a entrada já foi
        // validada acima. O texto vem do motor do pedágio, que lê o corte do
        // registro: escrever o número aqui seria constante legal fora de params.
        regras.push(fora('pedagio-50', 'nao_se_aplica', p50.detalhe.split(' Veja ')[0] ?? p50.detalhe))
      } else {
        return p50
      }

      const p100 = calcularPedagio100(
        { ...pedagio, idadeAnos: entrada.idadeAnos, idadeMeses: entrada.idadeMeses },
        dataReferencia,
        registro,
      )
      if (!p100.ok) return p100
      regras.push(deCumprimento('pedagio-100', p100.valores))
      somar(NOMES['pedagio-100'], p100.traco)
    }

    const idade = calcularAposentadoriaPorIdade({ ...base, filiadoAntesDaEmenda: true }, dataReferencia, registro)
    if (!idade.ok) return idade
    regras.push(deCumprimento('idade', idade.valores))
    somar(NOMES.idade, idade.traco)
    regras.push(fora('permanente', 'nao_se_aplica', 'Só para quem se filiou ao Regime Geral depois de 13/11/2019.'))
  }

  let maisCedo: AvaliacaoDaRegra | null = null
  for (const r of regras) {
    if (r.mesesAteCumprir === null) continue
    if (maisCedo === null || maisCedo.mesesAteCumprir === null || r.mesesAteCumprir < maisCedo.mesesAteCumprir) maisCedo = r
  }

  if (maisCedo !== null && maisCedo.mesesAteCumprir !== null) {
    etapas.push({
      rotulo: `Regra que se cumpre primeiro — ${maisCedo.nome}`,
      formula:
        maisCedo.mesesAteCumprir === 0
          ? 'requisitos já cumpridos na data de referência'
          : `em ${descreverMeses(maisCedo.mesesAteCumprir)}, mantida a contribuição`,
      resultado: centavos(maisCedo.mesesAteCumprir * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      justificativa:
        'Cumprir primeiro não é o mesmo que ser a mais vantajosa: o valor do benefício muda de uma regra para outra, e o pedágio de 50% leva o fator previdenciário.',
    })
  }

  return {
    ok: true,
    valores: { regras, maisCedo },
    traco: { etapas, dataReferencia, vigenciasAplicadas: [...new Set(vigencias)] },
  }
}
