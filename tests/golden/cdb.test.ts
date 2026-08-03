/**
 * Casos-ouro de CALC-039 — CDB, LCI e LCA.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * **Nenhuma tabela nova entrou no sistema por causa desta calculadora.** O
 * imposto é o de CALC-018, cujos parâmetros já estão em `lib/params/` com
 * vigência e fonte, e cujos casos-ouro estão em `renda-fixa.test.ts`. O que se
 * confere aqui é o que ela acrescenta: a conversão de "% do CDI" em taxa ao ano,
 * e a consequência disso no líquido.
 *
 * O caso mais importante do arquivo é o da comparação entre isento e tributado —
 * e ele **corrigiu o texto da calculadora**. A nota dizia que o isento supera
 * "em prazo curto", sugerindo uma virada próxima; a medição mostrou que, com
 * CDI a 10% ao ano, o isento a 95% ganha do tributado a 105% em TODO prazo até
 * cerca de dez anos, e que a vantagem dele **cresce** nesse intervalo.
 *
 * Afirmação sobre o mundo, neste projeto, tem teste — e quando o teste discorda
 * do texto, é o texto que muda.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/cdb'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

const BASE = {
  valorAplicado: 10_000_000,
  percentualDoCdi: 10_000,
  taxaCdi: 1_000,
  produto: 'tributado',
  prazoMeses: 12,
}

function calcularOuFalhar(valores: Record<string, number | string>) {
  const r = calcular(valores, REF)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r
}

describe('CALC-039 · a conversão de "% do CDI" em taxa ao ano', () => {
  it('100% do CDI é o próprio CDI', () => {
    const r = calcularOuFalhar(BASE)
    const taxa = r.valores.destaques?.find((d) => d.rotulo === 'Taxa efetiva ao ano')
    expect(taxa?.valor).toBe('10,00%')
  })

  it('110% de 10% ao ano dão 11,00%', () => {
    const r = calcularOuFalhar({ ...BASE, percentualDoCdi: 11_000 })
    const taxa = r.valores.destaques?.find((d) => d.rotulo === 'Taxa efetiva ao ano')
    expect(taxa?.valor).toBe('11,00%')
  })

  it('mais percentual do CDI, mais dinheiro no fim', () => {
    const cem = calcularOuFalhar(BASE).valores.principal
    const cento10 = calcularOuFalhar({ ...BASE, percentualDoCdi: 11_000 }).valores.principal
    expect(cento10).toBeGreaterThan(cem)
  })
})

describe('CALC-039 · o imposto e a coluna da tela', () => {
  it('produto tributado tem linha de imposto; isento não tem', () => {
    const tributado = calcularOuFalhar(BASE)
    const isento = calcularOuFalhar({ ...BASE, produto: 'isento' })

    expect(tributado.valores.detalhamento.some((l) => l.rotulo === 'Imposto de renda')).toBe(true)
    expect(isento.valores.detalhamento.some((l) => l.rotulo === 'Imposto de renda')).toBe(false)
  })

  it('a coluna fecha: aplicado mais rendimento menos imposto é o líquido', () => {
    const r = calcularOuFalhar(BASE)
    const linhas = r.valores.detalhamento
    const soma = linhas
      .slice(0, -1)
      .reduce((t, l) => (l.sinal === 'debito' ? t - l.valor : t + l.valor), 0)
    expect(soma).toBe(linhas[linhas.length - 1]?.valor)
    expect(r.valores.principal).toBe(linhas[linhas.length - 1]?.valor)
  })

  it('com a mesma taxa, o isento entrega mais', () => {
    const tributado = calcularOuFalhar(BASE).valores.principal
    const isento = calcularOuFalhar({ ...BASE, produto: 'isento' }).valores.principal
    expect(isento).toBeGreaterThan(tributado)
  })
})

/**
 * A afirmação que a página faz sobre o mundo — e por isso a que precisa de
 * teste, não de confiança.
 */
describe('CALC-039 · o ponto de virada entre isento e tributado', () => {
  const isento95 = { ...BASE, produto: 'isento', percentualDoCdi: 9_500 }
  const tributado105 = { ...BASE, produto: 'tributado', percentualDoCdi: 10_500 }

  const distancia = (meses: number) =>
    calcularOuFalhar({ ...isento95, prazoMeses: meses }).valores.principal -
    calcularOuFalhar({ ...tributado105, prazoMeses: meses }).valores.principal

  it('o isento ganha em todo prazo até dez anos', () => {
    for (const meses of [3, 6, 12, 24, 48, 120]) {
      expect(distancia(meses), `${meses} meses`).toBeGreaterThan(0)
    }
  })

  /**
   * **A primeira versão deste teste afirmava o contrário, e estava errada.**
   *
   * A intuição diz que a vantagem do isento encolhe, porque a alíquota do
   * imposto cai com o prazo. O que ela esquece é que a base sobre a qual o
   * imposto incide cresce mais rápido do que a alíquota cai — então, em reais,
   * a distância AUMENTA ao longo de todo o intervalo útil.
   *
   * A medição corrigiu a nota da calculadora junto com o teste: o texto dizia
   * "supera em prazo curto" e sugeria uma virada próxima, quando ela só aparece
   * depois de uma década.
   */
  it('e a vantagem CRESCE em reais, ao contrário do que a intuição diz', () => {
    expect(distancia(48)).toBeGreaterThan(distancia(6))
    expect(distancia(120)).toBeGreaterThan(distancia(48))
  })
})

describe('CALC-039 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcular({ ...BASE, valorAplicado: 0 }, REF).ok).toBe(false)
    expect(calcular({ ...BASE, prazoMeses: 0 }, REF).ok).toBe(false)
  })

  it('a memória cita a fonte da tabela regressiva, que não é deste módulo', () => {
    const r = calcularOuFalhar(BASE)
    const comParametro = r.traco.etapas.filter((e) => e.parametro !== undefined)
    expect(comParametro.length).toBeGreaterThan(0)
    expect(r.traco.vigenciasAplicadas.length).toBeGreaterThan(0)
  })
})
