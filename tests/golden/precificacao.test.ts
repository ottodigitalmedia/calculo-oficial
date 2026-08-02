/**
 * Casos-ouro de CALC-049 — precificação de hora.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Sem parâmetro legal e sem preço "certo" a consultar: o que a calculadora faz é
 * uma conta de cobertura sobre premissas do usuário. Os números foram escolhidos
 * para fechar de cabeça:
 *
 *   22 dias × 8 h = 176 h de expediente. A 50%, 88 h faturáveis.
 *   R$ 8.000,00 de renda + R$ 800,00 de custos = R$ 8.800,00 a cobrir.
 *   Com 12% de imposto por dentro: 8.800 ÷ 0,88 = R$ 10.000,00 de faturamento.
 *   R$ 10.000,00 ÷ 88 h = R$ 113,64 por hora.
 *
 * O caso mais importante é o do **imposto por dentro**: acrescentar a alíquota
 * por fora deixaria a conta curta, e é o erro que a calculadora existe para não
 * cometer. O segundo é o da hora faturável — a 100% a conta desta calculadora
 * tem de coincidir com a divisão ingênua, e a qualquer valor abaixo disso, não.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/precificacao'
import {
  calcularPrecificacao,
  type EntradaPrecificacao,
} from '../../src/lib/engine/calculadoras/precificacao'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

const BASE: EntradaPrecificacao = {
  rendaDesejadaMensal: centavos(800_000),
  custosFixosMensais: centavos(80_000),
  diasTrabalhadosNoMes: 22,
  horasPorDia: 800,
  percentualFaturavelBp: basisPoints(5_000),
  aliquotaSobreFaturamentoBp: basisPoints(1_200),
}

function precoOuFalhar(entrada: EntradaPrecificacao) {
  const r = calcularPrecificacao(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-049 · as horas que se pode faturar', () => {
  const v = precoOuFalhar(BASE).valores

  it('22 dias de 8 horas são 176 horas de expediente', () => {
    expect(v.horasNoMes).toBe(17_600)
  })

  it('a metade delas é o que vira hora faturada', () => {
    expect(v.horasFaturaveis).toBe(8_800)
  })
})

/**
 * O erro que a calculadora existe para não cometer.
 */
describe('CALC-049 · o imposto entra por dentro, não por fora', () => {
  const v = precoOuFalhar(BASE).valores

  it('R$ 8.800,00 a cobrir com 12% exigem R$ 10.000,00 de faturamento', () => {
    expect(v.precisaCobrirNoMes).toBe(880_000)
    expect(v.faturamentoNecessario).toBe(1_000_000)
    expect(v.impostos).toBe(120_000)
  })

  /**
   * A conta por fora daria R$ 9.856,00 — e sobre esse valor o imposto de 12%
   * deixaria R$ 8.673,28, abaixo do que precisava sobrar.
   */
  it('acrescentar a alíquota por fora deixaria a conta curta', () => {
    const porFora = 880_000 + Math.round((880_000 * 1_200) / 10_000)
    expect(v.faturamentoNecessario).toBeGreaterThan(porFora)
  })

  it('a identidade fecha: faturamento menos imposto é o que precisa sobrar', () => {
    expect(v.faturamentoNecessario - v.impostos).toBe(v.precisaCobrirNoMes)
  })

  it('sem imposto informado, o faturamento é o próprio valor a cobrir', () => {
    const semImposto = precoOuFalhar({
      ...BASE,
      aliquotaSobreFaturamentoBp: basisPoints(0),
    }).valores
    expect(semImposto.faturamentoNecessario).toBe(semImposto.precisaCobrirNoMes)
    expect(semImposto.impostos).toBe(0)
  })
})

describe('CALC-049 · o preço da hora', () => {
  const v = precoOuFalhar(BASE).valores

  it('R$ 10.000,00 divididos por 88 horas dão R$ 113,64', () => {
    expect(v.valorHora).toBe(11_364)
  })

  it('o valor do dia é a hora vezes o expediente', () => {
    // R$ 113,64 × 8 h = R$ 909,12
    expect(v.valorDia).toBe(90_912)
  })

  it('doze meses de faturamento necessário', () => {
    expect(v.faturamentoAnual).toBe(1_000_000 * 12)
  })
})

