/**
 * CALC-095 — casos-ouro do saque-aniversário do FGTS.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre o Anexo da Lei nº 8.036/1990 —
 * as sete faixas de saldo, com alíquota e parcela adicional — aplicado como
 * manda o art. 20-D: alíquota sobre a soma dos saldos, mais a parcela adicional
 * da faixa. Cada caso traz a conta ao lado da asserção, e as fronteiras entre
 * faixas são testadas duas a duas, porque é ali que a parcela adicional mostra
 * para que serve: o saque não pode cair quando o saldo sobe.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularSaqueAniversario } from '../../src/lib/engine/calculadoras/saque-aniversario'
import { centavos } from '../../src/lib/engine/types'
import { SAQUE_ANIVERSARIO } from '../../src/lib/params/data/saque-aniversario'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(SAQUE_ANIVERSARIO)
const REF = '2026-06-15' as DataISO

function saque(saldo: number, ref = REF) {
  const r = calcularSaqueAniversario({ saldo: centavos(saldo) }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-095 · uma faixa de cada vez', () => {
  /** R$ 400,00 × 50% = R$ 200,00, sem parcela adicional na primeira faixa. */
  it('primeira faixa — metade do saldo', () => {
    const v = saque(40_000)
    expect(v.aliquota).toBe(5_000)
    expect(v.parcelaAdicional).toBe(0)
    expect(v.saque).toBe(20_000)
    expect(v.saldoRestante).toBe(20_000)
  })

  /** R$ 800,00 × 40% = R$ 320,00 + R$ 50,00 = R$ 370,00. */
  it('segunda faixa', () => {
    expect(saque(80_000).saque).toBe(37_000)
  })

  /** R$ 3.000,00 × 30% = R$ 900,00 + R$ 150,00 = R$ 1.050,00. */
  it('terceira faixa', () => {
    expect(saque(300_000).saque).toBe(105_000)
  })

  /** R$ 8.000,00 × 20% = R$ 1.600,00 + R$ 650,00 = R$ 2.250,00. */
  it('quarta faixa', () => {
    expect(saque(800_000).saque).toBe(225_000)
  })

  /** R$ 12.000,00 × 15% = R$ 1.800,00 + R$ 1.150,00 = R$ 2.950,00. */
  it('quinta faixa', () => {
    expect(saque(1_200_000).saque).toBe(295_000)
  })

  /** R$ 18.000,00 × 10% = R$ 1.800,00 + R$ 1.900,00 = R$ 3.700,00. */
  it('sexta faixa', () => {
    expect(saque(1_800_000).saque).toBe(370_000)
  })

  /** R$ 50.000,00 × 5% = R$ 2.500,00 + R$ 2.900,00 = R$ 5.400,00. */
  it('última faixa, sem teto', () => {
    const v = saque(5_000_000)
    expect(v.aliquota).toBe(500)
    expect(v.saque).toBe(540_000)
    expect(v.saldoRestante).toBe(4_460_000)
  })
})

describe('CALC-095 · a parcela adicional mantém a tabela contínua', () => {
  /**
   * R$ 500,00 → 50% = R$ 250,00.
   * R$ 500,01 → 40% = R$ 200,00 (200,004 arredondado) + R$ 50,00 = R$ 250,00.
   * Um centavo a mais de saldo não pode dar saque MENOR — é para isso que a
   * parcela adicional existe.
   */
  it('fronteira da primeira para a segunda faixa', () => {
    expect(saque(50_000).saque).toBe(25_000)
    expect(saque(50_001).saque).toBe(25_000)
  })

  /** R$ 1.000,00 → 40% + 50,00 = R$ 450,00; R$ 1.000,01 → 30% + 150,00 = R$ 450,00. */
  it('fronteira da segunda para a terceira faixa', () => {
    expect(saque(100_000).saque).toBe(45_000)
    expect(saque(100_001).saque).toBe(45_000)
  })

  /** R$ 20.000,00 → 10% + 1.900,00 = R$ 3.900,00; R$ 20.000,01 → 5% + 2.900,00 = R$ 3.900,00. */
  it('fronteira da última faixa', () => {
    expect(saque(2_000_000).saque).toBe(390_000)
    expect(saque(2_000_001).saque).toBe(390_000)
  })

  /** Saldos crescentes nunca produzem saque decrescente. */
  it('o saque nunca cai quando o saldo sobe', () => {
    let anterior = 0
    for (const saldo of [10_000, 50_000, 50_001, 100_000, 100_001, 500_000, 500_001, 1_000_000, 1_500_001, 3_000_000]) {
      const atual = saque(saldo).saque
      expect(atual, `saldo ${saldo}`).toBeGreaterThanOrEqual(anterior)
      anterior = atual
    }
  })

  /** Quanto maior o saldo, menor a fatia sacada: 50% na primeira faixa, menos de 11% com R$ 50 mil. */
  it('o percentual efetivo cai com o saldo', () => {
    expect(saque(40_000).percentualEfetivo).toBe(5_000)
    expect(saque(5_000_000).percentualEfetivo).toBeLessThan(1_100)
  })
})

describe('CALC-095 · entradas recusadas e cobertura', () => {
  it('sem saldo, fica pendente', () => {
    const r = calcularSaqueAniversario({ saldo: centavos(0) }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('RN-003 — antes da lei de 2019 não há tabela', () => {
    const r = calcularSaqueAniversario({ saldo: centavos(300_000) }, '2019-12-11' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('a memória avisa que o restante fica preso na conta', () => {
    const r = calcularSaqueAniversario({ saldo: centavos(300_000) }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    const restante = r.traco.etapas.find((e) => e.rotulo.includes('permanece na conta'))
    expect(restante?.justificativa).toContain('despedida sem justa causa')
  })
})
