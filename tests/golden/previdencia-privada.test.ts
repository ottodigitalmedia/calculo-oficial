/**
 * CALC-094 — casos-ouro do imposto no resgate da previdência privada.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a Lei nº 11.053/2004 — art. 1º,
 * I a VI (35%, 30%, 25%, 20%, 15% e 10%, conforme o prazo de acumulação), § 2º
 * (imposto definitivo), § 3º (prazo contado do aporte ao pagamento) e art. 3º,
 * I e II (15% de antecipação no regime progressivo, sobre o valor do resgate
 * nos planos de previdência e sobre os rendimentos no seguro com cobertura por
 * sobrevivência). A conta de cada caso está ao lado da asserção.
 *
 * As fronteiras da tabela são testadas uma a uma, porque a lei usa "superior a
 * N e inferior ou igual a N+2" — exatamente dois anos ficam na PRIMEIRA faixa,
 * e trocar isso muda a alíquota em cinco pontos.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularResgatePrevidencia,
  type EntradaPrevidencia,
} from '../../src/lib/engine/calculadoras/previdencia-privada'
import { ZERO, centavos } from '../../src/lib/engine/types'
import { PREVIDENCIA_PRIVADA } from '../../src/lib/params/data/previdencia-privada'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(PREVIDENCIA_PRIVADA)
const REF = '2026-06-15' as DataISO

const BASE: EntradaPrevidencia = {
  tipoDePlano: 'pgbl',
  regime: 'regressivo',
  valorResgate: centavos(10_000_000),
  totalAportado: ZERO,
  anosDeAcumulacao: 12,
}

function resgate(over: Partial<EntradaPrevidencia> = {}, ref = REF) {
  const r = calcularResgatePrevidencia({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-094 · regime regressivo', () => {
  /** R$ 100.000,00 com 12 anos: 10% = R$ 10.000,00; líquido R$ 90.000,00. */
  it('acima de dez anos paga a menor alíquota', () => {
    const v = resgate()
    expect(v.aliquota).toBe(1_000)
    expect(v.imposto).toBe(1_000_000)
    expect(v.liquido).toBe(9_000_000)
    expect(v.impostoDefinitivo).toBe(true)
  })

  /**
   * As seis faixas, pelas fronteiras da lei:
   *   0 e 2 anos  → 35%   (inferior ou igual a 2)
   *   3 e 4 anos  → 30%   (superior a 2 e até 4)
   *   5 e 6 anos  → 25%
   *   7 e 8 anos  → 20%
   *   9 e 10 anos → 15%
   *   11 anos     → 10%   (superior a 10)
   */
  it('cada fronteira da tabela cai na faixa certa', () => {
    const esperado: readonly (readonly [number, number])[] = [
      [0, 3_500],
      [2, 3_500],
      [3, 3_000],
      [4, 3_000],
      [5, 2_500],
      [6, 2_500],
      [7, 2_000],
      [8, 2_000],
      [9, 1_500],
      [10, 1_500],
      [11, 1_000],
      [30, 1_000],
    ]
    for (const [anos, aliquota] of esperado) {
      expect(resgate({ anosDeAcumulacao: anos }).aliquota, `${anos} anos`).toBe(aliquota)
    }
  })

  /** R$ 50.000,00 com 2 anos: 35% = R$ 17.500,00. */
  it('dois anos ainda são a faixa mais cara', () => {
    const v = resgate({ valorResgate: centavos(5_000_000), anosDeAcumulacao: 2 })
    expect(v.imposto).toBe(1_750_000)
    expect(v.liquido).toBe(3_250_000)
  })

  /**
   * VGBL: base é só o rendimento. R$ 100.000,00 resgatados com R$ 70.000,00
   * aportados = R$ 30.000,00 de rendimento × 10% = R$ 3.000,00.
   */
  it('no VGBL o imposto alcança apenas o rendimento', () => {
    const v = resgate({ tipoDePlano: 'vgbl', totalAportado: centavos(7_000_000) })
    expect(v.rendimento).toBe(3_000_000)
    expect(v.base).toBe(3_000_000)
    expect(v.imposto).toBe(300_000)
    expect(v.liquido).toBe(9_700_000)
  })

  /** Plano que rendeu menos que o aportado: sem rendimento, sem imposto. */
  it('VGBL sem rendimento não paga imposto', () => {
    const v = resgate({ tipoDePlano: 'vgbl', totalAportado: centavos(12_000_000) })
    expect(v.base).toBe(0)
    expect(v.imposto).toBe(0)
    expect(v.liquido).toBe(10_000_000)
  })

  /**
   * O mesmo resgate, no mesmo prazo, em PGBL e em VGBL: R$ 10.000,00 contra
   * R$ 3.000,00 de imposto. A diferença é a base, não a alíquota.
   */
  it('PGBL e VGBL diferem na base, com a mesma alíquota', () => {
    const pgbl = resgate()
    const vgbl = resgate({ tipoDePlano: 'vgbl', totalAportado: centavos(7_000_000) })
    expect(pgbl.aliquota).toBe(vgbl.aliquota)
    expect(pgbl.imposto).toBeGreaterThan(vgbl.imposto)
  })
})

