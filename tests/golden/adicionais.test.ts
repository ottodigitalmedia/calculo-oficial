/**
 * CALC-077 · CALC-078 · CALC-079 — casos-ouro dos adicionais.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: todo valor esperado é **aritmética direta sobre o texto
 * da norma**, com a conta escrita ao lado de cada asserção para ser refeita com
 * calculadora comum:
 *
 * - noturno urbano: CLT, art. 73 — 20% sobre a hora diurna e hora de 3.150
 *   segundos (7h de relógio = 8h noturnas, a razão 3.600/3.150 = 8/7);
 * - noturno rural: Lei nº 5.889/1973, art. 7º — 25%, sem redução da hora;
 * - insalubridade: CLT, art. 192 — 40%, 20% e 10% do salário mínimo, que é
 *   R$ 1.518,00 em 2025 (Decreto nº 12.342/2024) e R$ 1.621,00 em 2026
 *   (Decreto nº 12.797/2025);
 * - periculosidade: CLT, art. 193, § 1º — 30% do salário básico.
 *
 * Não existe exemplo oficial resolvido de nenhum dos três publicado por órgão
 * público. Nenhum número foi lido de calculadora concorrente, blog, planilha de
 * terceiro ou resposta de modelo de linguagem (`CO-1`, regra 10 de `CLAUDE.md`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularAdicionalNoturno,
  calcularInsalubridade,
  calcularPericulosidade,
  type EntradaAdicionalNoturno,
} from '../../src/lib/engine/calculadoras/adicionais'
import { ZERO, centavos } from '../../src/lib/engine/types'
import { ADICIONAIS } from '../../src/lib/params/data/adicionais'
import { INSS } from '../../src/lib/params/data/inss'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(TRABALHISTA, ADICIONAIS, INSS)
const R2026 = '2026-06-15' as DataISO
const R2025 = '2025-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-077 — Adicional noturno
// ---------------------------------------------------------------------------

/** R$ 2.200,00 com 44h: divisor 220, hora normal de exatamente R$ 10,00. */
const NOTURNO: EntradaAdicionalNoturno = {
  salario: centavos(220_000),
  jornadaSemanal: 44,
  regime: 'urbano',
  horasNoturnasCentesimos: 700,
  refletirDSR: false,
  diasUteis: 25,
  diasDescanso: 5,
}

