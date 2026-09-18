/**
 * CALC-112 — férias concedidas fora do prazo.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a CLT, na redação do Decreto-lei
 * nº 1.535/1977 lida no Planalto em 18/09/2026 — art. 130 (doze meses para
 * adquirir), art. 134 (doze meses para conceder) e art. 137 (pagamento em
 * dobro) —, sobre a Súmula 81 do TST (dobra dos DIAS gozados após o prazo),
 * lida no livro de súmulas publicado pelo TST, e sobre o terço constitucional
 * (CF, art. 7º, XVII).
 *
 * Mês comercial de trinta dias, como em CALC-004.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularFeriasEmDobro, type EntradaFeriasEmDobro } from '../../src/lib/engine/calculadoras/ferias-em-dobro'
import { centavos } from '../../src/lib/engine/types'
import { FERIAS_FORA_DO_PRAZO } from '../../src/lib/params/data/ferias-fora-do-prazo'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(FERIAS_FORA_DO_PRAZO)
const REF = '2026-06-15' as DataISO

/** Admitido em 10/03/2024: adquire em 10/03/2025; o prazo para conceder vai até 09/03/2026. */
const BASE: EntradaFeriasEmDobro = {
  salario: centavos(300_000),
  inicioDoAquisitivo: '2024-03-10',
  inicioDasFerias: '2026-02-24',
  dias: 30,
}

function ferias(over: Partial<EntradaFeriasEmDobro> = {}) {
  const r = calcularFeriasEmDobro({ ...BASE, ...over }, REF, registro)
  if (!r.ok) throw new Error(r.detalhe)
  return r.valores
}

describe('CALC-112 · os prazos', () => {
  it('aquisitivo até 09/03/2025; concessivo até 09/03/2026', () => {
    const v = ferias()
    expect(v.fimDoAquisitivo).toBe('2025-03-09')
    expect(v.fimDoConcessivo).toBe('2026-03-09')
  })

  /** 29/02/2024 + 12 meses cai num dia que não existe: o direito vem em 01/03/2025. */
  it('início em 29 de fevereiro', () => {
    const v = ferias({ inicioDoAquisitivo: '2024-02-29', inicioDasFerias: '2026-01-10' })
    expect(v.fimDoAquisitivo).toBe('2025-02-28')
    expect(v.fimDoConcessivo).toBe('2026-02-28')
  })
})

describe('CALC-112 · a dobra dia a dia (Súmula 81)', () => {
  /**
   * Férias de 24/02 a 25/03/2026: 14 dias dentro do prazo, 16 depois de 09/03.
   * - simples: R$ 3.000,00 ÷ 30 × 14 = R$ 1.400,00; + ⅓ R$ 466,67 = R$ 1.866,67;
   * - em dobro: R$ 3.000,00 ÷ 30 × 16 = R$ 1.600,00; + ⅓ R$ 533,33 = R$ 2.133,33;
   *   × 2 = R$ 4.266,66;
   * - total R$ 6.133,33, contra R$ 4.000,00 dentro do prazo.
   */
  it('férias que atravessam o fim do prazo: só os dias de fora dobram', () => {
    const v = ferias()
    expect(v.diasSimples).toBe(14)
    expect(v.diasEmDobro).toBe(16)
    expect(v.valorSimples).toBe(186_667)
    expect(v.valorEmDobro).toBe(426_666)
    expect(v.total).toBe(613_333)
    expect(v.acrescimoDaDobra).toBe(213_333)
  })

  /** De 01/02 a 02/03/2026: tudo dentro do prazo — R$ 3.000,00 + ⅓ = R$ 4.000,00. */
  it('dentro do prazo, nada dobra', () => {
    const v = ferias({ inicioDasFerias: '2026-02-01' })
    expect(v.diasEmDobro).toBe(0)
    expect(v.total).toBe(400_000)
    expect(v.acrescimoDaDobra).toBe(0)
  })

  /** O último dia do prazo ainda é simples: férias terminando em 09/03/2026. */
  it('terminar no último dia do prazo não dobra', () => {
    const v = ferias({ inicioDasFerias: '2026-02-08' })
    expect(v.diasEmDobro).toBe(0)
  })

  /** De 01/04 a 30/04/2026: tudo fora — R$ 4.000,00 × 2. */
  it('inteiramente fora do prazo: a remuneração inteira em dobro', () => {
    const v = ferias({ inicioDasFerias: '2026-04-01' })
    expect(v.diasEmDobro).toBe(30)
    expect(v.total).toBe(800_000)
  })

  /** Vinte dias, de 01/03 a 20/03/2026: 9 simples, 11 em dobro. */
  it('período menor que trinta dias', () => {
    const v = ferias({ inicioDasFerias: '2026-03-01', dias: 20 })
    expect(v.diasSimples).toBe(9)
    expect(v.diasEmDobro).toBe(11)
  })

  it('a memória cita a Súmula 81 e o art. 137', () => {
    const r = calcularFeriasEmDobro(BASE, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas.some((e) => e.fundamento?.norma.includes('Súmula 81'))).toBe(true)
    expect(r.traco.etapas.some((e) => e.parametro?.dispositivo === 'Art. 137, caput')).toBe(true)
  })
})

describe('CALC-112 · entradas recusadas', () => {
  it('férias antes de adquirir o direito', () => {
    const r = calcularFeriasEmDobro({ ...BASE, inicioDasFerias: '2025-03-01' }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('inconsistencia_temporal')
  })

  it('dias fora de 1 a 30, salário ou data ausentes', () => {
    for (const over of [{ dias: 0 }, { dias: 31 }, { dias: 2.5 }]) {
      const r = calcularFeriasEmDobro({ ...BASE, ...over }, REF, registro)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
    for (const over of [{ salario: centavos(0) }, { inicioDasFerias: '' }]) {
      const r = calcularFeriasEmDobro({ ...BASE, ...over }, REF, registro)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
    }
  })
})
