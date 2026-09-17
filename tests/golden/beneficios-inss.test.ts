/**
 * CALC-100 · CALC-101 · CALC-102 — casos-ouro dos benefícios do INSS.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a EC nº 103/2019, art. 23 (cota
 * familiar de 50%, mais 10 pontos percentuais por dependente, até 100%, com o
 * § 2º garantindo 100% quando há dependente inválido ou com deficiência); sobre
 * a Lei nº 8.213/1991, art. 61 (91% do salário de benefício) e art. 29, § 10 (o
 * benefício não pode exceder a média dos últimos doze salários de contribuição);
 * sobre o art. 73, I a III (último salário de contribuição para a doméstica, um
 * salário mínimo para a segurada especial, um doze avos da soma dos doze
 * últimos para as demais); e sobre a CF, art. 201, § 2º (nenhum benefício
 * substitutivo abaixo do salário mínimo).
 *
 * O teto é o limite superior da última faixa da tabela do INSS, cadastrada para
 * CALC-016 — em 2026, R$ 8.475,55. O salário mínimo de 2026 é R$ 1.621,00.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularAuxilioIncapacidade,
  calcularPensaoPorMorte,
  calcularSalarioMaternidadeInss,
  type EntradaSalarioMaternidade,
} from '../../src/lib/engine/calculadoras/beneficios-inss'
import { ZERO, centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { PREVIDENCIA_RGPS } from '../../src/lib/params/data/previdencia-rgps'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS, INSS)
const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-100 — Pensão por morte
// ---------------------------------------------------------------------------

function pensao(aposentadoria: number, dependentes: number, invalido = false, ref = REF) {
  const r = calcularPensaoPorMorte(
    { valorDaAposentadoria: centavos(aposentadoria), dependentes, temDependenteInvalido: invalido },
    ref,
    registro,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-100 · pensão por morte', () => {
  /** Um dependente: 50% + 10% = 60% de R$ 4.000,00 = R$ 2.400,00. */
  it('um dependente recebe a cota familiar mais uma cota', () => {
    const v = pensao(400_000, 1)
    expect(v.percentualAplicado).toBe(6_000)
    expect(v.valorDaPensao).toBe(240_000)
  })

  /** Três dependentes: 50% + 30% = 80% → R$ 3.200,00. */
  it('cada dependente soma dez pontos percentuais', () => {
    expect(pensao(400_000, 3).percentualAplicado).toBe(8_000)
    expect(pensao(400_000, 3).valorDaPensao).toBe(320_000)
  })

  /** Cinco dependentes chegam ao teto de 100%; seis não passam disso. */
  it('as cotas param em cem por cento', () => {
    expect(pensao(400_000, 5).percentualAplicado).toBe(10_000)
    expect(pensao(400_000, 6).percentualAplicado).toBe(10_000)
    expect(pensao(400_000, 6).valorDaPensao).toBe(400_000)
  })

  /** Dependente inválido: 100% desde logo, mesmo com um só dependente. */
  it('dependente inválido ou com deficiência garante o valor integral', () => {
    const v = pensao(400_000, 1, true)
    expect(v.percentualAplicado).toBe(10_000)
    expect(v.valorDaPensao).toBe(400_000)
  })

  /**
   * Aposentadoria de R$ 2.000,00 com um dependente: 60% = R$ 1.200,00, abaixo do
   * salário mínimo de 2026 (R$ 1.621,00). O piso constitucional eleva o valor.
   */
  it('o piso constitucional impede pensão abaixo do salário mínimo', () => {
    const v = pensao(200_000, 1)
    expect(v.aplicouPiso).toBe(true)
    expect(v.valorDaPensao).toBe(162_100)
  })

  it('RN-003 — óbito anterior à Emenda não é calculado por esta regra', () => {
    const r = calcularPensaoPorMorte(
      { valorDaAposentadoria: centavos(400_000), dependentes: 1, temDependenteInvalido: false },
      '2019-11-12' as DataISO,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('entradas recusadas', () => {
    const semValor = calcularPensaoPorMorte(
      { valorDaAposentadoria: ZERO, dependentes: 1, temDependenteInvalido: false },
      REF,
      registro,
    )
    expect(semValor.ok).toBe(false)
    if (!semValor.ok) expect(semValor.motivo).toBe('entrada_incompleta')

    for (const dependentes of [0, -1, 2.5, 21]) {
      const r = calcularPensaoPorMorte(
        { valorDaAposentadoria: centavos(400_000), dependentes, temDependenteInvalido: false },
        REF,
        registro,
      )
      expect(r.ok, `${dependentes} dependentes`).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })
})

// ---------------------------------------------------------------------------
// CALC-101 — Auxílio por incapacidade temporária
// ---------------------------------------------------------------------------

function auxilio(salarioDeBeneficio: number, mediaDoze: number, ref = REF) {
  const r = calcularAuxilioIncapacidade(
    { salarioDeBeneficio: centavos(salarioDeBeneficio), mediaDosUltimosDoze: centavos(mediaDoze) },
    ref,
    registro,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-101 · auxílio por incapacidade temporária', () => {
  /** R$ 3.000,00 × 91% = R$ 2.730,00, sem limites acionados. */
  it('noventa e um por cento do salário de benefício', () => {
    const v = auxilio(300_000, 400_000)
    expect(v.percentual).toBe(9_100)
    expect(v.valorDoBeneficio).toBe(273_000)
    expect(v.aplicouLimiteDosDoze).toBe(false)
  })

  /**
   * O limite do § 10: salário de benefício de R$ 5.000,00 dá R$ 4.550,00, mas a
   * média dos últimos doze é R$ 3.000,00 — o benefício cai para ela.
   */
  it('o benefício não supera a média dos últimos doze salários', () => {
    const v = auxilio(500_000, 300_000)
    expect(v.valorAntesDosLimites).toBe(455_000)
    expect(v.aplicouLimiteDosDoze).toBe(true)
    expect(v.valorDoBeneficio).toBe(300_000)
  })

  /** Teto de 2026: R$ 8.475,55. Salário de benefício no teto dá 91% dele, abaixo do teto. */
  it('o teto do regime limita o benefício', () => {
    const v = auxilio(1_500_000, 1_500_000)
    expect(v.aplicouTeto).toBe(true)
    expect(v.valorDoBeneficio).toBe(847_555)
    expect(v.teto).toBe(847_555)
  })

  /** R$ 1.500,00 × 91% = R$ 1.365,00 — abaixo do mínimo, sobe para R$ 1.621,00. */
  it('o piso eleva o benefício ao salário mínimo', () => {
    const v = auxilio(150_000, 150_000)
    expect(v.aplicouPiso).toBe(true)
    expect(v.valorDoBeneficio).toBe(162_100)
  })

  /** Média dos doze igual a zero significa "não informada": o limite não é aplicado. */
  it('sem a média dos doze, o limite do § 10 não entra', () => {
    const v = auxilio(300_000, 0)
    expect(v.aplicouLimiteDosDoze).toBe(false)
    expect(v.valorDoBeneficio).toBe(273_000)
  })

  it('entradas recusadas', () => {
    const semBase = calcularAuxilioIncapacidade(
      { salarioDeBeneficio: ZERO, mediaDosUltimosDoze: centavos(300_000) },
      REF,
      registro,
    )
    expect(semBase.ok).toBe(false)
    if (!semBase.ok) expect(semBase.motivo).toBe('entrada_incompleta')

    const negativa = calcularAuxilioIncapacidade(
      { salarioDeBeneficio: centavos(300_000), mediaDosUltimosDoze: centavos(-1) },
      REF,
      registro,
    )
    expect(negativa.ok).toBe(false)
    if (!negativa.ok) expect(negativa.motivo).toBe('entrada_invalida')
  })
})

// ---------------------------------------------------------------------------
// CALC-102 — Salário-maternidade pago pelo INSS
// ---------------------------------------------------------------------------

const MATERNIDADE: EntradaSalarioMaternidade = {
  categoria: 'demais',
  ultimoSalarioDeContribuicao: ZERO,
  somaDosDozeUltimos: centavos(3_600_000),
}

function maternidade(over: Partial<EntradaSalarioMaternidade> = {}, ref = REF) {
  const r = calcularSalarioMaternidadeInss({ ...MATERNIDADE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-102 · salário-maternidade do INSS', () => {
  /** Demais seguradas: R$ 36.000,00 ÷ 12 = R$ 3.000,00. */
  it('um doze avos da soma dos doze últimos salários de contribuição', () => {
    expect(maternidade().valorMensal).toBe(300_000)
  })

  /** Empregada doméstica: o último salário de contribuição, R$ 2.500,00. */
  it('empregada doméstica recebe o último salário de contribuição', () => {
    const v = maternidade({ categoria: 'domestica', ultimoSalarioDeContribuicao: centavos(250_000) })
    expect(v.valorMensal).toBe(250_000)
  })

  /** Segurada especial: um salário mínimo — R$ 1.621,00 em 2026. */
  it('segurada especial recebe o salário mínimo', () => {
    const v = maternidade({ categoria: 'especial' })
    expect(v.valorMensal).toBe(162_100)
  })

  /** Soma alta: R$ 144.000,00 ÷ 12 = R$ 12.000,00, limitado ao teto de R$ 8.475,55. */
  it('o teto do regime limita o valor', () => {
    const v = maternidade({ somaDosDozeUltimos: centavos(14_400_000) })
    expect(v.valorAntesDosLimites).toBe(1_200_000)
    expect(v.aplicouTeto).toBe(true)
    expect(v.valorMensal).toBe(847_555)
  })

  /** Doméstica com salário abaixo do mínimo: o piso do próprio art. 73 sobe o valor. */
  it('o piso de um salário mínimo vale para todas', () => {
    const v = maternidade({ categoria: 'domestica', ultimoSalarioDeContribuicao: centavos(100_000) })
    expect(v.aplicouPiso).toBe(true)
    expect(v.valorMensal).toBe(162_100)
  })

  it('entradas recusadas', () => {
    const semSoma = calcularSalarioMaternidadeInss({ ...MATERNIDADE, somaDosDozeUltimos: ZERO }, REF, registro)
    expect(semSoma.ok).toBe(false)
    if (!semSoma.ok) expect(semSoma.motivo).toBe('entrada_incompleta')

    const semSalario = calcularSalarioMaternidadeInss(
      { ...MATERNIDADE, categoria: 'domestica' },
      REF,
      registro,
    )
    expect(semSalario.ok).toBe(false)
    if (!semSalario.ok) expect(semSalario.motivo).toBe('entrada_incompleta')

    const negativa = calcularSalarioMaternidadeInss(
      { ...MATERNIDADE, somaDosDozeUltimos: centavos(-1) },
      REF,
      registro,
    )
    expect(negativa.ok).toBe(false)
  })

  it('RF-004 — o mesmo caso muda de valor entre 2025 e 2026', () => {
    const em2025 = maternidade({ categoria: 'especial' }, '2025-06-15' as DataISO)
    const em2026 = maternidade({ categoria: 'especial' })
    expect(em2025.valorMensal).toBe(151_800)
    expect(em2026.valorMensal).toBe(162_100)
  })
})
