/**
 * Casos-ouro de CALC-056 (financiamento de veículo), CALC-029 (portabilidade) e
 * CALC-033 (custo de aquisição de imóvel).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As três são aritmética sobre dados do contrato — sem parâmetro legal e sem
 * série. O que elas têm de norma é a definição do CET, na Resolução CMN nº
 * 4.881/2020, que o motor de taxa interna já implementa e que `credito.test.ts`
 * cobre pelo lado de CALC-024.
 *
 * As propriedades que estes casos travam:
 *
 *   1. **O CET é maior que a taxa do contrato quando há tarifa ou seguro**, e
 *      igual quando não há. É a razão de existir das duas de crédito.
 *   2. **Prazo maior baixa a parcela e aumenta o total** — a armadilha que
 *      CALC-029 existe para desfazer.
 *   3. **A taxa do contrato atual é reencontrada** pela busca, a partir do
 *      saldo, da parcela e do prazo.
 *   4. **A coluna de custos de CALC-033 fecha** com o total exibido (§7.12).
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularAquisicaoDef } from '../../src/lib/calculadoras/custo-de-aquisicao'
import { calcular as calcularVeiculoDef } from '../../src/lib/calculadoras/financiamento-de-veiculo'
import { calcular as calcularPortabilidadeDef } from '../../src/lib/calculadoras/portabilidade-de-credito'
import {
  calcularFinanciamentoDeVeiculo,
  calcularPortabilidade,
} from '../../src/lib/engine/calculadoras/credito'
import { calcularCustoDeAquisicao } from '../../src/lib/engine/calculadoras/imobiliario'
import { parcelaPrice } from '../../src/lib/engine/financeira'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-056 — Financiamento de veículo
// ---------------------------------------------------------------------------

const CARRO = {
  precoDoVeiculo: centavos(6_000_000),
  entrada: centavos(1_000_000),
  prazoMeses: 48,
  taxaMensalBp: basisPoints(150),
  tarifas: centavos(0),
  seguroMensal: centavos(0),
}

describe('CALC-056 · a parcela e o que ela esconde', () => {
  const r = calcularFinanciamentoDeVeiculo(CARRO, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('financia o preço menos a entrada', () => {
    expect(v.valorFinanciado).toBe(5_000_000)
    expect(v.valorFinanciadoComTarifas).toBe(5_000_000)
  })

  it('a parcela é a da tabela Price sobre o valor financiado', () => {
    expect(v.parcela).toBe(parcelaPrice(centavos(5_000_000), 48, basisPoints(150)))
  })

  it('o total pago soma a entrada com todas as parcelas', () => {
    expect(v.totalPago).toBe(1_000_000 + v.parcela * 48)
    expect(v.custoAcimaDoPreco).toBe(v.totalPago - 6_000_000)
  })

  /**
   * A razão de existir da página: sem tarifa nem seguro o CET é a própria taxa
   * do contrato; com eles, fica acima. É o que separa "taxa" de "custo".
   */
  it('sem tarifa nem seguro, o CET é a taxa do contrato', () => {
    expect(v.cetMensal).toBe(150)
  })

  it('tarifa embutida empurra o CET acima da taxa anunciada', () => {
    const comTarifa = calcularFinanciamentoDeVeiculo({ ...CARRO, tarifas: centavos(150_000) }, REF)
    if (!comTarifa.ok) throw new Error('esperado sucesso')
    expect(comTarifa.valores.cetMensal).toBeGreaterThan(150)
    expect(comTarifa.valores.parcela).toBeGreaterThan(v.parcela)
  })

  it('seguro na parcela também empurra o CET, sem mexer no valor financiado', () => {
    const comSeguro = calcularFinanciamentoDeVeiculo({ ...CARRO, seguroMensal: centavos(5_000) }, REF)
    if (!comSeguro.ok) throw new Error('esperado sucesso')
    expect(comSeguro.valores.valorFinanciadoComTarifas).toBe(v.valorFinanciadoComTarifas)
    expect(comSeguro.valores.cetMensal).toBeGreaterThan(v.cetMensal)
  })

  it('o CET anual é o mensal capitalizado por doze', () => {
    expect(v.cetAnual).toBeGreaterThan(v.cetMensal * 12)
  })

  it('entrada maior reduz o custo além do preço', () => {
    const maisEntrada = calcularFinanciamentoDeVeiculo(
      { ...CARRO, entrada: centavos(3_000_000) },
      REF,
    )
    if (!maisEntrada.ok) throw new Error('esperado sucesso')
    expect(maisEntrada.valores.custoAcimaDoPreco).toBeLessThan(v.custoAcimaDoPreco)
  })

  it('o preço à vista é ultrapassado em alguma parcela dentro do prazo', () => {
    expect(v.mesesParaSuperarOPreco).toBeGreaterThan(0)
    expect(v.mesesParaSuperarOPreco).toBeLessThanOrEqual(48)
    const pago = 1_000_000 + v.parcela * v.mesesParaSuperarOPreco
    expect(pago).toBeGreaterThan(6_000_000)
    const antes = 1_000_000 + v.parcela * (v.mesesParaSuperarOPreco - 1)
    expect(antes).toBeLessThanOrEqual(6_000_000)
  })

  it('entrada que cobre o preço inteiro não é financiamento', () => {
    const aVista = calcularFinanciamentoDeVeiculo({ ...CARRO, entrada: centavos(6_000_000) }, REF)
    expect(aVista.ok).toBe(false)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularFinanciamentoDeVeiculo({ ...CARRO, precoDoVeiculo: centavos(0) }, REF).ok).toBe(false)
    expect(calcularFinanciamentoDeVeiculo({ ...CARRO, prazoMeses: 0 }, REF).ok).toBe(false)
    expect(calcularFinanciamentoDeVeiculo({ ...CARRO, taxaMensalBp: basisPoints(0) }, REF).ok).toBe(false)
  })

  it('a coluna do resultado fecha', () => {
    const r2 = calcularVeiculoDef(
      {
        precoDoVeiculo: 6_000_000,
        entrada: 1_000_000,
        prazoMeses: 48,
        taxaMensal: 150,
        tarifas: 150_000,
        seguroMensal: 0,
      },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    const [preco, custo, total] = r2.valores.detalhamento
    expect((preco?.valor ?? 0) + (custo?.valor ?? 0)).toBe(total?.valor)
    expect(r2.valores.principal).toBe(total?.valor)
  })
})

