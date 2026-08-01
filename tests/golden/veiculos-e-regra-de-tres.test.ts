/**
 * Casos-ouro de CALC-071 (regra de três), CALC-055 (viagem) e CALC-057 (carro).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As três são aritmética: não há parâmetro legal nem fonte a consultar. Os
 * valores esperados foram escolhidos para fechar **de cabeça**, e é isso que os
 * torna conferíveis por quem ler o arquivo:
 *
 *   4 operários levam 12 dias; 6 operários levam 8 — inversa, e 12 × 4 ÷ 6 = 8.
 *   600 km a 12 km/l gastam 50 litros; a R$ 6,00 o litro, R$ 300,00.
 *   1.000 km por mês a 10 km/l gastam 100 litros, e R$ 600,00 de combustível.
 *
 * O caso mais importante do arquivo é o de CALC-057: as linhas mensais têm de
 * somar exatamente o total exibido, porque cada custo anual é dividido por doze
 * ANTES de somar. Somar e dividir no fim daria um total alguns centavos distante
 * da coluna — que é o defeito de `ESTADO-DO-PROJETO` §7.12.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDoCarro } from '../../src/lib/calculadoras/custo-do-carro'
import { calcular as calcularDaViagem } from '../../src/lib/calculadoras/viagem'
import {
  calcularRegraDeTres,
  type EntradaRegraDeTres,
} from '../../src/lib/engine/calculadoras/aritmetica'
import {
  calcularCustoDoCarro,
  calcularViagem,
  type EntradaCustoDoCarro,
  type EntradaViagem,
} from '../../src/lib/engine/calculadoras/veiculos'
import { centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-071 — Regra de três
// ---------------------------------------------------------------------------

/** 4 corresponde a 12; 6 corresponde a quanto? Tudo em centésimos. */
const PROPORCAO: EntradaRegraDeTres = {
  tipo: 'simples',
  a: 400,
  b: 1_200,
  c: 600,
  sentido: 'direta',
  a2: 0,
  c2: 0,
  sentido2: 'direta',
}

function regraOuFalhar(entrada: EntradaRegraDeTres) {
  const r = calcularRegraDeTres(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-071 · o sentido da grandeza muda tudo', () => {
  it('direta: 12 × 6 ÷ 4 = 18', () => {
    expect(regraOuFalhar(PROPORCAO).valores.resultado).toBe(1_800)
  })

  it('inversa: 12 × 4 ÷ 6 = 8', () => {
    expect(regraOuFalhar({ ...PROPORCAO, sentido: 'inversa' }).valores.resultado).toBe(800)
  })

  /**
   * A mesma entrada com sentidos diferentes devolve números distintos e
   * igualmente plausíveis — que é exatamente por que o sentido é campo, e não
   * palpite da calculadora.
   */
  it('a memória declara qual sentido foi aplicado', () => {
    const direta = regraOuFalhar(PROPORCAO).traco.etapas.map((e) => e.rotulo)
    const inversa = regraOuFalhar({ ...PROPORCAO, sentido: 'inversa' }).traco.etapas.map(
      (e) => e.rotulo,
    )
    expect(direta).toContain('Primeira grandeza — proporção direta')
    expect(inversa).toContain('Primeira grandeza — proporção inversa')
  })
})

describe('CALC-071 · composta aplica uma grandeza depois da outra', () => {
  /**
   * Quatro operários levantam um muro em 12 dias. Seis operários, um muro do
   * dobro do tamanho: operários é inversa, tamanho é direta.
   * 12 × (4 ÷ 6) × (2 ÷ 1) = 16 dias.
   */
  const composta = regraOuFalhar({
    tipo: 'composta',
    a: 400,
    b: 1_200,
    c: 600,
    sentido: 'inversa',
    a2: 100,
    c2: 200,
    sentido2: 'direta',
    })

  it('chega aos 16 dias', () => {
    expect(composta.valores.resultado).toBe(1_600)
  })

  it('expõe o valor intermediário, que é onde se confere o sentido', () => {
    expect(composta.valores.parcial).toBe(800)
    expect(composta.traco.etapas.map((e) => e.rotulo)).toContain(
      'Segunda grandeza — proporção direta',
    )
  })

  it('toda etapa sai em unidade de número, não de moeda', () => {
    for (const etapa of composta.traco.etapas) {
      expect(etapa.unidade, etapa.rotulo).toBe('numero')
    }
  })
})

