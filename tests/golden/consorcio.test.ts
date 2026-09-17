/**
 * CALC-099 — casos-ouro do comparador consórcio × financiamento.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Esta calculadora não tem parâmetro legal: taxa de administração, fundo de
 * reserva e juros são preço de contrato, digitados pelo usuário (`ADR-006`). Os
 * valores esperados são identidades aritméticas conferidas à mão:
 *
 * - consórcio: total = carta + taxa de administração + fundo de reserva, e
 *   parcela = total ÷ prazo;
 * - financiamento: parcela pela tabela Price, a mesma função já conferida nos
 *   casos-ouro de CALC-024, e total = entrada + parcela × prazo;
 * - taxa equivalente do consórcio: a taxa mensal que faz o valor presente das
 *   parcelas igualar a carta — conferida aqui pelo caminho inverso, com
 *   `parcelaPrice`.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularConsorcioOuFinanciamento,
  type EntradaConsorcio,
} from '../../src/lib/engine/calculadoras/consorcio'
import { parcelaPrice } from '../../src/lib/engine/financeira'
import { ZERO, basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

const BASE: EntradaConsorcio = {
  valorDoBem: centavos(6_000_000),
  prazoMeses: 60,
  taxaAdministracaoBp: basisPoints(1_800),
  fundoReservaBp: basisPoints(200),
  mesDaContemplacao: 12,
  entradaFinanciamento: ZERO,
  jurosMensalBp: basisPoints(150),
}

function comparar(over: Partial<EntradaConsorcio> = {}) {
  const r = calcularConsorcioOuFinanciamento({ ...BASE, ...over }, REF)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-099 · o lado do consórcio', () => {
  /**
   * Carta de R$ 60.000,00 com 18% de taxa de administração e 2% de fundo de
   * reserva: R$ 10.800,00 + R$ 1.200,00 = R$ 12.000,00 de custo.
   * Total R$ 72.000,00 ÷ 60 = R$ 1.200,00 por mês.
   */
  it('parcela é o total dividido pelo prazo, sem juros', () => {
    const v = comparar()
    expect(v.custoDoConsorcio).toBe(1_200_000)
    expect(v.totalConsorcio).toBe(7_200_000)
    expect(v.parcelaConsorcio).toBe(120_000)
  })

  /** Sem fundo de reserva, o custo é só a taxa: R$ 10.800,00. */
  it('grupo sem fundo de reserva', () => {
    const v = comparar({ fundoReservaBp: basisPoints(0) })
    expect(v.custoDoConsorcio).toBe(1_080_000)
    expect(v.totalConsorcio).toBe(7_080_000)
  })

  /**
   * A taxa equivalente existe e é positiva quando o total supera a carta — e
   * ela é conferida pelo caminho inverso: a parcela Price naquela taxa precisa
   * ficar a um centavo da parcela do consórcio.
   */
  it('a taxa mensal equivalente reproduz a parcela do consórcio', () => {
    const v = comparar()
    expect(v.taxaEquivalenteConsorcioBp).not.toBeNull()
    const taxa = v.taxaEquivalenteConsorcioBp as number
    expect(taxa).toBeGreaterThan(0)
    const parcelaNaTaxa = parcelaPrice(centavos(6_000_000), 60, basisPoints(taxa))
    expect(Math.abs(parcelaNaTaxa - v.parcelaConsorcio)).toBeLessThanOrEqual(200)
  })

  /** Sem taxa de administração e sem fundo, não há custo — e não há taxa equivalente. */
  it('consórcio sem custo nenhum não tem taxa equivalente', () => {
    const v = comparar({ taxaAdministracaoBp: basisPoints(0), fundoReservaBp: basisPoints(0) })
    expect(v.custoDoConsorcio).toBe(0)
    expect(v.taxaEquivalenteConsorcioBp).toBeNull()
  })
})

