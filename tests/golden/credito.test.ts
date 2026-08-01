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
  calcularQuitacaoAntecipada,
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

// ---------------------------------------------------------------------------
// CALC-026 — Quitação antecipada
// ---------------------------------------------------------------------------

/**
 * Financiamento montado ao contrário, para que o resultado seja conferível por
 * identidade: R$ 20.000,00 em 24 parcelas a 2% ao mês. A parcela sai da fórmula
 * do sistema francês, e o saldo devedor de hoje tem de devolver o principal.
 */
const PRINCIPAL_ORIGINAL = centavos(2_000_000)
const PARCELA_DO_CONTRATO = parcelaPrice(PRINCIPAL_ORIGINAL, 24, basisPoints(200))

const QUITACAO_BASE = {
  valorParcela: PARCELA_DO_CONTRATO,
  parcelasRestantes: 24,
  taxaMensal: basisPoints(200),
  valorDisponivel: centavos(0),
  modalidade: 'reduzir-prazo',
} as const

describe('CALC-026 · o saldo devedor é o valor presente, não a soma das parcelas', () => {
  const r = calcularQuitacaoAntecipada(QUITACAO_BASE, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  /**
   * A identidade que prova a conta: as 24 parcelas foram geradas a partir de
   * R$ 20.000,00 a 2% ao mês, então trazê-las a valor presente àquela mesma
   * taxa tem de devolver os R$ 20.000,00 — a menos do centavo de arredondamento
   * da prestação.
   */
  it('devolve o principal de onde as parcelas saíram', () => {
    expect(Math.abs(r.valores.saldoPresente - PRINCIPAL_ORIGINAL)).toBeLessThanOrEqual(100)
  })

  it('a soma nua das parcelas é bem maior que o saldo', () => {
    expect(r.valores.somaDasParcelas).toBe(PARCELA_DO_CONTRATO * 24)
    expect(r.valores.somaDasParcelas).toBeGreaterThan(r.valores.saldoPresente)
  })

  it('a economia é a diferença entre as duas leituras', () => {
    expect(r.valores.economia).toBe(r.valores.somaDasParcelas - r.valores.saldoPresente)
    expect(r.valores.quitacaoTotal).toBe(true)
    expect(r.valores.totalFuturo).toBe(0)
  })

  it('a etapa do saldo cita o art. 52 do Código de Defesa do Consumidor', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo.startsWith('Saldo devedor hoje'))
    expect(etapa?.fundamento?.norma).toContain('8.078')
    expect(etapa?.fundamento?.dispositivo).toContain('52')
  })
})

/**
 * Sem juros não há o que reduzir, e a calculadora precisa dizer isso em vez de
 * inventar um desconto.
 */
describe('CALC-026 · a juros zero não existe economia', () => {
  const r = calcularQuitacaoAntecipada({ ...QUITACAO_BASE, taxaMensal: basisPoints(0) }, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  it('o saldo é a própria soma das parcelas', () => {
    expect(r.valores.saldoPresente).toBe(r.valores.somaDasParcelas)
  })

  it('a economia e o desconto são zero', () => {
    expect(r.valores.economia).toBe(0)
    expect(r.valores.descontoBp).toBe(0)
  })
})

describe('CALC-026 · amortização parcial — as duas escolhas', () => {
  const disponivel = centavos(500_000)

  const prazo = calcularQuitacaoAntecipada(
    { ...QUITACAO_BASE, valorDisponivel: disponivel, modalidade: 'reduzir-prazo' },
    REF,
  )
  const parcela = calcularQuitacaoAntecipada(
    { ...QUITACAO_BASE, valorDisponivel: disponivel, modalidade: 'reduzir-parcela' },
    REF,
  )
  if (!prazo.ok || !parcela.ok) throw new Error('esperado sucesso')

  it('reduzir prazo mantém a parcela e corta meses', () => {
    expect(prazo.valores.novaParcela).toBe(PARCELA_DO_CONTRATO)
    expect(prazo.valores.novoPrazo).toBeLessThan(24)
  })

  it('reduzir parcela mantém o prazo e baixa a prestação', () => {
    expect(parcela.valores.novoPrazo).toBe(24)
    expect(parcela.valores.novaParcela).toBeLessThan(PARCELA_DO_CONTRATO)
  })

  /**
   * O conselho que a calculadora dá, verificado em vez de afirmado: cada mês
   * eliminado é um mês inteiro de juros que deixa de existir.
   */
  it('cortar prazo economiza mais que reduzir parcela, com o mesmo dinheiro', () => {
    expect(prazo.valores.economia).toBeGreaterThan(parcela.valores.economia)
  })

  it('nas duas, a economia é o que se deixa de pagar no total', () => {
    for (const r of [prazo, parcela]) {
      expect(r.valores.economia).toBe(
        r.valores.somaDasParcelas - r.valores.valorPagoAgora - r.valores.totalFuturo,
      )
      expect(r.valores.quitacaoTotal).toBe(false)
      expect(r.valores.valorPagoAgora).toBe(disponivel)
    }
  })
})

describe('CALC-026 · fronteiras', () => {
  it('oferecer mais que o saldo é quitação total, não troco', () => {
    const r = calcularQuitacaoAntecipada(
      { ...QUITACAO_BASE, valorDisponivel: centavos(50_000_000) },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.quitacaoTotal).toBe(true)
    expect(r.valores.valorPagoAgora).toBe(r.valores.saldoPresente)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(
      calcularQuitacaoAntecipada({ ...QUITACAO_BASE, valorParcela: centavos(0) }, REF).ok,
    ).toBe(false)
    expect(
      calcularQuitacaoAntecipada({ ...QUITACAO_BASE, parcelasRestantes: 0 }, REF).ok,
    ).toBe(false)
  })

  it('taxa negativa e valor negativo são recusados', () => {
    expect(
      calcularQuitacaoAntecipada({ ...QUITACAO_BASE, taxaMensal: basisPoints(-1) }, REF).ok,
    ).toBe(false)
    expect(
      calcularQuitacaoAntecipada({ ...QUITACAO_BASE, valorDisponivel: centavos(-1) }, REF).ok,
    ).toBe(false)
  })

  it('uma parcela restante já produz alguma economia', () => {
    const r = calcularQuitacaoAntecipada({ ...QUITACAO_BASE, parcelasRestantes: 1 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.economia).toBeGreaterThan(0)
    // Uma parcela descontada por um mês a 2%: o desconto tende a 2/102.
    expect(r.valores.descontoBp).toBeGreaterThan(150)
    expect(r.valores.descontoBp).toBeLessThan(250)
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
