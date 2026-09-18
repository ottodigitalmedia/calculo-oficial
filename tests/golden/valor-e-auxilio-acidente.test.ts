/**
 * CALC-109 — valor da aposentadoria · CALC-110 — auxílio-acidente.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre textos oficiais lidos em
 * 18/09/2026 no Planalto:
 *
 * - EC nº 103/2019, art. 26: média limitada ao teto (§ 1º); 60% mais 2 pontos
 *   percentuais por ano acima de 20 anos (§ 2º) ou, para a mulher, de 15 (§ 5º);
 *   100% no pedágio de 100% e na incapacidade acidentária (§ 3º);
 * - Lei nº 8.213/1991, art. 33: piso do salário mínimo e teto do salário de
 *   contribuição para o benefício que substitui o salário;
 * - Lei nº 8.213/1991, art. 86, § 1º: auxílio-acidente de 50% do salário de
 *   benefício, sem o piso — é indenização.
 *
 * Salário mínimo de 2026 (R$ 1.621,00) e teto de 2026 (R$ 8.475,55) lidos dos
 * parâmetros já cadastrados e conferidos nos lotes anteriores.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularAuxilioAcidente,
  calcularValorDaAposentadoria,
  type EntradaValorDaAposentadoria,
} from '../../src/lib/engine/calculadoras/beneficios-inss'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { PREVIDENCIA_RGPS } from '../../src/lib/params/data/previdencia-rgps'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS, INSS)
const REF = '2026-06-15' as DataISO

function valor(over: Partial<EntradaValorDaAposentadoria>) {
  const r = calcularValorDaAposentadoria(
    { media: centavos(400_000), sexo: 'homem', anosDeContribuicao: 35, hipotese: 'programada', ...over },
    REF,
    registro,
  )
  if (!r.ok) throw new Error(r.detalhe)
  return r.valores
}

describe('CALC-109 · o coeficiente do art. 26', () => {
  /** Homem, 35 anos: 15 acima de 20 → 60% + 30% = 90% de R$ 4.000,00. */
  it('homem com 35 anos de contribuição: 90%', () => {
    const v = valor({})
    expect(v.coeficiente).toBe(9_000)
    expect(v.anosComAcrescimo).toBe(15)
    expect(v.valorDoBeneficio).toBe(360_000)
  })

  /** Mulher, 30 anos: 15 acima de 15 → 90%. O § 5º começa a contar cinco anos antes. */
  it('mulher com 30 anos de contribuição: também 90%', () => {
    const v = valor({ sexo: 'mulher', anosDeContribuicao: 30 })
    expect(v.coeficiente).toBe(9_000)
    expect(v.valorDoBeneficio).toBe(360_000)
  })

  /** Homem, 20 anos: nenhum ano acima — 60% de R$ 3.000,00. */
  it('sem ano acima do limite, fica nos 60%', () => {
    const v = valor({ media: centavos(300_000), anosDeContribuicao: 20 })
    expect(v.coeficiente).toBe(6_000)
    expect(v.valorDoBeneficio).toBe(180_000)
  })

  /** Homem com 15 anos (aposentadoria por idade): 60% de R$ 2.000,00 = R$ 1.200,00, elevado ao mínimo. */
  it('o piso do salário mínimo', () => {
    const v = valor({ media: centavos(200_000), anosDeContribuicao: 15 })
    expect(v.coeficiente).toBe(6_000)
    expect(v.aplicouPiso).toBe(true)
    expect(v.valorDoBeneficio).toBe(162_100)
  })

  /** Homem, 45 anos: 60% + 50% = 110% de R$ 8.000,00 = R$ 8.800,00 — o coeficiente passa de 100%, o teto segura. */
  it('o coeficiente passa de cem por cento; o benefício, não passa do teto', () => {
    const v = valor({ media: centavos(800_000), anosDeContribuicao: 45 })
    expect(v.coeficiente).toBe(11_000)
    expect(v.aplicouTeto).toBe(true)
    expect(v.valorDoBeneficio).toBe(847_555)
  })

  /** Média de R$ 10.000,00 limitada ao teto de R$ 8.475,55 antes do coeficiente (§ 1º). */
  it('a média é limitada ao teto antes do coeficiente', () => {
    const v = valor({ media: centavos(1_000_000), anosDeContribuicao: 40 })
    expect(v.aplicouTetoNaMedia).toBe(true)
    expect(v.mediaConsiderada).toBe(847_555)
    expect(v.coeficiente).toBe(10_000)
    expect(v.valorDoBeneficio).toBe(847_555)
  })

  /** R$ 3.333,33 × 62% (mulher, 16 anos) = R$ 2.066,6646 → R$ 2.066,66. */
  it('arredondamento ao centavo', () => {
    const v = valor({ sexo: 'mulher', anosDeContribuicao: 16, media: centavos(333_333) })
    expect(v.coeficiente).toBe(6_200)
    expect(v.valorDoBeneficio).toBe(206_666)
  })
})

