/**
 * CALC-093 — casos-ouro do imposto sobre ganhos em bolsa.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a Lei nº 11.033/2004 — art. 2º,
 * I e II (20% no day trade, 15% nas demais), art. 2º, § 1º (retenção de 0,005%
 * sobre o valor da alienação) e art. 3º, I (isenção quando as alienações do mês
 * no mercado à vista de ações não passam de R$ 20.000,00) —, sobre a Lei nº
 * 9.959/2000, art. 8º (retenção de 1% no day trade; perdas de day trade só
 * compensam ganhos de day trade) e sobre a Lei nº 9.430/1996, art. 68 (DARF
 * mínimo de R$ 10,00, com o valor menor somado aos períodos seguintes).
 *
 * A conta de cada caso está ao lado da asserção. A Receita não publica exemplo
 * resolvido de apuração mensal de renda variável; nenhum número foi lido de
 * calculadora concorrente, blog, planilha de terceiro ou resposta de modelo de
 * linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularIrBolsa, type EntradaBolsa } from '../../src/lib/engine/calculadoras/bolsa'
import { ZERO, centavos } from '../../src/lib/engine/types'
import { BOLSA } from '../../src/lib/params/data/bolsa'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(BOLSA)
const REF = '2026-06-15' as DataISO

const BASE: EntradaBolsa = {
  vendasComuns: ZERO,
  resultadoComum: ZERO,
  prejuizoAcumuladoComum: ZERO,
  resultadoDayTrade: ZERO,
  prejuizoAcumuladoDayTrade: ZERO,
  irrfRetidoInformado: ZERO,
}

function bolsa(over: Partial<EntradaBolsa> = {}, ref = REF) {
  const r = calcularIrBolsa({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-093 · a isenção é do valor vendido, não do lucro', () => {
  /** R$ 15.000,00 vendidos: dentro do limite. Lucro de R$ 3.000,00, imposto zero. */
  it('vendeu abaixo do limite com lucro alto — nada a pagar', () => {
    const v = bolsa({ vendasComuns: centavos(1_500_000), resultadoComum: centavos(300_000) })
    expect(v.isentoNoMes).toBe(true)
    expect(v.impostoComum).toBe(0)
    expect(v.darf).toBe(0)
  })

  /**
   * R$ 25.000,00 vendidos: fora da isenção. Lucro R$ 3.000,00 × 15% = R$ 450,00.
   * Retenção estimada: 25.000,00 × 5/100.000 = R$ 1,25. DARF R$ 448,75.
   */
  it('vendeu acima do limite — imposto sobre o ganho inteiro', () => {
    const v = bolsa({ vendasComuns: centavos(2_500_000), resultadoComum: centavos(300_000) })
    expect(v.isentoNoMes).toBe(false)
    expect(v.baseComum).toBe(300_000)
    expect(v.impostoComum).toBe(45_000)
    expect(v.irrfDeduzido).toBe(125)
    expect(v.darf).toBe(44_875)
  })

  /** Um centavo acima do limite já tira a isenção: R$ 20.000,01 vendidos. */
  it('um centavo acima do limite tributa o mês', () => {
    expect(bolsa({ vendasComuns: centavos(2_000_001), resultadoComum: centavos(10_000) }).isentoNoMes).toBe(false)
    expect(bolsa({ vendasComuns: centavos(2_000_000), resultadoComum: centavos(10_000) }).isentoNoMes).toBe(true)
  })

  /** Mês isento com prejuízo: a perda continua disponível para os meses seguintes. */
  it('prejuízo em mês isento é transportado', () => {
    const v = bolsa({ vendasComuns: centavos(1_000_000), resultadoComum: centavos(-200_000) })
    expect(v.prejuizoAProximoComum).toBe(200_000)
    expect(v.darf).toBe(0)
  })
})

describe('CALC-093 · day trade é um bolso separado', () => {
  /**
   * Ganho de R$ 2.000,00 com R$ 500,00 de prejuízo acumulado de day trade:
   * base R$ 1.500,00 × 20% = R$ 300,00. Retenção de 1% sobre o ganho: R$ 20,00.
   * DARF: R$ 280,00.
   */
  it('alíquota de 20% e retenção de 1%', () => {
    const v = bolsa({
      resultadoDayTrade: centavos(200_000),
      prejuizoAcumuladoDayTrade: centavos(50_000),
    })
    expect(v.baseDayTrade).toBe(150_000)
    expect(v.impostoDayTrade).toBe(30_000)
    expect(v.irrfDeduzido).toBe(2_000)
    expect(v.darf).toBe(28_000)
  })

  /** Prejuízo de operação comum NÃO compensa ganho de day trade: 1.000 × 20% = R$ 200,00. */
  it('prejuízo comum não entra na base do day trade', () => {
    const v = bolsa({
      prejuizoAcumuladoComum: centavos(500_000),
      resultadoDayTrade: centavos(100_000),
    })
    expect(v.baseDayTrade).toBe(100_000)
    expect(v.impostoDayTrade).toBe(20_000)
    expect(v.prejuizoAProximoComum).toBe(500_000)
  })

  /** A isenção mensal não alcança o day trade: R$ 500,00 de ganho pagam R$ 100,00. */
  it('a isenção das vendas não vale para day trade', () => {
    const v = bolsa({ vendasComuns: centavos(500_000), resultadoDayTrade: centavos(50_000) })
    expect(v.isentoNoMes).toBe(true)
    expect(v.impostoDayTrade).toBe(10_000)
  })

  /**
   * Os dois bolsos no mesmo mês: vendas de R$ 30.000,00 com lucro comum de
   * R$ 1.000,00 (15% = R$ 150,00) e prejuízo de R$ 800,00 em day trade.
   * Retenção comum: 30.000,00 × 5/100.000 = R$ 1,50. DARF R$ 148,50.
   */
  it('comum tributado e day trade no prejuízo, no mesmo mês', () => {
    const v = bolsa({
      vendasComuns: centavos(3_000_000),
      resultadoComum: centavos(100_000),
      resultadoDayTrade: centavos(-80_000),
    })
    expect(v.impostoComum).toBe(15_000)
    expect(v.impostoDayTrade).toBe(0)
    expect(v.irrfDeduzido).toBe(150)
    expect(v.darf).toBe(14_850)
    expect(v.prejuizoAProximoDayTrade).toBe(80_000)
  })
})

