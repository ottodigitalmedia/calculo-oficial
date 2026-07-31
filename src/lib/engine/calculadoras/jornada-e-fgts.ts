/**
 * CALC-006 — Horas extras · CALC-007 — FGTS.
 *
 * As duas fecham o v1. Não compartilham conta, mas compartilham o arquivo pela
 * mesma razão de `ferias-e-decimo-terceiro.ts`: são pequenas, e cada arquivo
 * novo no motor é um pedaço a mais no pacote adiado.
 *
 * **CALC-006 é a única do v1 com aritmética de TEMPO.** A hora noturna dura 52
 * minutos e 30 segundos (CLT, art. 73, § 1º), então sete horas de relógio
 * valem oito horas noturnas — e ignorar isso subestima o adicional em 14%.
 *
 * Regras: `RN-021` a `RN-026`.
 */

import { aplicarAliquota, multiplicarPorInteiro, proporcao, somar } from '../money'
import { fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import {
  CF_ART_7_XVI,
  CLT_ART_64,
  CLT_ART_73,
  LEI_605_ART_7,
  LEI_8036_ART_15,
  TST_SUMULA_172,
  TST_SUMULA_431,
} from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const
const AVOS_NO_ANO = 12
/** Segundos de uma hora de relógio. Unidade, não parâmetro legal. */
// eslint-disable-next-line no-restricted-syntax -- definição de unidade de tempo, não constante legal
const SEGUNDOS_NA_HORA = 3_600
/**
 * Divisor mensal = jornada semanal × 5.
 *
 * Vem do art. 64 da CLT — o salário-hora do mensalista sai dividindo o salário
 * mensal por 30 vezes as horas diárias — com a semana de seis dias úteis:
 * 30 ÷ 6 = 5. Para 44h dá 220; para 40h dá 200, que é exatamente o divisor
 * fixado pela Súmula 431 do TST. A coincidência com a súmula é a conferência.
 */
const DIAS_UTEIS_POR_MES_SOBRE_SEMANA = 5

function percentualDe(registro: Registro, id: string, data: DataISO): BasisPoints | null {
  const r = registro.resolver(id, data)
  if (!r.ok) return null
  return r.resolvida.vigencia.valor.tipo === 'percentual'
    ? basisPoints(r.resolvida.vigencia.valor.aliquotaBp)
    : null
}

function inteiroDe(registro: Registro, id: string, data: DataISO): number | null {
  const r = registro.resolver(id, data)
  if (!r.ok) return null
  return r.resolvida.vigencia.valor.tipo === 'inteiro' ? r.resolvida.vigencia.valor.valor : null
}

// ---------------------------------------------------------------------------
// CALC-006 — Horas extras
// ---------------------------------------------------------------------------

export interface EntradaHorasExtras {
  readonly salario: Centavos
  readonly jornadaSemanal: number
  readonly horasExtras50: number
  readonly horasExtras100: number
  readonly horasNoturnas: number
  readonly refletirDSR: boolean
  readonly diasUteis: number
  readonly diasDescanso: number
}

export interface SaidaHorasExtras {
  readonly total: Centavos
  readonly valorHoraNormal: Centavos
  readonly divisor: number
  readonly extras50: Centavos
  readonly extras100: Centavos
  readonly adicionalNoturno: Centavos
  readonly horasNoturnasComputadas: number
  readonly reflexoDsr: Centavos
}

export function calcularHorasExtras(
  entrada: EntradaHorasExtras,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaHorasExtras> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário bruto para ver o resultado.' }
  }
  if (entrada.jornadaSemanal <= 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe a jornada semanal.' }
  }
  if (entrada.horasExtras50 < 0 || entrada.horasExtras100 < 0 || entrada.horasNoturnas < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'As horas não podem ser negativas.' }
  }

  const adicional50 = percentualDe(registro, 'hora-extra-adicional-minimo', dataReferencia)
  const adicionalNoturnoBp = percentualDe(registro, 'adicional-noturno', dataReferencia)
  const segundosDaHoraNoturna = inteiroDe(registro, 'hora-noturna-segundos', dataReferencia)

  if (adicional50 === null || adicionalNoturnoBp === null || segundosDaHoraNoturna === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há parâmetros de jornada para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>()
  const citar = (id: string) => {
    const r = registro.resolver(id, dataReferencia)
    if (r.ok) vigencias.add(r.resolvida.vigencia.id)
  }
  citar('hora-extra-adicional-minimo')
  citar('adicional-noturno')
  citar('hora-noturna-segundos')

  // `RN-024` — o divisor sai da jornada.
  const divisor = entrada.jornadaSemanal * DIAS_UTEIS_POR_MES_SOBRE_SEMANA
  const valorHoraNormal = proporcao(entrada.salario, 1, divisor, POLITICA)

  etapas.push({
    rotulo: 'Valor da hora normal',
    formula: `${reais(entrada.salario)} ÷ ${divisor} (jornada de ${entrada.jornadaSemanal}h × 5)`,
    resultado: valorHoraNormal,
    fundamento: fundamentar(entrada.jornadaSemanal === 40 ? TST_SUMULA_431 : CLT_ART_64),
    justificativa:
      'O divisor mensal é a jornada semanal multiplicada por 5, que é a semana de seis dias ' +
      'aplicada aos 30 dias do mês. Para 40 horas dá 200, o divisor fixado pela Súmula 431.',
  })

  // --- Horas a 50% ---
  const valorHora50 = somar(
    valorHoraNormal,
    aplicarAliquota(valorHoraNormal, adicional50, POLITICA),
  )
  const extras50 = multiplicarPorInteiro(valorHora50, entrada.horasExtras50)
  if (entrada.horasExtras50 > 0) {
    etapas.push({
      rotulo: `Horas extras a ${percentual(adicional50)}`,
      formula: `${reais(valorHoraNormal)} + ${percentual(adicional50)} = ${reais(valorHora50)} × ${entrada.horasExtras50}h`,
      resultado: extras50,
      fundamento: fundamentar(CF_ART_7_XVI),
    })
  }

  // --- Horas a 100% ---
  const valorHora100 = multiplicarPorInteiro(valorHoraNormal, 2)
  const extras100 = multiplicarPorInteiro(valorHora100, entrada.horasExtras100)
  if (entrada.horasExtras100 > 0) {
    etapas.push({
      rotulo: 'Horas extras a 100,00%',
      formula: `${reais(valorHoraNormal)} × 2 = ${reais(valorHora100)} × ${entrada.horasExtras100}h`,
      resultado: extras100,
      justificativa:
        'O adicional de 100% não é mínimo legal: decorre de convenção coletiva ou do trabalho ' +
        'em domingo e feriado não compensado. Informe aqui só o que seu contrato prevê.',
    })
  }

  /**
   * `RN-026` — a hora noturna dura menos que a hora de relógio.
   *
   * CLT, art. 73, § 1º: "A hora do trabalho noturno será computada como de 52
   * minutos e 30 segundos". Sete horas de relógio entre 22h e 5h equivalem a
   * oito horas noturnas — quem multiplica direto perde 1/8 do adicional.
   */
  const horasNoturnasComputadas = Math.round(
    (entrada.horasNoturnas * SEGUNDOS_NA_HORA) / segundosDaHoraNoturna,
  )
  const adicionalPorHora = aplicarAliquota(valorHoraNormal, adicionalNoturnoBp, POLITICA)
  const adicionalNoturno = multiplicarPorInteiro(adicionalPorHora, horasNoturnasComputadas)

  if (entrada.horasNoturnas > 0) {
    etapas.push({
      rotulo: 'Horas noturnas computadas',
      formula: `${entrada.horasNoturnas}h de relógio × 3.600s ÷ ${segundosDaHoraNoturna.toLocaleString('pt-BR')}s = ${horasNoturnasComputadas}h noturnas`,
      resultado: ZERO,
      fundamento: fundamentar(CLT_ART_73),
      justificativa:
        'A hora noturna é computada como 52 minutos e 30 segundos, então sete horas de ' +
        'relógio valem oito horas noturnas.',
    })
    etapas.push({
      rotulo: `Adicional noturno de ${percentual(adicionalNoturnoBp)}`,
      formula: `${reais(valorHoraNormal)} × ${percentual(adicionalNoturnoBp)} = ${reais(adicionalPorHora)} × ${horasNoturnasComputadas}h`,
      resultado: adicionalNoturno,
      fundamento: fundamentar(CLT_ART_73),
    })
  }

  // `RN-025` — reflexo no descanso semanal remunerado.
  const somaDosAdicionais = somar(extras50, extras100, adicionalNoturno)
  let reflexoDsr: Centavos = ZERO

  if (entrada.refletirDSR && somaDosAdicionais > 0) {
    if (entrada.diasUteis <= 0 || entrada.diasDescanso <= 0) {
      return {
        ok: false,
        motivo: 'entrada_invalida',
        detalhe: 'Informe os dias úteis e os dias de descanso do mês para calcular o reflexo.',
      }
    }
    reflexoDsr = proporcao(
      multiplicarPorInteiro(somaDosAdicionais, entrada.diasDescanso),
      1,
      entrada.diasUteis,
      POLITICA,
    )
    etapas.push({
      rotulo: 'Reflexo no descanso semanal remunerado',
      formula: `${reais(somaDosAdicionais)} ÷ ${entrada.diasUteis} dias úteis × ${entrada.diasDescanso} dias de descanso`,
      resultado: reflexoDsr,
      fundamento: fundamentar(LEI_605_ART_7),
      justificativa:
        'A remuneração do repouso computa as horas extraordinárias habitualmente prestadas ' +
        '(Súmula 172 do TST). Sem habitualidade, não há reflexo.',
    })
    vigencias.add(TST_SUMULA_172.id)
  }

  const total = somar(somaDosAdicionais, reflexoDsr)
  etapas.push({
    rotulo: 'Total a receber pelas horas',
    formula:
      `${reais(extras50)} (50%) + ${reais(extras100)} (100%) + ${reais(adicionalNoturno)} (noturno)` +
      (reflexoDsr > 0 ? ` + ${reais(reflexoDsr)} (DSR)` : ''),
    resultado: total,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }

  return {
    ok: true,
    valores: {
      total,
      valorHoraNormal,
      divisor,
      extras50,
      extras100,
      adicionalNoturno,
      horasNoturnasComputadas,
      reflexoDsr,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-007 — FGTS
// ---------------------------------------------------------------------------

export type MotivoSaida =
  | 'trabalhando'
  | 'sem-justa-causa'
  | 'pedido-demissao'
  | 'acordo-mutuo'

export interface EntradaFgts {
  readonly salario: Centavos
  readonly mesesTrabalhados: number
  readonly incluir13: boolean
  readonly motivoSaida: MotivoSaida
}

export interface SaidaFgts {
  readonly saldoEstimado: Centavos
  readonly depositoMensal: Centavos
  readonly multa: Centavos
  readonly totalComMulta: Centavos
  readonly temMulta: boolean
  readonly percentualMulta: BasisPoints
}

export function calcularFgts(
  entrada: EntradaFgts,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaFgts> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário bruto para ver o resultado.' }
  }
  if (entrada.mesesTrabalhados <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe os meses de contrato para ver o resultado.' }
  }

  const aliquota = registro.resolver('fgts-aliquota-deposito', dataReferencia)
  if (!aliquota.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: aliquota.detalhe }
  if (aliquota.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O parâmetro de FGTS não é percentual.' }
  }
  const aliquotaBp = basisPoints(aliquota.resolvida.vigencia.valor.aliquotaBp)

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([aliquota.resolvida.vigencia.id])

  const depositoMensal = aplicarAliquota(entrada.salario, aliquotaBp, POLITICA)
  etapas.push({
    rotulo: 'Depósito mensal',
    formula: `${reais(entrada.salario)} × ${percentual(aliquotaBp)}`,
    resultado: depositoMensal,
    parametro: {
      parametroId: 'fgts-aliquota-deposito',
      nome: aliquota.resolvida.parametro.nome,
      vigenciaInicio: aliquota.resolvida.vigencia.inicio,
      vigenciaFim: aliquota.resolvida.vigencia.fim,
      norma: aliquota.resolvida.fonte.norma,
      ...(aliquota.resolvida.fonte.dispositivo === undefined
        ? {}
        : { dispositivo: aliquota.resolvida.fonte.dispositivo }),
      url: aliquota.resolvida.fonte.url,
    },
  })

  // O art. 15 inclui a Gratificação de Natal na base: 13 depósitos por ano.
  const mesesEquivalentes = entrada.incluir13
    ? Math.round((entrada.mesesTrabalhados * (AVOS_NO_ANO + 1)) / AVOS_NO_ANO)
    : entrada.mesesTrabalhados

  const saldoEstimado = multiplicarPorInteiro(depositoMensal, mesesEquivalentes)
  etapas.push({
    rotulo: 'Saldo estimado — sem correção',
    formula: entrada.incluir13
      ? `${reais(depositoMensal)} × ${entrada.mesesTrabalhados} meses × 13/12 (com 13º) = ${reais(saldoEstimado)}`
      : `${reais(depositoMensal)} × ${entrada.mesesTrabalhados} meses`,
    resultado: saldoEstimado,
    fundamento: fundamentar(LEI_8036_ART_15),
    justificativa:
      'ESTIMATIVA. O saldo real inclui correção monetária e juros, ignora aumentos, faltas e ' +
      'afastamentos, e consta apenas do extrato da conta vinculada (`RN-023`).',
  })

  // A multa depende do motivo, e não é escolha livre.
  const temMulta = entrada.motivoSaida === 'sem-justa-causa' || entrada.motivoSaida === 'acordo-mutuo'
  const idDaMulta =
    entrada.motivoSaida === 'acordo-mutuo' ? 'fgts-multa-acordo-mutuo' : 'fgts-multa-sem-justa-causa'

  let multa: Centavos = ZERO
  let percentualMulta = basisPoints(0)

  if (temMulta) {
    const r = registro.resolver(idDaMulta, dataReferencia)
    if (!r.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: r.detalhe }
    if (r.resolvida.vigencia.valor.tipo !== 'percentual') {
      return { ok: false, motivo: 'entrada_invalida', detalhe: 'O parâmetro de multa não é percentual.' }
    }
    percentualMulta = basisPoints(r.resolvida.vigencia.valor.aliquotaBp)
    multa = aplicarAliquota(saldoEstimado, percentualMulta, POLITICA)
    vigencias.add(r.resolvida.vigencia.id)

    etapas.push({
      rotulo: 'Multa rescisória',
      formula: `${reais(saldoEstimado)} × ${percentual(percentualMulta)}`,
      resultado: multa,
      parametro: {
        parametroId: idDaMulta,
        nome: r.resolvida.parametro.nome,
        vigenciaInicio: r.resolvida.vigencia.inicio,
        vigenciaFim: r.resolvida.vigencia.fim,
        norma: r.resolvida.fonte.norma,
        ...(r.resolvida.fonte.dispositivo === undefined
          ? {}
          : { dispositivo: r.resolvida.fonte.dispositivo }),
        url: r.resolvida.fonte.url,
      },
      ...(entrada.motivoSaida === 'acordo-mutuo'
        ? {
            justificativa:
              'Na extinção por acordo a indenização é devida pela metade, e a movimentação da ' +
              'conta fica limitada a 80% dos depósitos.',
          }
        : {}),
    })
  } else {
    etapas.push({
      rotulo: 'Sem multa rescisória',
      formula:
        entrada.motivoSaida === 'trabalhando'
          ? 'O contrato segue em vigor'
          : 'A multa é devida na despedida pelo empregador sem justa causa e, pela metade, no acordo',
      resultado: ZERO,
      fundamento: fundamentar(LEI_8036_ART_15),
    })
  }

  const totalComMulta = somar(saldoEstimado, multa)
  etapas.push({
    rotulo: temMulta ? 'Saldo mais multa' : 'Saldo estimado',
    formula: temMulta ? `${reais(saldoEstimado)} + ${reais(multa)}` : `${reais(saldoEstimado)}`,
    resultado: totalComMulta,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }

  return {
    ok: true,
    valores: { saldoEstimado, depositoMensal, multa, totalComMulta, temMulta, percentualMulta },
    traco,
  }
}

export { centavos }
