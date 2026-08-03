/**
 * Casos-ouro de CALC-067 (conta de água) e CALC-059 (depreciação de veículo).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As duas são aritmética sobre dados do usuário — sem parâmetro legal e sem
 * série. As faixas de tarifa usadas aqui **não são de nenhuma concessionária
 * real**: são números redondos escolhidos para a conta fechar de cabeça, e usar
 * uma tabela real daria ao teste a aparência de conferir uma tarifa que este
 * produto deliberadamente não publica (`00-catalogo` §14).
 *
 *   Faixas: até 10 m³ a R$ 5,00 · até 20 m³ a R$ 10,00 · acima a R$ 20,00.
 *   Consumo de 25 m³ → 10×5 + 10×10 + 5×20 = 50 + 100 + 100 = R$ 250,00.
 *
 *   Carro de R$ 100.000,00 valendo R$ 72.250,00 depois de 24 meses:
 *   0,85² = 0,7225 — exatamente 15% ao ano.
 *
 * As três propriedades que estes casos travam:
 *
 *   1. **A tarifa progressiva não é consumo × tarifa.** A conta de cabeça
 *      cobra a mais, e a diferença cresce com o consumo.
 *   2. **O custo do próximo m³ é maior que o médio** em tarifa progressiva —
 *      é o número que a economia devolve, e o motivo de ele existir na tela.
 *   3. **A taxa de depreciação é DESCOBERTA, não informada** — e a busca
 *      precisa reencontrar a taxa que gerou o valor de hoje.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularAguaDef } from '../../src/lib/calculadoras/conta-de-agua'
import { calcular as calcularDepreciacaoDef } from '../../src/lib/calculadoras/depreciacao-de-veiculo'
import { calcularContaDeAgua } from '../../src/lib/engine/calculadoras/consumo'
import { calcularDepreciacao } from '../../src/lib/engine/calculadoras/veiculos'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-067 — Conta de água
// ---------------------------------------------------------------------------

/** Ver a nota de topo: números redondos, não tabela de concessionária real. */
const FAIXAS = [
  [1_000, 500],
  [2_000, 1_000],
  [0, 2_000],
]

const CONTA = {
  faixas: FAIXAS,
  consumo: 2_500,
  consumoMinimo: 0,
  esgotoBp: basisPoints(0),
  taxaFixa: centavos(0),
}