describe('CALC-093 · compensação e piso do DARF', () => {
  /** R$ 4.000,00 de ganho com R$ 4.500,00 de prejuízo: base zero e R$ 500,00 sobrando. */
  it('o prejuízo acumulado zera a base e o que sobra continua acumulado', () => {
    const v = bolsa({
      vendasComuns: centavos(5_000_000),
      resultadoComum: centavos(400_000),
      prejuizoAcumuladoComum: centavos(450_000),
    })
    expect(v.baseComum).toBe(0)
    expect(v.impostoComum).toBe(0)
    expect(v.prejuizoAProximoComum).toBe(50_000)
    expect(v.darf).toBe(0)
  })

  /**
   * Ganho de R$ 50,00 com vendas de R$ 25.000,00: imposto R$ 7,50, retenção
   * R$ 1,25, a pagar R$ 6,25 — abaixo do mínimo do DARF.
   */
  it('imposto abaixo do mínimo do DARF não é pago agora, e não some', () => {
    const v = bolsa({ vendasComuns: centavos(2_500_000), resultadoComum: centavos(5_000) })
    expect(v.impostoTotal).toBe(750)
    expect(v.acumulaParaOProximoMes).toBe(true)
    expect(v.darf).toBe(0)
  })

  /**
   * Art. 2º, § 4º: retenção de até R$ 1,00 no mês é dispensada.
   * Vendas de R$ 20.000,01 × 5/100.000 = R$ 1,00 — nada é retido, e nada há a
   * deduzir. O imposto sobre o ganho de R$ 500,00 é 15% = R$ 75,00.
   */
  it('retenção de até um real é dispensada', () => {
    const v = bolsa({ vendasComuns: centavos(2_000_001), resultadoComum: centavos(50_000) })
    expect(v.irrfDeduzido).toBe(0)
    expect(v.impostoComum).toBe(7_500)
    expect(v.darf).toBe(7_500)
  })

  /** Retenção informada substitui a estimativa: R$ 30,00 retidos contra R$ 450,00 de imposto. */
  it('a retenção informada é usada no lugar da estimativa', () => {
    const v = bolsa({
      vendasComuns: centavos(2_500_000),
      resultadoComum: centavos(300_000),
      irrfRetidoInformado: centavos(3_000),
    })
    expect(v.irrfEstimado).toBe(false)
    expect(v.darf).toBe(42_000)
  })

  /** Retenção maior que o imposto não vira DARF negativo. */
  it('retenção maior que o imposto zera o DARF', () => {
    const v = bolsa({
      vendasComuns: centavos(2_500_000),
      resultadoComum: centavos(5_000),
      irrfRetidoInformado: centavos(10_000),
    })
    expect(v.darf).toBe(0)
  })
})

describe('CALC-093 · entradas recusadas e cobertura', () => {
  it('sem resultado nenhum, fica pendente', () => {
    const r = calcularIrBolsa(BASE, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('lucro maior que o total vendido é incoerente', () => {
    const r = calcularIrBolsa(
      { ...BASE, vendasComuns: centavos(100_000), resultadoComum: centavos(200_000) },
      REF,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('prejuízo acumulado ou retenção negativos são recusados', () => {
    for (const over of [
      { prejuizoAcumuladoComum: centavos(-1) },
      { prejuizoAcumuladoDayTrade: centavos(-1) },
      { irrfRetidoInformado: centavos(-1) },
      { vendasComuns: centavos(-1) },
    ]) {
      const r = calcularIrBolsa({ ...BASE, resultadoDayTrade: centavos(100_000), ...over }, REF, registro)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })

  it('RN-003 — antes de 2005 as alíquotas não estão cadastradas', () => {
    const r = calcularIrBolsa(
      { ...BASE, vendasComuns: centavos(2_500_000), resultadoComum: centavos(300_000) },
      '2004-12-31' as DataISO,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