describe('CALC-071 · fronteiras', () => {
  it('valor conhecido ausente mantém o estado pendente', () => {
    expect(calcularRegraDeTres({ ...PROPORCAO, a: 0 }, REF).ok).toBe(false)
    expect(calcularRegraDeTres({ ...PROPORCAO, b: 0 }, REF).ok).toBe(false)
    expect(calcularRegraDeTres({ ...PROPORCAO, c: 0 }, REF).ok).toBe(false)
  })

  it('na composta, a segunda grandeza também é exigida', () => {
    const semSegunda = { ...PROPORCAO, tipo: 'composta' as const }
    expect(calcularRegraDeTres(semSegunda, REF).ok).toBe(false)
  })

  it('valores iguais devolvem o próprio resultado, nos dois sentidos', () => {
    for (const sentido of ['direta', 'inversa'] as const) {
      const r = regraOuFalhar({ ...PROPORCAO, c: PROPORCAO.a, sentido })
      expect(r.valores.resultado).toBe(PROPORCAO.b)
    }
  })
})

// ---------------------------------------------------------------------------
// CALC-055 — Custo de viagem
// ---------------------------------------------------------------------------

/** 300 km de ida, ida e volta, 12 km/l, R$ 6,00 o litro, R$ 40,00 de pedágio. */
const VIAGEM: EntradaViagem = {
  distancia: 300,
  consumo: 1_200,
  precoLitro: centavos(600),
  idaEVolta: true,
  pedagios: centavos(4_000),
  pessoas: 4,
}

function viagemOuFalhar(entrada: EntradaViagem) {
  const r = calcularViagem(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-055 · a volta é metade da conta', () => {
  const v = viagemOuFalhar(VIAGEM).valores

  it('ida e volta dobram a distância', () => {
    expect(v.distanciaTotal).toBe(600)
    expect(viagemOuFalhar({ ...VIAGEM, idaEVolta: false }).valores.distanciaTotal).toBe(300)
  })

  it('600 km a 12 km/l são 50 litros', () => {
    expect(v.litros).toBe(5_000)
  })

  it('50 litros a R$ 6,00 são R$ 300,00', () => {
    expect(v.custoCombustivel).toBe(30_000)
  })

  it('com pedágio, R$ 340,00', () => {
    expect(v.custoTotal).toBe(34_000)
  })

  it('entre quatro pessoas, R$ 85,00 cada', () => {
    expect(v.custoPorPessoa).toBe(8_500)
  })

  it('e R$ 0,57 por quilômetro', () => {
    expect(v.custoPorQuilometro).toBe(57)
  })
})

describe('CALC-055 · o custo do combustível fecha com os litros exibidos', () => {
  /**
   * Quem confere "50 litros × R$ 6,00" na calculadora do celular precisa chegar
   * ao mesmo número da tela — por isso o custo é derivado dos litros já
   * arredondados, e não de uma fórmula direta que os ignoraria.
   */
  it('litros vezes preço reproduz o custo, ao centavo', () => {
    for (const consumo of [1_200, 875, 1_033]) {
      const v = viagemOuFalhar({ ...VIAGEM, consumo }).valores
      const conferido = Math.round((v.litros * 600) / 100)
      expect(Math.abs(v.custoCombustivel - conferido), `consumo ${consumo}`).toBeLessThanOrEqual(1)
    }
  })
})

describe('CALC-055 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularViagem({ ...VIAGEM, distancia: 0 }, REF).ok).toBe(false)
    expect(calcularViagem({ ...VIAGEM, consumo: 0 }, REF).ok).toBe(false)
    expect(calcularViagem({ ...VIAGEM, precoLitro: centavos(0) }, REF).ok).toBe(false)
  })

  it('viajar sozinho não divide nada', () => {
    const v = viagemOuFalhar({ ...VIAGEM, pessoas: 1 }).valores
    expect(v.custoPorPessoa).toBe(v.custoTotal)
  })

  it('sem pedágio, a etapa do pedágio não existe', () => {
    const rotulos = viagemOuFalhar({ ...VIAGEM, pedagios: centavos(0) }).traco.etapas.map(
      (e) => e.rotulo,
    )
    expect(rotulos).not.toContain('Com os pedágios')
  })
})

