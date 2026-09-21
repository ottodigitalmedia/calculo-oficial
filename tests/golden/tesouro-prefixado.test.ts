/**
 * CALC-122 — Tesouro Prefixado levado ao vencimento.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`:
 *
 * - **Decreto nº 12.814, de 09/01/2026, art. 2º** — texto conferido no Planalto
 *   em 21/09/2026: a LTN tem "valor nominal - múltiplo de R$ 1.000,00" e
 *   "resgate - pelo valor nominal, na data de vencimento";
 * - **Metodologia de cálculo dos títulos públicos federais**, publicada pelo
 *   Tesouro Nacional e lida na mesma data: preço da LTN igual a 1.000,00
 *   dividido por (1 + taxa) elevado a du/252, e "Base 1000" nas regras de
 *   arredondamento;
 * - **Lei nº 11.033/2004, art. 1º** — a tabela regressiva do imposto, já
 *   cadastrada e conferida em lote anterior;
 * - **Decreto nº 6.306/2007, Anexo** — a tabela do IOF termina em "30 | 00", e
 *   é essa fronteira que a recusa abaixo testa.
 *
 * Os valores são a aritmética desses dispositivos, conferida por um cálculo em
 * frações exatas feito à parte, fora do motor. Nenhum número veio de
 * calculadora concorrente, blog, planilha de terceiro ou resposta de modelo de
 * linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularTesouroPrefixado } from '../../src/lib/engine/calculadoras/tesouro-prefixado'
import { centavos } from '../../src/lib/engine/types'
import { RENDA_FIXA } from '../../src/lib/params/data/renda-fixa'
import { TITULOS_PUBLICOS } from '../../src/lib/params/data/titulos-publicos'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'
import { porSlug } from '../../src/lib/calculadoras'

const registro = construirRegistro(TITULOS_PUBLICOS, RENDA_FIXA)
const COMPRA = '2026-09-21' as DataISO

const calcular = (valorAplicado: number, preco: number, vencimento: string, compra: string = COMPRA) =>
  calcularTesouroPrefixado(
    {
      valorAplicado: centavos(valorAplicado),
      precoUnitario: centavos(preco),
      compra: compra as DataISO,
      vencimento: vencimento as DataISO,
    },
    compra as DataISO,
    registro,
  )

const valores = (...args: Parameters<typeof calcular>) => {
  const r = calcular(...args)
  if (!r.ok) throw new Error(r.detalhe)
  return r.valores
}

describe('CALC-122 · Tesouro Prefixado', () => {
  /**
   * R$ 1.000,00 a R$ 746,42 por título: 1,34 título, que pagam R$ 1.339,73 no
   * vencimento. De 21/09/2026 a 1º/01/2029 são 833 dias — acima de 720, a
   * alíquota é de 15%: R$ 50,96 sobre os R$ 339,73 de rendimento. Líquido: R$
   * 1.288,77.
   */
  it('levado ao vencimento, com a menor alíquota', () => {
    const v = valores(100_000, 74_642, '2029-01-01')
    expect(v.brutoNoVencimento).toBe(133_973)
    expect(v.rendimento).toBe(33_973)
    expect(v.diasCorridos).toBe(833)
    expect(v.aliquotaIr).toBe(1_500)
    expect(v.imposto).toBe(5_096)
    expect(v.liquidoNoVencimento).toBe(128_877)
    expect(v.quantidadeEmCentesimos).toBe(134)
  })

  /** A rentabilidade do período: 33,97% bruta e 28,88% líquida sobre o aplicado. */
  it('a rentabilidade é a do período, sobre o valor aplicado', () => {
    const v = valores(100_000, 74_642, '2029-01-01')
    expect(v.rentabilidadeBrutaBp).toBe(3_397)
    expect(v.rentabilidadeLiquidaBp).toBe(2_888)
  })

  /**
   * R$ 5.000,00 a R$ 965,00, vencendo em 1º/01/2027: 102 dias, a primeira faixa
   * da tabela — 22,5% sobre R$ 181,35.
   */
  it('prazo curto cai na alíquota maior', () => {
    const v = valores(500_000, 96_500, '2027-01-01')
    expect(v.brutoNoVencimento).toBe(518_135)
    expect(v.aliquotaIr).toBe(2_250)
    expect(v.imposto).toBe(4_080)
    expect(v.liquidoNoVencimento).toBe(514_055)
  })

  it('o imposto incide só sobre o rendimento, nunca sobre o total', () => {
    const v = valores(100_000, 74_642, '2029-01-01')
    expect(v.imposto).toBeLessThan(v.rendimento)
    expect(v.brutoNoVencimento - v.imposto).toBe(v.liquidoNoVencimento)
  })

  it('menos de trinta dias é recusado — ainda há IOF', () => {
    const r = calcular(100_000, 99_000, '2026-10-15')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    // No trigésimo dia, a tabela do Anexo zera e a conta passa a valer.
    expect(calcular(100_000, 99_000, '2026-10-21').ok).toBe(true)
  })

  it('preço acima do valor de resgate é recusado', () => {
    expect(calcular(100_000, 100_000, '2029-01-01').ok).toBe(false)
    expect(calcular(100_000, 100_001, '2029-01-01').ok).toBe(false)
  })

  it('vencimento antes da compra é recusado', () => {
    expect(calcular(100_000, 74_642, '2026-09-20').ok).toBe(false)
  })

  it('a página devolve o líquido no vencimento', () => {
    const r = porSlug('tesouro-prefixado')!.calcular(
      { valorAplicado: 100_000, preco: 74_642, compra: COMPRA, vencimento: '2029-01-01' },
      COMPRA,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(128_877)
  })
})
