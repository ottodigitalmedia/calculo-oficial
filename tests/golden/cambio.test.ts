/**
 * Casos-ouro de CALC-062 — conversor de moeda com IOF.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * **Não há alíquota de IOF cadastrada neste sistema, e não é por esquecimento.**
 * A fonte oficial não resolve qual redação do art. 15-B do Decreto nº
 * 6.306/2007 está em vigor — ver `ESTADO-DO-PROJETO` §7.33. A alíquota é campo,
 * e por isso os casos abaixo a informam explicitamente: eles conferem a
 * ARITMÉTICA, e nenhum deles afirma qual alíquota se aplica a quem.
 *
 * Os números foram escolhidos para fechar de cabeça:
 *
 *   1.000 unidades a R$ 5,00 são R$ 5.000,00.
 *   4% de spread são R$ 200,00; 6% de IOF sobre R$ 5.200,00 são R$ 312,00.
 *
 * O caso mais importante é o da **cotação efetiva**: é o número que a página
 * coloca em destaque, e ele precisa fechar com o total que a coluna soma.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/cambio'
import { calcularCambio, type EntradaCambio } from '../../src/lib/engine/calculadoras/cambio'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

/** Mil unidades a R$ 5,00, com 4% de spread e 6% de IOF. */
const BASE: EntradaCambio = {
  valorEmMoeda: 100_000,
  cotacao: centavos(500),
  spreadBp: basisPoints(400),
  iofBp: basisPoints(600),
  tarifa: centavos(0),
}

function cambioOuFalhar(entrada: EntradaCambio) {
  const r = calcularCambio(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-062 · a conta, camada a camada', () => {
  const v = cambioOuFalhar(BASE).valores

  it('mil unidades a R$ 5,00 são R$ 5.000,00 pela cotação nua', () => {
    expect(v.valorPelaCotacao).toBe(500_000)
  })

  it('4% de spread são R$ 200,00', () => {
    expect(v.spread).toBe(20_000)
  })

  /** O IOF incide sobre o valor da operação, que já inclui o spread. */
  it('6% de IOF incidem sobre os R$ 5.200,00, e não sobre os R$ 5.000,00', () => {
    expect(v.iof).toBe(31_200)
  })

  it('o total soma as três camadas', () => {
    expect(v.custoTotal).toBe(500_000 + 20_000 + 31_200)
  })
})

/**
 * O número que a página existe para mostrar.
 */
describe('CALC-062 · a cotação efetiva', () => {
  const v = cambioOuFalhar(BASE).valores

  it('é o total dividido pela moeda recebida', () => {
    // R$ 5.512,00 ÷ 1.000 = R$ 5,512 → R$ 5,51 ao centavo
    expect(v.cotacaoEfetiva).toBe(551)
  })

  it('fica acima da cotação de tela, e o percentual mede a distância', () => {
    expect(v.cotacaoEfetiva).toBeGreaterThan(BASE.cotacao)
    // 5,51 contra 5,00 é 10,20%
    expect(v.acrescimoBp).toBe(1_020)
  })

  it('sem custo nenhum, a efetiva é a própria cotação', () => {
    const limpo = cambioOuFalhar({
      ...BASE,
      spreadBp: basisPoints(0),
      iofBp: basisPoints(0),
    }).valores
    expect(limpo.cotacaoEfetiva).toBe(BASE.cotacao)
    expect(limpo.acrescimoBp).toBe(0)
  })

  it('a tarifa também entra na cotação efetiva', () => {
    const comTarifa = cambioOuFalhar({ ...BASE, tarifa: centavos(3_000) }).valores
    expect(comTarifa.custoTotal).toBe(551_200 + 3_000)
    expect(comTarifa.cotacaoEfetiva).toBeGreaterThan(551)
  })
})

/**
 * O que a calculadora NÃO faz, e que precisa continuar não fazendo.
 */
describe('CALC-062 · nenhuma alíquota de IOF é assumida', () => {
  it('sem alíquota informada, não há imposto na conta', () => {
    const v = cambioOuFalhar({ ...BASE, iofBp: basisPoints(0) }).valores
    expect(v.iof).toBe(0)
    expect(v.custoTotal).toBe(520_000)
  })

  it('e a etapa do imposto não existe quando ele é zero', () => {
    const rotulos = cambioOuFalhar({ ...BASE, iofBp: basisPoints(0) }).traco.etapas.map(
      (e) => e.rotulo,
    )
    expect(rotulos).not.toContain('IOF sobre a operação')
  })

  /**
   * A memória precisa dizer de onde a alíquota veio — e ela veio do usuário.
   * Se algum dia alguém cadastrar um valor legal aqui, esta asserção falha, que
   * é o comportamento desejado: quem cadastrar terá de resolver a fonte antes.
   */
  it('a etapa do imposto declara que a alíquota é informada, não cadastrada', () => {
    const etapa = cambioOuFalhar(BASE).traco.etapas.find((e) => e.rotulo === 'IOF sobre a operação')
    expect(etapa?.justificativa).toContain('que VOCÊ informou')
    expect(etapa?.parametro).toBeUndefined()
  })

  it('o traço não aplica vigência nenhuma', () => {
    expect(cambioOuFalhar(BASE).traco.vigenciasAplicadas).toEqual([])
  })
})

describe('CALC-062 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularCambio({ ...BASE, valorEmMoeda: 0 }, REF).ok).toBe(false)
    expect(calcularCambio({ ...BASE, cotacao: centavos(0) }, REF).ok).toBe(false)
  })

  it('valores negativos são recusados', () => {
    expect(calcularCambio({ ...BASE, spreadBp: basisPoints(-1) }, REF).ok).toBe(false)
    expect(calcularCambio({ ...BASE, iofBp: basisPoints(-1) }, REF).ok).toBe(false)
    expect(calcularCambio({ ...BASE, tarifa: centavos(-1) }, REF).ok).toBe(false)
  })
})

describe('CALC-062 · a coluna do resultado fecha', () => {
  it('as camadas somam o custo total exibido', () => {
    const r = calcular(
      { valorEmMoeda: 100_000, cotacao: 500, spread: 400, iof: 600, tarifa: 3_000 },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const linhas = r.valores.detalhamento
    const soma = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(soma).toBe(linhas[linhas.length - 1]?.valor)
    expect(r.valores.principal).toBe(linhas[linhas.length - 1]?.valor)
  })

  it('custo não informado não vira linha zerada', () => {
    const r = calcular({ valorEmMoeda: 100_000, cotacao: 500 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.detalhamento).toHaveLength(2)
    expect(r.valores.detalhamento.every((l) => l.valor !== 0)).toBe(true)
  })
})
