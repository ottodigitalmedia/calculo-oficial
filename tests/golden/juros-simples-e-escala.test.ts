/**
 * CALC-119 — juros simples · CALC-120 — escala 12 × 36.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`:
 *
 * - **Juros simples:** aritmética — `J = C × i × n` com conversão proporcional
 *   no calendário comercial (mês de 30 dias, ano de 360) —, conferida a lápis e
 *   por um cálculo em frações exatas feito à parte, fora do motor. A comparação
 *   com o composto simula mês a mês em centavos, com a mesma política de
 *   arredondamento de CALC-022. Não há norma: o critério de verdade é a conta.
 * - **Escala 12 × 36:** CLT, art. 59-A (doze horas de trabalho por trinta e seis
 *   de descanso), texto conferido no Planalto em 18/09/2026; os feriados
 *   nacionais da Lei nº 662/1949 e da Lei nº 14.759/2023, com as vigências de
 *   `params/data/feriados.ts`; e o calendário gregoriano — os dias da semana
 *   foram conferidos numa biblioteca de datas independente do motor.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularEscala12x36 } from '../../src/lib/engine/calculadoras/escala-12x36'
import { calcularJurosSimples, type EntradaJurosSimples } from '../../src/lib/engine/calculadoras/juros-simples'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { FERIADOS } from '../../src/lib/params/data/feriados'
import { JORNADA } from '../../src/lib/params/data/jornada'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'
import { porSlug } from '../../src/lib/calculadoras'

const REF = '2026-06-15' as DataISO

describe('CALC-119 · juros simples', () => {
  const juros = (capital: number, taxaBp: number, periodoDaTaxa: EntradaJurosSimples['periodoDaTaxa'], prazo: number, unidadeDoPrazo: EntradaJurosSimples['unidadeDoPrazo']) => {
    const r = calcularJurosSimples({ capital: centavos(capital), taxa: basisPoints(taxaBp), periodoDaTaxa, prazo, unidadeDoPrazo }, REF)
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  /** R$ 1.000,00 × 2% × 12 = R$ 240,00 — R$ 20,00 por mês, sempre sobre o capital. */
  it('2% ao mês por 12 meses', () => {
    const v = juros(100_000, 200, 'mes', 12, 'meses')
    expect(v.juros).toBe(24_000)
    expect(v.montante).toBe(124_000)
    expect(v.taxaNoPrazoBp).toBe(2_400)
  })

  /** 45 dias ÷ 30 = 1,5 mês; 2% × 1,5 = 3% de R$ 1.000,00. */
  it('prazo em dias com taxa ao mês: calendário comercial', () => {
    const v = juros(100_000, 200, 'mes', 45, 'dias')
    expect(v.juros).toBe(3_000)
    expect(v.composto).toBeNull()
  })

  /** 0,1% ao dia por 30 dias sobre R$ 50.000,00 = 3% = R$ 1.500,00. */
  it('taxa ao dia', () => {
    const v = juros(5_000_000, 10, 'dia', 30, 'dias')
    expect(v.juros).toBe(150_000)
    expect(v.composto).toBeNull()
  })

  /** R$ 333,33 × 1% × 15/30 = R$ 1,666650 → meio para cima, R$ 1,67. */
  it('um único arredondamento, meio para cima', () => {
    expect(juros(33_333, 100, 'mes', 15, 'dias').juros).toBe(167)
    // R$ 0,50 × 1% = meio centavo exato: sobe.
    expect(juros(50, 100, 'mes', 1, 'meses').juros).toBe(1)
  })

  /** R$ 100 milhões a 10% ao dia por 36.000 dias: o produto passa de 2^53, e a conta continua exata. */
  it('produto acima do inteiro seguro, sem perda', () => {
    expect(juros(10_000_000_000, 1_000, 'dia', 36_000, 'dias').juros).toBe(36_000_000_000_000)
  })

  describe('a comparação com o composto', () => {
    /** 1.000 × 1,02^12, mês a mês em centavos = R$ 1.268,23. O composto passa à frente. */
    it('acima de um período da taxa, o composto dá mais', () => {
      const v = juros(100_000, 200, 'mes', 12, 'meses')
      expect(v.composto?.montante).toBe(126_823)
    })

    /** 12% ao ano por 6 meses: simples 6%; composto √1,12 − 1 ≈ 5,83%. */
    it('abaixo de um período da taxa, o simples dá mais', () => {
      const v = juros(100_000, 1_200, 'ano', 6, 'meses')
      expect(v.juros).toBe(6_000)
      expect(v.composto?.montante).toBe(105_830)
      expect(v.montante).toBeGreaterThan(v.composto!.montante)
    })

    /** 24% ao ano por um ano: os dois dão R$ 1.240,00. */
    it('em exatamente um período, empatam', () => {
      const v = juros(100_000, 2_400, 'ano', 1, 'anos')
      expect(v.montante).toBe(124_000)
      expect(v.composto?.montante).toBe(124_000)
    })
  })

  it('entradas recusadas', () => {
    const base: EntradaJurosSimples = { capital: centavos(100_000), taxa: basisPoints(200), periodoDaTaxa: 'mes', prazo: 12, unidadeDoPrazo: 'meses' }
    expect(calcularJurosSimples({ ...base, capital: centavos(0) }, REF).ok).toBe(false)
    expect(calcularJurosSimples({ ...base, taxa: basisPoints(0) }, REF).ok).toBe(false)
    expect(calcularJurosSimples({ ...base, prazo: 0 }, REF).ok).toBe(false)
    expect(calcularJurosSimples({ ...base, prazo: 101, unidadeDoPrazo: 'anos' }, REF).ok).toBe(false)
  })

  it('a página devolve o montante', () => {
    const r = porSlug('juros-simples')!.calcular({ capital: 100_000, taxa: 200, periodoTaxa: 'mes', prazo: 12, periodoPrazo: 'meses' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(124_000)
  })
})

