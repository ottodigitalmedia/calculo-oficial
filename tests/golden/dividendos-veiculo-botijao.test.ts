/**
 * Casos-ouro de CALC-046 (dividendos), CALC-058 (elétrico vs. combustão) e
 * CALC-068 (botijão de gás).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As três são aritmética sobre dados do usuário — sem parâmetro legal e sem
 * série. Os números foram escolhidos para fechar de cabeça:
 *
 *   Ação a R$ 20,00 pagando R$ 2,00 no ano: yield de 10%.
 *   1.000 km a 10 km/l e R$ 6,00 o litro: R$ 600,00. A 5 km/kWh e R$ 0,80: R$ 160,00.
 *   Botijão de R$ 120,00 que dura 60 dias: R$ 2,00 por dia.
 *
 * Os dois casos mais importantes:
 *
 *   1. **O arredondamento da renda alvo é para CIMA** (CALC-046). Para baixo, a
 *      quantidade devolvida renderia MENOS que a renda pedida — errada no
 *      sentido que decepciona.
 *   2. **O custo por quilo** (CALC-068) é o número que compara tamanhos, e o
 *      botijão menor mais barato precisa sair mais caro por quilo.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularBotijaoDef } from '../../src/lib/calculadoras/botijao'
import { calcular as calcularDividendosDef } from '../../src/lib/calculadoras/dividendos'
import { calcular as calcularEletricoDef } from '../../src/lib/calculadoras/eletrico-vs-combustao'
import { calcularBotijao } from '../../src/lib/engine/calculadoras/consumo'
import { calcularDividendos } from '../../src/lib/engine/calculadoras/dividendos'
import { compararEletricoVsCombustao } from '../../src/lib/engine/calculadoras/veiculos'
import { centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-046 — Dividend yield
// ---------------------------------------------------------------------------

const ACAO = {
  precoPorAcao: centavos(2_000),
  dividendoAnualPorAcao: centavos(200),
  quantidade: 1_000,
  rendaMensalDesejada: centavos(0),
}

describe('CALC-046 · o yield e a renda', () => {
  const r = calcularDividendos(ACAO, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('R$ 2,00 de provento sobre R$ 20,00 de preço são 10%', () => {
    expect(v.yieldAnualBp).toBe(1_000)
  })

  it('mil ações a R$ 20,00 são R$ 20.000,00 investidos e R$ 2.000,00 no ano', () => {
    expect(v.investimentoTotal).toBe(2_000_000)
    expect(v.rendaAnual).toBe(200_000)
  })

  it('a média mensal é a anual dividida por doze', () => {
    // R$ 2.000,00 ÷ 12 = R$ 166,666… → R$ 166,67 com meio para cima.
    expect(v.rendaMensal).toBe(16_667)
  })

  /**
   * O yield sobe quando o preço cai — sem que nada de bom tenha acontecido. É a
   * armadilha da métrica, e a página existe para nomeá-la.
   */
  it('preço menor com o mesmo provento eleva o yield', () => {
    const barata = calcularDividendos({ ...ACAO, precoPorAcao: centavos(1_000) }, REF)
    if (!barata.ok) throw new Error('esperado sucesso')
    expect(barata.valores.yieldAnualBp).toBe(2_000)
  })

  it('a etapa do yield declara que ele olha para trás', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo.startsWith('Dividend yield'))
    expect(etapa?.justificativa).toContain('para TRÁS')
  })
})

/**
 * O caso do arredondamento: com arredondamento para baixo, a resposta erraria
 * no sentido que decepciona.
 */
