/**
 * CALC-120 — Escala 12 × 36: plantões e horas no período.
 *
 * A partir de um dia de plantão conhecido, a conta marca os plantões de um
 * período — um a cada ciclo de doze horas de trabalho e trinta e seis de
 * descanso (CLT, art. 59-A) — e diz quantos são, quantas horas somam, quantos
 * caem em domingo e quais caem em feriado nacional.
 *
 * **O ciclo vem dos parâmetros, não de um "2" escrito aqui.** Doze mais trinta e
 * seis são quarenta e oito horas: dois dias. A conta exige que o ciclo feche em
 * dias inteiros — é o que faz o plantão começar sempre no mesmo horário — e
 * recusa, em vez de adivinhar, se algum dia os parâmetros disserem outra coisa.
 *
 * **O plantão é contado no dia em que começa.** O noturno que entra às 19h e sai
 * às 7h pertence ao dia da entrada; é assim que as escalas são publicadas.
 *
 * **Feriado na escala não é conta de dinheiro aqui.** O parágrafo único do art.
 * 59-A diz que a remuneração mensal da escala já abrange o descanso semanal e
 * os feriados, que se consideram compensados. A calculadora aponta os plantões
 * em feriado — a pergunta que mais se faz — e cita a regra; convenção coletiva
 * pode dispor diferente, e a tela diz isso.
 *
 * Os feriados são os nacionais de `params/data/feriados.ts`, resolvidos DIA A
 * DIA pelo mesmo motivo de CALC-072: o de 20 de novembro só existe desde
 * 22/12/2023.
 */

import { compararDatas, diasEntre, escreverData, lerData, somarDias, type DataCivil } from '../datas'
import { citar, fundamentar, type Etapa, type Resultado } from '../traco'
import { centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CLT_ART_59A, LEI_9093_1995 } from '../../params/data/fontes'
import { IDS_DOS_FERIADOS } from '../../params/data/feriados'

export const PARAMETROS_ESCALA_12X36 = [
  'escala-12x36-trabalho-minutos',
  'escala-12x36-descanso-minutos',
  ...IDS_DOS_FERIADOS,
] as const

/** Unidades do relógio e do calendário — não são parâmetros legais. */
const MINUTOS_NA_HORA = 60
const HORAS_NO_DIA = 24
const MINUTOS_NO_DIA = MINUTOS_NA_HORA * HORAS_NO_DIA
const DIAS_NA_SEMANA = 7

/** Escala das grandezas em unidade `'numero'` — ver `Unidade` em `traco.ts`. */
// eslint-disable-next-line no-restricted-syntax -- unidade, não parâmetro legal (ADR-004 A-1)
const CENTESIMOS_POR_UNIDADE = 100

/**
 * O período mais longo aceito: um ano bissexto. É limite de tela, não de lei —
 * a lista de plantões de um período maior não caberia no resultado.
 */
// eslint-disable-next-line no-restricted-syntax -- limite de interface, não parâmetro legal
export const PERIODO_MAXIMO_EM_DIAS = 366

export interface EntradaEscala12x36 {
  /** Um dia em que houve, ou haverá, plantão. */
  readonly plantao: DataISO
  readonly inicio: DataISO
  readonly fim: DataISO
}

export interface PlantaoEmFeriado {
  readonly data: DataISO
  readonly nome: string
}

export interface SaidaEscala12x36 {
  readonly plantoes: readonly DataISO[]
  readonly minutosTrabalhados: number
  readonly emDomingo: number
  readonly emFeriado: readonly PlantaoEmFeriado[]
  /** Média semanal da escala, em minutos: trabalho × 7 ÷ dias do ciclo. */
  readonly mediaSemanalMinutos: number
  readonly minutosPorPlantao: number
  readonly minutosDeDescanso: number
  readonly diasDoCiclo: number
}

type Resolvido = { readonly valor: number; readonly resolvida: VigenciaResolvida } | null