describe('CALC-055 · a coluna do resultado fecha', () => {
  it('combustível mais pedágio é a última linha', () => {
    const r = calcularDaViagem(
      {
        distancia: 300,
        trajeto: 'ida-e-volta',
        consumo: 1_200,
        precoLitro: 600,
        pedagios: 4_000,
        pessoas: 4,
      },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const linhas = r.valores.detalhamento
    const soma = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(soma).toBe(linhas[linhas.length - 1]?.valor)
    expect(r.valores.principal).toBe(34_000)
  })
})

// ---------------------------------------------------------------------------
// CALC-057 — Custo mensal de ter um carro
// ---------------------------------------------------------------------------

const CARRO: EntradaCustoDoCarro = {
  kmPorMes: 1_000,
  consumo: 1_000,
  precoLitro: centavos(600),
  ipvaAnual: centavos(120_000),
  seguroAnual: centavos(240_000),
  licenciamentoAnual: centavos(18_000),
  manutencaoAnual: centavos(120_000),
  depreciacaoAnual: centavos(600_000),
  estacionamentoMensal: centavos(0),
}

function carroOuFalhar(entrada: EntradaCustoDoCarro) {
  const r = calcularCustoDoCarro(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-057 · o que o posto mostra e o que o carro custa', () => {
  const v = carroOuFalhar(CARRO).valores

  it('1.000 km a 10 km/l são 100 litros, R$ 600,00 de combustível', () => {
    expect(v.litrosPorMes).toBe(10_000)
    expect(v.combustivelMensal).toBe(60_000)
  })

  it('cada custo anual entra dividido por doze', () => {
    expect(v.ipvaMensal).toBe(10_000)
    expect(v.seguroMensal).toBe(20_000)
    expect(v.licenciamentoMensal).toBe(1_500)
    expect(v.manutencaoMensal).toBe(10_000)
    expect(v.depreciacaoMensal).toBe(50_000)
  })

  it('o mês inteiro custa mais que o dobro do combustível', () => {
    expect(v.custoMensal).toBe(151_500)
    expect(v.custoMensal).toBeGreaterThan(v.combustivelMensal * 2)
  })

  it('doze meses e o custo por quilômetro derivam do mensal exibido', () => {
    expect(v.custoAnual).toBe(151_500 * 12)
    expect(v.custoPorQuilometro).toBe(152)
  })
})

/**
 * O caso que a divisão por doze existe para garantir.
 */
describe('CALC-057 · a soma das linhas mensais é o total, ao centavo', () => {
  it('vale para valores anuais que não dividem por doze', () => {
    const v = carroOuFalhar({
      ...CARRO,
      ipvaAnual: centavos(123_457),
      seguroAnual: centavos(99_991),
      licenciamentoAnual: centavos(17_777),
      manutencaoAnual: centavos(88_889),
      depreciacaoAnual: centavos(555_555),
    }).valores

    const soma =
      v.combustivelMensal +
      v.ipvaMensal +
      v.seguroMensal +
      v.licenciamentoMensal +
      v.manutencaoMensal +
      v.depreciacaoMensal
    expect(soma).toBe(v.custoMensal)
  })

  it('e vale na coluna que aparece na tela', () => {
    const r = calcularDoCarro(
      {
        kmPorMes: 1_000,
        consumo: 1_000,
        precoLitro: 600,
        ipvaAnual: 123_457,
        seguroAnual: 99_991,
        licenciamentoAnual: 17_777,
        manutencaoAnual: 88_889,
        depreciacaoAnual: 555_555,
        estacionamentoMensal: 35_000,
      },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const linhas = r.valores.detalhamento
    const soma = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(soma).toBe(linhas[linhas.length - 1]?.valor)
    expect(r.valores.principal).toBe(linhas[linhas.length - 1]?.valor)
  })

  it('custo não informado não vira linha zerada', () => {
    const r = calcularDoCarro({ kmPorMes: 1_000, consumo: 1_000, precoLitro: 600 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.detalhamento).toHaveLength(2)
    expect(r.valores.principal).toBe(60_000)
  })
})

describe('CALC-057 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularCustoDoCarro({ ...CARRO, kmPorMes: 0 }, REF).ok).toBe(false)
    expect(calcularCustoDoCarro({ ...CARRO, consumo: 0 }, REF).ok).toBe(false)
    expect(calcularCustoDoCarro({ ...CARRO, precoLitro: centavos(0) }, REF).ok).toBe(false)
  })

  it('sem custo anual nenhum, a etapa da divisão por doze não existe', () => {
    const rotulos = carroOuFalhar({
      ...CARRO,
      ipvaAnual: centavos(0),
      seguroAnual: centavos(0),
      licenciamentoAnual: centavos(0),
      manutencaoAnual: centavos(0),
      depreciacaoAnual: centavos(0),
    }).traco.etapas.map((e) => e.rotulo)
    expect(rotulos).not.toContain('Custos anuais, divididos por doze')
  })
})
