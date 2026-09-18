/**
 * CALC-118 — abono salarial · CALC-009 — seguro-desemprego do doméstico.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`:
 *
 * - **Tabela oficial do Ministério do Trabalho e Emprego** — página do serviço
 *   Abono Salarial, conferida em 18/09/2026 —, com os valores do pagamento de
 *   2026 por meses trabalhados no ano-base 2024: 136,00 · 271,00 · 406,00 ·
 *   541,00 · 675,00 · 811,00 · 946,00 · 1.081,00 · 1.216,00 · 1.351,00 ·
 *   1.486,00 · 1.621,00; e o limite de "remuneração média de até R$ 2.766,00";
 * - Lei nº 7.998/1990, art. 9º, §§ 2º e 4º (1/12 do salário mínimo do pagamento
 *   por mês; arredondamento para cima até o real inteiro);
 * - LC nº 150/2015, arts. 26 e 28, I (um salário mínimo, até três parcelas;
 *   quinze meses nos últimos vinte e quatro).
 *
 * **Divergência declarada:** para cinco meses a tabela do Ministério traz R$
 * 675,00, e a lei dá R$ 676,00 — R$ 1.621,00 × 5 ÷ 12 = R$ 675,42, e o § 4º
 * manda suplementar até o real de cima, como a própria tabela faz nos outros
 * onze valores. O caso segue a lei, e a divergência está em
 * `ESTADO-DO-PROJETO` §7.91.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularAbono } from '../../src/lib/engine/calculadoras/abono-salarial'
import { calcularSeguroDesempregoDomestico } from '../../src/lib/engine/calculadoras/seguro-desemprego'
import { centavos } from '../../src/lib/engine/types'
import { ABONO_SALARIAL } from '../../src/lib/params/data/abono-salarial'
import { INSS } from '../../src/lib/params/data/inss'
import { SEGURO_DESEMPREGO } from '../../src/lib/params/data/seguro-desemprego'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'
import { porSlug } from '../../src/lib/calculadoras'

const REF = '2026-06-15' as DataISO

describe('CALC-118 · abono salarial — pagamento de 2026', () => {
  const registro = construirRegistro(ABONO_SALARIAL, INSS)
  const abono = (meses: number, media = 200_000, cadastro = true) => {
    const r = calcularAbono({ remuneracaoMedia: centavos(media), meses, cadastroHaCincoAnos: cadastro }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  it('a tabela do Ministério, mês a mês — onze valores iguais', () => {
    const tabela: readonly (readonly [number, number])[] = [
      [1, 13_600], [2, 27_100], [3, 40_600], [4, 54_100], [6, 81_100], [7, 94_600],
      [8, 108_100], [9, 121_600], [10, 135_100], [11, 148_600], [12, 162_100],
    ]
    for (const [meses, valor] of tabela) expect(abono(meses).valorPelaLei, `${meses} meses`).toBe(valor)
  })

  /** R$ 1.621,00 × 5 ÷ 12 = R$ 675,4166… → o § 4º manda R$ 676,00 (a tabela diz R$ 675,00). */
  it('cinco meses: a lei dá R$ 676,00', () => {
    expect(abono(5).valorPelaLei).toBe(67_600)
  })

  it('o limite de R$ 2.766,00 é inclusivo', () => {
    expect(abono(12, 276_600).atendeRenda).toBe(true)
    expect(abono(12, 276_601).atendeRenda).toBe(false)
    expect(abono(12, 276_601).atendeTudo).toBe(false)
  })

  it('sem os cinco anos de cadastro, os critérios não fecham', () => {
    const v = abono(12, 200_000, false)
    expect(v.atendeRenda).toBe(true)
    expect(v.atendeTudo).toBe(false)
  })

  it('a página mostra zero quando algum critério não é atendido, e o valor da lei ao lado', () => {
    const d = porSlug('abono-salarial-pis')!
    const fora = d.calcular({ remuneracaoMedia: 300_000, meses: 12, cadastro: 'sim' }, REF)
    const dentro = d.calcular({ remuneracaoMedia: 200_000, meses: 12, cadastro: 'sim' }, REF)
    if (!fora.ok || !dentro.ok) throw new Error('esperado sucesso')
    expect(fora.valores.principal).toBe(0)
    expect(dentro.valores.principal).toBe(162_100)
  })

  it('RN-003 — o limite de 2027 ainda não foi publicado', () => {
    const r = calcularAbono({ remuneracaoMedia: centavos(200_000), meses: 12, cadastroHaCincoAnos: true }, '2027-03-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('meses fora de 1 a 12 são recusados', () => {
    for (const meses of [0, 13, 2.5]) {
      expect(calcularAbono({ remuneracaoMedia: centavos(200_000), meses, cadastroHaCincoAnos: true }, REF, registro).ok).toBe(false)
    }
  })
})

describe('CALC-009 · seguro-desemprego do doméstico', () => {
  const registro = construirRegistro(SEGURO_DESEMPREGO, INSS)

  /** Três parcelas de um salário mínimo de 2026: 3 × R$ 1.621,00 = R$ 4.863,00. */
  it('três parcelas de um salário mínimo', () => {
    const r = calcularSeguroDesempregoDomestico({ meses: 15 }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.valores.parcela).toBe(162_100)
    expect(r.valores.numeroDeParcelas).toBe(3)
    expect(r.valores.total).toBe(486_300)
  })

  it('quinze meses nos últimos vinte e quatro: catorze não bastam', () => {
    const r = calcularSeguroDesempregoDomestico({ meses: 14 }, REF, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    expect(calcularSeguroDesempregoDomestico({ meses: 25 }, REF, registro).ok).toBe(false)
  })

  it('a página leva a escolha do doméstico ao motor certo', () => {
    const d = porSlug('seguro-desemprego')!
    const r = d.calcular({ vinculo: 'domestico', mesesDomestico: 20 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(486_300)
  })
})
