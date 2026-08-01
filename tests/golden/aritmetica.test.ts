/**
 * Casos-ouro de CALC-070 (porcentagem) e CALC-054 (álcool ou gasolina).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Nenhuma das duas tem parâmetro legal nem norma a citar: é aritmética. Os
 * valores esperados são identidades verificáveis a lápis, e vários casos são
 * escritos como **identidade** em vez de número tabelado — "somar P% e depois
 * tirar P% não devolve ao ponto de partida" é uma afirmação mais forte que
 * comparar com um resultado escrito à mão, porque ela vale para qualquer
 * entrada.
 *
 * `CO-1` continua valendo: nenhum valor veio de outro site.
 */

import { describe, expect, it } from 'vitest'

import {
  calcularCombustivel,
  calcularPorcentagem,
} from '../../src/lib/engine/calculadoras/aritmetica'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-070 — Porcentagem
// ---------------------------------------------------------------------------

/** Atalho: valores chegam em CENTÉSIMOS da unidade. 200 é 20.000. */
const u = (unidades: number) => unidades * 100

const BASE = {
  valor: u(200),
  percentualBp: basisPoints(1_500),
  referencia: u(0),
} as const

describe('CALC-070 · quanto é 15% de 200', () => {
  const r = calcularPorcentagem({ ...BASE, operacao: 'parte' }, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  it('devolve 30, em centésimos e em unidade de número', () => {
    expect(r.valores.resultado).toBe(u(30))
    expect(r.valores.unidade).toBe('numero')
  })

  it('a diferença é o que sobra do valor original', () => {
    expect(r.valores.diferenca).toBe(u(170))
  })

  it('a memória declara a unidade de cada etapa, e nenhuma é moeda', () => {
    for (const e of r.traco.etapas) expect(e.unidade).toBe('numero')
  })
})

describe('CALC-070 · acréscimo e desconto', () => {
  it('200 com 15% de acréscimo é 230', () => {
    const r = calcularPorcentagem({ ...BASE, operacao: 'acrescimo' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.resultado).toBe(u(230))
    expect(r.valores.diferenca).toBe(u(30))
  })

  it('200 com 15% de desconto é 170', () => {
    const r = calcularPorcentagem({ ...BASE, operacao: 'desconto' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.resultado).toBe(u(170))
    expect(r.valores.diferenca).toBe(u(30))
  })

  /**
   * A identidade que a calculadora existe para tornar visível, e o erro de
   * intuição mais comum sobre porcentagem.
   */
  it('subir 10% e depois cair 10% NÃO devolve ao ponto de partida', () => {
    const subiu = calcularPorcentagem(
      { operacao: 'acrescimo', valor: u(100), percentualBp: basisPoints(1_000), referencia: 0 },
      REF,
    )
    if (!subiu.ok) throw new Error('esperado sucesso')
    expect(subiu.valores.resultado).toBe(u(110))

    const caiu = calcularPorcentagem(
      {
        operacao: 'desconto',
        valor: subiu.valores.resultado,
        percentualBp: basisPoints(1_000),
        referencia: 0,
      },
      REF,
    )
    if (!caiu.ok) throw new Error('esperado sucesso')
    expect(caiu.valores.resultado).toBe(u(99))
  })

  it('zero por cento não muda nada, e cem por cento zera', () => {
    const nulo = calcularPorcentagem(
      { operacao: 'desconto', valor: u(200), percentualBp: basisPoints(0), referencia: 0 },
      REF,
    )
    const total = calcularPorcentagem(
      { operacao: 'desconto', valor: u(200), percentualBp: basisPoints(10_000), referencia: 0 },
      REF,
    )
    if (!nulo.ok || !total.ok) throw new Error('esperado sucesso')
    expect(nulo.valores.resultado).toBe(u(200))
    expect(total.valores.resultado).toBe(0)
  })
})

describe('CALC-070 · proporção e variação, que são diferentes', () => {
  it('30 é 15% de 200', () => {
    const r = calcularPorcentagem(
      { operacao: 'proporcao', valor: u(30), percentualBp: basisPoints(0), referencia: u(200) },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.resultado).toBe(1_500)
    expect(r.valores.unidade).toBe('percentual')
    // O que falta para o total.
    expect(r.valores.diferenca).toBe(u(170))
  })

  it('de 200 para 230, a variação é de 15% — a mesma base, outro numerador', () => {
    const r = calcularPorcentagem(
      { operacao: 'variacao', valor: u(230), percentualBp: basisPoints(0), referencia: u(200) },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.resultado).toBe(1_500)
    expect(r.valores.diferenca).toBe(u(30))
  })

  it('a variação é negativa na queda, e medida sobre o valor ANTERIOR', () => {
    // De 200 para 150: caiu 50 sobre 200 = −25%. Sobre o valor novo daria
    // −33,33%, que é o erro que este caso existe para travar.
    const r = calcularPorcentagem(
      { operacao: 'variacao', valor: u(150), percentualBp: basisPoints(0), referencia: u(200) },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.resultado).toBe(-2_500)
  })

  it('dobrar é variação de 100%', () => {
    const r = calcularPorcentagem(
      { operacao: 'variacao', valor: u(400), percentualBp: basisPoints(0), referencia: u(200) },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.resultado).toBe(10_000)
  })

  it('referência zero é recusada nas duas, e com mensagens distintas', () => {
    const prop = calcularPorcentagem(
      { operacao: 'proporcao', valor: u(30), percentualBp: basisPoints(0), referencia: 0 },
      REF,
    )
    const varia = calcularPorcentagem(
      { operacao: 'variacao', valor: u(30), percentualBp: basisPoints(0), referencia: 0 },
      REF,
    )
    expect(prop.ok).toBe(false)
    expect(varia.ok).toBe(false)
    if (prop.ok || varia.ok) throw new Error('esperado erro')
    expect(prop.detalhe).not.toBe(varia.detalhe)
  })
})

// ---------------------------------------------------------------------------
// CALC-054 — Álcool ou gasolina
// ---------------------------------------------------------------------------

/**
 * Carro em que o álcool rende exatamente 70% do que rende a gasolina — a
 * hipótese que a regra de bolso pressupõe. Serve de referência para os casos
 * seguintes, que a rompem de propósito.
 */
const CARRO_DA_REGRA = {
  precoAlcool: centavos(419),
  precoGasolina: centavos(599),
  consumoAlcool: u(7),
  consumoGasolina: u(10),
  distancia: 1_000,
} as const

describe('CALC-054 · no carro que rende 70%, a regra de bolso acerta', () => {
  const r = calcularCombustivel(CARRO_DA_REGRA, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  it('a razão de consumo é exatamente 70%', () => {
    expect(r.valores.razaoConsumoBp).toBe(7_000)
  })

  it('o preço de equilíbrio é 70% do preço da gasolina', () => {
    // R$ 5,99 × 70% = R$ 4,193 → R$ 4,19 arredondado.
    expect(r.valores.precoEquilibrioAlcool).toBe(419)
  })

  it('mil quilômetros consomem 100 litros de gasolina', () => {
    expect(r.valores.custoGasolina).toBe(599 * 100)
  })

  it('a R$ 4,19 o litro, os dois praticamente empatam', () => {
    expect(Math.abs(r.valores.economia)).toBeLessThanOrEqual(100)
  })
})

/**
 * O caso que dá razão de existir à calculadora: mesmo preço, carro diferente,
 * resposta diferente da que a regra dos 70% daria.
 */
describe('CALC-054 · quando o carro foge da média, a regra erra', () => {
  const precos = { precoAlcool: centavos(410), precoGasolina: centavos(599) }
  // R$ 4,10 é 68,4% de R$ 5,99 — pela regra dos 70%, "compensa álcool".

  it('num carro que rende 75%, o álcool de fato compensa', () => {
    const r = calcularCombustivel(
      { ...precos, consumoAlcool: u(7.5), consumoGasolina: u(10), distancia: 1_000 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.maisEconomico).toBe('alcool')
    expect(r.valores.precoEquilibrioAlcool).toBeGreaterThan(410)
  })

  it('num carro que rende 65%, o mesmo preço faz a gasolina compensar', () => {
    const r = calcularCombustivel(
      { ...precos, consumoAlcool: u(6.5), consumoGasolina: u(10), distancia: 1_000 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.maisEconomico).toBe('gasolina')
    expect(r.valores.precoEquilibrioAlcool).toBeLessThan(410)
  })
})

describe('CALC-054 · identidades da conta', () => {
  it('a economia é a diferença absoluta entre os dois custos', () => {
    const r = calcularCombustivel(CARRO_DA_REGRA, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.economia).toBe(Math.abs(r.valores.custoGasolina - r.valores.custoAlcool))
  })

  it('dobrar o percurso dobra os dois custos', () => {
    const mil = calcularCombustivel(CARRO_DA_REGRA, REF)
    const doisMil = calcularCombustivel({ ...CARRO_DA_REGRA, distancia: 2_000 }, REF)
    if (!mil.ok || !doisMil.ok) throw new Error('esperado sucesso')
    expect(doisMil.valores.custoGasolina).toBe(mil.valores.custoGasolina * 2)
  })

  it('o custo a cada 100 km não depende do percurso informado', () => {
    const mil = calcularCombustivel(CARRO_DA_REGRA, REF)
    const cem = calcularCombustivel({ ...CARRO_DA_REGRA, distancia: 100 }, REF)
    if (!mil.ok || !cem.ok) throw new Error('esperado sucesso')
    expect(cem.valores.custoCemKmAlcool).toBe(mil.valores.custoCemKmAlcool)
    expect(cem.valores.custoCemKmAlcool).toBe(cem.valores.custoAlcool)
  })

  it('preços iguais e consumos iguais empatam', () => {
    const r = calcularCombustivel(
      {
        precoAlcool: centavos(500),
        precoGasolina: centavos(500),
        consumoAlcool: u(10),
        consumoGasolina: u(10),
        distancia: 1_000,
      },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.maisEconomico).toBe('empate')
    expect(r.valores.economia).toBe(0)
  })
})

describe('CALC-054 · entradas incompletas mantêm o estado pendente', () => {
  it('preço, consumo ou percurso ausentes não produzem resultado', () => {
    for (const parcial of [
      { precoAlcool: centavos(0) },
      { precoGasolina: centavos(0) },
      { consumoAlcool: 0 },
      { consumoGasolina: 0 },
      { distancia: 0 },
    ]) {
      expect(calcularCombustivel({ ...CARRO_DA_REGRA, ...parcial }, REF).ok).toBe(false)
    }
  })
})

describe('CALC-070 e CALC-054 · C-M1 · não existe cálculo sem memória', () => {
  it('as duas registram etapas com valores substituídos', () => {
    const p = calcularPorcentagem({ ...BASE, operacao: 'parte' }, REF)
    const c = calcularCombustivel(CARRO_DA_REGRA, REF)
    if (!p.ok || !c.ok) throw new Error('esperado sucesso')
    for (const r of [p, c]) {
      expect(r.traco.etapas.length).toBeGreaterThan(1)
      for (const e of r.traco.etapas) expect(e.formula.length).toBeGreaterThan(0)
    }
  })

  it('a memória do combustível cita o preço de equilíbrio, que é a régua', () => {
    const r = calcularCombustivel(CARRO_DA_REGRA, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Preço de equilíbrio do álcool')
    expect(etapa?.justificativa).toContain('regra de bolso')
  })
})
