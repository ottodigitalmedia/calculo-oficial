/**
 * CASOS-OURO — CALC-022 Juros compostos.
 *
 * fonte_verificacao: cálculo manual, independente do motor, simulando mês a
 * mês em centavos com a mesma política de arredondamento. Não há norma a
 * conferir — é matemática, e o critério de verdade é a aritmética, não a
 * publicação oficial.
 */

import { describe, expect, it } from 'vitest'

import { calcularJurosCompostos } from '../../src/lib/engine/calculadoras/juros-compostos'
import { basisPoints, centavos } from '../../src/lib/engine/types'

const EM_2026 = '2026-01-01'

function calcular(
  valorInicial: number,
  aporteMensal: number,
  taxaBp: number,
  taxaAoAno: boolean,
  meses: number,
) {
  const r = calcularJurosCompostos(
    {
      valorInicial: centavos(valorInicial),
      aporteMensal: centavos(aporteMensal),
      taxa: basisPoints(taxaBp),
      taxaAoAno,
      meses,
    },
    EM_2026,
  )
  if (!r.ok) throw new Error(r.detalhe)
  return r
}

describe('capitalização mensal em centavos', () => {
  /**
   * R$ 1.000,00 a 1% ao mês por 12 meses, arredondando a cada mês.
   * Simulado à mão: montante R$ 1.126,84 · juros R$ 126,84.
   *
   * Note que a fórmula fechada 1000 × 1,01^12 = 1.126,825… daria R$ 1.126,83.
   * A diferença de um centavo é o arredondamento mensal — que é como uma conta
   * real se comporta, e por isso é o comportamento adotado.
   */
  it('R$ 1.000,00 a 1% ao mês por 12 meses', () => {
    const r = calcular(100_000, 0, 100, false, 12)
    expect(r.valores.montante).toBe(112_684)
    expect(r.valores.totalInvestido).toBe(100_000)
    expect(r.valores.totalJuros).toBe(12_684)
  })

  it('só aportes, sem valor inicial', () => {
    // R$ 100,00 por mês a 1% ao mês, 12 meses.
    const r = calcular(0, 10_000, 100, false, 12)
    expect(r.valores.montante).toBe(126_825)
    expect(r.valores.totalInvestido).toBe(120_000)
    expect(r.valores.totalJuros).toBe(6_825)
  })

  it('o aporte do mês não rende no próprio mês', () => {
    // Um único mês, sem valor inicial: o aporte entra depois da capitalização,
    // então não há juros nenhum.
    const r = calcular(0, 10_000, 100, false, 1)
    expect(r.valores.totalJuros).toBe(0)
    expect(r.valores.montante).toBe(10_000)
  })
})

describe('taxa anual convertida em mensal equivalente', () => {
  /**
   * 12% ao ano NÃO é 1% ao mês. A taxa mensal equivalente é a raiz décima
   * segunda de 1,12 menos um — cerca de 0,9489% —, e doze meses dela devolvem
   * o ano inteiro.
   */
  it('12% ao ano por 12 meses recompõe o ano', () => {
    const r = calcular(1_000_000, 0, 1_200, true, 12)
    // R$ 10.000,00 → R$ 11.200,01. O centavo a mais é o arredondamento mensal.
    expect(r.valores.montante).toBe(1_120_001)
    expect(r.valores.taxaMensalBp).toBe(95)
  })

  it('dividir a taxa anual por doze daria resultado diferente', () => {
    const equivalente = calcular(1_000_000, 0, 1_200, true, 12)
    const dividida = calcular(1_000_000, 0, 100, false, 12)
    // 12/12 = 1% ao mês capitaliza para 12,68% ao ano, não 12%.
    expect(dividida.valores.montante).toBeGreaterThan(equivalente.valores.montante)
  })

  it('a taxa mensal aplicada é exibida para conferência', () => {
    const r = calcular(1_000_000, 0, 1_200, true, 12)
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Taxa mensal equivalente')
    expect(etapa?.formula).toContain('ao ano')
    expect(etapa?.formula).toContain('ao mês')
  })
})

describe('evolução ano a ano', () => {
  it('uma linha por ano completo, mais o mês final', () => {
    const r = calcular(100_000, 10_000, 100, false, 30)
    // 30 meses: fecha ano 1 (mês 12), ano 2 (mês 24) e o parcial no mês 30.
    expect(r.valores.evolucao).toHaveLength(3)
    expect(r.valores.evolucao[0]?.ano).toBe(1)
    expect(r.valores.evolucao[2]?.saldo).toBe(r.valores.montante)
  })

  it('o saldo cresce e os juros ultrapassam o investido no longo prazo', () => {
    const r = calcular(0, 100_000, 100, false, 360)
    const ultima = r.valores.evolucao[r.valores.evolucao.length - 1]
    expect(ultima?.juros).toBeGreaterThan(ultima?.investido ?? 0)
  })
})

describe('C-M3 · erros de domínio', () => {
  it('taxa zero devolve entrada_incompleta', () => {
    const r = calcularJurosCompostos(
      { valorInicial: centavos(100_000), aporteMensal: centavos(0), taxa: basisPoints(0), taxaAoAno: false, meses: 12 },
      EM_2026,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('prazo zero devolve entrada_incompleta', () => {
    const r = calcularJurosCompostos(
      { valorInicial: centavos(100_000), aporteMensal: centavos(0), taxa: basisPoints(100), taxaAoAno: false, meses: 0 },
      EM_2026,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('valores negativos são recusados', () => {
    const r = calcularJurosCompostos(
      { valorInicial: centavos(-1), aporteMensal: centavos(0), taxa: basisPoints(100), taxaAoAno: false, meses: 12 },
      EM_2026,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})

describe('C-M1 · o traço permite acompanhar a capitalização', () => {
  it('mostra os primeiros meses e o último, sem despejar todos', () => {
    const r = calcular(100_000, 10_000, 100, false, 120)
    const meses = r.traco.etapas.filter((e) => e.rotulo.startsWith('Mês '))
    // Três primeiros mais o último: a memória explica o mecanismo sem virar
    // um extrato de 120 linhas, que ninguém confere.
    expect(meses).toHaveLength(4)
    expect(meses[meses.length - 1]?.rotulo).toBe('Mês 120')
  })
})
