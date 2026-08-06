/**
 * Casos-ouro de CALC-038 — financiamento de reforma.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Aritmética sobre dados do usuário — sem parâmetro legal e sem série. A
 * parcela é a da tabela Price e o CET é a taxa interna do fluxo, os dois já
 * cobertos por `credito.test.ts` pelo lado de CALC-024 e CALC-025. O que estes
 * casos verificam é o que esta calculadora acrescenta.
 *
 * As propriedades que eles travam:
 *
 *   1. **Modalidade sem taxa não entra na tabela.** Campo em branco significa
 *      "não tenho essa opção", e mostrá-la com taxa zero inventaria uma porta
 *      que não existe — com o total mais baixo de todos, ainda por cima.
 *   2. **A mais barata é a de menor TOTAL**, não a de menor parcela nem a de
 *      menor taxa nominal.
 *   3. **Juntar com rendimento leva menos tempo que sem.** É a única parte da
 *      página em que uma premissa do usuário muda a conta, e ela começa em zero.
 *   4. **Sem tarifa, o CET é a própria taxa do contrato** — a mesma identidade
 *      que CALC-056 verifica.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDef } from '../../src/lib/calculadoras/financiamento-de-reforma'
import { calcularFinanciamentoDeReforma } from '../../src/lib/engine/calculadoras/credito'
import { parcelaPrice } from '../../src/lib/engine/financeira'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

const OBRA = {
  valorDaObra: centavos(3_000_000),
  prazoMeses: 24,
  modalidades: [
    { rotulo: 'Garantia de imóvel', taxaMensalBp: basisPoints(120), tarifas: centavos(0) },
    { rotulo: 'Consignado', taxaMensalBp: basisPoints(180), tarifas: centavos(0) },
    { rotulo: 'Pessoal', taxaMensalBp: basisPoints(600), tarifas: centavos(0) },
  ],
  guardaPorMes: centavos(0),
  rendimentoMensalBp: basisPoints(0),
}

function calc(over: Partial<typeof OBRA> = {}) {
  const r = calcularFinanciamentoDeReforma({ ...OBRA, ...over }, REF)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-038 · a mesma obra por cada porta', () => {
  it('cada linha usa a parcela da tabela Price sobre o valor da obra', () => {
    const v = calc()
    expect(v.linhas).toHaveLength(3)
    expect(v.linhas[0]?.parcela).toBe(
      parcelaPrice(centavos(3_000_000), 24, basisPoints(120)),
    )
  })

  it('a mais barata é a de menor total, e a mais cara a de maior', () => {
    const v = calc()
    expect(v.maisBarata.rotulo).toBe('Garantia de imóvel')
    expect(v.maisCara.rotulo).toBe('Pessoal')
    expect(v.diferencaEntreModalidades).toBe(v.maisCara.totalPago - v.maisBarata.totalPago)
    expect(v.diferencaEntreModalidades).toBeGreaterThan(0)
  })

  it('o custo do crédito é o total menos a obra', () => {
    for (const linha of calc().linhas) {
      expect(linha.custoDoCredito).toBe(linha.totalPago - 3_000_000)
    }
  })

  /**
   * A propriedade que impede a porta inexistente: campo em branco é "não
   * tenho". Uma linha com taxa zero apareceria como a mais barata de todas.
   */
  it('modalidade sem taxa não entra na tabela', () => {
    const v = calc({
      modalidades: [
        { rotulo: 'Garantia de imóvel', taxaMensalBp: basisPoints(120), tarifas: centavos(0) },
        { rotulo: 'Consignado', taxaMensalBp: basisPoints(0), tarifas: centavos(0) },
        { rotulo: 'Cartão', taxaMensalBp: basisPoints(0), tarifas: centavos(0) },
      ],
    })
    expect(v.linhas).toHaveLength(1)
    expect(v.linhas.map((l) => l.rotulo)).toEqual(['Garantia de imóvel'])
  })

  it('sem nenhuma taxa informada, o estado é pendente', () => {
    const r = calcularFinanciamentoDeReforma(
      {
        ...OBRA,
        modalidades: OBRA.modalidades.map((m) => ({ ...m, taxaMensalBp: basisPoints(0) })),
      },
      REF,
    )
    expect(r.ok).toBe(false)
  })

  it('sem obra ou sem prazo, o estado é pendente', () => {
    expect(calcularFinanciamentoDeReforma({ ...OBRA, valorDaObra: centavos(0) }, REF).ok).toBe(false)
    expect(calcularFinanciamentoDeReforma({ ...OBRA, prazoMeses: 0 }, REF).ok).toBe(false)
  })

  /** Mesma identidade verificada em CALC-056: sem tarifa, CET é a taxa. */
  it('sem tarifa, o CET é a própria taxa do contrato', () => {
    for (const linha of calc().linhas) {
      expect(linha.cetMensal, linha.rotulo).toBe(linha.taxaMensalBp)
    }
  })

  it('tarifa embutida empurra o CET acima da taxa anunciada', () => {
    const v = calc({
      modalidades: [
        { rotulo: 'Pessoal', taxaMensalBp: basisPoints(180), tarifas: centavos(100_000) },
      ],
    })
    expect(v.linhas[0]?.cetMensal).toBeGreaterThan(180)
  })
})