describe('CALC-120 · escala 12 × 36', () => {
  const registro = construirRegistro(JORNADA, FERIADOS)
  const escala = (plantao: string, inicio: string, fim: string) => {
    const r = calcularEscala12x36({ plantao: plantao as DataISO, inicio: inicio as DataISO, fim: fim as DataISO }, inicio as DataISO, registro)
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  /** Junho de 2026 a partir de 1º/06 (segunda): dias ímpares, 15 plantões, 180 horas; domingos 7 e 21. */
  it('um mês de trinta dias', () => {
    const v = escala('2026-06-01', '2026-06-01', '2026-06-30')
    expect(v.plantoes).toHaveLength(15)
    expect(v.minutosTrabalhados).toBe(15 * 720)
    expect(v.emDomingo).toBe(2)
    expect(v.emFeriado).toHaveLength(0)
    expect(v.diasDoCiclo).toBe(2)
    expect(v.mediaSemanalMinutos).toBe(42 * 60)
  })

  /** Dezembro de 2026 a partir de 1º/12: 16 plantões, e o Natal (25, ímpar) cai em plantão. */
  it('um mês de trinta e um dias, com o Natal', () => {
    const v = escala('2026-12-01', '2026-12-01', '2026-12-31')
    expect(v.plantoes).toHaveLength(16)
    expect(v.emFeriado.map((f) => f.data)).toEqual(['2026-12-25'])
  })

  /** Novembro de 2026, dias pares: Finados (2) e Consciência Negra (20); a República (15) fica de fora. */
  it('feriados só nos dias de plantão', () => {
    const v = escala('2026-11-02', '2026-11-01', '2026-11-30')
    expect(v.plantoes).toHaveLength(15)
    expect(v.emFeriado.map((f) => f.data)).toEqual(['2026-11-02', '2026-11-20'])
  })

  /** Em novembro de 2023 o dia 20 ainda não era feriado nacional — a Lei nº 14.759 é de 22/12/2023. */
  it('o feriado é resolvido na data de cada plantão', () => {
    const v = escala('2023-11-02', '2023-11-01', '2023-11-30')
    expect(v.emFeriado.map((f) => f.data)).toEqual(['2023-11-02'])
  })

  it('fevereiro: catorze plantões, e quinze no bissexto começando no dia 1º', () => {
    expect(escala('2026-02-01', '2026-02-01', '2026-02-28').plantoes).toHaveLength(14)
    expect(escala('2028-02-01', '2028-02-01', '2028-02-29').plantoes).toHaveLength(15)
  })

  /** 15/07/2026 é plantão; 44 dias antes, 1º/06, também é. */
  it('o dia de plantão informado pode estar depois do período', () => {
    const v = escala('2026-07-15', '2026-06-01', '2026-06-30')
    expect(v.plantoes[0]).toBe('2026-06-01')
    expect(v.plantoes).toHaveLength(15)
  })

  /** 2026 inteiro a partir de 1º/01: 183 plantões, e seis feriados nacionais caem neles. */
  it('um ano inteiro', () => {
    const v = escala('2026-01-01', '2026-01-01', '2026-12-31')
    expect(v.plantoes).toHaveLength(183)
    expect(v.emFeriado.map((f) => f.data)).toEqual(['2026-01-01', '2026-04-21', '2026-05-01', '2026-10-12', '2026-11-15', '2026-12-25'])
  })

  it('RN-003 — antes de 11/11/2017 não há escala do art. 59-A cadastrada', () => {
    const r = calcularEscala12x36({ plantao: '2017-11-10' as DataISO, inicio: '2017-11-10' as DataISO, fim: '2017-11-30' as DataISO }, '2017-11-10' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
    expect(escala('2017-11-11', '2017-11-11', '2017-11-30').plantoes).toHaveLength(10)
  })

  it('entradas recusadas', () => {
    const r1 = calcularEscala12x36({ plantao: '2026-06-01' as DataISO, inicio: '2026-06-30' as DataISO, fim: '2026-06-01' as DataISO }, REF, registro)
    const r2 = calcularEscala12x36({ plantao: '2026-06-01' as DataISO, inicio: '2026-01-01' as DataISO, fim: '2027-01-02' as DataISO }, REF, registro)
    expect(r1.ok).toBe(false)
    expect(r2.ok).toBe(false)
  })

  it('a página devolve a quantidade de plantões', () => {
    const r = porSlug('escala-12x36')!.calcular({ plantao: '2026-06-01', inicio: '2026-06-01', fim: '2026-06-30' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(1_500)
  })
})