function inteiroDe(registro: Registro, id: string, data: DataISO): Resolvido {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

/** Dia da semana: 0 é domingo. Mesma âncora aritmética de CALC-072. */
function diaDaSemana(d: DataCivil): number {
  // eslint-disable-next-line no-restricted-syntax -- âncora do calendário, não parâmetro
  const ancora: DataCivil = { ano: 2000, mes: 1, dia: 1 }
  // 2000-01-01 foi um sábado (6).
  const sabado = 6
  const delta = diasEntre(ancora, d)
  return (((delta + sabado) % DIAS_NA_SEMANA) + DIAS_NA_SEMANA) % DIAS_NA_SEMANA
}

/** "12h", "42h", "7h30". */
function horas(minutos: number): string {
  const h = Math.floor(minutos / MINUTOS_NA_HORA)
  const m = minutos % MINUTOS_NA_HORA
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

function emHorasCentesimos(minutos: number): number {
  return Math.round((minutos * CENTESIMOS_POR_UNIDADE) / MINUTOS_NA_HORA)
}

export function calcularEscala12x36(
  entrada: EntradaEscala12x36,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaEscala12x36> {
  const plantao = lerData(entrada.plantao)
  const inicio = lerData(entrada.inicio)
  const fim = lerData(entrada.fim)
  if (!plantao || !inicio || !fim) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe um dia de plantão e as duas datas do período.' }
  }
  if (compararDatas(inicio, fim) > 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A data final precisa ser igual ou posterior à inicial.' }
  }
  const diasCorridos = diasEntre(inicio, fim) + 1
  if (diasCorridos > PERIODO_MAXIMO_EM_DIAS) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O período pode ter no máximo um ano.' }
  }

  /**
   * `RN-003` nas duas pontas: a escala do art. 59-A existe desde 11/11/2017, e
   * um período que começa antes disso não tem regra cadastrada para o trecho
   * inicial.
   */
  const trabalho = inteiroDe(registro, 'escala-12x36-trabalho-minutos', entrada.inicio)
  const descanso = inteiroDe(registro, 'escala-12x36-descanso-minutos', entrada.inicio)
  const trabalhoNoFim = inteiroDe(registro, 'escala-12x36-trabalho-minutos', entrada.fim)
  const descansoNoFim = inteiroDe(registro, 'escala-12x36-descanso-minutos', entrada.fim)
  if (trabalho === null || descanso === null || trabalhoNoFim === null || descansoNoFim === null) {
    return {
      ok: false,
      motivo: 'vigencia_ausente',
      detalhe: 'A escala 12 × 36 do art. 59-A da CLT vale a partir de 11/11/2017 — não há parâmetros para o período informado.',
    }
  }
  if (trabalhoNoFim.valor !== trabalho.valor || descansoNoFim.valor !== descanso.valor) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'A duração da escala muda dentro do período informado. Divida o período na data da mudança.',
    }
  }

  const ciclo = trabalho.valor + descanso.valor
  if (ciclo % MINUTOS_NO_DIA !== 0) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'O ciclo de trabalho e descanso cadastrado não fecha em dias inteiros, e esta conta não o cobre.',
    }
  }
  const diasDoCiclo = ciclo / MINUTOS_NO_DIA

  function feriadoNacionalDe(dia: DataCivil): string | null {
    const iso = escreverData(dia)
    for (const id of IDS_DOS_FERIADOS) {
      const r = registro.resolver(id, iso)
      if (!r.ok) continue
      const valor = r.resolvida.vigencia.valor
      if (valor.tipo === 'data_fixa' && valor.mes === dia.mes && valor.dia === dia.dia) {
        return r.resolvida.parametro.nome
      }
    }
    return null
  }

  const plantoes: DataISO[] = []
  const emFeriado: PlantaoEmFeriado[] = []
  let emDomingo = 0
  for (let i = 0; i < diasCorridos; i += 1) {
    const dia = somarDias(inicio, i)
    const distancia = diasEntre(plantao, dia)
    if (((distancia % diasDoCiclo) + diasDoCiclo) % diasDoCiclo !== 0) continue
    const iso = escreverData(dia)
    plantoes.push(iso)
    if (diaDaSemana(dia) === 0) emDomingo += 1
    const feriado = feriadoNacionalDe(dia)
    if (feriado) emFeriado.push({ data: iso, nome: feriado })
  }

  const minutosTrabalhados = plantoes.length * trabalho.valor
  const mediaSemanalMinutos = Math.round((trabalho.valor * DIAS_NA_SEMANA) / diasDoCiclo)

  const etapas: Etapa[] = [
    {
      rotulo: `Ciclo da escala — ${horas(trabalho.valor)} de trabalho e ${horas(descanso.valor)} de descanso`,
      formula: `${horas(trabalho.valor)} + ${horas(descanso.valor)} = ${horas(ciclo)}: um plantão a cada ${diasDoCiclo} dias`,
      resultado: centavos(diasDoCiclo * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      parametro: citar(trabalho.resolvida),
      fundamento: fundamentar(CLT_ART_59A),
    },
    {
      rotulo: 'Plantões no período',
      formula: `de ${entrada.inicio} a ${entrada.fim}, a cada ${diasDoCiclo} dias contados de ${entrada.plantao}`,
      resultado: centavos(plantoes.length * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      justificativa: 'O plantão é contado no dia em que começa, inclusive o que atravessa a meia-noite.',
    },
    {
      rotulo: 'Horas de plantão no período',
      formula: `${plantoes.length} plantões × ${horas(trabalho.valor)}`,
      resultado: centavos(emHorasCentesimos(minutosTrabalhados)),
      unidade: 'numero',
      justificativa:
        'O art. 59-A manda observar ou indenizar os intervalos para repouso e alimentação; as horas aqui são as do plantão inteiro, como a escala é contratada.',
    },
    {
      rotulo: 'Média semanal da escala',
      formula: `${horas(trabalho.valor)} × ${DIAS_NA_SEMANA} dias ÷ ${diasDoCiclo}`,
      resultado: centavos(emHorasCentesimos(mediaSemanalMinutos)),
      unidade: 'numero',
      parametro: citar(descanso.resolvida),
    },
    {
      rotulo: 'Plantões em feriado nacional',
      formula: emFeriado.length > 0 ? emFeriado.map((f) => `${f.nome} (${f.data})`).join(', ') : 'nenhum no período',
      resultado: centavos(emFeriado.length * CENTESIMOS_POR_UNIDADE),
      unidade: 'numero',
      fundamento: fundamentar(LEI_9093_1995),
      justificativa:
        'Pelo parágrafo único do art. 59-A, a remuneração mensal da escala já abrange o descanso semanal e os feriados, que se consideram compensados. Convenção ou acordo coletivo pode dispor de outra forma.',
    },
  ]

  return {
    ok: true,
    valores: {
      plantoes,
      minutosTrabalhados,
      emDomingo,
      emFeriado,
      mediaSemanalMinutos,
      minutosPorPlantao: trabalho.valor,
      minutosDeDescanso: descanso.valor,
      diasDoCiclo,
    },
    traco: {
      etapas,
      dataReferencia,
      vigenciasAplicadas: [trabalho.resolvida.vigencia.id, descanso.resolvida.vigencia.id],
    },
  }
}
