/**
 * CALC-098 — come-cotas dos fundos de curto prazo · CALC-070 — porcentagem em série.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`:
 *
 * - **Come-cotas de curto prazo:** Lei nº 14.754/2023, art. 17, § 1º, II (20% na
 *   tributação periódica, e o complemento no resgate) e Lei nº 11.053/2004, art.
 *   6º, § 2º (22,5% até seis meses, 20% acima) — textos conferidos no Planalto
 *   em 19/09/2026. Os valores são as alíquotas aplicadas a lápis sobre
 *   rendimentos redondos.
 * - **Porcentagem em série:** aritmética, conferida por um cálculo em frações
 *   exatas feito à parte, fora do motor, com o mesmo arredondamento por passo.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularPercentuaisEmSerie } from '../../src/lib/engine/calculadoras/aritmetica'
import { calcularComeCotas } from '../../src/lib/engine/calculadoras/come-cotas'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { COME_COTAS } from '../../src/lib/params/data/come-cotas'
import { RENDA_FIXA } from '../../src/lib/params/data/renda-fixa'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'
import { porSlug } from '../../src/lib/calculadoras'

const REF = '2026-06-15' as DataISO

describe('CALC-098 · come-cotas do fundo de curto prazo', () => {
  const registro = construirRegistro(COME_COTAS, RENDA_FIXA)
  const curto = (rendimento: number, jaTributado: number, jaRetido: number, acimaDeSeisMeses: boolean) => {
    const r = calcularComeCotas(
      {
        rendimentoAcumulado: centavos(rendimento),
        rendimentoJaTributado: centavos(jaTributado),
        impostoJaRetido: centavos(jaRetido),
        diasDesdeAplicacao: 0,
        fundo: 'curto',
        acimaDeSeisMeses,
      },
      REF,
      registro,
    )
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  /** R$ 1.000,00 de rendimento: come-cotas de 20% = R$ 200,00; resgate até seis meses, 22,5% = R$ 225,00. */
  it('primeiro come-cotas, aplicação de até seis meses', () => {
    const v = curto(100_000, 0, 0, false)
    expect(v.aliquotaPeriodica).toBe(2_000)
    expect(v.comeCotas).toBe(20_000)
    expect(v.aliquotaFinal).toBe(2_250)
    expect(v.impostoNoResgate).toBe(22_500)
    expect(v.complementoNoResgate).toBe(22_500)
  })

  /**
   * R$ 1.500,00 acumulados, R$ 1.000,00 já tributados e R$ 200,00 já retidos:
   * come-cotas de 20% sobre R$ 500,00 = R$ 100,00. No resgate, acima de seis
   * meses: 20% de R$ 1.500,00 = R$ 300,00, menos R$ 200,00 = R$ 100,00.
   * Até seis meses: 22,5% = R$ 337,50, menos R$ 200,00 = R$ 137,50.
   */
  it('come-cotas seguinte, e as duas faixas do resgate', () => {
    const acima = curto(150_000, 100_000, 20_000, true)
    expect(acima.comeCotas).toBe(10_000)
    expect(acima.aliquotaFinal).toBe(2_000)
    expect(acima.complementoNoResgate).toBe(10_000)
    const ate = curto(150_000, 100_000, 20_000, false)
    expect(ate.impostoNoResgate).toBe(33_750)
    expect(ate.complementoNoResgate).toBe(13_750)
  })

  it('a regra geral continua a mesma — 15% no come-cotas', () => {
    const r = calcularComeCotas(
      { rendimentoAcumulado: centavos(100_000), rendimentoJaTributado: centavos(0), impostoJaRetido: centavos(0), diasDesdeAplicacao: 365 },
      REF,
      registro,
    )
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.valores.comeCotas).toBe(15_000)
  })

  it('a página leva a escolha do fundo ao motor', () => {
    const d = porSlug('come-cotas')!
    const r = d.calcular({ fundo: 'curto', rendimento: 100_000, jaTributado: 0, jaRetido: 0, prazoCurto: 'acima' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(20_000)
  })
})

describe('CALC-070 · porcentagem em série', () => {
  const serie = (valor: number, passos: readonly (readonly [number, number])[]) => {
    const r = calcularPercentuaisEmSerie(
      valor,
      passos.map(([a, d]) => ({ acrescimoBp: basisPoints(a), descontoBp: basisPoints(d) })),
      REF,
    )
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  /** 100 − 10% = 90; 90 − 10% = 81. Dezenove por cento, e não vinte. */
  it('dois descontos de 10% são 19%', () => {
    const v = serie(10_000, [[0, 1_000], [0, 1_000]])
    expect(v.resultado).toBe(8_100)
    expect(v.variacaoEquivalenteBp).toBe(-1_900)
    expect(v.diferenca).toBe(-1_900)
  })

  /** 100 + 10% = 110; 110 − 10% = 99. */
  it('subir 10% e cair 10% termina 1% abaixo', () => {
    const v = serie(10_000, [[1_000, 0], [0, 1_000]])
    expect(v.resultado).toBe(9_900)
    expect(v.variacaoEquivalenteBp).toBe(-100)
  })

  /** 100 × 1,05³: 105; 110,25; 115,7625 → 115,76. Equivalente: 15,7625% → 15,76%. */
  it('três acréscimos de 5%', () => {
    const v = serie(10_000, [[500, 0], [500, 0], [500, 0]])
    expect(v.resultado).toBe(11_576)
    expect(v.variacaoEquivalenteBp).toBe(1_576)
  })

  /**
   * 99,99 com três descontos de 7,5%, arredondando cada passo: 92,49; 85,55;
   * 79,13. O equivalente exato é 1 − 0,925³ = 20,8546875% → 20,85%.
   */
  it('arredondamento por passo, equivalente pelo produto exato', () => {
    const v = serie(9_999, [[0, 750], [0, 750], [0, 750]])
    expect(v.resultado).toBe(7_913)
    expect(v.variacaoEquivalenteBp).toBe(-2_085)
  })

  it('linhas vazias são ignoradas; entradas inválidas, recusadas', () => {
    expect(serie(20_000, [[0, 5_000], [0, 0], [0, 5_000]]).resultado).toBe(5_000)
    const r = (passos: readonly (readonly [number, number])[]) =>
      calcularPercentuaisEmSerie(10_000, passos.map(([a, d]) => ({ acrescimoBp: basisPoints(a), descontoBp: basisPoints(d) })), REF).ok
    expect(r([[0, 0]])).toBe(false)
    expect(r([[1_000, 1_000]])).toBe(false)
    expect(r([[0, 10_001]])).toBe(false)
  })

  it('a página lê a lista e devolve o valor final', () => {
    const d = porSlug('porcentagem')!
    const r = d.calcular({ operacao: 'serie', valor: 10_000, serie: '0,1000;0,1000' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(8_100)
  })
})