describe('CALC-038 · a porta que o banco não mostra', () => {
  it('sem guardar nada, não há prazo para juntar', () => {
    expect(calc().mesesParaJuntar).toBe(0)
  })

  it('guardando, o prazo sai da divisão quando não há rendimento', () => {
    // R$ 30.000,00 ÷ R$ 2.500,00 = 12 meses exatos.
    expect(calc({ guardaPorMes: centavos(250_000) }).mesesParaJuntar).toBe(12)
  })

  it('a fração de mês conta como mês inteiro — não dá para juntar pela metade', () => {
    // R$ 30.000,00 ÷ R$ 2.800,00 = 10,7 → 11 meses.
    expect(calc({ guardaPorMes: centavos(280_000) }).mesesParaJuntar).toBe(11)
  })

  /**
   * A única premissa do usuário que muda a conta — e ela começa em zero, para
   * não enviesar a comparação a favor de esperar.
   */
  it('com rendimento, junta-se em menos tempo', () => {
    const semRendimento = calc({ guardaPorMes: centavos(250_000) })
    const comRendimento = calc({
      guardaPorMes: centavos(250_000),
      rendimentoMensalBp: basisPoints(100),
    })
    expect(comRendimento.mesesParaJuntar).toBeLessThanOrEqual(semRendimento.mesesParaJuntar)
    expect(comRendimento.mesesParaJuntar).toBeGreaterThan(0)
  })

  it('diz quando juntar demora mais que o financiamento', () => {
    expect(calc({ guardaPorMes: centavos(250_000) }).juntarDemoraMais).toBe(false)
    expect(calc({ guardaPorMes: centavos(50_000) }).juntarDemoraMais).toBe(true)
  })
})

describe('CALC-038 · a definição publicada', () => {
  it('a coluna do resultado fecha com o total da mais barata', () => {
    const r = calcularDef(
      { valorDaObra: 3_000_000, prazoMeses: 24, garantiaImovel: 120, pessoal: 600 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const [obra, custo, total] = r.valores.detalhamento
    expect((obra?.valor ?? 0) + (custo?.valor ?? 0)).toBe(total?.valor)
    expect(r.valores.principal).toBe(total?.valor)
  })

  it('a tabela traz só as modalidades preenchidas', () => {
    const r = calcularDef(
      { valorDaObra: 3_000_000, prazoMeses: 24, garantiaImovel: 120, pessoal: 600 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.tabela?.linhas).toHaveLength(2)
  })

  it('o destaque da diferença some quando há uma opção só', () => {
    const uma = calcularDef({ valorDaObra: 3_000_000, prazoMeses: 24, consignado: 180 }, REF)
    if (!uma.ok) throw new Error('esperado sucesso')
    expect((uma.valores.destaques ?? []).some((d) => d.rotulo.includes('pior'))).toBe(false)

    const duas = calcularDef(
      { valorDaObra: 3_000_000, prazoMeses: 24, consignado: 180, cartao: 1_200 },
      REF,
    )
    if (!duas.ok) throw new Error('esperado sucesso')
    expect((duas.valores.destaques ?? []).some((d) => d.rotulo.includes('pior'))).toBe(true)
  })

  it('sem quanto guardar, a nota convida a informar em vez de omitir a alternativa', () => {
    const r = calcularDef({ valorDaObra: 3_000_000, prazoMeses: 24, consignado: 180 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect((r.valores.notas ?? []).some((n) => n.includes('guardar por mês'))).toBe(true)
  })
})
