/**
 * Casos-ouro de CALC-064 (valor futuro) e CALC-045 (Tesouro IPCA+).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * **Estas duas projetam, e não há fonte para o futuro.** Não existe tabela a
 * conferir, e por isso os casos são identidades e aritmética fechada, com taxas
 * escolhidas para o número sair redondo:
 *
 *   10% ao ano por 2 anos acumulam 21%, e não 20%.
 *   Inflação de 10% com juro real de 10% dão 21% nominais, e não 20%.
 *
 * Os dois casos mais importantes do arquivo:
 *
 *   1. **Composição, e não soma** — nas duas calculadoras, em dois lugares.
 *   2. **O imposto morde a correção da inflação**, e é isso que faz o ganho real
 *      líquido cair abaixo da taxa contratada. É a razão de CALC-045 existir.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularTesouro } from '../../src/lib/calculadoras/tesouro-ipca'
import { calcular as calcularFuturo } from '../../src/lib/calculadoras/valor-futuro'
import {
  calcularIpcaMais,
  projetarValorFuturo,
  type EntradaIpcaMais,
  type EntradaProjecao,
} from '../../src/lib/engine/calculadoras/projecao'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-064 — Valor futuro
// ---------------------------------------------------------------------------

const PROJECAO: EntradaProjecao = {
  valorHoje: centavos(100_000),
  inflacaoAnualBp: basisPoints(1_000),
  anos: 2,
}

function futuroOuFalhar(entrada: EntradaProjecao) {
  const r = projetarValorFuturo(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-064 · inflação se acumula de forma composta', () => {
  const v = futuroOuFalhar(PROJECAO).valores

  it('dois anos de 10% dão 21%, e não 20%', () => {
    expect(v.inflacaoAcumuladaBp).toBe(2_100)
  })

  it('R$ 1.000,00 hoje equivalem a R$ 1.210,00 daqui a dois anos', () => {
    expect(v.valorFuturoEquivalente).toBe(121_000)
  })

  /**
   * A leitura inversa, que é o número que dói: o mesmo dinheiro parado.
   * 1.000 ÷ 1,21 = 826,45.
   */
  it('e a mesma quantia parada comprará o equivalente a R$ 826,45', () => {
    expect(v.poderDeCompraFuturo).toBe(82_644)
  })

  it('a perda de poder de compra não é o simétrico da inflação', () => {
    // 1 − 1/1,21 = 17,35%
    expect(v.perdaDePoderBp).toBe(1_735)
    expect(v.perdaDePoderBp).toBeLessThan(v.inflacaoAcumuladaBp)
  })

  it('a diferença entre compor e multiplicar cresce com o prazo', () => {
    const dez = futuroOuFalhar({ ...PROJECAO, anos: 10 }).valores
    expect(dez.inflacaoAcumuladaBp).toBeGreaterThan(10 * 1_000)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(projetarValorFuturo({ ...PROJECAO, valorHoje: centavos(0) }, REF).ok).toBe(false)
    expect(projetarValorFuturo({ ...PROJECAO, inflacaoAnualBp: basisPoints(0) }, REF).ok).toBe(false)
    expect(projetarValorFuturo({ ...PROJECAO, anos: 0 }, REF).ok).toBe(false)
  })

  it('a coluna do resultado fecha', () => {
    const r = calcularFuturo({ valorHoje: 100_000, inflacaoAnual: 1_000, anos: 2 }, REF)
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const [hoje, acrescimo, futuro] = r.valores.detalhamento
    expect((hoje?.valor ?? 0) + (acrescimo?.valor ?? 0)).toBe(futuro?.valor)
    expect(r.valores.principal).toBe(121_000)
  })

  /**
   * A referência do índice sai da série real e não pode virar premissa: ela
   * aparece como destaque, e trocar o índice de referência **não** muda o
   * resultado.
   */
  it('o índice de referência não interfere na projeção', () => {
    const comIpca = calcularFuturo(
      { valorHoje: 100_000, inflacaoAnual: 1_000, anos: 2, indiceDeReferencia: 'ipca' },
      REF,
    )
    const comIgpm = calcularFuturo(
      { valorHoje: 100_000, inflacaoAnual: 1_000, anos: 2, indiceDeReferencia: 'igpm' },
      REF,
    )
    if (!comIpca.ok || !comIgpm.ok) throw new Error('esperado sucesso')
    expect(comIpca.valores.principal).toBe(comIgpm.valores.principal)
  })
})

// ---------------------------------------------------------------------------
// CALC-045 — Tesouro IPCA+
// ---------------------------------------------------------------------------

const TITULO: EntradaIpcaMais = {
  valorInvestido: centavos(100_000),
  taxaRealAnualBp: basisPoints(1_000),
  inflacaoAnualBp: basisPoints(1_000),
  anos: 1,
  aliquotaIrBp: basisPoints(0),
}

