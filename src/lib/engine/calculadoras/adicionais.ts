/**
 * CALC-077 — Adicional noturno · CALC-078 — Insalubridade · CALC-079 —
 * Periculosidade.
 *
 * Os três adicionais que se somam ao salário por condição de trabalho, no mesmo
 * arquivo pela razão de `jornada-e-fgts.ts`: são pequenos, e cada arquivo novo
 * no motor é um pedaço a mais no pacote adiado.
 *
 * **O que cada um tem de armadilha, e que a memória de cálculo precisa mostrar:**
 *
 * - noturno urbano: a hora dura 52min30s (CLT, art. 73, § 1º), então as horas
 *   de relógio valem mais horas noturnas; o RURAL não tem essa redução, e o
 *   percentual é outro (Lei nº 5.889/1973, art. 7º);
 * - insalubridade: a base é o salário mínimo, não o salário do empregado
 *   (CLT, art. 192) — é o erro mais comum de quem calcula de cabeça;
 * - periculosidade: a base é o salário básico, sem outros adicionais (CLT, art.
 *   193, § 1º, e Súmula 191, I, do TST), e não se acumula com a insalubridade:
 *   o empregado escolhe um (§ 2º).
 */

import { aplicarAliquota, multiplicarPorInteiro, proporcao, somar } from '../money'
import { citar, fundamentar, percentual, reais, type Etapa, type Resultado, type Traco } from '../traco'
import { ZERO, basisPoints, centavos, type BasisPoints, type Centavos } from '../types'
import type { DataISO, VigenciaResolvida } from '../../params/tipos'
import type { Registro } from '../../params/registry'
import {
  CLT_ART_64,
  CLT_ART_193,
  TST_SUMULA_60,
  TST_SUMULA_139,
  TST_SUMULA_191,
  TST_SUMULA_431,
} from '../../params/data/fontes'

const POLITICA = 'meio_para_cima' as const

/** Segundos de uma hora de relógio. Unidade, não parâmetro legal. */
// eslint-disable-next-line no-restricted-syntax -- definição de unidade de tempo, não constante legal
const SEGUNDOS_NA_HORA = 3_600

/** As horas chegam em centésimos, como todo campo decimal. Unidade. */
// eslint-disable-next-line no-restricted-syntax -- escala do campo decimal (centésimos), não constante legal
const CENTESIMOS = 100

/**
 * Divisor mensal = jornada semanal × 5 — a mesma derivação de `jornada-e-fgts.ts`
 * (CLT, art. 64, com a semana de seis dias: 30 ÷ 6 = 5). Para 40h dá 200, o
 * divisor da Súmula 431 do TST.
 */
const DIAS_UTEIS_POR_MES_SOBRE_SEMANA = 5

type Resolucao<T> = { readonly ok: true; readonly valor: T; readonly resolvida: VigenciaResolvida } | null

function resolverPercentual(registro: Registro, id: string, data: DataISO): Resolucao<BasisPoints> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'percentual') return null
  return { ok: true, valor: basisPoints(r.resolvida.vigencia.valor.aliquotaBp), resolvida: r.resolvida }
}

function resolverInteiro(registro: Registro, id: string, data: DataISO): Resolucao<number> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'inteiro') return null
  return { ok: true, valor: r.resolvida.vigencia.valor.valor, resolvida: r.resolvida }
}

function resolverMonetario(registro: Registro, id: string, data: DataISO): Resolucao<Centavos> {
  const r = registro.resolver(id, data)
  if (!r.ok || r.resolvida.vigencia.valor.tipo !== 'valor_monetario') return null
  return { ok: true, valor: centavos(r.resolvida.vigencia.valor.centavos), resolvida: r.resolvida }
}

/** "7,50" a partir de 750 centésimos — só para compor a fórmula. */
function horas(centesimos: number): string {
  const inteiro = Math.trunc(centesimos / CENTESIMOS)
  const fracao = centesimos % CENTESIMOS
  return fracao === 0 ? `${inteiro}h` : `${inteiro},${String(fracao).padStart(2, '0')}h`
}

// ---------------------------------------------------------------------------
// CALC-077 — Adicional noturno
// ---------------------------------------------------------------------------