describe('CALC-094 · regime progressivo', () => {
  /** PGBL: 15% sobre o resgate inteiro = R$ 15.000,00, como antecipação. */
  it('retém quinze por cento do resgate, e não é definitivo', () => {
    const v = resgate({ regime: 'progressivo' })
    expect(v.aliquota).toBe(1_500)
    expect(v.imposto).toBe(1_500_000)
    expect(v.impostoDefinitivo).toBe(false)
  })

  /** VGBL: 15% sobre o rendimento de R$ 30.000,00 = R$ 4.500,00. */
  it('no VGBL a antecipação incide só sobre o rendimento', () => {
    const v = resgate({ regime: 'progressivo', tipoDePlano: 'vgbl', totalAportado: centavos(7_000_000) })
    expect(v.imposto).toBe(450_000)
  })

  /** No progressivo o prazo não muda nada: a alíquota é a mesma com 1 ou 20 anos. */
  it('o prazo de acumulação não altera a retenção', () => {
    expect(resgate({ regime: 'progressivo', anosDeAcumulacao: 1 }).imposto).toBe(
      resgate({ regime: 'progressivo', anosDeAcumulacao: 20 }).imposto,
    )
  })

  it('a memória diz que o imposto ainda será ajustado', () => {
    const r = calcularResgatePrevidencia({ ...BASE, regime: 'progressivo' }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas.some((e) => e.rotulo.includes('a ajustar na declaração'))).toBe(true)
  })
})

describe('CALC-094 · entradas recusadas e cobertura', () => {
  it('sem valor de resgate, fica pendente', () => {
    const r = calcularResgatePrevidencia({ ...BASE, valorResgate: ZERO }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('VGBL sem o total aportado fica pendente', () => {
    const r = calcularResgatePrevidencia({ ...BASE, tipoDePlano: 'vgbl' }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('prazo negativo, fracionado ou absurdo é recusado', () => {
    for (const anos of [-1, 2.5, 61]) {
      const r = calcularResgatePrevidencia({ ...BASE, anosDeAcumulacao: anos }, REF, registro)
      expect(r.ok, `${anos} anos`).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })

  it('aporte negativo é recusado', () => {
    const r = calcularResgatePrevidencia({ ...BASE, totalAportado: centavos(-1) }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('RN-003 — antes de 2005 não há tabela cadastrada', () => {
    for (const regime of ['regressivo', 'progressivo'] as const) {
      const r = calcularResgatePrevidencia({ ...BASE, regime }, '2004-12-31' as DataISO, registro)
      expect(r.ok, regime).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
    }
  })
})
