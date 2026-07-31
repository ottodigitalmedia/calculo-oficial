/**
 * Casos-ouro de CALC-024 (CET) e CALC-025 (SAC vs. Price).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Estas duas não têm parâmetro legal: o que entra é digitado. O que há de
 * norma é a **definição** do CET, na Resolução CMN nº 4.881/2020 — método, não
 * valor. Os números esperados são identidades matemáticas, verificadas por
 * construção: monta-se o fluxo a partir de uma taxa conhecida e exige-se que o
 * cálculo devolva aquela taxa.
 *
 * É uma conferência mais forte que comparar com um resultado tabelado, porque
 * não depende de nenhuma fonte externa estar certa.
 */

import { describe, expect, it } from 'vitest'

import {
  calcularAmortizacao,
  calcularCet,
} from '../../src/lib/engine/calculadoras/credito'
import { parcelaPrice } from '../../src/lib/engine/financeira'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-024 — CET
// ---------------------------------------------------------------------------

describe('CALC-024 · sem tarifa, o CET é a própria taxa do contrato', () => {
  const principal = centavos(1_000_000)
  const parcela = parcelaPrice(principal, 12, basisPoints(200))

  const r = calcularCet(
    {
      valorLiberado: principal,
      valorParcela: parcela,
      prazoMeses: 12,
      despesasNaLiberacao: centavos(0),
    },
    REF,
  )
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  it('devolve a taxa de onde a parcela saiu', () => {
    expect(r.valores.cetMensal).toBe(200)
  })

  it('anualiza pela capitalização composta', () => {
    // 1,02^12 − 1 = 26,82%
    expect(r.valores.cetAnual).toBe(2_682)
  })

  it('o custo total é o que se paga a mais do que se recebeu', () => {
    expect(r.valores.custoTotal).toBe(r.valores.totalPago - r.valores.recebidoDeFato)
  })
})

/**
 * O caso que dá sentido à calculadora: a tarifa não aparece na taxa anunciada,
 * mas encarece o crédito.
 */
describe('CALC-024 · a tarifa na liberação eleva o CET sem mudar a parcela', () => {
  const principal = centavos(1_000_000)
  const parcela = parcelaPrice(principal, 12, basisPoints(200))

  const semTarifa = calcularCet(
    { valorLiberado: principal, valorParcela: parcela, prazoMeses: 12, despesasNaLiberacao: centavos(0) },
    REF,
  )
  const comTarifa = calcularCet(
    {
      valorLiberado: principal,
      valorParcela: parcela,
      prazoMeses: 12,
      despesasNaLiberacao: centavos(50_000),
    },
    REF,
  )
  if (!semTarifa.ok || !comTarifa.ok) throw new Error('esperado sucesso')

  it('deduz a tarifa do valor recebido — Resolução CMN 4.881, art. 4º, I', () => {
    expect(comTarifa.valores.recebidoDeFato).toBe(950_000)
  })

  it('o CET sobe, com a mesma parcela e o mesmo prazo', () => {
    expect(comTarifa.valores.cetMensal).toBeGreaterThan(semTarifa.valores.cetMensal)
  })

  it('a etapa da dedução cita a norma do Banco Central', () => {
    const etapa = comTarifa.traco.etapas.find((e) => e.rotulo === 'Valor que de fato entrou')
    expect(etapa?.fundamento?.norma).toContain('4.881')
  })

  it('o custo total cresce exatamente o valor da tarifa', () => {
    expect(comTarifa.valores.custoTotal).toBe(semTarifa.valores.custoTotal + 50_000)
  })
})