// ---------------------------------------------------------------------------
// CALC-029 — Portabilidade de crédito
// ---------------------------------------------------------------------------

const DIVIDA = {
  saldoDevedor: centavos(3_000_000),
  parcelaAtual: parcelaPrice(centavos(3_000_000), 36, basisPoints(250)),
  parcelasRestantes: 36,
  novaTaxaMensalBp: basisPoints(150),
  novoPrazoMeses: 36,
  custosDaPortabilidade: centavos(0),
}

describe('CALC-029 · a proposta comparada pelo total', () => {
  const r = calcularPortabilidade(DIVIDA, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  /**
   * A taxa do contrato atual é DESCOBERTA. Aqui a parcela foi construída a
   * partir de 2,5% ao mês, e a busca precisa reencontrar esse número.
   */
  it('a taxa do contrato atual é reencontrada pela busca', () => {
    expect(v.taxaAtualBp).toBeGreaterThanOrEqual(249)
    expect(v.taxaAtualBp).toBeLessThanOrEqual(251)
  })

  it('no mesmo prazo, taxa menor economiza', () => {
    expect(v.economia).toBeGreaterThan(0)
    expect(v.novaParcela).toBeLessThan(DIVIDA.parcelaAtual)
    expect(v.prazoAumentou).toBe(false)
  })

  it('a coluna fecha: total atual − total novo = economia', () => {
    expect(v.totalAtual - v.totalNovo).toBe(v.economia)
  })

  /**
   * A armadilha central: prazo maior baixa a parcela e aumenta o total, mesmo
   * com taxa menor. É o que a página existe para desfazer.
   */
  it('prazo maior baixa a parcela e pode aumentar o total', () => {
    const alongada = calcularPortabilidade({ ...DIVIDA, novoPrazoMeses: 72 }, REF)
    if (!alongada.ok) throw new Error('esperado sucesso')
    expect(alongada.valores.novaParcela).toBeLessThan(v.novaParcela)
    expect(alongada.valores.totalNovo).toBeGreaterThan(v.totalNovo)
    expect(alongada.valores.prazoAumentou).toBe(true)
    expect(alongada.valores.mesesAMais).toBe(36)
  })

  it('a comparação a prazo igual isola o ganho de taxa', () => {
    const alongada = calcularPortabilidade({ ...DIVIDA, novoPrazoMeses: 72 }, REF)
    if (!alongada.ok) throw new Error('esperado sucesso')
    // A mesma taxa nova, sem alongar, é o cenário do caso base.
    expect(alongada.valores.totalNovoNoMesmoPrazo).toBe(v.totalNovo)
    expect(alongada.valores.totalNovoNoMesmoPrazo).toBeLessThan(alongada.valores.totalNovo)
  })

  /**
   * Taxa nova IGUAL à atual e prazo igual: nada muda, e a economia é zero. É o
   * caso que pega erro de sinal e de arredondamento acumulado.
   */
  it('proposta idêntica não economiza nada', () => {
    const igual = calcularPortabilidade({ ...DIVIDA, novaTaxaMensalBp: basisPoints(250) }, REF)
    if (!igual.ok) throw new Error('esperado sucesso')
    expect(Math.abs(igual.valores.economia)).toBeLessThanOrEqual(36)
  })

  it('taxa maior custa mais, e o resultado fica negativo', () => {
    const pior = calcularPortabilidade({ ...DIVIDA, novaTaxaMensalBp: basisPoints(400) }, REF)
    if (!pior.ok) throw new Error('esperado sucesso')
    expect(pior.valores.economia).toBeLessThan(0)
  })

  it('os custos da portabilidade entram no valor financiado', () => {
    const comCustos = calcularPortabilidade(
      { ...DIVIDA, custosDaPortabilidade: centavos(100_000) },
      REF,
    )
    if (!comCustos.ok) throw new Error('esperado sucesso')
    expect(comCustos.valores.novaParcela).toBeGreaterThan(v.novaParcela)
    expect(comCustos.valores.economia).toBeLessThan(v.economia)
    // O CET olha o saldo, não o valor com custos — por isso fica acima da taxa.
    expect(comCustos.valores.cetNovoMensal).toBeGreaterThan(150)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularPortabilidade({ ...DIVIDA, saldoDevedor: centavos(0) }, REF).ok).toBe(false)
    expect(calcularPortabilidade({ ...DIVIDA, parcelasRestantes: 0 }, REF).ok).toBe(false)
    expect(calcularPortabilidade({ ...DIVIDA, novaTaxaMensalBp: basisPoints(0) }, REF).ok).toBe(false)
  })

  it('a definição publicada fecha a coluna do resultado', () => {
    const r2 = calcularPortabilidadeDef(
      {
        saldoDevedor: 3_000_000,
        parcelaAtual: DIVIDA.parcelaAtual,
        parcelasRestantes: 36,
        novaTaxa: 150,
        novoPrazoMeses: 36,
        custos: 0,
      },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    const [atual, novo, economia] = r2.valores.detalhamento
    expect((atual?.valor ?? 0) - (novo?.valor ?? 0)).toBe(economia?.valor)
  })
})

// ---------------------------------------------------------------------------
// CALC-033 — Custo total de aquisição de imóvel
// ---------------------------------------------------------------------------

const COMPRA = {
  valorDoImovel: centavos(50_000_000),
  entrada: centavos(10_000_000),
  itbiBp: basisPoints(200),
  escritura: centavos(300_000),
  registro: centavos(200_000),
  avaliacao: centavos(50_000),
  outrasDespesas: centavos(0),
}

describe('CALC-033 · o que não cabe no preço', () => {
  const r = calcularCustoDeAquisicao(COMPRA, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('2% de ITBI sobre R$ 500.000,00 são R$ 10.000,00', () => {
    expect(v.itbi).toBe(1_000_000)
  })

  it('os custos somam ITBI, escritura, registro e avaliação', () => {
    expect(v.custosAlemDoPreco).toBe(1_000_000 + 300_000 + 200_000 + 50_000)
  })

  /**
   * O número que trava negócio: não é a entrada, é a entrada MAIS os custos.
   */
  it('o desembolso na assinatura é a entrada mais os custos', () => {
    expect(v.desembolsoNaAssinatura).toBe(10_000_000 + v.custosAlemDoPreco)
    expect(v.desembolsoNaAssinatura).toBeGreaterThan(COMPRA.entrada)
  })

  it('o percentual dos custos sai sobre o valor do imóvel', () => {
    // R$ 15.500,00 sobre R$ 500.000,00 = 3,10%
    expect(v.custosBp).toBe(310)
  })

  it('o valor a financiar é o preço menos a entrada', () => {
    expect(v.valorFinanciado).toBe(40_000_000)
    expect(v.custoTotalDaCompra).toBe(50_000_000 + v.custosAlemDoPreco)
  })

  it('sem ITBI informado, a conta segue com o que houver', () => {
    const semItbi = calcularCustoDeAquisicao({ ...COMPRA, itbiBp: basisPoints(0) }, REF)
    if (!semItbi.ok) throw new Error('esperado sucesso')
    expect(semItbi.valores.itbi).toBe(0)
    expect(semItbi.valores.custosAlemDoPreco).toBe(550_000)
  })

  it('entrada maior que o imóvel é recusada', () => {
    expect(calcularCustoDeAquisicao({ ...COMPRA, entrada: centavos(60_000_000) }, REF).ok).toBe(false)
  })

  it('sem valor de imóvel, o estado é pendente', () => {
    expect(calcularCustoDeAquisicao({ ...COMPRA, valorDoImovel: centavos(0) }, REF).ok).toBe(false)
  })

  it('a coluna do resultado fecha com o total exibido', () => {
    const r2 = calcularAquisicaoDef(
      {
        valorDoImovel: 50_000_000,
        entrada: 10_000_000,
        itbi: 200,
        escritura: 300_000,
        registro: 200_000,
        avaliacao: 50_000,
        outrasDespesas: 0,
      },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    const linhas = r2.valores.detalhamento
    const total = linhas[linhas.length - 1]
    const parcelas = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(parcelas).toBe(total?.valor)
    expect(r2.valores.principal).toBe(1_550_000)
  })

  it('linha de custo zerada não aparece na coluna', () => {
    const r2 = calcularAquisicaoDef(
      { valorDoImovel: 50_000_000, entrada: 0, itbi: 200, escritura: 0, registro: 0 },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    expect(r2.valores.detalhamento.map((l) => l.rotulo)).toEqual(['ITBI', 'Custos além do preço'])
  })
})
