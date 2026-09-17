/**
 * CALC-097 — casos-ouro da multa de trânsito.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre o Código de Trânsito Brasileiro
 * — art. 258, I a IV (R$ 293,47 na gravíssima, R$ 195,23 na grave, R$ 130,16 na
 * média e R$ 88,38 na leve, na redação da Lei nº 13.281/2016) e § 2º (fator
 * multiplicador da multa agravada); art. 259, I a IV (sete, cinco, quatro e três
 * pontos); art. 261, I, "a" a "c" (suspensão aos 20, 30 ou 40 pontos em doze
 * meses, conforme o número de gravíssimas, na redação da Lei nº 14.071/2020); e
 * art. 284, caput e § 1º (pagamento por 80% até o vencimento, ou por 60% com
 * adesão à notificação eletrônica). A conta de cada caso está ao lado da
 * asserção.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularMultaTransito,
  type EntradaMultaTransito,
} from '../../src/lib/engine/calculadoras/transito'
import { TRANSITO } from '../../src/lib/params/data/transito'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(TRANSITO)
const REF = '2026-06-15' as DataISO

const BASE: EntradaMultaTransito = {
  natureza: 'gravissima',
  fatorMultiplicador: 1,
  formaDePagamento: 'integral',
  pontosAcumulados: 0,
  gravissimasAcumuladas: 0,
  atividadeRemunerada: false,
}

function multa(over: Partial<EntradaMultaTransito> = {}, ref = REF) {
  const r = calcularMultaTransito({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-097 · valor por natureza da infração', () => {
  it('as quatro naturezas, com valor e pontos', () => {
    const esperado: readonly (readonly ['gravissima' | 'grave' | 'media' | 'leve', number, number])[] = [
      ['gravissima', 29_347, 7],
      ['grave', 19_523, 5],
      ['media', 13_016, 4],
      ['leve', 8_838, 3],
    ]
    for (const [natureza, valor, pontos] of esperado) {
      const v = multa({ natureza })
      expect(v.valorCheio, natureza).toBe(valor)
      expect(v.pontosDaInfracao, natureza).toBe(pontos)
    }
  })

  /** Multa agravada: R$ 293,47 × 5 = R$ 1.467,35. */
  it('fator multiplicador multiplica o valor, não os pontos', () => {
    const v = multa({ fatorMultiplicador: 5 })
    expect(v.valorCheio).toBe(146_735)
    expect(v.pontosDaInfracao).toBe(7)
  })
})

describe('CALC-097 · descontos do art. 284', () => {
  /** R$ 293,47 × 80% = 234,776 → R$ 234,78. */
  it('pagamento até o vencimento', () => {
    const v = multa({ formaDePagamento: 'ate-vencimento' })
    expect(v.valorAPagar).toBe(23_478)
    expect(v.desconto).toBe(5_869)
  })

  /** R$ 293,47 × 60% = 176,082 → R$ 176,08. */
  it('pagamento com adesão à notificação eletrônica', () => {
    const v = multa({ formaDePagamento: 'notificacao-eletronica' })
    expect(v.valorAPagar).toBe(17_608)
  })

  /** Sem desconto, paga-se o valor cheio. */
  it('pagamento fora do prazo não tem desconto', () => {
    const v = multa()
    expect(v.valorAPagar).toBe(v.valorCheio)
    expect(v.desconto).toBe(0)
  })

  /** O desconto incide sobre o valor já multiplicado: R$ 1.467,35 × 60% = R$ 880,41. */
  it('o desconto vem depois do fator multiplicador', () => {
    const v = multa({ fatorMultiplicador: 5, formaDePagamento: 'notificacao-eletronica' })
    expect(v.valorAPagar).toBe(88_041)
  })

  it('RN-003 — o desconto da notificação eletrônica só existe a partir de 2023', () => {
    const r = calcularMultaTransito(
      { ...BASE, formaDePagamento: 'notificacao-eletronica' },
      '2023-06-19' as DataISO,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

describe('CALC-097 · pontos e limite de suspensão', () => {
  /** Uma gravíssima na contagem: o limite é 30 pontos. */
  it('com uma gravíssima, o limite é o do meio', () => {
    const v = multa()
    expect(v.pontosTotais).toBe(7)
    expect(v.limiteDePontos).toBe(30)
    expect(v.atingiuOLimite).toBe(false)
    expect(v.pontosAteOLimite).toBe(23)
  })

  /** Duas gravíssimas — a acumulada e esta — derrubam o limite para 20. */
  it('com duas gravíssimas, o limite cai', () => {
    const v = multa({ gravissimasAcumuladas: 1, pontosAcumulados: 7 })
    expect(v.limiteDePontos).toBe(20)
    expect(v.pontosTotais).toBe(14)
  })

  /** Sem nenhuma gravíssima, o limite é 40. */
  it('sem gravíssima, o limite é o mais alto', () => {
    const v = multa({ natureza: 'leve' })
    expect(v.limiteDePontos).toBe(40)
  })

  /** Condutor com atividade remunerada: limite mais alto, mesmo com gravíssimas. */
  it('atividade remunerada usa sempre o limite mais alto', () => {
    const v = multa({ gravissimasAcumuladas: 3, pontosAcumulados: 21, atividadeRemunerada: true })
    expect(v.limiteDePontos).toBe(40)
    expect(v.pontosTotais).toBe(28)
    expect(v.atingiuOLimite).toBe(false)
  })

  /** 38 pontos acumulados + 3 de uma leve = 41 ≥ 40. */
  it('a soma que alcança o limite é sinalizada', () => {
    const v = multa({ natureza: 'leve', pontosAcumulados: 38 })
    expect(v.pontosTotais).toBe(41)
    expect(v.atingiuOLimite).toBe(true)
    expect(v.pontosAteOLimite).toBe(0)
  })

  /** Exatamente no limite já conta: 33 + 7 = 40, com uma gravíssima → limite 30. */
  it('atingir o limite exato conta como atingido', () => {
    const v = multa({ pontosAcumulados: 23 })
    expect(v.pontosTotais).toBe(30)
    expect(v.limiteDePontos).toBe(30)
    expect(v.atingiuOLimite).toBe(true)
  })
})

describe('CALC-097 · entradas recusadas e cobertura', () => {
  it('fator inválido é recusado', () => {
    for (const fator of [0, -1, 2.5, 101]) {
      const r = calcularMultaTransito({ ...BASE, fatorMultiplicador: fator }, REF, registro)
      expect(r.ok, `fator ${fator}`).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })

  it('pontos e gravíssimas negativos ou fracionados são recusados', () => {
    for (const over of [
      { pontosAcumulados: -1 },
      { pontosAcumulados: 2.5 },
      { gravissimasAcumuladas: -1 },
      { gravissimasAcumuladas: 1.5 },
    ]) {
      const r = calcularMultaTransito({ ...BASE, ...over }, REF, registro)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })

  it('RN-003 — antes de 01/11/2016 os valores não estão cadastrados', () => {
    const r = calcularMultaTransito(BASE, '2016-10-31' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