describe('CALC-024 · entradas que não produzem CET', () => {
  it('parcelas que não superam o recebido são recusadas, não zeradas', () => {
    const r = calcularCet(
      {
        valorLiberado: centavos(1_000_000),
        valorParcela: centavos(50_000),
        prazoMeses: 12,
        despesasNaLiberacao: centavos(0),
      },
      REF,
    )
    expect(r.ok).toBe(false)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    for (const entrada of [
      { valorLiberado: centavos(0), valorParcela: centavos(1_000), prazoMeses: 12 },
      { valorLiberado: centavos(1_000), valorParcela: centavos(0), prazoMeses: 12 },
      { valorLiberado: centavos(1_000), valorParcela: centavos(100), prazoMeses: 0 },
    ]) {
      expect(calcularCet({ ...entrada, despesasNaLiberacao: centavos(0) }, REF).ok).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// CALC-025 — SAC vs. Price
// ---------------------------------------------------------------------------

const AMORT_BASE = {
  principal: centavos(12_000_000),
  prazoMeses: 120,
  taxaMensal: basisPoints(100),
}

describe('CALC-025 · as duas fórmulas clássicas', () => {
  const r = calcularAmortizacao(AMORT_BASE, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  it('a prestação do Price é constante e fecha com a fórmula', () => {
    expect(r.valores.parcelaPriceConstante).toBe(
      parcelaPrice(AMORT_BASE.principal, 120, basisPoints(100)),
    )
  })

  it('a primeira parcela do SAC é amortização mais juros do saldo cheio', () => {
    // 120.000 ÷ 120 = R$ 1.000,00 de amortização; juros = 120.000 × 1% = 1.200
    expect(r.valores.primeiraParcelaSac).toBe(100_000 + 120_000)
  })

  it('a última parcela do SAC é a menor de todas', () => {
    expect(r.valores.ultimaParcelaSac).toBeLessThan(r.valores.primeiraParcelaSac)
  })

  it('a primeira parcela do SAC é maior que a do Price', () => {
    expect(r.valores.primeiraParcelaSac).toBeGreaterThan(r.valores.parcelaPriceConstante)
  })
})

/**
 * A identidade que prova que a amortização está certa: ao fim do prazo, os dois
 * sistemas devolveram exatamente o principal — o que sobra é juro.
 */
describe('CALC-025 · os dois sistemas quitam o mesmo principal', () => {
  const r = calcularAmortizacao(AMORT_BASE, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  it('total pago menos juros é o principal, no SAC', () => {
    expect(r.valores.totalSac - r.valores.jurosSac).toBe(AMORT_BASE.principal)
  })

  it('total pago menos juros é o principal, no Price', () => {
    expect(Math.abs(r.valores.totalPrice - r.valores.jurosPrice - AMORT_BASE.principal)).toBeLessThanOrEqual(100)
  })

  it('o saldo devedor zera nos dois ao fim do prazo', () => {
    const ultima = r.valores.evolucao[r.valores.evolucao.length - 1]
    expect(ultima?.saldoSac).toBe(0)
    expect(ultima?.saldoPrice).toBe(0)
  })

  it('o SAC custa menos no total — é a razão de a comparação existir', () => {
    expect(r.valores.totalSac).toBeLessThan(r.valores.totalPrice)
    expect(r.valores.economiaDoSac).toBe(r.valores.totalPrice - r.valores.totalSac)
  })
})

describe('CALC-025 · a juros zero os dois sistemas coincidem', () => {
  const r = calcularAmortizacao({ ...AMORT_BASE, taxaMensal: basisPoints(0) }, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  it('as parcelas são iguais e somam o principal', () => {
    expect(r.valores.primeiraParcelaSac).toBe(r.valores.parcelaPriceConstante)
    expect(r.valores.totalSac).toBe(AMORT_BASE.principal)
  })

  it('não há juro nenhum, e portanto não há economia', () => {
    expect(r.valores.jurosSac).toBe(0)
    expect(r.valores.economiaDoSac).toBe(0)
  })
})

describe('CALC-025 · a evolução é resumida por ano', () => {
  it('dez anos produzem dez linhas', () => {
    const r = calcularAmortizacao(AMORT_BASE, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.evolucao).toHaveLength(10)
  })

  it('prazo que não fecha o ano ainda registra a última linha', () => {
    const r = calcularAmortizacao({ ...AMORT_BASE, prazoMeses: 18 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.evolucao).toHaveLength(2)
    expect(r.valores.evolucao[1]?.saldoSac).toBe(0)
  })

  it('o saldo cai mais rápido no SAC do que no Price', () => {
    const r = calcularAmortizacao(AMORT_BASE, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const primeiroAno = r.valores.evolucao[0]
    expect(primeiroAno?.saldoSac).toBeLessThan(primeiroAno?.saldoPrice ?? 0)
  })
})

describe('CALC-025 · entradas inválidas', () => {
  it('principal ou prazo ausentes mantêm o estado pendente', () => {
    expect(calcularAmortizacao({ ...AMORT_BASE, principal: centavos(0) }, REF).ok).toBe(false)
    expect(calcularAmortizacao({ ...AMORT_BASE, prazoMeses: 0 }, REF).ok).toBe(false)
  })

  it('taxa negativa é recusada', () => {
    expect(calcularAmortizacao({ ...AMORT_BASE, taxaMensal: basisPoints(-1) }, REF).ok).toBe(false)
  })
})

describe('CALC-024 e CALC-025 · C-M1 · não existe cálculo sem memória', () => {
  it('o CET registra as etapas com valores substituídos', () => {
    const parcela = parcelaPrice(centavos(1_000_000), 12, basisPoints(200))
    const r = calcularCet(
      { valorLiberado: centavos(1_000_000), valorParcela: parcela, prazoMeses: 12, despesasNaLiberacao: centavos(0) },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.traco.etapas.length).toBeGreaterThan(3)
    for (const e of r.traco.etapas) expect(e.formula.length).toBeGreaterThan(0)
  })

  it('a amortização registra as duas fórmulas e a diferença', () => {
    const r = calcularAmortizacao(AMORT_BASE, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Price — prestação constante')
    expect(rotulos).toContain('SAC — amortização constante')
    expect(rotulos).toContain('Diferença entre os dois sistemas')
  })
})
