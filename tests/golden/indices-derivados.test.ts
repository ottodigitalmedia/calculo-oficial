/**
 * Casos-ouro de CALC-061, CALC-063 e CALC-037.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As três reaproveitam `corrigirPorIndice`, cujo caso-ouro está em
 * `correcao-por-indice.test.ts` e usa série sintética pelo motivo explicado lá.
 * Aqui o que se confere é o que **cada uma acrescenta** ao motor comum:
 *
 *   CALC-061 — a direção inversa, e que a perda NÃO é o simétrico da inflação.
 *   CALC-063 — a comparação com o reajuste oferecido, feita em reais.
 *   CALC-037 — a diferença projetada em doze meses.
 *
 * O caso mais importante do arquivo é o da perda de poder de compra: 60% de
 * inflação são 37,5% de perda, e confundir os dois é o erro clássico do assunto.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularPoder } from '../../src/lib/calculadoras/poder-de-compra'
import { calcular as calcularAluguel } from '../../src/lib/calculadoras/reajuste-aluguel'
import { calcular as calcularSalario } from '../../src/lib/calculadoras/reajuste-salarial'
import { corrigirPorIndice } from '../../src/lib/engine/calculadoras/indices'
import { centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// A direção inversa, no motor
// ---------------------------------------------------------------------------

describe('motor · corrigir e deflacionar são a mesma conta, em direções opostas', () => {
  /** Um mês que acumula exatamente 60%: fator 1,6 sobre o valor de partida. */
  const sessentaPorCento = {
    inicio: '2020-01',
    valores: [0, 600_000],
  }

  const r = corrigirPorIndice(
    {
      valorOriginal: centavos(100_000),
      de: '2020-01',
      ate: '2020-02',
      serie: sessentaPorCento,
      nomeDoIndice: 'Índice de teste',
    },
    REF,
  )
  if (!r.ok) throw new Error('esperado sucesso')

  it('60% de inflação levam R$ 1.000,00 a R$ 1.600,00', () => {
    expect(r.valores.variacaoBp).toBe(6_000)
    expect(r.valores.valorCorrigido).toBe(160_000)
  })

  /**
   * O número que a página existe para desfazer: a perda **não** é 60%.
   * 1 − 1/1,6 = 0,375.
   */
  it('mas a perda de poder de compra é 37,5%, e não 60%', () => {
    expect(r.valores.perdaDePoderBp).toBe(3_750)
    expect(r.valores.valorDeflacionado).toBe(62_500)
  })

  it('deflacionar é dividir pelo mesmo fator que corrigir multiplica', () => {
    expect(r.valores.valorCorrigido * r.valores.valorDeflacionado).toBe(100_000 * 100_000)
  })

  it('sem meses aplicados, as duas direções devolvem o próprio valor', () => {
    const parado = corrigirPorIndice(
      {
        valorOriginal: centavos(100_000),
        de: '2020-01',
        ate: '2020-01',
        serie: sessentaPorCento,
        nomeDoIndice: 'Índice de teste',
      },
      REF,
    )
    if (!parado.ok) throw new Error('esperado sucesso')
    expect(parado.valores.valorCorrigido).toBe(100_000)
    expect(parado.valores.valorDeflacionado).toBe(100_000)
    expect(parado.valores.perdaDePoderBp).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// As três, sobre a série real do repositório
// ---------------------------------------------------------------------------

const PERIODO = { de: '2015-01-01', ate: '2020-01-01' }

describe('CALC-061 · poder de compra', () => {
  const r = calcularPoder({ valor: 100_000, indice: 'ipca', ...PERIODO }, REF)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)

  it('o equivalente de hoje é maior que o valor de então', () => {
    expect(r.valores.principal).toBeGreaterThan(100_000)
  })

  it('a coluna fecha: valor de então mais inflação é o equivalente', () => {
    const [entao, inflacao, hoje] = r.valores.detalhamento
    expect((entao?.valor ?? 0) + (inflacao?.valor ?? 0)).toBe(hoje?.valor)
    expect(r.valores.principal).toBe(hoje?.valor)
  })

  it('mostra os dois sentidos, nomeados', () => {
    const rotulos = r.valores.destaques?.map((d) => d.rotulo) ?? []
    expect(rotulos).toContain('Perda de poder de compra')
    expect(rotulos.some((x) => x.includes('compraria, na época'))).toBe(true)
  })
})

describe('CALC-063 · reajuste de salário', () => {
  it('sem proposta, mostra só a reposição', () => {
    const r = calcularSalario({ salario: 300_000, indice: 'inpc', ...PERIODO }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.valores.destaques?.map((d) => d.rotulo) ?? []
    expect(rotulos).not.toContain('Salário com o reajuste oferecido')
    expect(r.valores.principal).toBeGreaterThan(300_000)
  })

  /**
   * A comparação é feita em REAIS, e não entre percentuais. Uma proposta
   * generosa tem de aparecer como ganho; uma curta, como perda.
   */
  it('proposta acima da inflação vira ganho real', () => {
    const r = calcularSalario(
      { salario: 300_000, indice: 'inpc', ...PERIODO, reajusteOferecido: 9_000 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.valores.destaques?.map((d) => d.rotulo) ?? []
    expect(rotulos).toContain('Ganho real sobre a inflação')
  })

  it('proposta abaixo da inflação vira perda real', () => {
    const r = calcularSalario(
      { salario: 300_000, indice: 'inpc', ...PERIODO, reajusteOferecido: 100 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.valores.destaques?.map((d) => d.rotulo) ?? []
    expect(rotulos).toContain('Perda real para a inflação')
  })

  it('a coluna fecha', () => {
    const r = calcularSalario({ salario: 300_000, indice: 'inpc', ...PERIODO }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const [antes, reposicao, depois] = r.valores.detalhamento
    expect((antes?.valor ?? 0) + (reposicao?.valor ?? 0)).toBe(depois?.valor)
  })
})

describe('CALC-037 · reajuste de aluguel', () => {
  const r = calcularAluguel({ aluguel: 200_000, indice: 'igpm', ...PERIODO }, REF)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)

  it('a coluna fecha: aluguel atual mais reajuste é o novo', () => {
    const [atual, reajuste, novo] = r.valores.detalhamento
    expect((atual?.valor ?? 0) + (reajuste?.valor ?? 0)).toBe(novo?.valor)
    expect(r.valores.principal).toBe(novo?.valor)
  })

  it('projeta a diferença em doze meses', () => {
    const mensal = r.valores.detalhamento[1]?.valor ?? 0
    expect(mensal).toBeGreaterThan(0)
    const anual = r.valores.destaques?.find((d) => d.rotulo === 'Diferença em doze meses')
    expect(anual).toBeDefined()
  })

  /**
   * O IGP-M e o IPCA divergem muito, e o contrato é quem decide. Trocar o índice
   * tem de mudar o resultado — se não mudasse, o campo seria decorativo.
   */
  it('trocar o índice muda o resultado, porque é o contrato que manda', () => {
    const comIpca = calcularAluguel({ aluguel: 200_000, indice: 'ipca', ...PERIODO }, REF)
    if (!comIpca.ok) throw new Error('esperado sucesso')
    expect(comIpca.valores.principal).not.toBe(r.valores.principal)
  })
})

describe('as três recusam mês não publicado, como CALC-060', () => {
  const futuro = { de: '2020-01-01', ate: '2030-01-01' }

  it('poder de compra', () => {
    expect(calcularPoder({ valor: 100_000, indice: 'ipca', ...futuro }, REF).ok).toBe(false)
  })

  it('reajuste de salário', () => {
    expect(calcularSalario({ salario: 300_000, indice: 'inpc', ...futuro }, REF).ok).toBe(false)
  })

  it('reajuste de aluguel', () => {
    expect(calcularAluguel({ aluguel: 200_000, indice: 'igpm', ...futuro }, REF).ok).toBe(false)
  })
})