/** Urbano segue a CLT; lavoura e pecuária seguem a Lei nº 5.889/1973. */
export type RegimeNoturno = 'urbano' | 'lavoura' | 'pecuaria'

export interface EntradaAdicionalNoturno {
  readonly salario: Centavos
  readonly jornadaSemanal: number
  readonly regime: RegimeNoturno
  /** Horas de RELÓGIO trabalhadas no horário noturno, em centésimos. */
  readonly horasNoturnasCentesimos: number
  readonly refletirDSR: boolean
  readonly diasUteis: number
  readonly diasDescanso: number
}

export interface SaidaAdicionalNoturno {
  readonly total: Centavos
  readonly adicional: Centavos
  readonly reflexoDsr: Centavos
  readonly valorHoraNormal: Centavos
  readonly adicionalPorHora: Centavos
  readonly aliquota: BasisPoints
  readonly divisor: number
  /** Horas noturnas que entram na conta, em centésimos. Iguais às de relógio no rural. */
  readonly horasComputadasCentesimos: number
  readonly horaReduzida: boolean
}

export function calcularAdicionalNoturno(
  entrada: EntradaAdicionalNoturno,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaAdicionalNoturno> {
  if (entrada.salario <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário bruto para ver o resultado.' }
  }
  if (entrada.horasNoturnasCentesimos <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe as horas trabalhadas no horário noturno.' }
  }
  if (entrada.jornadaSemanal <= 0) {
    return { ok: false, motivo: 'entrada_invalida', detalhe: 'Informe a jornada semanal.' }
  }

  const urbano = entrada.regime === 'urbano'
  const percentualAplicado = resolverPercentual(
    registro,
    urbano ? 'adicional-noturno' : 'adicional-noturno-rural',
    dataReferencia,
  )
  const horaNoturna = urbano ? resolverInteiro(registro, 'hora-noturna-segundos', dataReferencia) : null
  if (percentualAplicado === null || (urbano && horaNoturna === null)) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há parâmetro de trabalho noturno para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([percentualAplicado.resolvida.vigencia.id])

  // --- Valor da hora normal — mesmo divisor das horas extras ---------------
  const divisor = entrada.jornadaSemanal * DIAS_UTEIS_POR_MES_SOBRE_SEMANA
  const valorHoraNormal = proporcao(entrada.salario, 1, divisor, POLITICA)
  etapas.push({
    rotulo: 'Valor da hora normal',
    formula: `${reais(entrada.salario)} ÷ ${divisor} (jornada de ${entrada.jornadaSemanal}h × 5)`,
    resultado: valorHoraNormal,
    fundamento: fundamentar(entrada.jornadaSemanal === 40 ? TST_SUMULA_431 : CLT_ART_64),
  })

  // --- Horas que entram na conta -------------------------------------------
  let horasComputadasCentesimos = entrada.horasNoturnasCentesimos
  if (urbano && horaNoturna !== null) {
    vigencias.add(horaNoturna.resolvida.vigencia.id)
    // Para EXIBIR as horas computadas; o valor em dinheiro abaixo não passa por
    // este arredondamento — ele aplica a proporção direto sobre o adicional.
    horasComputadasCentesimos = Math.round(
      (entrada.horasNoturnasCentesimos * SEGUNDOS_NA_HORA) / horaNoturna.valor,
    )
    etapas.push({
      rotulo: 'Horas noturnas computadas',
      formula: `${horas(entrada.horasNoturnasCentesimos)} de relógio × 3.600s ÷ ${horaNoturna.valor.toLocaleString('pt-BR')}s = ${horas(horasComputadasCentesimos)} noturnas`,
      resultado: centavos(horasComputadasCentesimos),
      unidade: 'numero',
      parametro: citar(horaNoturna.resolvida),
      justificativa:
        'A hora noturna urbana é computada como 52 minutos e 30 segundos. Sete horas de relógio ' +
        'entre 22h e 5h valem oito horas noturnas.',
    })
  } else {
    etapas.push({
      rotulo: 'Horas noturnas — sem redução',
      formula: `${horas(entrada.horasNoturnasCentesimos)} de relógio, ${
        entrada.regime === 'lavoura' ? 'das 21h às 5h, na lavoura' : 'das 20h às 4h, na pecuária'
      }`,
      resultado: centavos(horasComputadasCentesimos),
      unidade: 'numero',
      parametro: citar(percentualAplicado.resolvida),
      justificativa:
        'A lei do trabalho rural define o horário noturno e o percentual, mas não reduz a hora: a hora ' +
        'de 52 minutos e 30 segundos é regra da CLT para o trabalho urbano.',
    })
  }

  // --- O adicional -----------------------------------------------------------
  const adicionalPorHora = aplicarAliquota(valorHoraNormal, percentualAplicado.valor, POLITICA)
  const adicional =
    urbano && horaNoturna !== null
      ? proporcao(
          adicionalPorHora,
          entrada.horasNoturnasCentesimos * SEGUNDOS_NA_HORA,
          horaNoturna.valor * CENTESIMOS,
          POLITICA,
        )
      : proporcao(adicionalPorHora, entrada.horasNoturnasCentesimos, CENTESIMOS, POLITICA)

  etapas.push({
    rotulo: `Adicional noturno de ${percentual(percentualAplicado.valor)}`,
    formula: urbano
      ? `${reais(valorHoraNormal)} × ${percentual(percentualAplicado.valor)} = ${reais(adicionalPorHora)} por hora × ${horas(entrada.horasNoturnasCentesimos)} × 3.600 ÷ ${horaNoturna?.valor.toLocaleString('pt-BR')}`
      : `${reais(valorHoraNormal)} × ${percentual(percentualAplicado.valor)} = ${reais(adicionalPorHora)} por hora × ${horas(entrada.horasNoturnasCentesimos)}`,
    resultado: adicional,
    parametro: citar(percentualAplicado.resolvida),
    ...(urbano
      ? {
          justificativa:
            'A conversão para horas noturnas é aplicada sobre o valor do adicional, sem arredondar as horas ' +
            'no caminho — arredondá-las antes pagaria de mais ou de menos em jornadas quebradas.',
        }
      : {}),
  })

  // --- Reflexo no descanso semanal -----------------------------------------
  let reflexoDsr: Centavos = ZERO
  if (entrada.refletirDSR) {
    if (entrada.diasUteis <= 0 || entrada.diasDescanso <= 0) {
      return {
        ok: false,
        motivo: 'entrada_invalida',
        detalhe: 'Informe os dias úteis e os dias de descanso do mês para calcular o reflexo.',
      }
    }
    reflexoDsr = proporcao(multiplicarPorInteiro(adicional, entrada.diasDescanso), 1, entrada.diasUteis, POLITICA)
    etapas.push({
      rotulo: 'Reflexo no descanso semanal remunerado',
      formula: `${reais(adicional)} ÷ ${entrada.diasUteis} dias úteis × ${entrada.diasDescanso} dias de descanso`,
      resultado: reflexoDsr,
      fundamento: fundamentar(TST_SUMULA_60),
      justificativa:
        'O adicional noturno pago com habitualidade integra o salário para todos os efeitos (Súmula 60, I), ' +
        'e o repouso semanal é calculado sobre o salário (Lei nº 605/1949, art. 7º).',
    })
  }

  const total = somar(adicional, reflexoDsr)
  etapas.push({
    rotulo: 'Total do adicional noturno',
    formula: reflexoDsr > 0 ? `${reais(adicional)} + ${reais(reflexoDsr)} (DSR)` : reais(adicional),
    resultado: total,
  })

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: {
      total,
      adicional,
      reflexoDsr,
      valorHoraNormal,
      adicionalPorHora,
      aliquota: percentualAplicado.valor,
      divisor,
      horasComputadasCentesimos,
      horaReduzida: urbano,
    },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-078 — Insalubridade
// ---------------------------------------------------------------------------

export type GrauInsalubridade = 'maximo' | 'medio' | 'minimo'

const PARAMETRO_DO_GRAU: Readonly<Record<GrauInsalubridade, string>> = {
  maximo: 'insalubridade-grau-maximo',
  medio: 'insalubridade-grau-medio',
  minimo: 'insalubridade-grau-minimo',
}

const NOME_DO_GRAU: Readonly<Record<GrauInsalubridade, string>> = {
  maximo: 'grau máximo',
  medio: 'grau médio',
  minimo: 'grau mínimo',
}

export interface EntradaInsalubridade {
  readonly grau: GrauInsalubridade
  /**
   * Base mais favorável prevista em convenção ou contrato, como o piso da
   * categoria. Zero quer dizer "a base legal": o salário mínimo.
   */
  readonly baseInformada: Centavos
}

export interface SaidaInsalubridade {
  readonly adicional: Centavos
  readonly base: Centavos
  readonly salarioMinimo: Centavos
  readonly aliquota: BasisPoints
  readonly baseEhSalarioMinimo: boolean
}

/**
 * Exportada porque CALC-079 compara a periculosidade com a insalubridade — o
 * § 2º do art. 193 manda o empregado escolher um dos dois.
 */
export function calcularInsalubridade(
  entrada: EntradaInsalubridade,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaInsalubridade> {
  const salarioMinimo = resolverMonetario(registro, 'salario-minimo', dataReferencia)
  const grau = resolverPercentual(registro, PARAMETRO_DO_GRAU[entrada.grau], dataReferencia)
  if (salarioMinimo === null || grau === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há salário mínimo ou adicional cadastrado para a data informada.' }
  }

  if (entrada.baseInformada > 0 && entrada.baseInformada < salarioMinimo.valor) {
    return {
      ok: false,
      motivo: 'entrada_invalida',
      detalhe:
        `A base informada é menor que o salário mínimo (${reais(salarioMinimo.valor)}). O art. 192 da CLT ` +
        'usa o salário mínimo como base; convenção ou contrato só podem prever base maior.',
    }
  }

  const etapas: Etapa[] = []
  const baseEhSalarioMinimo = entrada.baseInformada <= 0
  const base = baseEhSalarioMinimo ? salarioMinimo.valor : entrada.baseInformada

  if (baseEhSalarioMinimo) {
    etapas.push({
      rotulo: 'Base de cálculo — salário mínimo',
      formula: reais(base),
      resultado: base,
      parametro: citar(salarioMinimo.resolvida),
      justificativa:
        'A base legal do adicional é o salário mínimo, e não o salário do empregado. É o erro mais comum de ' +
        'quem calcula de cabeça.',
    })
  } else {
    etapas.push({
      rotulo: 'Base de cálculo informada',
      formula: `${reais(base)} (salário mínimo vigente: ${reais(salarioMinimo.valor)})`,
      resultado: base,
      parametro: citar(salarioMinimo.resolvida),
      justificativa:
        'Base prevista em convenção coletiva ou no contrato, maior que o salário mínimo. Sem previsão desse ' +
        'tipo, vale o salário mínimo.',
    })
  }

  const adicional = aplicarAliquota(base, grau.valor, POLITICA)
  etapas.push({
    rotulo: `Adicional de insalubridade — ${NOME_DO_GRAU[entrada.grau]}`,
    formula: `${reais(base)} × ${percentual(grau.valor)}`,
    resultado: adicional,
    parametro: citar(grau.resolvida),
  })
  etapas.push({
    rotulo: 'Natureza salarial',
    formula: 'O adicional integra a remuneração enquanto é pago',
    resultado: adicional,
    fundamento: fundamentar(TST_SUMULA_139),
    justificativa:
      'Por integrar a remuneração, o adicional sofre INSS e imposto de renda junto com o salário do mês e ' +
      'reflete em férias, 13º e FGTS.',
  })

  const traco: Traco = {
    etapas,
    dataReferencia,
    vigenciasAplicadas: [salarioMinimo.resolvida.vigencia.id, grau.resolvida.vigencia.id],
  }
  return {
    ok: true,
    valores: { adicional, base, salarioMinimo: salarioMinimo.valor, aliquota: grau.valor, baseEhSalarioMinimo },
    traco,
  }
}

// ---------------------------------------------------------------------------
// CALC-079 — Periculosidade
// ---------------------------------------------------------------------------

export interface EntradaPericulosidade {
  readonly salarioBasico: Centavos
  /** Grau de insalubridade a comparar, quando o empregado também faz jus a ela. */
  readonly compararCom: GrauInsalubridade | null
}

export type AdicionalMaisVantajoso = 'periculosidade' | 'insalubridade' | 'iguais'

export interface SaidaPericulosidade {
  readonly adicional: Centavos
  readonly salarioComAdicional: Centavos
  readonly aliquota: BasisPoints
  readonly insalubridade: Centavos | null
  readonly maisVantajoso: AdicionalMaisVantajoso | null
}

export function calcularPericulosidade(
  entrada: EntradaPericulosidade,
  dataReferencia: DataISO,
  registro: Registro,
): Resultado<SaidaPericulosidade> {
  if (entrada.salarioBasico <= 0) {
    return { ok: false, motivo: 'entrada_incompleta', detalhe: 'Informe o salário básico para ver o resultado.' }
  }

  const aliquota = resolverPercentual(registro, 'periculosidade-adicional', dataReferencia)
  if (aliquota === null) {
    return { ok: false, motivo: 'vigencia_ausente', detalhe: 'Não há adicional de periculosidade cadastrado para a data informada.' }
  }

  const etapas: Etapa[] = []
  const vigencias = new Set<string>([aliquota.resolvida.vigencia.id])

  const adicional = aplicarAliquota(entrada.salarioBasico, aliquota.valor, POLITICA)
  etapas.push({
    rotulo: `Adicional de periculosidade de ${percentual(aliquota.valor)}`,
    formula: `${reais(entrada.salarioBasico)} × ${percentual(aliquota.valor)}`,
    resultado: adicional,
    parametro: citar(aliquota.resolvida),
    justificativa:
      'A base é o salário básico, sem gratificações, prêmios, participação nos lucros ou outros adicionais.',
  })
  etapas.push({
    rotulo: 'Base de cálculo — salário básico',
    formula: 'O adicional não incide sobre outros adicionais',
    resultado: entrada.salarioBasico,
    fundamento: fundamentar(TST_SUMULA_191),
    justificativa:
      'O eletricitário contratado antes da Lei nº 12.740/2012 tem base na totalidade das parcelas salariais ' +
      '(itens II e III da súmula) — caso que esta estimativa não cobre.',
  })

  const salarioComAdicional = somar(entrada.salarioBasico, adicional)
  etapas.push({
    rotulo: 'Salário básico com o adicional',
    formula: `${reais(entrada.salarioBasico)} + ${reais(adicional)}`,
    resultado: salarioComAdicional,
  })

  let insalubridade: Centavos | null = null
  let maisVantajoso: AdicionalMaisVantajoso | null = null

  if (entrada.compararCom !== null) {
    const r = calcularInsalubridade({ grau: entrada.compararCom, baseInformada: ZERO }, dataReferencia, registro)
    if (!r.ok) return r
    insalubridade = r.valores.adicional
    for (const v of r.traco.vigenciasAplicadas) vigencias.add(v)

    maisVantajoso =
      adicional > insalubridade ? 'periculosidade' : adicional < insalubridade ? 'insalubridade' : 'iguais'

    etapas.push({
      rotulo: `Comparação com a insalubridade — ${NOME_DO_GRAU[entrada.compararCom]}`,
      formula: `${reais(r.valores.salarioMinimo)} × ${percentual(r.valores.aliquota)} = ${reais(insalubridade)}, contra ${reais(adicional)} de periculosidade`,
      resultado: insalubridade,
      fundamento: fundamentar(CLT_ART_193),
      justificativa:
        'Os dois adicionais não se acumulam: o art. 193, § 2º, da CLT permite ao empregado optar pela ' +
        'insalubridade. A insalubridade é calculada sobre o salário mínimo; a periculosidade, sobre o salário ' +
        'básico.',
    })
  }

  const traco: Traco = { etapas, dataReferencia, vigenciasAplicadas: [...vigencias] }
  return {
    ok: true,
    valores: { adicional, salarioComAdicional, aliquota: aliquota.valor, insalubridade, maisVantajoso },
    traco,
  }
}
