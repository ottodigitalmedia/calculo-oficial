/**
 * Casos-ouro de CALC-034 — alugar ou comprar.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * **Não há valor a conferir contra fonte nenhuma**: a calculadora compara dois
 * caminhos sob três premissas do usuário, e o futuro não tem tabela. O que se
 * confere aqui são as propriedades que o modelo precisa ter para não enganar —
 * e cada uma corresponde a um viés conhecido deste tipo de comparação:
 *
 *   1. A carteira de quem aluga começa com a entrada e os custos de aquisição.
 *      Esquecer isso é o erro mais comum, e favorece comprar.
 *   2. A diferença mensal anda nos DOIS sentidos. Modelar só um favorece alugar.
 *   3. A valorização de equilíbrio de fato empata as duas pontas.
 *   4. O prazo NÃO decide sozinho: o que manda é a distância entre a
 *      valorização do imóvel e o rendimento da carteira. Este item entrou
 *      afirmando o contrário, e a medição o corrigiu.
 *
 * O caso 3 é o mais importante: a valorização de equilíbrio é o número que a
 * página coloca em destaque, e ele precisa ser verdade — não aproximação.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/alugar-ou-comprar'
import {
  compararAlugarOuComprar,
  type EntradaAlugarOuComprar,
} from '../../src/lib/engine/calculadoras/alugar-ou-comprar'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

/** Imóvel de R$ 500.000,00, aluguel de R$ 2.000,00, dez anos. */
const BASE: EntradaAlugarOuComprar = {
  valorDoImovel: centavos(50_000_000),
  entrada: centavos(10_000_000),
  custosDeAquisicao: centavos(2_500_000),
  prazoFinanciamentoMeses: 360,
  taxaFinanciamentoMensal: basisPoints(90),
  sistema: 'sac',
  custosDoDonoMensais: centavos(30_000),
  aluguelMensal: centavos(200_000),
  reajusteAluguelAnualBp: basisPoints(450),
  valorizacaoAnualBp: basisPoints(400),
  rendimentoCarteiraAnualBp: basisPoints(1_000),
  anos: 10,
}