function tituloOuFalhar(entrada: EntradaIpcaMais) {
  const r = calcularIpcaMais(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-045 · a taxa nominal é o produto, não a soma', () => {
  const v = tituloOuFalhar(TITULO).valores

  it('10% de inflação com 10% de juro real dão 21% nominais', () => {
    expect(v.taxaNominalAnualBp).toBe(2_100)
  })

  it('R$ 1.000,00 viram R$ 1.210,00 no vencimento', () => {
    expect(v.valorBrutoNoVencimento).toBe(121_000)
    expect(v.rendimentoNominal).toBe(21_000)
  })

  /**
   * A separação que dá sentido à página: do rendimento de R$ 210,00, cem foram
   * só reposição da inflação e cento e dez foram ganho real.
   */
  it('separa o que repôs a inflação do que é ganho', () => {
    expect(v.parteQueReposInflacao).toBe(10_000)
    expect(v.parteDeGanhoReal).toBe(11_000)
    expect(v.parteQueReposInflacao + v.parteDeGanhoReal).toBe(v.rendimentoNominal)
  })
})

/**
 * O caso que a calculadora existe para mostrar.
 */
describe('CALC-045 · o imposto morde a correção da inflação', () => {
  const semImposto = tituloOuFalhar(TITULO).valores
  const comImposto = tituloOuFalhar({ ...TITULO, aliquotaIrBp: basisPoints(2_000) }).valores

  it('o imposto incide sobre o rendimento NOMINAL, e não sobre o ganho real', () => {
    // 20% de R$ 210,00 são R$ 42,00 — e não 20% dos R$ 110,00 de ganho real.
    expect(comImposto.imposto).toBe(4_200)
    expect(comImposto.imposto).toBeGreaterThan(2_200)
  })

  it('e por isso o ganho real líquido cai abaixo da taxa contratada', () => {
    expect(semImposto.ganhoRealLiquidoBp).toBe(1_000)
    expect(comImposto.ganhoRealLiquidoBp).toBeLessThan(TITULO.taxaRealAnualBp)
  })

  it('o líquido em moeda de hoje é menor que o investido mais o ganho real', () => {
    expect(comImposto.liquidoEmMoedaDeHoje).toBeLessThan(
      TITULO.valorInvestido + semImposto.parteDeGanhoReal,
    )
    expect(comImposto.liquidoEmMoedaDeHoje).toBeGreaterThan(TITULO.valorInvestido)
  })

  /**
   * Inflação maior aumenta a base tributável sem aumentar o ganho real — e é
   * isso que faz a mordida crescer. Sem imposto, o ganho real não se move.
   */
  it('inflação maior corrói mais o ganho real, mas só quando há imposto', () => {
    const inflacaoAlta = tituloOuFalhar({
      ...TITULO,
      inflacaoAnualBp: basisPoints(3_000),
      aliquotaIrBp: basisPoints(2_000),
    }).valores
    expect(inflacaoAlta.ganhoRealLiquidoBp).toBeLessThan(comImposto.ganhoRealLiquidoBp)

    const semImpostoInflacaoAlta = tituloOuFalhar({
      ...TITULO,
      inflacaoAnualBp: basisPoints(3_000),
    }).valores
    expect(semImpostoInflacaoAlta.ganhoRealLiquidoBp).toBe(1_000)
  })
})

describe('CALC-045 · fronteiras e a coluna da tela', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularIpcaMais({ ...TITULO, valorInvestido: centavos(0) }, REF).ok).toBe(false)
    expect(calcularIpcaMais({ ...TITULO, taxaRealAnualBp: basisPoints(0) }, REF).ok).toBe(false)
    expect(calcularIpcaMais({ ...TITULO, anos: 0 }, REF).ok).toBe(false)
  })

  it('alíquota de 100% ou mais é recusada', () => {
    expect(calcularIpcaMais({ ...TITULO, aliquotaIrBp: basisPoints(10_000) }, REF).ok).toBe(false)
  })

  it('sem inflação, o nominal é o próprio juro real', () => {
    const v = tituloOuFalhar({ ...TITULO, inflacaoAnualBp: basisPoints(0) }).valores
    expect(v.taxaNominalAnualBp).toBe(1_000)
    expect(v.parteQueReposInflacao).toBe(0)
  })

  it('as linhas somam o valor bruto no vencimento', () => {
    const r = calcularTesouro(
      { valorInvestido: 100_000, taxaReal: 1_000, inflacaoAnual: 1_000, anos: 1, aliquotaIr: 2_000 },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const linhas = r.valores.detalhamento
    const soma = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(soma).toBe(linhas[linhas.length - 1]?.valor)
  })

  it('o resultado principal é o líquido em poder de compra de hoje', () => {
    const r = calcularTesouro(
      { valorInvestido: 100_000, taxaReal: 1_000, inflacaoAnual: 1_000, anos: 1, aliquotaIr: 2_000 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const bruto = r.valores.detalhamento[r.valores.detalhamento.length - 1]?.valor ?? 0
    expect(r.valores.principal).toBeLessThan(bruto)
  })
})