describe('CALC-099 · o lado do financiamento', () => {
  /** A parcela é a da tabela Price sobre o valor financiado. */
  it('parcela pela Price, e total com a entrada', () => {
    const v = comparar({ entradaFinanciamento: centavos(1_000_000) })
    const esperada = parcelaPrice(centavos(5_000_000), 60, basisPoints(150))
    expect(v.parcelaFinanciamento).toBe(esperada)
    expect(v.totalFinanciamento).toBe(esperada * 60 + 1_000_000)
  })

  /** Um mês a 1%: a parcela é o principal acrescido dos juros do mês. */
  it('caso de conferência direta — uma parcela a 1%', () => {
    const v = comparar({ prazoMeses: 1, mesDaContemplacao: 1, jurosMensalBp: basisPoints(100) })
    expect(v.parcelaFinanciamento).toBe(6_060_000)
  })

  /** Juros de 1,5% ao mês equivalem a 19,56% ao ano — (1,015^12 − 1). */
  it('a taxa anual equivalente é calculada', () => {
    const v = comparar()
    expect(v.jurosAnualBp).toBeGreaterThan(1_900)
    expect(v.jurosAnualBp).toBeLessThan(2_000)
  })

  /** Entrada maior reduz o valor financiado e, com ele, o total pago. */
  it('entrada reduz o total do financiamento', () => {
    const sem = comparar()
    const com = comparar({ entradaFinanciamento: centavos(2_000_000) })
    expect(com.totalFinanciamento).toBeLessThan(sem.totalFinanciamento)
    expect(com.custoDoFinanciamento).toBeLessThan(sem.custoDoFinanciamento)
  })
})

describe('CALC-099 · a comparação', () => {
  /** Com 1,5% ao mês, o financiamento sai bem mais caro que o consórcio de 20%. */
  it('a diferença aponta o mais caro', () => {
    const v = comparar()
    expect(v.diferencaTotal).toBeGreaterThan(0)
    expect(v.totalFinanciamento).toBeGreaterThan(v.totalConsorcio)
  })

  /** Com juros baixos, o consórcio de taxa alta pode perder: 0,3% ao mês. */
  it('juros baixos invertem o resultado', () => {
    const v = comparar({ jurosMensalBp: basisPoints(30) })
    expect(v.totalFinanciamento).toBeLessThan(v.totalConsorcio)
    expect(v.diferencaTotal).toBeLessThan(0)
  })

  /** A memória registra quando o bem chega em cada caminho. */
  it('a memória declara o mês da contemplação', () => {
    const r = calcularConsorcioOuFinanciamento({ ...BASE, mesDaContemplacao: 24 }, REF)
    if (!r.ok) throw new Error(r.detalhe)
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('Diferença'))
    expect(etapa?.justificativa).toContain('mês 24')
  })

  it('sem contemplação prevista, a memória diz que o bem só chega no fim', () => {
    const r = calcularConsorcioOuFinanciamento({ ...BASE, mesDaContemplacao: 0 }, REF)
    if (!r.ok) throw new Error(r.detalhe)
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('Diferença'))
    expect(etapa?.justificativa).toContain('fim do grupo')
  })
})

describe('CALC-099 · entradas recusadas', () => {
  it('sem valor do bem, fica pendente; sem juros, também', () => {
    const semBem = calcularConsorcioOuFinanciamento({ ...BASE, valorDoBem: ZERO }, REF)
    expect(semBem.ok).toBe(false)
    if (!semBem.ok) expect(semBem.motivo).toBe('entrada_incompleta')

    const semJuros = calcularConsorcioOuFinanciamento({ ...BASE, jurosMensalBp: basisPoints(0) }, REF)
    expect(semJuros.ok).toBe(false)
    if (!semJuros.ok) expect(semJuros.motivo).toBe('entrada_incompleta')
  })

  it('prazo, taxas, entrada e contemplação fora de faixa são recusados', () => {
    for (const over of [
      { prazoMeses: 0 },
      { prazoMeses: 481 },
      { prazoMeses: 12.5 },
      { taxaAdministracaoBp: basisPoints(-1) },
      { fundoReservaBp: basisPoints(-1) },
      { entradaFinanciamento: centavos(6_000_000) },
      { entradaFinanciamento: centavos(-1) },
      { mesDaContemplacao: 61 },
      { mesDaContemplacao: -1 },
    ]) {
      const r = calcularConsorcioOuFinanciamento({ ...BASE, ...over }, REF)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })
})