function noturno(over: Partial<EntradaAdicionalNoturno> = {}, ref = R2026) {
  const r = calcularAdicionalNoturno({ ...NOTURNO, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-077 · adicional noturno urbano — CLT, art. 73', () => {
  it('hora normal de R$ 10,00: R$ 2.200,00 ÷ 220', () => {
    expect(noturno().valorHoraNormal).toBe(1_000)
    expect(noturno().divisor).toBe(220)
  })

  it('20% da hora: R$ 2,00 por hora noturna', () => {
    expect(noturno().adicionalPorHora).toBe(200)
  })

  /** 7h × 3.600 ÷ 3.150 = 8h. 8 × R$ 2,00 = R$ 16,00. */
  it('7 horas de relógio valem 8 horas noturnas', () => {
    const v = noturno()
    expect(v.horasComputadasCentesimos).toBe(800)
    expect(v.adicional).toBe(1_600)
    expect(v.horaReduzida).toBe(true)
  })

  /** 22 noites de 7h = 154h de relógio = 176h noturnas. 176 × R$ 2,00 = R$ 352,00. */
  it('um mês de 22 noites: R$ 352,00', () => {
    const v = noturno({ horasNoturnasCentesimos: 15_400 })
    expect(v.horasComputadasCentesimos).toBe(17_600)
    expect(v.adicional).toBe(35_200)
  })

  /**
   * 7,5h de relógio: R$ 2,00 × 750 × 3.600 ÷ 315.000 = R$ 17,142857… → R$ 17,14.
   * As horas não são arredondadas antes do dinheiro: arredondar 8,57h para 9h
   * daria R$ 18,00, e para 8h daria R$ 16,00 — os dois errados.
   */
  it('jornada quebrada não arredonda as horas antes do valor', () => {
    const v = noturno({ horasNoturnasCentesimos: 750 })
    expect(v.adicional).toBe(1_714)
    expect(v.horasComputadasCentesimos).toBe(857)
  })

  /** R$ 352,00 ÷ 25 dias úteis × 5 de descanso = R$ 70,40. Total R$ 422,40. */
  it('reflexo no DSR sobre o adicional habitual', () => {
    const v = noturno({ horasNoturnasCentesimos: 15_400, refletirDSR: true })
    expect(v.reflexoDsr).toBe(7_040)
    expect(v.total).toBe(42_240)
  })

  it('sem reflexo, o total é o próprio adicional', () => {
    const v = noturno({ horasNoturnasCentesimos: 15_400 })
    expect(v.reflexoDsr).toBe(0)
    expect(v.total).toBe(35_200)
  })

  /** 40h: divisor 200 (Súmula 431). R$ 2.000,00 ÷ 200 = R$ 10,00. */
  it('jornada de 40h usa o divisor 200', () => {
    const v = noturno({ salario: centavos(200_000), jornadaSemanal: 40 })
    expect(v.divisor).toBe(200)
    expect(v.valorHoraNormal).toBe(1_000)
  })
})

describe('CALC-077 · adicional noturno rural — Lei nº 5.889/1973, art. 7º', () => {
  /** 25% de R$ 10,00 = R$ 2,50 por hora, sem redução: 154h × R$ 2,50 = R$ 385,00. */
  it('lavoura: 25% e hora de relógio', () => {
    const v = noturno({ regime: 'lavoura', horasNoturnasCentesimos: 15_400 })
    expect(v.aliquota).toBe(2_500)
    expect(v.adicionalPorHora).toBe(250)
    expect(v.horasComputadasCentesimos).toBe(15_400)
    expect(v.adicional).toBe(38_500)
    expect(v.horaReduzida).toBe(false)
  })

  it('pecuária: mesmo percentual, mesma ausência de redução', () => {
    const v = noturno({ regime: 'pecuaria', horasNoturnasCentesimos: 700 })
    expect(v.adicional).toBe(1_750)
  })

  /** A mesma jornada rende mais no urbano pela hora reduzida? Não: 20% × 8/7 < 25%. */
  it('o rural paga mais que o urbano pela mesma noite', () => {
    const urbano = noturno({ horasNoturnasCentesimos: 700 }).adicional
    const rural = noturno({ regime: 'lavoura', horasNoturnasCentesimos: 700 }).adicional
    expect(urbano).toBe(1_600)
    expect(rural).toBe(1_750)
  })
})

describe('CALC-077 · entradas e vigência', () => {
  it('sem horas noturnas, o resultado fica pendente', () => {
    const r = calcularAdicionalNoturno({ ...NOTURNO, horasNoturnasCentesimos: 0 }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('reflexo pedido sem dias do mês é recusado', () => {
    const r = calcularAdicionalNoturno({ ...NOTURNO, refletirDSR: true, diasUteis: 0 }, R2026, registro)
    expect(r.ok).toBe(false)
  })

  /** RN-003: a Lei nº 5.889 é de 11/06/1973 — antes dela, não há regra rural cadastrada. */
  it('noturno rural antes da lei rural é bloqueado, não extrapolado', () => {
    const r = calcularAdicionalNoturno({ ...NOTURNO, regime: 'lavoura' }, '1970-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// CALC-078 — Insalubridade
// ---------------------------------------------------------------------------

function insalubridade(grau: 'maximo' | 'medio' | 'minimo', base = ZERO, ref = R2026) {
  const r = calcularInsalubridade({ grau, baseInformada: base }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-078 · insalubridade sobre o salário mínimo — CLT, art. 192', () => {
  /** 2026: R$ 1.621,00 × 40% = R$ 648,40 · × 20% = R$ 324,20 · × 10% = R$ 162,10. */
  it('2026 — os três graus', () => {
    expect(insalubridade('maximo').adicional).toBe(64_840)
    expect(insalubridade('medio').adicional).toBe(32_420)
    expect(insalubridade('minimo').adicional).toBe(16_210)
  })

  /** 2025: R$ 1.518,00 × 40% = R$ 607,20 · × 20% = R$ 303,60 · × 10% = R$ 151,80. */
  it('2025 — mesma lei, outro salário mínimo', () => {
    expect(insalubridade('maximo', ZERO, R2025).adicional).toBe(60_720)
    expect(insalubridade('medio', ZERO, R2025).adicional).toBe(30_360)
    expect(insalubridade('minimo', ZERO, R2025).adicional).toBe(15_180)
  })

  it('a base padrão é o salário mínimo, e não o salário do empregado', () => {
    const v = insalubridade('medio')
    expect(v.base).toBe(162_100)
    expect(v.baseEhSalarioMinimo).toBe(true)
  })

  /** Piso de R$ 3.000,00 em convenção, grau médio: R$ 600,00. */
  it('base mais favorável prevista em convenção', () => {
    const v = insalubridade('medio', centavos(300_000))
    expect(v.adicional).toBe(60_000)
    expect(v.baseEhSalarioMinimo).toBe(false)
  })

  it('base informada abaixo do salário mínimo é recusada', () => {
    const r = calcularInsalubridade({ grau: 'medio', baseInformada: centavos(100_000) }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('RN-003 — antes da cobertura do salário mínimo, bloqueia', () => {
    const r = calcularInsalubridade({ grau: 'medio', baseInformada: ZERO }, '2024-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// CALC-079 — Periculosidade
// ---------------------------------------------------------------------------

function periculosidade(salario: number, compararCom: 'maximo' | 'medio' | 'minimo' | null = null) {
  const r = calcularPericulosidade({ salarioBasico: centavos(salario), compararCom }, R2026, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-079 · periculosidade — CLT, art. 193, § 1º', () => {
  /** R$ 3.000,00 × 30% = R$ 900,00; com o básico, R$ 3.900,00. */
  it('30% do salário básico', () => {
    const v = periculosidade(300_000)
    expect(v.adicional).toBe(90_000)
    expect(v.salarioComAdicional).toBe(390_000)
  })

  /** R$ 3.333,33 × 30% = R$ 999,999 → R$ 1.000,00 (arredondamento meio para cima). */
  it('arredonda uma vez, no centavo', () => {
    expect(periculosidade(333_333).adicional).toBe(100_000)
  })

  it('sem comparação, não há insalubridade no resultado', () => {
    const v = periculosidade(300_000)
    expect(v.insalubridade).toBeNull()
    expect(v.maisVantajoso).toBeNull()
  })
})

describe('CALC-079 · a escolha do § 2º — periculosidade ou insalubridade', () => {
  /** R$ 900,00 de periculosidade contra R$ 648,40 de insalubridade máxima. */
  it('salário alto: a periculosidade compensa', () => {
    const v = periculosidade(300_000, 'maximo')
    expect(v.insalubridade).toBe(64_840)
    expect(v.maisVantajoso).toBe('periculosidade')
  })

  /** R$ 2.000,00 × 30% = R$ 600,00, contra R$ 648,40: a insalubridade máxima compensa. */
  it('salário baixo: a insalubridade máxima compensa', () => {
    const v = periculosidade(200_000, 'maximo')
    expect(v.adicional).toBe(60_000)
    expect(v.maisVantajoso).toBe('insalubridade')
  })

  /** R$ 2.161,33 × 30% = R$ 648,399 → R$ 648,40 — igual à insalubridade máxima de 2026. */
  it('o empate é declarado como empate', () => {
    expect(periculosidade(216_133, 'maximo').maisVantajoso).toBe('iguais')
  })
})

describe('CALC-077 a CALC-079 · entradas recusadas e datas sem cobertura', () => {
  it('adicional noturno sem salário fica pendente', () => {
    const r = calcularAdicionalNoturno({ ...NOTURNO, salario: ZERO }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('adicional noturno sem jornada é recusado', () => {
    const r = calcularAdicionalNoturno({ ...NOTURNO, jornadaSemanal: 0 }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  /** RN-003: a CLT de 1943 é o início da cobertura urbana. */
  it('noturno urbano antes da CLT é bloqueado', () => {
    const r = calcularAdicionalNoturno(NOTURNO, '1940-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('periculosidade sem salário fica pendente', () => {
    const r = calcularPericulosidade({ salarioBasico: ZERO, compararCom: null }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  /** RN-003: a Lei nº 6.514 é de 23/12/1977. */
  it('periculosidade antes da Lei nº 6.514 é bloqueada', () => {
    const r = calcularPericulosidade({ salarioBasico: centavos(300_000), compararCom: null }, '1975-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  /**
   * Em 2024 há periculosidade, mas não há salário mínimo cadastrado: a
   * comparação não pode inventar a insalubridade, e o cálculo inteiro bloqueia.
   */
  it('comparação sem salário mínimo cadastrado bloqueia, em vez de comparar com zero', () => {
    const r = calcularPericulosidade({ salarioBasico: centavos(300_000), compararCom: 'maximo' }, '2024-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