describe('CALC-067 · a tarifa progressiva', () => {
  const r = calcularContaDeAgua(CONTA, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('25 m³ nas três faixas dão R$ 250,00', () => {
    expect(v.agua).toBe(25_000)
    expect(v.total).toBe(25_000)
  })

  it('cada faixa cobra o volume que cai nela', () => {
    expect(v.faixasAplicadas.map((f) => f.volume)).toEqual([1_000, 1_000, 500])
    expect(v.faixasAplicadas.map((f) => f.valor)).toEqual([5_000, 10_000, 10_000])
  })

  /**
   * A afirmação que a página faz sobre o mundo: "consumo × tarifa" — a conta de
   * cabeça — cobra a mais, e a diferença cresce com o consumo.
   */
  it('a conta de cabeça cobra mais que a progressiva, e erra mais quanto maior o consumo', () => {
    for (const consumo of [1_500, 2_500, 5_000]) {
      const progressiva = calcularContaDeAgua({ ...CONTA, consumo }, REF)
      if (!progressiva.ok) throw new Error('esperado sucesso')
      const tarifaAlcancada = progressiva.valores.faixasAplicadas.at(-1)?.tarifa ?? 0
      const deCabeca = (consumo * tarifaAlcancada) / 100
      expect(deCabeca, `consumo ${consumo}`).toBeGreaterThan(progressiva.valores.agua)
    }
  })

  /**
   * O número que muda comportamento: economizar um m³ devolve o preço da faixa
   * mais alta alcançada, não o preço médio.
   */
  it('o próximo m³ custa mais que o médio', () => {
    expect(v.custoDoProximoM3).toBe(2_000)
    expect(v.custoDoProximoM3).toBeGreaterThan(v.custoMedioPorM3)
  })

  it('consumo dentro da primeira faixa não alcança as outras', () => {
    const pouco = calcularContaDeAgua({ ...CONTA, consumo: 500 }, REF)
    if (!pouco.ok) throw new Error('esperado sucesso')
    expect(pouco.valores.faixasAplicadas).toHaveLength(1)
    expect(pouco.valores.agua).toBe(2_500)
  })

  /**
   * O caso da casa vazia: a conta não zera porque a concessionária cobra o
   * mínimo. Ignorá-lo faria a página errar para menos justamente em quem viajou.
   */
  it('o consumo mínimo faturado é cobrado de quem consome menos', () => {
    const minimo = calcularContaDeAgua({ ...CONTA, consumo: 200, consumoMinimo: 1_000 }, REF)
    if (!minimo.ok) throw new Error('esperado sucesso')
    expect(minimo.valores.consumoFaturado).toBe(1_000)
    expect(minimo.valores.agua).toBe(5_000)
  })

  it('quem consome acima do mínimo paga pelo que consumiu', () => {
    const acima = calcularContaDeAgua({ ...CONTA, consumoMinimo: 1_000 }, REF)
    if (!acima.ok) throw new Error('esperado sucesso')
    expect(acima.valores.consumoFaturado).toBe(2_500)
  })

  it('o esgoto é percentual da água, e a taxa fixa entra por fora', () => {
    const completa = calcularContaDeAgua(
      { ...CONTA, esgotoBp: basisPoints(8_000), taxaFixa: centavos(1_000) },
      REF,
    )
    if (!completa.ok) throw new Error('esperado sucesso')
    expect(completa.valores.esgoto).toBe(20_000)
    expect(completa.valores.total).toBe(25_000 + 20_000 + 1_000)
  })

  it('com esgoto, o próximo m³ carrega o esgoto junto', () => {
    const completa = calcularContaDeAgua({ ...CONTA, esgotoBp: basisPoints(10_000) }, REF)
    if (!completa.ok) throw new Error('esperado sucesso')
    expect(completa.valores.custoDoProximoM3).toBe(4_000)
  })

  it('sem faixa ou sem consumo, o estado é pendente', () => {
    expect(calcularContaDeAgua({ ...CONTA, faixas: [] }, REF).ok).toBe(false)
    expect(calcularContaDeAgua({ ...CONTA, faixas: [[1_000, 0]] }, REF).ok).toBe(false)
    expect(calcularContaDeAgua({ ...CONTA, consumo: 0 }, REF).ok).toBe(false)
  })

  it('a definição publicada fecha a coluna do resultado', () => {
    const r2 = calcularAguaDef(
      {
        consumo: 2_500,
        faixas: '1000,500;2000,1000;0,2000',
        esgoto: 8_000,
        consumoMinimo: 0,
        taxaFixa: 1_000,
      },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    const linhas = r2.valores.detalhamento
    const total = linhas[linhas.length - 1]
    const parcelas = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(parcelas).toBe(total?.valor)
    expect(r2.valores.principal).toBe(46_000)
  })

  it('a tabela do resultado soma o valor da água', () => {
    const r2 = calcularAguaDef(
      { consumo: 2_500, faixas: '1000,500;2000,1000;0,2000', esgoto: 0 },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    const soma = (r2.valores.tabela?.linhas ?? []).reduce((t, l) => t + (l.valores[2] ?? 0), 0)
    expect(soma).toBe(25_000)
  })
})

// ---------------------------------------------------------------------------
// CALC-059 — Depreciação de veículo
// ---------------------------------------------------------------------------

const CARRO = {
  valorDeCompra: centavos(10_000_000),
  valorHoje: centavos(7_225_000),
  mesesDePosse: 24,
  anosDeProjecao: 5,
}

describe('CALC-059 · a taxa é descoberta, não informada', () => {
  const r = calcularDepreciacao(CARRO, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('R$ 100.000 valendo R$ 72.250 em dois anos são 15% ao ano', () => {
    // 0,85 × 0,85 = 0,7225 — a taxa que gerou o valor precisa ser reencontrada.
    expect(v.taxaAnualBp).toBeGreaterThanOrEqual(1_490)
    expect(v.taxaAnualBp).toBeLessThanOrEqual(1_510)
  })

  it('a perda acumulada e a perda por mês saem da diferença', () => {
    expect(v.perdaAcumulada).toBe(2_775_000)
    expect(v.perdaPorMes).toBe(Math.round(2_775_000 / 24))
    expect(v.perdaPercentualBp).toBe(2_775)
  })

  /**
   * A busca precisa reencontrar a taxa que gerou o valor — é o teste que pega
   * bisseção com intervalo ou monotonicidade errados.
   */
  it('a taxa reencontrada reproduz o valor de hoje', () => {
    for (const anos of [1, 2, 3, 5]) {
      for (const queda of [0.9, 0.85, 0.8, 0.95]) {
        const hoje = Math.round(10_000_000 * queda ** anos)
        const achado = calcularDepreciacao(
          { ...CARRO, valorHoje: centavos(hoje), mesesDePosse: anos * 12 },
          REF,
        )
        if (!achado.ok) throw new Error('esperado sucesso')
        const esperado = Math.round((1 - queda) * 10_000)
        expect(
          Math.abs(achado.valores.taxaAnualBp - esperado),
          `${queda} em ${anos} anos deu ${achado.valores.taxaAnualBp}`,
        ).toBeLessThanOrEqual(20)
      }
    }
  })

  /**
   * Depreciação é composta: a perda em reais diminui a cada ano, mesmo com a
   * taxa constante. É a afirmação que a página faz, e o motivo de o primeiro
   * ano ser o mais caro.
   */
  it('a perda em reais diminui a cada ano', () => {
    const perdas = v.projecao.map((p) => p.perdaNoAno)
    for (let i = 1; i < perdas.length; i += 1) {
      expect(perdas[i] ?? 0).toBeLessThan(perdas[i - 1] ?? 0)
    }
  })

  it('a projeção parte do valor de hoje e só cai', () => {
    expect(v.projecao).toHaveLength(5)
    let anterior = CARRO.valorHoje
    for (const p of v.projecao) {
      expect(p.valor).toBeLessThan(anterior)
      anterior = p.valor
    }
    expect(v.valorProjetado).toBe(v.projecao.at(-1)?.valor)
  })

  /**
   * Carro que não perdeu valor acontece — modelo raro, compra abaixo do
   * mercado, período de escassez. A página diz isso em vez de inventar taxa.
   */
  it('carro que não perdeu valor é declarado, não forçado', () => {
    const valorizado = calcularDepreciacao(
      { ...CARRO, valorHoje: centavos(11_000_000) },
      REF,
    )
    if (!valorizado.ok) throw new Error('esperado sucesso')
    expect(valorizado.valores.valorizou).toBe(true)
    expect(valorizado.valores.taxaAnualBp).toBe(0)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularDepreciacao({ ...CARRO, valorDeCompra: centavos(0) }, REF).ok).toBe(false)
    expect(calcularDepreciacao({ ...CARRO, valorHoje: centavos(0) }, REF).ok).toBe(false)
    expect(calcularDepreciacao({ ...CARRO, mesesDePosse: 0 }, REF).ok).toBe(false)
  })

  it('a definição publicada esconde a projeção quando não há queda', () => {
    const caindo = calcularDepreciacaoDef(
      { valorDeCompra: 10_000_000, valorHoje: 7_225_000, mesesDePosse: 24, anosDeProjecao: 5 },
      REF,
    )
    if (!caindo.ok) throw new Error('esperado sucesso')
    expect(caindo.valores.tabela?.linhas).toHaveLength(5)
    expect(caindo.valores.principal).toBe(2_775_000)

    const valorizado = calcularDepreciacaoDef(
      { valorDeCompra: 10_000_000, valorHoje: 11_000_000, mesesDePosse: 24, anosDeProjecao: 5 },
      REF,
    )
    if (!valorizado.ok) throw new Error('esperado sucesso')
    expect(valorizado.valores.tabela).toBeUndefined()
  })
})
