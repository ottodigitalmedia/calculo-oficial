/**
 * Casos-ouro de CALC-042 (quanto rende por mês) e CALC-041 (poupança).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As duas consomem série econômica como **sugestão**, não como parâmetro: a
 * taxa é campo, e o que os casos abaixo exercitam é a conta, com taxas fixadas
 * aqui. Nenhum valor esperado depende do cache, que muda a cada coleta.
 *
 * O caso mais importante do arquivo é o da conversão anual para mensal: 12% ao
 * ano NÃO são 1% ao mês. Dividir por doze é o erro mais comum da categoria, e
 * ele superestima a renda em todo prazo.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularPoupanca } from '../../src/lib/calculadoras/poupanca'
import { calcular as calcularRenda } from '../../src/lib/calculadoras/renda-mensal'
import { taxaMensalEquivalente } from '../../src/lib/engine/calculadoras/juros-compostos'
import {
  calcularRendaMensal,
  type EntradaRendaMensal,
} from '../../src/lib/engine/calculadoras/renda-mensal'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

const BASE: EntradaRendaMensal = {
  capital: centavos(10_000_000),
  taxa: basisPoints(1_200),
  taxaAoAno: true,
  aliquotaIrBp: basisPoints(0),
}

function rendaOuFalhar(entrada: EntradaRendaMensal) {
  const r = calcularRendaMensal(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

// ---------------------------------------------------------------------------
// A conversão que quase todo mundo erra
// ---------------------------------------------------------------------------

describe('CALC-042 · taxa anual não se divide por doze', () => {
  const v = rendaOuFalhar(BASE).valores

  it('12% ao ano equivalem a 0,95% ao mês, não a 1,00%', () => {
    // 1,12^(1/12) − 1 = 0,9489%
    expect(v.taxaMensalBp).toBe(95)
    expect(v.taxaMensalBp).toBeLessThan(100)
  })

  it('e a diferença aparece no bolso', () => {
    // R$ 100.000,00 a 0,95% dão R$ 950,00; a 1% dariam R$ 1.000,00.
    expect(v.rendimentoBrutoMensal).toBe(95_000)
  })

  it('a conversão é a mesma de juros compostos, e não uma segunda verdade', () => {
    expect(v.taxaMensalBp).toBe(taxaMensalEquivalente(basisPoints(1_200), true))
  })

  it('taxa informada ao mês é usada como está', () => {
    const mensal = rendaOuFalhar({ ...BASE, taxa: basisPoints(100), taxaAoAno: false }).valores
    expect(mensal.taxaMensalBp).toBe(100)
    expect(mensal.rendimentoBrutoMensal).toBe(100_000)
  })
})

// ---------------------------------------------------------------------------
// O imposto
// ---------------------------------------------------------------------------

describe('CALC-042 · o imposto incide sobre o rendimento, não sobre o capital', () => {
  const v = rendaOuFalhar({ ...BASE, aliquotaIrBp: basisPoints(2_000) }).valores

  it('20% sobre R$ 950,00 são R$ 190,00', () => {
    expect(v.impostoMensal).toBe(19_000)
    expect(v.rendimentoLiquidoMensal).toBe(76_000)
  })

  it('a identidade fecha: bruto menos imposto é o líquido', () => {
    expect(v.rendimentoBrutoMensal - v.impostoMensal).toBe(v.rendimentoLiquidoMensal)
  })

  it('doze meses são doze vezes o líquido — quem retira não capitaliza', () => {
    expect(v.rendimentoLiquidoAnual).toBe(v.rendimentoLiquidoMensal * 12)
  })

  it('sem alíquota, o líquido é o próprio bruto', () => {
    const sem = rendaOuFalhar(BASE).valores
    expect(sem.impostoMensal).toBe(0)
    expect(sem.rendimentoLiquidoMensal).toBe(sem.rendimentoBrutoMensal)
  })

  /**
   * A taxa líquida sai do que a tela soma, e não da multiplicação das duas
   * alíquotas — os arredondamentos acontecem em lugares diferentes, e o que
   * aparece tem de fechar com as linhas.
   */
  it('a taxa líquida é derivada do rendimento exibido', () => {
    expect(v.taxaLiquidaMensalBp).toBe(
      Math.round((v.rendimentoLiquidoMensal * 10_000) / BASE.capital),
    )
  })
})

