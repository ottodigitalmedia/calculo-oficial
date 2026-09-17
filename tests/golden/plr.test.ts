/**
 * CALC-085 — casos-ouro do imposto sobre a PLR.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre as duas tabelas de tributação
 * exclusiva da PLR publicadas pela Receita Federal nas páginas de tabelas de
 * 2025 e 2026 — "De janeiro a abril de 2025" e "A partir de maio de 2025" — e
 * sobre a Lei nº 10.101/2000, art. 3º: § 5º (tributação em separado, tabela
 * anual), § 7º (recálculo sobre o total do ano, descontado o já retido) e § 10
 * (dedução da pensão alimentícia). A conta de cada caso está ao lado da
 * asserção: base × alíquota da faixa − parcela a deduzir.
 *
 * A Receita não publica exemplo resolvido de PLR. Nenhum número foi lido de
 * calculadora concorrente, blog, planilha de terceiro ou resposta de modelo de
 * linguagem (`CO-1`). A conferência de que as parcelas a deduzir foram
 * transcritas certo é a de continuidade entre faixas, registrada em
 * `RFB_TABELA_PLR` — e o caso "limite da isenção" abaixo a trava.
 */

import { describe, expect, it } from 'vitest'

import { calcularPlr, type EntradaPlr } from '../../src/lib/engine/calculadoras/plr'
import { ZERO, centavos } from '../../src/lib/engine/types'
import { PLR } from '../../src/lib/params/data/plr'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(PLR)
const MAIO_EM_DIANTE = '2026-06-15' as DataISO
const JANEIRO_A_ABRIL_2025 = '2025-03-15' as DataISO

const BASE: EntradaPlr = {
  valorPlr: centavos(1_000_000),
  pensao: ZERO,
  baseAnterior: ZERO,
  impostoRetidoAnterior: ZERO,
}

function plr(over: Partial<EntradaPlr> = {}, ref = MAIO_EM_DIANTE) {
  const r = calcularPlr({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-085 · tabela a partir de maio de 2025', () => {
  it('R$ 8.000,00 está dentro da isenção de R$ 8.214,40', () => {
    const v = plr({ valorPlr: centavos(800_000) })
    expect(v.imposto).toBe(0)
    expect(v.isento).toBe(true)
    expect(v.liquido).toBe(800_000)
  })

  /** R$ 10.000,00 × 15% − R$ 1.360,25 = R$ 139,75. Líquido R$ 9.860,25. */
  it('R$ 10.000,00 — faixa de 15%', () => {
    const v = plr()
    expect(v.aliquotaFaixa).toBe(1_500)
    expect(v.imposto).toBe(13_975)
    expect(v.liquido).toBe(986_025)
  })

  /** R$ 20.000,00 × 27,5% − R$ 3.166,80 = R$ 2.333,20. */
  it('R$ 20.000,00 — última faixa', () => {
    expect(plr({ valorPlr: centavos(2_000_000) }).imposto).toBe(233_320)
  })

  /**
   * Um centavo acima da isenção: R$ 8.214,41 × 7,5% − R$ 616,08 = 616,08075 − 616,08
   * = R$ 0,00075 → R$ 0,00. A tabela é contínua: não há salto de imposto no limite.
   */
  it('um centavo acima da isenção não gera salto de imposto', () => {
    const v = plr({ valorPlr: centavos(821_441) })
    expect(v.aliquotaFaixa).toBe(750)
    expect(v.imposto).toBe(0)
  })
})

describe('CALC-085 · a mesma PLR com a tabela de janeiro a abril de 2025', () => {
  /** R$ 8.000,00 × 7,5% − R$ 573,06 = R$ 26,94 — isenta na tabela de maio, tributada na anterior. */
  it('R$ 8.000,00 pagos em março de 2025 pagam imposto', () => {
    const v = plr({ valorPlr: centavos(800_000) }, JANEIRO_A_ABRIL_2025)
    expect(v.imposto).toBe(2_694)
  })

  it('RN-003 — antes de 2025 não há tabela cadastrada', () => {
    const r = calcularPlr(BASE, '2024-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

describe('CALC-085 · § 7º — segunda parcela no mesmo ano', () => {
  /**
   * Duas parcelas de R$ 6.000,00, isentas cada uma. Juntas, R$ 12.000,00:
   * × 15% − R$ 1.360,25 = R$ 439,75, todo cobrado na segunda.
   */
  it('duas parcelas isentas podem gerar imposto juntas', () => {
    const primeira = plr({ valorPlr: centavos(600_000) })
    expect(primeira.imposto).toBe(0)

    const segunda = plr({ valorPlr: centavos(600_000), baseAnterior: centavos(600_000) })
    expect(segunda.baseAnual).toBe(1_200_000)
    expect(segunda.imposto).toBe(43_975)
  })

  /** R$ 20.000,00 no ano: R$ 2.333,20. Já retidos R$ 139,75 → R$ 2.193,45 nesta parcela. */
  it('o imposto já retido é descontado do recalculado', () => {
    const v = plr({ baseAnterior: centavos(1_000_000), impostoRetidoAnterior: centavos(13_975) })
    expect(v.impostoAnual).toBe(233_320)
    expect(v.imposto).toBe(219_345)
  })

  it('retido anterior maior que o recalculado não vira imposto negativo', () => {
    expect(plr({ impostoRetidoAnterior: centavos(1_000_000) }).imposto).toBe(0)
  })
})

describe('CALC-085 · § 10 — pensão alimentícia', () => {
  /**
   * PLR R$ 10.000,00 com R$ 1.000,00 de pensão: base R$ 9.000,00.
   * × 7,5% − R$ 616,08 = R$ 58,92. Líquido: 10.000,00 − 1.000,00 − 58,92 = R$ 8.941,08.
   */
  it('a pensão sai da base e do líquido', () => {
    const v = plr({ pensao: centavos(100_000) })
    expect(v.baseDaParcela).toBe(900_000)
    expect(v.imposto).toBe(5_892)
    expect(v.liquido).toBe(894_108)
  })

  it('pensão maior que a PLR é recusada', () => {
    const r = calcularPlr({ ...BASE, pensao: centavos(2_000_000) }, MAIO_EM_DIANTE, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})

describe('CALC-085 · entradas recusadas', () => {
  it('sem valor de PLR, o resultado fica pendente', () => {
    const r = calcularPlr({ ...BASE, valorPlr: ZERO }, MAIO_EM_DIANTE, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('valores negativos são recusados', () => {
    const r = calcularPlr({ ...BASE, impostoRetidoAnterior: centavos(-1) }, MAIO_EM_DIANTE, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})
