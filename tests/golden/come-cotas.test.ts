/**
 * CALC-098 — casos-ouro do come-cotas.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a Lei nº 14.754/2023, art. 17 —
 * retenção no último dia útil de maio e de novembro (caput, I), alíquota de 15%
 * na tributação periódica e "percentual complementar necessário para totalizar
 * a alíquota prevista nos incisos I a IV do caput do art. 1º da Lei nº
 * 11.033/2004" no resgate (§ 1º, I), com a base do § 5º, I — e sobre a tabela
 * regressiva da Lei nº 11.033/2004 (22,5%, 20%, 17,5% e 15%, conforme o prazo),
 * que já está cadastrada para CALC-018.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularComeCotas, type EntradaComeCotas } from '../../src/lib/engine/calculadoras/come-cotas'
import { ZERO, centavos } from '../../src/lib/engine/types'
import { COME_COTAS } from '../../src/lib/params/data/come-cotas'
import { RENDA_FIXA } from '../../src/lib/params/data/renda-fixa'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(COME_COTAS, RENDA_FIXA)
const REF = '2026-06-15' as DataISO

const BASE: EntradaComeCotas = {
  rendimentoAcumulado: centavos(100_000),
  rendimentoJaTributado: ZERO,
  impostoJaRetido: ZERO,
  diasDesdeAplicacao: 200,
}

function cc(over: Partial<EntradaComeCotas> = {}, ref = REF) {
  const r = calcularComeCotas({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-098 · a retenção periódica', () => {
  /** R$ 1.000,00 de rendimento × 15% = R$ 150,00. */
  it('quinze por cento sobre o rendimento ainda não tributado', () => {
    const v = cc()
    expect(v.aliquotaPeriodica).toBe(1_500)
    expect(v.baseDoComeCotas).toBe(100_000)
    expect(v.comeCotas).toBe(15_000)
  })

  /** Já tributados R$ 400,00: a base é R$ 600,00 e o come-cotas, R$ 90,00. */
  it('o que já sofreu come-cotas não é tributado de novo', () => {
    const v = cc({ rendimentoJaTributado: centavos(40_000) })
    expect(v.baseDoComeCotas).toBe(60_000)
    expect(v.comeCotas).toBe(9_000)
  })

  /** Rendimento inteiro já tributado: não há nova retenção. */
  it('sem rendimento novo, não há retenção', () => {
    const v = cc({ rendimentoJaTributado: centavos(100_000) })
    expect(v.baseDoComeCotas).toBe(0)
    expect(v.comeCotas).toBe(0)
  })
})

describe('CALC-098 · a alíquota final e o complemento', () => {
  /**
   * 200 dias caem na segunda faixa: 20%. R$ 1.000,00 × 20% = R$ 200,00 devidos.
   * Com R$ 150,00 já retidos no come-cotas, faltam R$ 50,00 no resgate.
   */
  it('o resgate cobra só a diferença', () => {
    const v = cc({ impostoJaRetido: centavos(15_000) })
    expect(v.aliquotaFinal).toBe(2_000)
    expect(v.impostoNoResgate).toBe(20_000)
    expect(v.complementoNoResgate).toBe(5_000)
  })

  /** As quatro faixas da tabela, pelas fronteiras: 180, 181, 360, 361, 720, 721. */
  it('cada fronteira da tabela regressiva', () => {
    const esperado: readonly (readonly [number, number])[] = [
      [1, 2_250],
      [180, 2_250],
      [181, 2_000],
      [360, 2_000],
      [361, 1_750],
      [720, 1_750],
      [721, 1_500],
      [2_000, 1_500],
    ]
    for (const [dias, aliquota] of esperado) {
      expect(cc({ diasDesdeAplicacao: dias }).aliquotaFinal, `${dias} dias`).toBe(aliquota)
    }
  })

  /**
   * Prazo longo: 800 dias → 15%, a mesma alíquota do come-cotas. R$ 1.000,00 ×
   * 15% = R$ 150,00, e não sobra complemento nenhum se já foram retidos R$ 150,00.
   */
  it('acima de dois anos, a alíquota final iguala a do come-cotas', () => {
    const v = cc({ diasDesdeAplicacao: 800, impostoJaRetido: centavos(15_000) })
    expect(v.aliquotaFinal).toBe(1_500)
    expect(v.impostoNoResgate).toBe(15_000)
    expect(v.complementoNoResgate).toBe(0)
  })

  /** Retido a mais que o devido não vira restituição no resgate: o complemento é zero. */
  it('retenção maior que o devido não gera valor negativo', () => {
    const v = cc({ diasDesdeAplicacao: 800, impostoJaRetido: centavos(30_000) })
    expect(v.complementoNoResgate).toBe(0)
  })

  /** Resgate em 100 dias, sem come-cotas anterior: 22,5% de R$ 1.000,00 = R$ 225,00. */
  it('resgate rápido paga a alíquota mais alta inteira', () => {
    const v = cc({ diasDesdeAplicacao: 100 })
    expect(v.impostoNoResgate).toBe(22_500)
    expect(v.complementoNoResgate).toBe(22_500)
  })
})

describe('CALC-098 · entradas recusadas e cobertura', () => {
  it('sem rendimento, fica pendente', () => {
    const r = calcularComeCotas({ ...BASE, rendimentoAcumulado: ZERO }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('entradas incoerentes são recusadas', () => {
    for (const over of [
      { rendimentoJaTributado: centavos(-1) },
      { impostoJaRetido: centavos(-1) },
      { rendimentoJaTributado: centavos(200_000) },
      { diasDesdeAplicacao: 0 },
      { diasDesdeAplicacao: -5 },
      { diasDesdeAplicacao: 10.5 },
    ]) {
      const r = calcularComeCotas({ ...BASE, ...over }, REF, registro)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })

  it('RN-003 — a regra do come-cotas vale a partir de 2024', () => {
    const r = calcularComeCotas(BASE, '2023-12-31' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('a memória explica que a retenção é antecipação', () => {
    const r = calcularComeCotas(BASE, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('Alíquota final'))
    expect(etapa?.justificativa).toContain('antecipa')
  })
})