describe('CALC-042 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularRendaMensal({ ...BASE, capital: centavos(0) }, REF).ok).toBe(false)
    expect(calcularRendaMensal({ ...BASE, taxa: basisPoints(0) }, REF).ok).toBe(false)
  })

  it('alíquota de 100% ou mais é recusada', () => {
    expect(calcularRendaMensal({ ...BASE, aliquotaIrBp: basisPoints(10_000) }, REF).ok).toBe(false)
    expect(calcularRendaMensal({ ...BASE, aliquotaIrBp: basisPoints(-1) }, REF).ok).toBe(false)
  })

  it('a coluna do resultado fecha', () => {
    const r = calcularRenda(
      { capital: 10_000_000, taxa: 1_200, periodoTaxa: 'ano', aliquotaIr: 2_000 },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const [bruto, imposto, liquido] = r.valores.detalhamento
    expect((bruto?.valor ?? 0) - (imposto?.valor ?? 0)).toBe(liquido?.valor)
    expect(r.valores.principal).toBe(liquido?.valor)
  })

  it('sem imposto, sobram duas linhas iguais', () => {
    const r = calcularRenda({ capital: 10_000_000, taxa: 1_200, periodoTaxa: 'ano' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.detalhamento).toHaveLength(2)
    expect(r.valores.detalhamento[0]?.valor).toBe(r.valores.detalhamento[1]?.valor)
  })
})

// ---------------------------------------------------------------------------
// CALC-041 — poupança
// ---------------------------------------------------------------------------

describe('CALC-041 · a poupança é juros compostos com a taxa publicada', () => {
  /** R$ 10.000,00 a 0,50% ao mês por 12 meses. */
  const r = calcularPoupanca(
    { valorInicial: 1_000_000, aporteMensal: 0, taxaMensal: 50, meses: 12 },
    REF,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)

  it('capitaliza mês a mês, e não linearmente', () => {
    // 1,005^12 − 1 = 6,17%, e não 6,00%
    expect(r.valores.principal).toBeGreaterThan(1_061_000)
    expect(r.valores.principal).toBeLessThan(1_062_000)
  })

  it('a coluna fecha: depositado mais rendimento é o saldo', () => {
    const [depositado, rendimento, saldo] = r.valores.detalhamento
    expect((depositado?.valor ?? 0) + (rendimento?.valor ?? 0)).toBe(saldo?.valor)
    expect(r.valores.principal).toBe(saldo?.valor)
  })

  it('com depósito mensal, o total depositado cresce a cada mês', () => {
    const com = calcularPoupanca(
      { valorInicial: 1_000_000, aporteMensal: 100_000, taxaMensal: 50, meses: 12 },
      REF,
    )
    if (!com.ok) throw new Error('esperado sucesso')
    expect(com.valores.detalhamento[0]?.valor).toBe(1_000_000 + 100_000 * 12)
    expect(com.valores.principal).toBeGreaterThan(r.valores.principal)
  })

  it('traz a evolução ano a ano', () => {
    const longo = calcularPoupanca(
      { valorInicial: 1_000_000, aporteMensal: 0, taxaMensal: 50, meses: 36 },
      REF,
    )
    if (!longo.ok) throw new Error('esperado sucesso')
    expect(longo.valores.tabela?.linhas).toHaveLength(3)
  })

  it('prazo ou taxa ausentes mantêm o estado pendente', () => {
    expect(calcularPoupanca({ valorInicial: 1_000_000, taxaMensal: 0, meses: 12 }, REF).ok).toBe(
      false,
    )
    expect(calcularPoupanca({ valorInicial: 1_000_000, taxaMensal: 50, meses: 0 }, REF).ok).toBe(
      false,
    )
  })
})
