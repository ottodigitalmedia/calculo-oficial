/**
 * CALC-080 — DSR sobre comissões e variáveis · CALC-081 — Desconto de faltas.
 *
 * As duas pontas da mesma lei, a nº 605/1949: uma calcula o repouso que a
 * remuneração variável gera (art. 7º), a outra o repouso que a falta
 * injustificada tira (art. 6º). Ninguém pesquisa uma sem esbarrar na outra.
 *
 * Nenhuma das duas consulta parâmetro com vigência: a regra está no corpo da lei
 * desde 1949, e o que a memória cita é o dispositivo — `fundamento`, não
 * `parametro` (`MC-3`).
 */

import { multiplicarPorInteiro, naoNegativo, proporcao, somar, subtrair } from '../money'
import { fundamentar, reais, type Etapa, type Resultado, type Traco } from '../traco'
import type { Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import { CLT_ART_64, LEI_605_ART_6, LEI_605_ART_7_C, TST_SUMULA_27 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

/**
 * O mês comercial de 30 dias — o denominador do salário-dia do mensalista.
 *
 * Vem do art. 64 da CLT, que calcula o salário-hora dividindo o mensal por
 * "30 (trinta) vezes o número de horas dessa duração": o dia é um trinta avos do
 * mês, qualquer que seja o número de dias do mês civil. É a mesma base de
 * `jornada-e-fgts.ts`.
 */
const DIAS_DO_MES_COMERCIAL = 30

/** Nenhum mês tem mais de cinco semanas — limite de sanidade da entrada. */
const SEMANAS_NO_MES_MAXIMO = 5

// ---------------------------------------------------------------------------
// CALC-080 — DSR sobre comissões e variáveis
// ---------------------------------------------------------------------------

export interface EntradaDsrVariavel {
  /** Comissões, horas extras ou outra remuneração variável do mês. */
  readonly valorVariavel: Centavos
  /** Dias úteis efetivamente trabalhados no mês. */
  readonly diasUteis: number
  /** Domingos e feriados do mês. */
  readonly domingosEFeriados: number
}

export interface SaidaDsrVariavel {
  readonly dsr: Centavos
  readonly valorPorDia: Centavos
  readonly totalComDsr: Centavos
}

export function calcularDsrVariavel(
  entrada: EntradaDsrVariavel,
  dataReferencia: DataISO,
): Resultado<SaidaDsrVariavel> {
  if (entrada.valorVariavel <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o valor das comissões ou da remuneração variável.' }
  }
  if (entrada.diasUteis <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe os dias úteis trabalhados no mês.' }
  }
  if (entrada.domingosEFeriados < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os domingos e feriados não podem ser negativos.' }
  }
  if (entrada.diasUteis + entrada.domingosEFeriados > 31) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Dias úteis mais domingos e feriados passam de 31 — confira a contagem do mês.',
    }
  }

  const etapas: Etapa[] = []

  const valorPorDia = proporcao(entrada.valorVariavel, 1, entrada.diasUteis, POLITICA)
  etapas.push({
    rotulo: 'Valor variável por dia trabalhado',
    formula: `${reais(entrada.valorVariavel)} ÷ ${entrada.diasUteis} dias úteis`,
    resultado: valorPorDia,
    fundamento: fundamentar(LEI_605_ART_7_C),
    justificativa:
      'Para quem ganha por produção, a lei manda dividir o ganho do período pelos dias de serviço ' +
      'efetivamente prestados. O resultado é o valor de um dia de repouso.',
  })

  // Uma única divisão, sobre o produto: arredondar o valor por dia antes de
  // multiplicar acumularia o erro a cada domingo e feriado.
  const dsr = proporcao(
    multiplicarPorInteiro(entrada.valorVariavel, entrada.domingosEFeriados),
    1,
    entrada.diasUteis,
    POLITICA,
  )
  etapas.push({
    rotulo: 'Repouso sobre a remuneração variável',
    formula: `${reais(entrada.valorVariavel)} ÷ ${entrada.diasUteis} × ${entrada.domingosEFeriados} domingos e feriados`,
    resultado: dsr,
    fundamento: fundamentar(TST_SUMULA_27),
    justificativa:
      'O repouso semanal e os feriados são devidos também ao empregado comissionista. A conta é feita sobre ' +
      'o produto, com um único arredondamento no fim.',
  })

  const totalComDsr = somar(entrada.valorVariavel, dsr)
  etapas.push({
    rotulo: 'Variável com o repouso',
    formula: `${reais(entrada.valorVariavel)} + ${reais(dsr)}`,
    resultado: totalComDsr,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }
  return { ok: true, valores: { dsr, valorPorDia, totalComDsr }, traco }
}

// ---------------------------------------------------------------------------
// CALC-081 — Desconto de faltas
// ---------------------------------------------------------------------------

export interface EntradaDescontoFaltas {
  readonly salario: Centavos
  /** Dias de falta sem motivo justificado. */
  readonly faltas: number
  /** Quantas semanas do mês tiveram pelo menos uma dessas faltas. */
  readonly semanasComFalta: number
}

export interface SaidaDescontoFaltas {
  readonly salarioDia: Centavos
  readonly descontoDosDias: Centavos
  readonly descontoDoRepouso: Centavos
  readonly descontoTotal: Centavos
  readonly salarioAposDesconto: Centavos
}

export function calcularDescontoDeFaltas(
  entrada: EntradaDescontoFaltas,
  dataReferencia: DataISO,
): Resultado<SaidaDescontoFaltas> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário bruto para ver o resultado.' }
  }
  if (entrada.faltas <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe quantos dias de falta sem justificativa houve no mês.' }
  }
  if (entrada.faltas > DIAS_DO_MES_COMERCIAL) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'As faltas não podem passar de 30 dias no mês.' }
  }
  if (entrada.semanasComFalta < 0 || entrada.semanasComFalta > SEMANAS_NO_MES_MAXIMO) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Um mês tem no máximo cinco semanas.' }
  }
  if (entrada.semanasComFalta > entrada.faltas) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: 'Cada semana com repouso perdido precisa de pelo menos uma falta — há mais semanas que faltas.',
    }
  }

  const etapas: Etapa[] = []

  const salarioDia = proporcao(entrada.salario, 1, DIAS_DO_MES_COMERCIAL, POLITICA)
  etapas.push({
    rotulo: 'Salário de um dia',
    formula: `${reais(entrada.salario)} ÷ 30`,
    resultado: salarioDia,
    fundamento: fundamentar(CLT_ART_64),
    justificativa:
      'O dia do mensalista é um trinta avos do salário, qualquer que seja o número de dias do mês — a base ' +
      'do art. 64 da CLT.',
  })

  const descontoDosDias = proporcao(entrada.salario, entrada.faltas, DIAS_DO_MES_COMERCIAL, POLITICA)
  etapas.push({
    rotulo: 'Desconto dos dias de falta',
    formula: `${reais(entrada.salario)} × ${entrada.faltas} ÷ 30`,
    resultado: descontoDosDias,
  })

  const descontoDoRepouso = proporcao(entrada.salario, entrada.semanasComFalta, DIAS_DO_MES_COMERCIAL, POLITICA)
  etapas.push({
    rotulo: 'Perda do repouso semanal',
    formula:
      entrada.semanasComFalta > 0
        ? `${reais(entrada.salario)} × ${entrada.semanasComFalta} ${entrada.semanasComFalta === 1 ? 'semana' : 'semanas'} ÷ 30`
        : 'Nenhuma semana com repouso perdido informada',
    resultado: descontoDoRepouso,
    fundamento: fundamentar(LEI_605_ART_6),
    justificativa:
      'Quem falta sem motivo justificado na semana perde a remuneração do repouso daquela semana. Falta ' +
      'justificada — atestado médico, casamento, acidente de trabalho e as hipóteses do art. 473 da CLT — ' +
      'não gera esse desconto.',
  })

  const descontoTotal = somar(descontoDosDias, descontoDoRepouso)
  etapas.push({
    rotulo: 'Desconto total',
    formula: `${reais(descontoDosDias)} + ${reais(descontoDoRepouso)}`,
    resultado: descontoTotal,
  })

  const salarioAposDesconto = naoNegativo(subtrair(entrada.salario, descontoTotal))
  etapas.push({
    rotulo: 'Salário bruto após o desconto',
    formula: `${reais(entrada.salario)} − ${reais(descontoTotal)}`,
    resultado: salarioAposDesconto,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [] }
  return {
    ok: true,
    valores: { salarioDia, descontoDosDias, descontoDoRepouso, descontoTotal, salarioAposDesconto },
    traco,
  }
}
