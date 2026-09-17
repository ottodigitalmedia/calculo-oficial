/**
 * CALC-083 — Salário do jovem aprendiz · CALC-084 — Recesso do estágio.
 *
 * Os dois vínculos de formação do catálogo. Não compartilham conta; dividem o
 * arquivo pela razão de `jornada-e-fgts.ts`.
 *
 * **Aprendiz: o piso é o salário mínimo HORÁRIO, não o mensal.** O art. 428,
 * § 2º, da CLT garante "o salário mínimo hora", e o aprendiz costuma ter jornada
 * menor que a integral — então o salário do mês é proporcional às horas, e não
 * o mínimo mensal. O valor horário vem do decreto, já arredondado (ver
 * `DECRETO_12342_2024`).
 *
 * **Estágio: a lei deixa duas lacunas, e a calculadora as declara.** Não diz
 * como arredondar os dias proporcionais, nem manda indenizar o recesso não
 * gozado ao fim do estágio. A conta mostra a proporção exata e não inventa
 * nenhuma das duas regras.
 */

import { aplicarAliquota, maximo, multiplicarPorInteiro, proporcao } from '../money'
import { calcularSalarioLiquido } from './salario-liquido'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type Centavos } from '../types'
import type { DataISO } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import { CLT_ART_64, CLT_ART_428, LEI_11788_ART_13 } from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

/** Mesma derivação do divisor mensal de `jornada-e-fgts.ts` (CLT, art. 64). */
const DIAS_UTEIS_POR_MES_SOBRE_SEMANA = 5

/** Os valores de horas e dias chegam e saem em centésimos. Unidade. */
// eslint-disable-next-line no-restricted-syntax -- escala dos campos decimais (centésimos), não constante legal
const CENTESIMOS = 100

/** Meses num ano. Unidade de calendário. */
const MESES_NO_ANO = 12

/** Dias de trabalho numa semana, no máximo. Limite de calendário, não de lei. */
const DIAS_DE_TRABALHO_NA_SEMANA_MAXIMO = 6