describe('CALC-109 · as hipóteses de cem por cento', () => {
  it('pedágio de 100%: a média integral, qualquer que seja o tempo', () => {
    const v = valor({ hipotese: 'pedagio-100', anosDeContribuicao: 36, media: centavos(500_000) })
    expect(v.coeficiente).toBe(10_000)
    expect(v.anosComAcrescimo).toBe(0)
    expect(v.valorDoBeneficio).toBe(500_000)
  })

  it('incapacidade permanente acidentária: 100%', () => {
    const v = valor({ hipotese: 'incapacidade-acidentaria', anosDeContribuicao: 10, media: centavos(300_000) })
    expect(v.valorDoBeneficio).toBe(300_000)
  })

  /** Incapacidade por outra causa segue o § 2º: mulher com 12 anos — 60% de R$ 3.000,00. */
  it('incapacidade permanente por outra causa: 60% mais o acréscimo', () => {
    const v = valor({ hipotese: 'incapacidade-comum', sexo: 'mulher', anosDeContribuicao: 12, media: centavos(300_000) })
    expect(v.coeficiente).toBe(6_000)
    expect(v.valorDoBeneficio).toBe(180_000)
  })

  it('a memória cita o art. 26 e o art. 33', () => {
    const r = calcularValorDaAposentadoria(
      { media: centavos(800_000), sexo: 'homem', anosDeContribuicao: 45, hipotese: 'programada' },
      REF,
      registro,
    )
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas.some((e) => e.parametro?.dispositivo?.includes('Art. 26'))).toBe(true)
    expect(r.traco.etapas.some((e) => e.fundamento?.dispositivo === 'Art. 33')).toBe(true)
  })

  it('entradas recusadas', () => {
    const base = { media: centavos(300_000), sexo: 'homem' as const, anosDeContribuicao: 30, hipotese: 'programada' as const }
    for (const over of [{ media: centavos(0) }, { anosDeContribuicao: 2.5 }, { anosDeContribuicao: -1 }, { anosDeContribuicao: 71 }]) {
      expect(calcularValorDaAposentadoria({ ...base, ...over }, REF, registro).ok).toBe(false)
    }
    const antes = calcularValorDaAposentadoria(base, '2019-11-12' as DataISO, registro)
    expect(antes.ok).toBe(false)
    if (!antes.ok) expect(antes.motivo).toBe('vigencia_ausente')
  })
})

describe('CALC-110 · auxílio-acidente', () => {
  const acidente = (sb: number) => {
    const r = calcularAuxilioAcidente({ salarioDeBeneficio: centavos(sb) }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  it('metade do salário de benefício', () => {
    const v = acidente(300_000)
    expect(v.percentual).toBe(5_000)
    expect(v.valorDoBeneficio).toBe(150_000)
  })

  /** R$ 2.000,00 × 50% = R$ 1.000,00 — abaixo do mínimo, e fica assim: é indenização. */
  it('pode ficar abaixo do salário mínimo', () => {
    const v = acidente(200_000)
    expect(v.valorDoBeneficio).toBe(100_000)
    expect(v.abaixoDoMinimo).toBe(true)
  })

  /** R$ 10.000,00 limitado a R$ 8.475,55; metade = R$ 4.237,775 → R$ 4.237,78. */
  it('o salário de benefício é limitado ao teto', () => {
    const v = acidente(1_000_000)
    expect(v.aplicouTeto).toBe(true)
    expect(v.salarioDeBeneficioConsiderado).toBe(847_555)
    expect(v.valorDoBeneficio).toBe(423_778)
  })

  it('a memória cita o art. 86', () => {
    const r = calcularAuxilioAcidente({ salarioDeBeneficio: centavos(300_000) }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas.at(-1)?.fundamento?.dispositivo).toContain('Art. 86')
  })

  it('sem salário de benefício, fica pendente', () => {
    const r = calcularAuxilioAcidente({ salarioDeBeneficio: centavos(0) }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })
})