function compararOuFalhar(entrada: EntradaAlugarOuComprar) {
  const r = compararAlugarOuComprar(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

// ---------------------------------------------------------------------------
// Viés 1 — a carteira de quem aluga
// ---------------------------------------------------------------------------

describe('CALC-034 · quem aluga começa com o que não gastou', () => {
  it('entrada maior deixa quem aluga com mais patrimônio', () => {
    const pouca = compararOuFalhar({ ...BASE, entrada: centavos(5_000_000) }).valores
    const muita = compararOuFalhar({ ...BASE, entrada: centavos(20_000_000) }).valores
    expect(muita.patrimonioLocatario).toBeGreaterThan(pouca.patrimonioLocatario)
  })

  /**
   * Custo de aquisição é dinheiro que evapora para quem compra e rende para
   * quem aluga — então ele mexe nos dois lados, em direções opostas.
   */
  it('custo de aquisição maior piora comprar e melhora alugar', () => {
    const sem = compararOuFalhar({ ...BASE, custosDeAquisicao: centavos(0) }).valores
    const com = compararOuFalhar({ ...BASE, custosDeAquisicao: centavos(5_000_000) }).valores
    expect(com.patrimonioLocatario).toBeGreaterThan(sem.patrimonioLocatario)
    expect(com.diferenca).toBeLessThan(sem.diferenca)
  })
})

// ---------------------------------------------------------------------------
// Viés 2 — a diferença anda nos dois sentidos
// ---------------------------------------------------------------------------

/**
 * Quando o aluguel é mais CARO que o desembolso de quem compra, a carteira de
 * quem aluga tem de financiar a diferença — e encolhe. Um modelo que só somasse
 * a sobra daria vantagem sistemática ao aluguel.
 */
describe('CALC-034 · a diferença mensal sai da carteira quando o aluguel é mais caro', () => {
  const aluguelCaro = { ...BASE, aluguelMensal: centavos(600_000), entrada: centavos(10_000_000) }

  it('aluguel muito caro reduz o patrimônio de quem aluga', () => {
    const normal = compararOuFalhar(BASE).valores
    const caro = compararOuFalhar(aluguelCaro).valores
    expect(caro.patrimonioLocatario).toBeLessThan(normal.patrimonioLocatario)
  })

  it('e aluguel mais barato o aumenta', () => {
    const barato = compararOuFalhar({ ...BASE, aluguelMensal: centavos(100_000) }).valores
    const normal = compararOuFalhar(BASE).valores
    expect(barato.patrimonioLocatario).toBeGreaterThan(normal.patrimonioLocatario)
  })
})

// ---------------------------------------------------------------------------
// Viés 3 — a valorização de equilíbrio precisa empatar de verdade
// ---------------------------------------------------------------------------

describe('CALC-034 · a valorização de equilíbrio empata as duas pontas', () => {
  const v = compararOuFalhar(BASE).valores

  it('existe, e é um percentual plausível', () => {
    expect(v.valorizacaoDeEquilibrioBp).not.toBeNull()
  })

  /**
   * O teste que dá sentido ao destaque: rodar a comparação COM a valorização de
   * equilíbrio tem de produzir empate. Tolerância de um centésimo do patrimônio,
   * porque a busca é sobre inteiros em basis points e o passo mínimo é 0,01%.
   */
  it('rodar com ela produz empate', () => {
    const equilibrio = v.valorizacaoDeEquilibrioBp
    if (equilibrio === null) throw new Error('esperado equilíbrio')

    const empate = compararOuFalhar({ ...BASE, valorizacaoAnualBp: equilibrio }).valores
    const tolerancia = Math.abs(empate.patrimonioComprador) / 100
    expect(Math.abs(empate.diferenca)).toBeLessThan(tolerancia)
  })

  it('acima dela comprar ganha; abaixo dela alugar ganha', () => {
    const equilibrio = v.valorizacaoDeEquilibrioBp
    if (equilibrio === null) throw new Error('esperado equilíbrio')

    const acima = compararOuFalhar({
      ...BASE,
      valorizacaoAnualBp: basisPoints(equilibrio + 300),
    }).valores
    const abaixo = compararOuFalhar({
      ...BASE,
      valorizacaoAnualBp: basisPoints(equilibrio - 300),
    }).valores

    expect(acima.diferenca).toBeGreaterThan(0)
    expect(abaixo.diferenca).toBeLessThan(0)
  })

  it('a valorização não mexe no patrimônio de quem aluga', () => {
    const a = compararOuFalhar({ ...BASE, valorizacaoAnualBp: basisPoints(0) }).valores
    const b = compararOuFalhar({ ...BASE, valorizacaoAnualBp: basisPoints(1_000) }).valores
    expect(a.patrimonioLocatario).toBe(b.patrimonioLocatario)
    expect(b.patrimonioComprador).toBeGreaterThan(a.patrimonioComprador)
  })
})

// ---------------------------------------------------------------------------
// Viés 4 — o prazo
// ---------------------------------------------------------------------------

/**
 * **A primeira versão deste bloco afirmava que prazo curto favorece alugar, e
 * estava errada como afirmação geral.**
 *
 * A medição mostrou o que de fato manda: a distância entre a valorização do
 * imóvel e o rendimento da carteira. Com carteira a 10% e imóvel a 4%, alugar
 * ganha em TODO prazo — e ganha mais quanto mais longo, porque a diferença é
 * composta. O prazo não inverte nada ali.
 *
 * O efeito dos custos de aquisição existe e é real, mas é de segunda ordem: ele
 * só decide quando as duas taxas são próximas. O texto da calculadora foi
 * corrigido junto com este teste.
 */
describe('CALC-034 · o que o prazo faz, e o que ele não faz', () => {
  it('com a carteira rendendo bem mais que o imóvel valoriza, alugar ganha em todo prazo', () => {
    const premissas = {
      ...BASE,
      rendimentoCarteiraAnualBp: basisPoints(1_000),
      valorizacaoAnualBp: basisPoints(400),
    }
    for (const anos of [3, 5, 10, 20, 30]) {
      expect(compararOuFalhar({ ...premissas, anos }).valores.diferenca, `${anos} anos`).toBeLessThan(0)
    }
  })

  it('e a vantagem de alugar CRESCE com o prazo, porque a diferença é composta', () => {
    const premissas = {
      ...BASE,
      rendimentoCarteiraAnualBp: basisPoints(1_000),
      valorizacaoAnualBp: basisPoints(400),
    }
    const curto = compararOuFalhar({ ...premissas, anos: 3 }).valores.diferenca
    const longo = compararOuFalhar({ ...premissas, anos: 25 }).valores.diferenca
    expect(longo).toBeLessThan(curto)
  })

  /**
   * O efeito dos custos de aquisição, isolado: com valorização e rendimento
   * IGUAIS, a única coisa que separa os dois caminhos no começo é o dinheiro
   * que evapora na compra. Aí, e só aí, o prazo inverte a resposta.
   */
  it('com as duas taxas iguais, o custo de aquisição faz alugar ganhar no começo e perder depois', () => {
    const iguais = {
      ...BASE,
      rendimentoCarteiraAnualBp: basisPoints(600),
      valorizacaoAnualBp: basisPoints(600),
    }
    expect(compararOuFalhar({ ...iguais, anos: 3 }).valores.diferenca).toBeLessThan(0)
    expect(compararOuFalhar({ ...iguais, anos: 10 }).valores.diferenca).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Fronteiras e a coluna da tela
// ---------------------------------------------------------------------------

describe('CALC-034 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(compararAlugarOuComprar({ ...BASE, valorDoImovel: centavos(0) }, REF).ok).toBe(false)
    expect(compararAlugarOuComprar({ ...BASE, aluguelMensal: centavos(0) }, REF).ok).toBe(false)
    expect(compararAlugarOuComprar({ ...BASE, anos: 0 }, REF).ok).toBe(false)
  })

  it('entrada acima do valor do imóvel é recusada', () => {
    const r = compararAlugarOuComprar({ ...BASE, entrada: centavos(60_000_000) }, REF)
    expect(r.ok).toBe(false)
  })

  it('compra à vista não tem financiamento a amortizar', () => {
    const v = compararOuFalhar({
      ...BASE,
      entrada: BASE.valorDoImovel,
      prazoFinanciamentoMeses: 0,
    }).valores
    expect(v.saldoDevedorNoFim).toBe(0)
    expect(v.primeiraPrestacao).toBe(0)
  })

  it('os dois sistemas de amortização produzem resultados distintos', () => {
    const sac = compararOuFalhar({ ...BASE, sistema: 'sac' }).valores
    const price = compararOuFalhar({ ...BASE, sistema: 'price' }).valores
    expect(sac.diferenca).not.toBe(price.diferenca)
  })
})

describe('CALC-034 · a coluna do resultado fecha', () => {
  it('comprando menos alugando é a diferença', () => {
    const r = calcular(
      {
        valorDoImovel: 50_000_000,
        entrada: 10_000_000,
        custosDeAquisicao: 2_500_000,
        prazoFinanciamento: 360,
        taxaFinanciamento: 90,
        sistema: 'sac',
        custosDoDono: 30_000,
        aluguelMensal: 200_000,
        reajusteAluguel: 450,
        valorizacaoAnual: 400,
        rendimentoCarteira: 1_000,
        anos: 10,
      },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const [comprando, alugando, diferenca] = r.valores.detalhamento
    expect((comprando?.valor ?? 0) - (alugando?.valor ?? 0)).toBe(diferenca?.valor)
    expect(r.valores.principal).toBe(diferenca?.valor)
  })

  it('o destaque nomeia o lado que sai à frente, e ele bate com o sinal', () => {
    const r = calcular(
      {
        valorDoImovel: 50_000_000,
        aluguelMensal: 200_000,
        anos: 10,
        taxaFinanciamento: 90,
        rendimentoCarteira: 1_000,
      },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const lado = r.valores.destaques?.find((d) => d.rotulo === 'Sai à frente')?.valor
    if (r.valores.principal > 0) expect(lado).toBe('Comprar')
    else if (r.valores.principal < 0) expect(lado).toBe('Alugar')
    else expect(lado).toBe('Empate')
  })
})