describe('CALC-046 · a renda alvo arredonda para cima', () => {
  it('a quantidade devolvida rende ao MENOS a renda pedida', () => {
    for (const alvo of [100_000, 123_456, 333_333]) {
      const r = calcularDividendos({ ...ACAO, rendaMensalDesejada: centavos(alvo) }, REF)
      if (!r.ok) throw new Error('esperado sucesso')
      const rendaAnualObtida = r.valores.acoesParaARenda * ACAO.dividendoAnualPorAcao
      expect(rendaAnualObtida, `alvo ${alvo}`).toBeGreaterThanOrEqual(alvo * 12)
    }
  })

  it('sem renda alvo, não há investimento necessário a mostrar', () => {
    const r = calcularDividendos(ACAO, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.acoesParaARenda).toBe(0)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularDividendos({ ...ACAO, precoPorAcao: centavos(0) }, REF).ok).toBe(false)
    expect(calcularDividendos({ ...ACAO, quantidade: 0 }, REF).ok).toBe(false)
  })

  it('a coluna do resultado fica vazia de propósito', () => {
    const r = calcularDividendosDef(
      { precoPorAcao: 2_000, dividendoAnual: 200, quantidade: 1_000 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.detalhamento).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// CALC-058 — Elétrico vs. combustão
// ---------------------------------------------------------------------------

const CARROS = {
  kmPorMes: 1_000,
  consumoCombustao: 1_000,
  precoLitro: centavos(600),
  consumoEletrico: 500,
  tarifaKwh: centavos(80),
  diferencaDePreco: centavos(0),
}

describe('CALC-058 · energia por quilômetro', () => {
  const r = compararEletricoVsCombustao(CARROS, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('1.000 km a 10 km/l e R$ 6,00 o litro custam R$ 600,00', () => {
    expect(v.custoMensalCombustao).toBe(60_000)
  })

  it('os mesmos 1.000 km a 5 km/kWh e R$ 0,80 custam R$ 160,00', () => {
    expect(v.custoMensalEletrico).toBe(16_000)
  })

  it('a economia é a diferença, e ela fecha em doze meses', () => {
    expect(v.economiaMensal).toBe(44_000)
    expect(v.economiaAnual).toBe(44_000 * 12)
  })

  it('o custo por km sai dos dois lados', () => {
    expect(v.custoPorKmCombustao).toBe(60)
    expect(v.custoPorKmEletrico).toBe(16)
  })

  /**
   * Com energia cara e consumo ruim, o elétrico pode sair mais caro — e a
   * calculadora precisa dizer isso em vez de supor que ele sempre ganha.
   */
  it('o elétrico pode sair mais caro, e o sinal inverte', () => {
    const caro = compararEletricoVsCombustao(
      { ...CARROS, tarifaKwh: centavos(300), consumoEletrico: 300 },
      REF,
    )
    if (!caro.ok) throw new Error('esperado sucesso')
    expect(caro.valores.economiaMensal).toBeLessThan(0)
    expect(caro.valores.mesesParaPagarADiferenca).toBe(0)
  })

  it('a diferença de preço se paga na proporção da economia', () => {
    const com = compararEletricoVsCombustao(
      { ...CARROS, diferencaDePreco: centavos(4_400_000) },
      REF,
    )
    if (!com.ok) throw new Error('esperado sucesso')
    // R$ 44.000,00 ÷ R$ 440,00 por mês = 100 meses
    expect(com.valores.mesesParaPagarADiferenca).toBe(100)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(compararEletricoVsCombustao({ ...CARROS, kmPorMes: 0 }, REF).ok).toBe(false)
    expect(compararEletricoVsCombustao({ ...CARROS, consumoEletrico: 0 }, REF).ok).toBe(false)
  })

  it('a coluna do resultado fecha', () => {
    const r = calcularEletricoDef(
      {
        kmPorMes: 1_000,
        consumoCombustao: 1_000,
        precoLitro: 600,
        consumoEletrico: 500,
        tarifaKwh: 80,
      },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const [combustao, eletrico, diferenca] = r.valores.detalhamento
    expect((combustao?.valor ?? 0) - (eletrico?.valor ?? 0)).toBe(diferenca?.valor)
  })
})

// ---------------------------------------------------------------------------
// CALC-068 — Botijão de gás
// ---------------------------------------------------------------------------

const BOTIJAO = {
  precoDoBotijao: centavos(12_000),
  duracaoDias: 60,
  massaKg: 1_300,
}

describe('CALC-068 · o custo do gás', () => {
  const r = calcularBotijao(BOTIJAO, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('R$ 120,00 em 60 dias são R$ 2,00 por dia', () => {
    expect(v.custoPorDia).toBe(200)
  })

  it('e R$ 60,00 por mês de trinta dias', () => {
    expect(v.custoPorMes).toBe(6_000)
    expect(v.custoPorAno).toBe(6_000 * 12)
  })

  it('R$ 120,00 por 13 kg dão R$ 9,23 por quilo', () => {
    expect(v.custoPorKg).toBe(923)
  })

  /**
   * A afirmação que a página faz sobre o mundo: botijão menor mais barato sai
   * mais caro por quilo. Aqui ela é verificada com os dois preços informados.
   */
  it('o botijão de 8 kg mais barato sai mais caro por quilo', () => {
    const menor = calcularBotijao(
      { precoDoBotijao: centavos(9_000), duracaoDias: 40, massaKg: 800 },
      REF,
    )
    if (!menor.ok) throw new Error('esperado sucesso')
    expect(menor.valores.custoPorKg).toBeGreaterThan(v.custoPorKg)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularBotijao({ ...BOTIJAO, precoDoBotijao: centavos(0) }, REF).ok).toBe(false)
    expect(calcularBotijao({ ...BOTIJAO, duracaoDias: 0 }, REF).ok).toBe(false)
  })

  it('a definição publicada calcula com o que a tela entrega', () => {
    const r2 = calcularBotijaoDef({ preco: 12_000, duracaoDias: 60, massaKg: 1_300 }, REF)
    if (!r2.ok) throw new Error('esperado sucesso')
    expect(r2.valores.principal).toBe(6_000)
  })
})