/**
 * A comparação que dá sentido à página: a divisão ingênua e a real.
 */
describe('CALC-049 · a distância para a divisão ingênua', () => {
  const v = precoOuFalhar(BASE).valores

  it('a ingênua ignora custo, imposto e hora não faturável', () => {
    // R$ 8.000,00 ÷ 176 h = R$ 45,45
    expect(v.valorHoraIngenuo).toBe(4_545)
  })

  it('e por isso fica muito abaixo do preço que fecha a conta', () => {
    expect(v.valorHoraIngenuo).toBeLessThan(v.valorHora)
  })

  /**
   * Com 100% de horas faturáveis, sem custo e sem imposto, as duas contas
   * descrevem a mesma coisa — e precisam coincidir. É a prova de que a
   * diferença acima vem das premissas, e não de um erro na fórmula.
   */
  it('sem custo, sem imposto e faturando tudo, as duas coincidem', () => {
    const v2 = precoOuFalhar({
      ...BASE,
      custosFixosMensais: centavos(0),
      aliquotaSobreFaturamentoBp: basisPoints(0),
      percentualFaturavelBp: basisPoints(10_000),
    }).valores
    expect(v2.valorHora).toBe(v2.valorHoraIngenuo)
  })

  it('menos horas faturáveis, preço maior', () => {
    const menos = precoOuFalhar({ ...BASE, percentualFaturavelBp: basisPoints(2_500) }).valores
    expect(menos.valorHora).toBeGreaterThan(v.valorHora)
  })
})

describe('CALC-049 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularPrecificacao({ ...BASE, rendaDesejadaMensal: centavos(0) }, REF).ok).toBe(false)
    expect(calcularPrecificacao({ ...BASE, diasTrabalhadosNoMes: 0 }, REF).ok).toBe(false)
    expect(calcularPrecificacao({ ...BASE, horasPorDia: 0 }, REF).ok).toBe(false)
    expect(calcularPrecificacao({ ...BASE, percentualFaturavelBp: basisPoints(0) }, REF).ok).toBe(false)
  })

  it('faturar mais que o expediente inteiro é recusado', () => {
    expect(
      calcularPrecificacao({ ...BASE, percentualFaturavelBp: basisPoints(10_001) }, REF).ok,
    ).toBe(false)
  })

  /** A 100% de alíquota não sobraria nada, e a divisão seria por zero. */
  it('alíquota de 100% ou mais é recusada', () => {
    expect(
      calcularPrecificacao({ ...BASE, aliquotaSobreFaturamentoBp: basisPoints(10_000) }, REF).ok,
    ).toBe(false)
    expect(
      calcularPrecificacao({ ...BASE, aliquotaSobreFaturamentoBp: basisPoints(-1) }, REF).ok,
    ).toBe(false)
  })

  it('a memória compara as duas contas, em vez de só entregar o número', () => {
    const rotulos = precoOuFalhar(BASE).traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Dessas, as que viram hora faturada')
    expect(rotulos).toContain('Preço da hora que fecha a conta')
    expect(rotulos).toContain('O que a divisão ingênua daria')
  })
})

describe('CALC-049 · a coluna do resultado fecha', () => {
  it('renda mais custos mais imposto é o faturamento necessário', () => {
    const r = calcular(
      {
        rendaDesejada: 800_000,
        custosFixos: 80_000,
        diasNoMes: 22,
        horasPorDia: 800,
        percentualFaturavel: 5_000,
        aliquota: 1_200,
      },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const linhas = r.valores.detalhamento
    const soma = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(soma).toBe(linhas[linhas.length - 1]?.valor)
    expect(r.valores.principal).toBe(11_364)
  })

  it('sem custo e sem imposto, sobram duas linhas e a soma continua fechando', () => {
    const r = calcular(
      {
        rendaDesejada: 800_000,
        diasNoMes: 22,
        horasPorDia: 800,
        percentualFaturavel: 5_000,
      },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.detalhamento).toHaveLength(2)
    expect(r.valores.detalhamento[0]?.valor).toBe(r.valores.detalhamento[1]?.valor)
  })
})
