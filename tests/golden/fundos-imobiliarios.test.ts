/**
 * CALC-096 — casos-ouro do imposto em fundos imobiliários.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a Lei nº 8.668/1993, arts. 17 e
 * 18 (20% sobre os rendimentos distribuídos e sobre o ganho na alienação de
 * cotas, na redação da Lei nº 9.779/1999) e sobre a Lei nº 11.033/2004, art. 3º,
 * III e § 1º (isenção dos rendimentos distribuídos, condicionada à negociação
 * exclusiva em bolsa ou balcão organizado, ao mínimo de cotistas do fundo e ao
 * limite de participação do cotista pessoa física, na redação da Lei nº
 * 14.754/2023). O piso do DARF é o do art. 68 da Lei nº 9.430/1996.
 *
 * A isenção mensal de vendas do art. 3º, I, é do mercado à vista de AÇÕES e não
 * alcança cotas de fundo imobiliário — os casos abaixo travam isso.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularIrFundosImobiliarios,
  type EntradaFundosImobiliarios,
} from '../../src/lib/engine/calculadoras/fundos-imobiliarios'
import { ZERO, basisPoints, centavos } from '../../src/lib/engine/types'
import { BOLSA } from '../../src/lib/params/data/bolsa'
import { FUNDOS_IMOBILIARIOS } from '../../src/lib/params/data/fundos-imobiliarios'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(FUNDOS_IMOBILIARIOS, BOLSA)
const REF = '2026-06-15' as DataISO

const BASE: EntradaFundosImobiliarios = {
  rendimentos: ZERO,
  ganhoNaVenda: ZERO,
  perdaNaVenda: ZERO,
  prejuizoAcumulado: ZERO,
  cotasNegociadasEmBolsa: true,
  cotistasDoFundo: 200,
  participacaoBp: basisPoints(0),
}

function fii(over: Partial<EntradaFundosImobiliarios> = {}, ref = REF) {
  const r = calcularIrFundosImobiliarios({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-096 · a isenção dos rendimentos tem três condições', () => {
  /** R$ 1.000,00 de rendimentos, fundo com 200 cotistas, cotas em bolsa, participação zero. */
  it('com as três condições, o rendimento é isento', () => {
    const v = fii({ rendimentos: centavos(100_000) })
    expect(v.rendimentosIsentos).toBe(true)
    expect(v.impostoRendimentos).toBe(0)
  })

  /** Fundo com menos cotistas que o mínimo: 20% sobre R$ 1.000,00 = R$ 200,00. */
  it('fundo abaixo do mínimo de cotistas perde a isenção', () => {
    const v = fii({ rendimentos: centavos(100_000), cotistasDoFundo: 80 })
    expect(v.rendimentosIsentos).toBe(false)
    expect(v.impostoRendimentos).toBe(20_000)
  })

  /** Cotas fora de bolsa: mesmo com muitos cotistas, não há isenção. */
  it('cotas fora de bolsa perdem a isenção', () => {
    expect(fii({ rendimentos: centavos(100_000), cotasNegociadasEmBolsa: false }).impostoRendimentos).toBe(20_000)
  })

  /** Participação de 10% tira a isenção; 9,99% mantém. O limite é "10% ou mais". */
  it('a fronteira da participação do cotista', () => {
    expect(fii({ rendimentos: centavos(100_000), participacaoBp: basisPoints(1_000) }).rendimentosIsentos).toBe(false)
    expect(fii({ rendimentos: centavos(100_000), participacaoBp: basisPoints(999) }).rendimentosIsentos).toBe(true)
  })

  /** Exatamente o mínimo de cotistas já basta. */
  it('o mínimo de cotistas é inclusivo', () => {
    const v = fii({ rendimentos: centavos(100_000), cotistasDoFundo: 100 })
    expect(v.minimoDeCotistas).toBe(100)
    expect(v.rendimentosIsentos).toBe(true)
  })
})