function inteiroDe(registro: Registro, id: string, data: DataISO) {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

function horasOuDias(centesimos: number, unidade: string): string {
  const inteiro = Math.trunc(centesimos / CENTESIMOS)
  const fracao = centesimos % CENTESIMOS
  const numero = fracao === 0 ? String(inteiro) : `${inteiro},${String(fracao).padStart(2, '0')}`
  return `${numero} ${unidade}`
}

// ---------------------------------------------------------------------------
// CALC-083 — Salário do jovem aprendiz
// ---------------------------------------------------------------------------

export interface EntradaAprendiz {
  readonly horasDiarias: number
  readonly diasPorSemana: number
  /** Valor da hora previsto no contrato. Zero = o salário mínimo horário. */
  readonly valorHoraContratado: Centavos
}

export interface SaidaAprendiz {
  readonly salarioBruto: Centavos
  readonly inss: Centavos
  readonly irrf: Centavos
  readonly liquido: Centavos
  readonly fgts: Centavos
  readonly valorHora: Centavos
  readonly salarioMinimoHora: Centavos
  readonly horasSemanais: number
  readonly horasMensais: number
  /** Jornada acima de seis horas, que só vale nas condições do art. 432, § 1º. */
  readonly jornadaEstendida: boolean
  /** O valor contratado estava abaixo do mínimo horário e foi substituído por ele. */
  readonly aplicadoPiso: boolean
}

export function calcularAprendiz(
  entrada: EntradaAprendiz,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaAprendiz> {
  if (entrada.horasDiarias <= 0 || entrada.diasPorSemana <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe as horas por dia e os dias de trabalho por semana.' }
  }
  if (entrada.diasPorSemana > DIAS_DE_TRABALHO_NA_SEMANA_MAXIMO) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A semana tem no máximo seis dias de trabalho.' }
  }

  const jornada = inteiroDe(registro, 'aprendiz-jornada-diaria', dataReferencia)
  const jornadaEstendidaMaxima = inteiroDe(registro, 'aprendiz-jornada-diaria-estendida', dataReferencia)
  if (jornada === null || jornadaEstendidaMaxima === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há limite de jornada do aprendiz para a data informada.' }
  }
  if (entrada.horasDiarias > jornadaEstendidaMaxima.valor) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        `A jornada do aprendiz não pode passar de ${jornadaEstendidaMaxima.valor} horas diárias — e só chega ` +
        'a esse limite para quem já completou o ensino fundamental, contando as horas de aprendizagem teórica.',
    }
  }

  const minimoHora = registro.resolver('salario-minimo-hora', dataReferencia)
  const fgtsAprendiz = registro.resolver('fgts-aliquota-aprendiz', dataReferencia)
  if (!minimoHora.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: minimoHora.detalhe }
  if (!fgtsAprendiz.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: fgtsAprendiz.detalhe }
  if (minimoHora.resolvida.vigencia.valor.tipo !== 'valor_monetario') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'O salário mínimo horário não é valor monetário.' }
  }
  if (fgtsAprendiz.resolvida.vigencia.valor.tipo !== 'percentual') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'A alíquota de FGTS do aprendiz não é percentual.' }
  }

  const salarioMinimoHora = centavos(minimoHora.resolvida.vigencia.valor.centavos)
  const aliquotaFgts = basisPoints(fgtsAprendiz.resolvida.vigencia.valor.aliquotaBp)
  const etapas: Etapa[] = []
  const vigencias = new Set<string>([
    minimoHora.resolvida.vigencia.id,
    fgtsAprendiz.resolvida.vigencia.id,
    jornada.resolvida.vigencia.id,
  ])

  // --- Valor da hora: o contratado, se maior que o piso --------------------
  const aplicadoPiso = entrada.valorHoraContratado > 0 && entrada.valorHoraContratado < salarioMinimoHora
  const valorHora = maximo(entrada.valorHoraContratado, salarioMinimoHora)
  etapas.push({
    rotulo: 'Salário mínimo horário',
    formula: reais(salarioMinimoHora),
    resultado: salarioMinimoHora,
    parametro: citar(minimoHora.resolvida),
  })
  etapas.push({
    rotulo: 'Valor da hora aplicado',
    formula:
      entrada.valorHoraContratado > 0
        ? `maior entre o contratado, ${reais(entrada.valorHoraContratado)}, e o mínimo horário, ${reais(salarioMinimoHora)}`
        : `${reais(salarioMinimoHora)} — o mínimo horário`,
    resultado: valorHora,
    fundamento: fundamentar(CLT_ART_428),
    justificativa: aplicadoPiso
      ? 'O valor contratado estava abaixo do salário mínimo horário, que é o piso garantido ao aprendiz. A conta usa o piso.'
      : 'Ao aprendiz é garantido o salário mínimo hora, salvo condição mais favorável.',
  })

  // --- Horas do mês --------------------------------------------------------
  const horasSemanais = entrada.horasDiarias * entrada.diasPorSemana
  const horasMensais = horasSemanais * DIAS_UTEIS_POR_MES_SOBRE_SEMANA
  const jornadaEstendida = entrada.horasDiarias > jornada.valor
  if (jornadaEstendida) vigencias.add(jornadaEstendidaMaxima.resolvida.vigencia.id)

  etapas.push({
    rotulo: 'Horas por semana',
    formula: `${entrada.horasDiarias}h por dia × ${entrada.diasPorSemana} ${entrada.diasPorSemana === 1 ? 'dia' : 'dias'}`,
    resultado: centavos(horasSemanais * CENTESIMOS),
    unidade: 'numero',
    parametro: citar((jornadaEstendida ? jornadaEstendidaMaxima : jornada).resolvida),
    justificativa: jornadaEstendida
      ? `Jornada acima de ${jornada.valor} horas só é permitida a quem já completou o ensino fundamental, e desde que as horas de aprendizagem teórica estejam contadas nela.`
      : `A jornada do aprendiz não passa de ${jornada.valor} horas diárias, sem prorrogação nem compensação.`,
  })
  etapas.push({
    rotulo: 'Horas remuneradas no mês',
    formula: `${horasSemanais}h por semana × 5`,
    resultado: centavos(horasMensais * CENTESIMOS),
    unidade: 'numero',
    fundamento: fundamentar(CLT_ART_64),
    justificativa:
      'O mês remunerado é a jornada semanal multiplicada por 5 — a mesma conta que faz 44 horas semanais ' +
      'virarem o divisor 220, e que já inclui o repouso semanal.',
  })

  const salarioBruto = multiplicarPorInteiro(valorHora, horasMensais)
  etapas.push({
    rotulo: 'Salário bruto do aprendiz',
    formula: `${reais(valorHora)} × ${horasMensais} horas`,
    resultado: salarioBruto,
  })

  // --- Descontos: o mesmo motor do salário líquido --------------------------
  const liquido = calcularSalarioLiquido(
    { salarioBruto, dependentes: 0, pensao: ZERO, outrosDescontos: ZERO, custoValeTransporte: ZERO },
    dataReferencia,
    registro,
  )
  if (!liquido.ok) return liquido
  etapas.push(...liquido.traco.etapas)
  for (const v of liquido.traco.vigenciasAplicadas) vigencias.add(v)

  // --- FGTS reduzido -------------------------------------------------------
  const fgts = aplicarAliquota(salarioBruto, aliquotaFgts, POLITICA)
  etapas.push({
    rotulo: 'FGTS depositado pelo empregador',
    formula: `${reais(salarioBruto)} × ${percentual(aliquotaFgts)}`,
    resultado: fgts,
    parametro: citar(fgtsAprendiz.resolvida),
    justificativa:
      'No contrato de aprendizagem o depósito é reduzido. É pago pelo empregador, por fora, e não sai do salário.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      salarioBruto,
      inss: liquido.valores.inss,
      irrf: liquido.valores.irrf,
      liquido: liquido.valores.liquido,
      fgts,
      valorHora,
      salarioMinimoHora,
      horasSemanais,
      horasMensais,
      jornadaEstendida,
      aplicadoPiso,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-084 — Recesso do estágio
// ---------------------------------------------------------------------------

export interface EntradaRecessoEstagio {
  readonly mesesDeEstagio: number
  /** Bolsa mensal. Zero = estágio sem contraprestação, recesso não remunerado. */
  readonly bolsa: Centavos
  /** Dias de recesso já gozados, em centésimos. */
  readonly diasGozadosCentesimos: number
}

export interface SaidaRecessoEstagio {
  /** Dias de recesso adquiridos no período, em centésimos. */
  readonly diasAdquiridosCentesimos: number
  /** Dias ainda não gozados, em centésimos. */
  readonly diasRestantesCentesimos: number
  /** Remuneração dos dias restantes. Zero quando não há bolsa. */
  readonly valor: Centavos
  readonly remunerado: boolean
}

export function calcularRecessoEstagio(
  entrada: EntradaRecessoEstagio,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaRecessoEstagio> {
  if (entrada.mesesDeEstagio <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe há quantos meses dura o estágio.' }
  }
  if (entrada.diasGozadosCentesimos < 0 || entrada.bolsa < 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os valores não podem ser negativos.' }
  }

  const recesso = registro.resolver('estagio-recesso-dias', dataReferencia)
  if (!recesso.ok) return { ok: false, motivo: 'vigencia_ausente', detalhe: recesso.detalhe }
  if (recesso.resolvida.vigencia.valor.tipo !== 'inteiro') {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Os dias de recesso não são inteiros.' }
  }
  const diasPorAno = recesso.resolvida.vigencia.valor.valor

  const etapas: Etapa[] = []

  // A proporção é exata em centésimos: 30 dias × 100 ÷ 12 meses = 250 por mês.
  const diasAdquiridosCentesimos = Math.round(
    (diasPorAno * CENTESIMOS * entrada.mesesDeEstagio) / MESES_NO_ANO,
  )
  etapas.push({
    rotulo: 'Dias de recesso adquiridos',
    formula: `${diasPorAno} dias × ${entrada.mesesDeEstagio} ${entrada.mesesDeEstagio === 1 ? 'mês' : 'meses'} ÷ 12`,
    resultado: centavos(diasAdquiridosCentesimos),
    unidade: 'numero',
    parametro: citar(recesso.resolvida),
    justificativa:
      entrada.mesesDeEstagio < MESES_NO_ANO
        ? 'Com menos de um ano de estágio, os dias são concedidos de forma proporcional. A lei não diz como ' +
          'arredondar a fração — o valor é mostrado exato.'
        : 'São trinta dias a cada ano de estágio; o que passar de anos completos é proporcional.',
  })

  if (entrada.diasGozadosCentesimos > diasAdquiridosCentesimos) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe: `Os dias já gozados passam dos ${horasOuDias(diasAdquiridosCentesimos, 'dias')} adquiridos no período.`,
    }
  }

  const diasRestantesCentesimos = diasAdquiridosCentesimos - entrada.diasGozadosCentesimos
  etapas.push({
    rotulo: 'Dias ainda não gozados',
    formula: `${horasOuDias(diasAdquiridosCentesimos, 'dias')} − ${horasOuDias(entrada.diasGozadosCentesimos, 'dias')} já gozados`,
    resultado: centavos(diasRestantesCentesimos),
    unidade: 'numero',
  })

  const remunerado = entrada.bolsa > 0
  const valor = remunerado
    ? proporcao(entrada.bolsa, diasRestantesCentesimos, diasPorAno * CENTESIMOS, POLITICA)
    : ZERO
  etapas.push({
    rotulo: 'Remuneração do recesso',
    formula: remunerado
      ? `${reais(entrada.bolsa)} ÷ ${diasPorAno} × ${horasOuDias(diasRestantesCentesimos, 'dias')}`
      : 'Sem bolsa, o recesso não é remunerado',
    resultado: valor,
    fundamento: fundamentar(LEI_11788_ART_13),
    justificativa: remunerado
      ? 'O recesso é remunerado quando o estagiário recebe bolsa. A conta usa a bolsa do mês dividida em trinta dias.'
      : 'O recesso é remunerado apenas quando há bolsa ou outra forma de contraprestação.',
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [recesso.resolvida.vigencia.id] }
  return {
    ok: true,
    valores: { diasAdquiridosCentesimos, diasRestantesCentesimos, valor, remunerado },
    traco,
  }
}
