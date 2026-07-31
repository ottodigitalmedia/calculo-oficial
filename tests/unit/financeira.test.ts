/**
 * Matemática financeira — `src/lib/engine/financeira.ts`.
 *
 * **Por que estes testes vêm antes das calculadoras que usam o módulo.** Aqui
 * não há norma para conferir: são identidades matemáticas, e identidade errada
 * produz número plausível em toda calculadora de crédito do catálogo. O jeito
 * de verificar é fechar o círculo — descontar o que foi capitalizado e exigir
 * o valor de partida de volta.
 */

import { describe, expect, it } from 'vitest'

import {
  anualizar,
  jurosDoPeriodo,
  parcelaPrice,
  taxaInternaMensal,
  valorPresenteDeSerie,
} from '../../src/lib/engine/financeira'
import { basisPoints, centavos } from '../../src/lib/engine/types'

describe('parcelaPrice — prestação constante do sistema francês', () => {
  it('R$ 1.000,00 em 12 meses a 1% ao mês', () => {
    // 1.000 × 0,01 × 1,01^12 / (1,01^12 − 1) = R$ 88,85
    expect(parcelaPrice(centavos(100_000), 12, basisPoints(100))).toBe(8_885)
  })

  it('taxa zero divide o principal em partes iguais', () => {
    expect(parcelaPrice(centavos(120_000), 12, basisPoints(0))).toBe(10_000)
  })

  it('uma parcela única a juros zero é o próprio principal', () => {
    expect(parcelaPrice(centavos(50_000), 1, basisPoints(0))).toBe(50_000)
  })

  it('uma parcela única com juros é principal mais juros', () => {
    expect(parcelaPrice(centavos(100_000), 1, basisPoints(200))).toBe(102_000)
  })

  it('prazo inválido devolve zero em vez de dividir por zero', () => {
    expect(parcelaPrice(centavos(100_000), 0, basisPoints(100))).toBe(0)
  })
})

/**
 * O teste que fecha o círculo: descontar a prestação calculada tem de devolver
 * o principal de onde ela saiu.
 */
describe('valorPresenteDeSerie — o inverso de parcelaPrice', () => {
  it('descontar a prestação de volta reproduz o principal', () => {
    const principal = centavos(100_000)
    const parcela = parcelaPrice(principal, 12, basisPoints(100))
    const presente = valorPresenteDeSerie(parcela, 12, basisPoints(100))
    // Um centavo de folga: a prestação foi arredondada ao centavo.
    expect(Math.abs(presente - principal)).toBeLessThanOrEqual(100)
  })

  it('fecha o círculo também em prazo longo', () => {
    const principal = centavos(30_000_000)
    const parcela = parcelaPrice(principal, 360, basisPoints(80))
    const presente = valorPresenteDeSerie(parcela, 360, basisPoints(80))
    expect(Math.abs(presente - principal)).toBeLessThanOrEqual(10_000)
  })

  it('a juros zero, o valor presente é a soma nua', () => {
    expect(valorPresenteDeSerie(centavos(10_000), 12, basisPoints(0))).toBe(120_000)
  })

  it('quanto maior a taxa, menor o valor presente', () => {
    const baixa = valorPresenteDeSerie(centavos(10_000), 24, basisPoints(50))
    const alta = valorPresenteDeSerie(centavos(10_000), 24, basisPoints(300))
    expect(alta).toBeLessThan(baixa)
  })

  it('prazo zero não tem valor presente', () => {
    expect(valorPresenteDeSerie(centavos(10_000), 0, basisPoints(100))).toBe(0)
  })
})

describe('taxaInternaMensal — a taxa que zera o fluxo', () => {
  it('recupera a taxa de onde a prestação saiu', () => {
    const principal = centavos(100_000)
    const parcela = parcelaPrice(principal, 12, basisPoints(100))
    expect(taxaInternaMensal(principal, parcela, 12)).toBe(100)
  })

  it('recupera taxas maiores', () => {
    const principal = centavos(500_000)
    const parcela = parcelaPrice(principal, 24, basisPoints(350))
    const achada = taxaInternaMensal(principal, parcela, 24)
    expect(achada).not.toBeNull()
    expect(Math.abs((achada as number) - 350)).toBeLessThanOrEqual(1)
  })

  /**
   * O caso que dá sentido ao CET: tarifas cobradas na liberação encarecem o
   * crédito sem aparecer na taxa nominal.
   */
  it('a tarifa cobrada na liberação eleva a taxa efetiva', () => {
    const contratado = centavos(100_000)
    const parcela = parcelaPrice(contratado, 12, basisPoints(100))
    // O tomador recebeu R$ 950,00 e paga as parcelas de R$ 1.000,00.
    const semTarifa = taxaInternaMensal(contratado, parcela, 12)
    const comTarifa = taxaInternaMensal(centavos(95_000), parcela, 12)

    expect(comTarifa).not.toBeNull()
    expect(comTarifa as number).toBeGreaterThan(semTarifa as number)
  })

  it('devolve nulo quando as parcelas não superam o liberado', () => {
    expect(taxaInternaMensal(centavos(100_000), centavos(5_000), 12)).toBeNull()
  })

  it('devolve nulo para entrada degenerada, em vez de número inventado', () => {
    expect(taxaInternaMensal(centavos(0), centavos(1_000), 12)).toBeNull()
    expect(taxaInternaMensal(centavos(100_000), centavos(0), 12)).toBeNull()
    expect(taxaInternaMensal(centavos(100_000), centavos(10_000), 0)).toBeNull()
  })
})

describe('anualizar', () => {
  it('1% ao mês equivale a 12,68% ao ano', () => {
    // 1,01^12 − 1 = 0,126825
    expect(anualizar(basisPoints(100))).toBe(1_268)
  })

  it('taxa zero permanece zero', () => {
    expect(anualizar(basisPoints(0))).toBe(0)
  })

  it('2% ao mês passa de 26% ao ano', () => {
    expect(anualizar(basisPoints(200))).toBeGreaterThan(2_600)
  })
})

describe('jurosDoPeriodo', () => {
  it('aplica a taxa sobre o saldo', () => {
    expect(jurosDoPeriodo(centavos(100_000), basisPoints(150))).toBe(1_500)
  })

  it('arredonda ao centavo mais próximo', () => {
    // R$ 333,33 × 1% = R$ 3,3333 → R$ 3,33
    expect(jurosDoPeriodo(centavos(33_333), basisPoints(100))).toBe(333)
  })

  it('saldo zero não gera juros', () => {
    expect(jurosDoPeriodo(centavos(0), basisPoints(500))).toBe(0)
  })
})