describe('CALC-096 · o ganho na venda é sempre tributado', () => {
  /** R$ 5.000,00 de ganho × 20% = R$ 1.000,00 — sem isenção por valor vendido. */
  it('ganho de cotas paga imposto mesmo com venda pequena', () => {
    const v = fii({ ganhoNaVenda: centavos(500_000) })
    expect(v.baseGanho).toBe(500_000)
    expect(v.impostoGanho).toBe(100_000)
    expect(v.darf).toBe(100_000)
  })

  /** R$ 5.000,00 de ganho com R$ 2.000,00 de prejuízo acumulado: base R$ 3.000,00 → R$ 600,00. */
  it('o prejuízo acumulado compensa o ganho', () => {
    const v = fii({ ganhoNaVenda: centavos(500_000), prejuizoAcumulado: centavos(200_000) })
    expect(v.baseGanho).toBe(300_000)
    expect(v.impostoGanho).toBe(60_000)
    expect(v.prejuizoAProximoMes).toBe(0)
  })

  /** Mês com perda: nada a pagar, e a perda vai para os meses seguintes. */
  it('perda do mês soma ao prejuízo a transportar', () => {
    const v = fii({ ganhoNaVenda: centavos(100_000), perdaNaVenda: centavos(250_000), prejuizoAcumulado: centavos(50_000) })
    expect(v.impostoGanho).toBe(0)
    expect(v.prejuizoAProximoMes).toBe(200_000)
  })

  /** Ganho de R$ 40,00 → imposto de R$ 8,00, abaixo do piso do DARF. */
  it('imposto abaixo do mínimo do DARF fica para o mês seguinte', () => {
    const v = fii({ ganhoNaVenda: centavos(4_000) })
    expect(v.impostoGanho).toBe(800)
    expect(v.acumulaParaOProximoMes).toBe(true)
    expect(v.darf).toBe(0)
  })

  /**
   * Rendimento tributado e ganho no mesmo mês: R$ 1.000,00 × 20% = R$ 200,00
   * retidos na fonte, mais R$ 5.000,00 × 20% = R$ 1.000,00 de DARF.
   */
  it('rendimento tributado e ganho somam no imposto do mês, mas só o ganho vira DARF', () => {
    const v = fii({ rendimentos: centavos(100_000), cotistasDoFundo: 10, ganhoNaVenda: centavos(500_000) })
    expect(v.impostoRendimentos).toBe(20_000)
    expect(v.impostoGanho).toBe(100_000)
    expect(v.impostoTotal).toBe(120_000)
    expect(v.darf).toBe(100_000)
  })
})

describe('CALC-096 · entradas recusadas e cobertura', () => {
  it('sem rendimento e sem venda, fica pendente', () => {
    const r = calcularIrFundosImobiliarios(BASE, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('valores negativos e cotistas fracionados são recusados', () => {
    for (const over of [
      { rendimentos: centavos(-1) },
      { ganhoNaVenda: centavos(-1) },
      { perdaNaVenda: centavos(-1) },
      { prejuizoAcumulado: centavos(-1) },
      { participacaoBp: basisPoints(-1) },
      { cotistasDoFundo: 10.5 },
    ]) {
      const r = calcularIrFundosImobiliarios({ ...BASE, rendimentos: centavos(100_000), ...over }, REF, registro)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })

  it('RN-003 — as condições da isenção valem a partir de 2024', () => {
    const r = calcularIrFundosImobiliarios(
      { ...BASE, rendimentos: centavos(100_000) },
      '2023-12-31' as DataISO,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('a memória nomeia o motivo de não haver isenção', () => {
    const r = calcularIrFundosImobiliarios(
      { ...BASE, rendimentos: centavos(100_000), cotistasDoFundo: 10 },
      REF,
      registro,
    )
    if (!r.ok) throw new Error(r.detalhe)
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('Rendimentos distribuídos'))
    expect(etapa?.justificativa).toContain('cotistas')
  })
})
