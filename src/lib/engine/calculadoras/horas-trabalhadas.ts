/**
 * CALC-115 — Horas trabalhadas e intervalos.
 *
 * A partir do horário de entrada, de saída e do intervalo, a conta responde o
 * que a jornada é — e o que a lei diz dela:
 *
 * - horas por dia e por semana, contra as oito e as quarenta e quatro da
 *   Constituição (art. 7º, XIII);
 * - o intervalo mínimo que aquela duração exige (CLT, art. 71): uma hora acima
 *   de seis horas de trabalho, quinze minutos acima de quatro;
 * - o intervalo que ficou faltando, e quanto ele vale — o período suprimido,
 *   com 50% sobre a hora normal (art. 71, § 4º, redação de 2017);
 * - o descanso entre uma jornada e a próxima, contra as onze horas do art. 66.
 *
 * **O intervalo não conta como trabalho** (art. 71, § 2º): as horas do dia são
 * a diferença entre entrada e saída menos o intervalo.
 *
 * **O que NÃO está aqui:** a hora noturna reduzida — a jornada que passa das
 * 22h tem conta própria em CALC-077 —, a compensação de jornada e o banco de
 * horas (CALC-013). A tela diz isso.
 */

import { aplicarAliquota, proporcao, somar } from '../money'
import { citar, fundamentar, reais, type Etapa, type Resultado } from '../traco'
import { ZERO, basisPoints, centavos, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CLT_ART_71 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

/** Unidades do relógio — não são parâmetros legais. */
const MINUTOS_NA_HORA = 60
const HORAS_NO_DIA = 24
const MINUTOS_NO_DIA = MINUTOS_NA_HORA * HORAS_NO_DIA

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/** Começo e fim do período noturno urbano — só para avisar, a conta é de CALC-077. */
const INICIO_NOTURNO = 22 * MINUTOS_NA_HORA
const FIM_NOTURNO = 5 * MINUTOS_NA_HORA

const DIAS_NA_SEMANA = 7

type Resolvido = { readonly valor: number; readonly resolvida: VigenciaResolvida } | null

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

/** "8h30", "44h", "15min". */
export function descreverMinutos(total: number): string {
  const h = Math.floor(total / MINUTOS_NA_HORA)
  const m = total % MINUTOS_NA_HORA
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

function emHorasCentesimos(minutos: number): number {
  return Math.round((minutos * CENTESIMOS_POR_UNIDADE) / MINUTOS_NA_HORA)
}

export interface EntradaHorasTrabalhadas {
  readonly entradaHora: number
  readonly entradaMinuto: number
  readonly saidaHora: number
  readonly saidaMinuto: number
  readonly intervaloMinutos: number
  readonly diasPorSemana: number
  /** Valor da hora normal. Zero = não calcular o valor do intervalo suprimido. */
  readonly valorDaHora: Centavos
}

export interface SaidaHorasTrabalhadas {
  readonly minutosPorDia: number
  readonly minutosPorSemana: number
  readonly minutosAlemDaDiaria: number
  readonly minutosAlemDaSemanal: number
  readonly intervaloExigido: number
  readonly intervaloSuprimido: number
  readonly intervaloAcimaDoMaximo: boolean
  /** Descanso até a próxima entrada, repetido o mesmo horário no dia seguinte. */
  readonly descansoEntreJornadas: number
  readonly descansoAbaixoDoMinimo: boolean
  readonly passaPeloPeriodoNoturno: boolean
  /** Valor do intervalo suprimido, por dia e por semana. Zero sem o valor da hora. */
  readonly valorSuprimidoPorDia: Centavos
  readonly valorSuprimidoPorSemana: Centavos
}

export function calcularHorasTrabalhadas(
  entrada: EntradaHorasTrabalhadas,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaHorasTrabalhadas> {
  const inteiros = [entrada.entradaHora, entrada.entradaMinuto, entrada.saidaHora, entrada.saidaMinuto, entrada.intervaloMinutos, entrada.diasPorSemana]
  if (inteiros.some((n) => !Number.isInteger(n) || n < 0)) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Horários e intervalo precisam ser números inteiros.' }
  }
  if (entrada.entradaHora >= HORAS_NO_DIA || entrada.saidaHora >= HORAS_NO_DIA || entrada.entradaMinuto >= MINUTOS_NA_HORA || entrada.saidaMinuto >= MINUTOS_NA_HORA) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'As horas vão de 0 a 23 e os minutos de 0 a 59.' }
  }
  if (entrada.diasPorSemana < 1 || entrada.diasPorSemana > DIAS_NA_SEMANA) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os dias de trabalho na semana vão de 1 a 7.' }
  }
  if (entrada.valorDaHora < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O valor da hora não pode ser negativo.' }
  }

  const inicio = entrada.entradaHora * MINUTOS_NA_HORA + entrada.entradaMinuto
  const fim = entrada.saidaHora * MINUTOS_NA_HORA + entrada.saidaMinuto
  // Saída antes da entrada no relógio: a jornada atravessou a meia-noite.
  const presenca = fim > inicio ? fim - inicio : fim + MINUTOS_NO_DIA - inicio
  if (fim === inicio) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A entrada e a saída não podem ser o mesmo horário.' }
  }
  if (entrada.intervaloMinutos >= presenca) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O intervalo não pode ser maior que o tempo entre a entrada e a saída.' }
  }

  const diaria = inteiroDe(registro, 'jornada-normal-diaria-minutos', dataReferencia)
  const semanal = inteiroDe(registro, 'jornada-normal-semanal-minutos', dataReferencia)
  const limiteLonga = inteiroDe(registro, 'intervalo-limite-jornada-longa-minutos', dataReferencia)
  const minimoLonga = inteiroDe(registro, 'intervalo-minimo-jornada-longa-minutos', dataReferencia)
  const maximo = inteiroDe(registro, 'intervalo-maximo-sem-acordo-minutos', dataReferencia)
  const limiteCurta = inteiroDe(registro, 'intervalo-limite-jornada-curta-minutos', dataReferencia)
  const minimoCurta = inteiroDe(registro, 'intervalo-minimo-jornada-curta-minutos', dataReferencia)
  const interjornada = inteiroDe(registro, 'interjornada-minima-minutos', dataReferencia)
  const acrescimoRes = registro.resolver('intervalo-suprimido-acrescimo', dataReferencia)
  if (
    diaria === null || semanal === null || limiteLonga === null || minimoLonga === null || maximo === null ||
    limiteCurta === null || minimoCurta === null || interjornada === null ||
    !acrescimoRes.ok || acrescimoRes.resolvida.vigencia.valor.tipo !== 'percentual'
  ) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'As regras de jornada e intervalo desta calculadora valem a partir de 11/11/2017 — não há parâmetros para a data informada.',
    }
  }
  const acrescimo = basisPoints(acrescimoRes.resolvida.vigencia.valor.aliquotaBp)

  const minutosPorDia = presenca - entrada.intervaloMinutos
  const minutosPorSemana = minutosPorDia * entrada.diasPorSemana
  const minutosAlemDaDiaria = Math.max(0, minutosPorDia - diaria.valor)
  const minutosAlemDaSemanal = Math.max(0, minutosPorSemana - semanal.valor)

  const intervaloExigido = minutosPorDia > limiteLonga.valor ? minimoLonga.valor : minutosPorDia > limiteCurta.valor ? minimoCurta.valor : 0
  const regraDoIntervalo = minutosPorDia > limiteLonga.valor ? minimoLonga : minutosPorDia > limiteCurta.valor ? minimoCurta : null
  const intervaloSuprimido = Math.max(0, intervaloExigido - entrada.intervaloMinutos)
  const intervaloAcimaDoMaximo = minutosPorDia > limiteLonga.valor && entrada.intervaloMinutos > maximo.valor

  const descansoEntreJornadas = MINUTOS_NO_DIA - presenca
  const descansoAbaixoDoMinimo = descansoEntreJornadas < interjornada.valor

  // Algum minuto entre 22h e 5h? Percorre a jornada de minuto em minuto — no
  // máximo um dia, o que é barato e não deixa borda de fora.
  let passaPeloPeriodoNoturno = false
  for (let t = 0; t < presenca; t += 1) {
    const agora = (inicio + t) % MINUTOS_NO_DIA
    if (agora >= INICIO_NOTURNO || agora < FIM_NOTURNO) {
      passaPeloPeriodoNoturno = true
      break
    }
  }

  let valorSuprimidoPorDia: Centavos = ZERO
  if (intervaloSuprimido > 0 && entrada.valorDaHora > 0) {
    const base = proporcao(entrada.valorDaHora, intervaloSuprimido, MINUTOS_NA_HORA, POLITICA)
    valorSuprimidoPorDia = somar(base, aplicarAliquota(base, acrescimo, POLITICA))
  }
  const valorSuprimidoPorSemana = centavos(valorSuprimidoPorDia * entrada.diasPorSemana)

  const etapas: Etapa[] = [
    {
      rotulo: `Horas trabalhadas por dia — ${descreverMinutos(minutosPorDia)}`,
      formula: `${descreverMinutos(presenca)} entre a entrada e a saída − ${descreverMinutos(entrada.intervaloMinutos)} de intervalo`,
      resultado: centavos(emHorasCentesimos(minutosPorDia)),
      unidade: 'numero',
      fundamento: fundamentar(CLT_ART_71),
      justificativa: 'Os intervalos de descanso não são computados na duração do trabalho (art. 71, § 2º).',
    },
    {
      rotulo: `Jornada normal diária — ${descreverMinutos(diaria.valor)}`,
      formula: minutosAlemDaDiaria > 0 ? `${descreverMinutos(minutosAlemDaDiaria)} além por dia` : 'dentro do limite',
      resultado: centavos(emHorasCentesimos(minutosAlemDaDiaria)),
      unidade: 'numero',
      parametro: citar(diaria.resolvida),
    },
    {
      rotulo: `Horas por semana — ${descreverMinutos(minutosPorSemana)}`,
      formula: `${descreverMinutos(minutosPorDia)} × ${entrada.diasPorSemana} dias; limite de ${descreverMinutos(semanal.valor)}`,
      resultado: centavos(emHorasCentesimos(minutosPorSemana)),
      unidade: 'numero',
      parametro: citar(semanal.resolvida),
      justificativa:
        'Acima dos limites há hora extra, salvo compensação ajustada em acordo ou convenção — que esta conta não conhece.',
    },
    {
      rotulo: `Intervalo exigido — ${intervaloExigido === 0 ? 'nenhum' : descreverMinutos(intervaloExigido)}`,
      formula:
        intervaloSuprimido > 0
          ? `${descreverMinutos(entrada.intervaloMinutos)} concedidos; faltam ${descreverMinutos(intervaloSuprimido)}`
          : `${descreverMinutos(entrada.intervaloMinutos)} concedidos — suficiente`,
      resultado: centavos(intervaloSuprimido * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      ...(regraDoIntervalo ? { parametro: citar(regraDoIntervalo.resolvida) } : {}),
      justificativa: 'Uma hora quando o trabalho passa de seis horas; quinze minutos quando passa de quatro, sem chegar a seis (art. 71, caput e § 1º).',
    },
  ]
  if (valorSuprimidoPorDia > 0) {
    etapas.push({
      rotulo: 'Intervalo suprimido — valor por dia',
      formula: `${reais(entrada.valorDaHora)} ÷ 60 × ${intervaloSuprimido} min, com acréscimo`,
      resultado: valorSuprimidoPorDia,
      parametro: citar(acrescimoRes.resolvida),
      justificativa: 'Paga-se apenas o período suprimido, com 50% sobre a hora normal, e o valor tem natureza indenizatória (art. 71, § 4º).',
    })
  }
  etapas.push({
    rotulo: `Descanso até a próxima jornada — ${descreverMinutos(descansoEntreJornadas)}`,
    formula: descansoAbaixoDoMinimo ? `abaixo das ${descreverMinutos(interjornada.valor)} exigidas` : `mínimo de ${descreverMinutos(interjornada.valor)} respeitado`,
    resultado: centavos(emHorasCentesimos(descansoEntreJornadas)),
    unidade: 'numero',
    parametro: citar(interjornada.resolvida),
    justificativa: 'Supõe o mesmo horário no dia seguinte de trabalho.',
  })

  return {
    ok: true,
    valores: {
      minutosPorDia,
      minutosPorSemana,
      minutosAlemDaDiaria,
      minutosAlemDaSemanal,
      intervaloExigido,
      intervaloSuprimido,
      intervaloAcimaDoMaximo,
      descansoEntreJornadas,
      descansoAbaixoDoMinimo,
      passaPeloPeriodoNoturno,
      valorSuprimidoPorDia,
      valorSuprimidoPorSemana,
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [
        diaria.resolvida.vigencia.id,
        semanal.resolvida.vigencia.id,
        limiteLonga.resolvida.vigencia.id,
        minimoLonga.resolvida.vigencia.id,
        limiteCurta.resolvida.vigencia.id,
        minimoCurta.resolvida.vigencia.id,
        interjornada.resolvida.vigencia.id,
        acrescimoRes.resolvida.vigencia.id,
      ],
    },
  }
}
