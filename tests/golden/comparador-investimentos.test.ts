/**
 * Casos-ouro de CALC-040 — Tesouro Selic, CDB ou poupança.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Nenhum motor novo entrou por causa desta calculadora: as três pernas saem de
 * `calcularRendaFixa` e `calcularJurosCompostos`, que já têm casos-ouro
 * próprios. O que se confere aqui é a **comparação** — que ela seja feita pelo
 * líquido, que a ordem responda ao prazo e ao percentual do CDI, e que a coluna
 * exibida seja a da perna vencedora.
 *
 * A taxa da poupança vem da série real e muda a cada coleta, então nenhum caso
 * fixa valor dela: o que se afirma é relação entre as três pernas.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/comparador-investimentos'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

const BASE = {
  valorAplicado: 10_000_000,
  prazoMeses: 12,
  taxaCdi: 1_000,
  percentualDoCdi: 10_000,
}

function calcularOuFalhar(valores: Record<string, number | string>) {
  const r = calcular(valores, REF)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r
}

describe('CALC-040 · a comparação é pelo líquido', () => {
  const r = calcularOuFalhar(BASE)

  it('traz as três aplicações na tabela', () => {
    expect(r.valores.tabela?.linhas.map((l) => l.rotulo)).toEqual([
      'CDB',
      'Tesouro Selic',
      'Poupança',
    ])
  })

  it('o resultado principal é o valor final da perna vencedora', () => {
    const melhor = Math.max(...(r.valores.tabela?.linhas.map((l) => l.valores[0] ?? 0) ?? []))
    expect(r.valores.principal).toBe(melhor)
  })

  it('a coluna do resultado fecha com a perna vencedora', () => {
    const [aplicado, rendimento, final] = r.valores.detalhamento
    expect((aplicado?.valor ?? 0) + (rendimento?.valor ?? 0)).toBe(final?.valor)
    expect(r.valores.principal).toBe(final?.valor)
  })

  it('o rendimento de cada linha é o valor final menos o aplicado', () => {
    for (const linha of r.valores.tabela?.linhas ?? []) {
      expect((linha.valores[0] ?? 0) - BASE.valorAplicado).toBe(linha.valores[1])
    }
  })
})

describe('CALC-040 · a ordem responde ao que foi informado', () => {
  it('CDB a 100% do CDI empata com o Tesouro Selic', () => {
    const linhas = calcularOuFalhar(BASE).valores.tabela?.linhas ?? []
    const cdb = linhas.find((l) => l.rotulo === 'CDB')?.valores[0]
    const tesouro = linhas.find((l) => l.rotulo === 'Tesouro Selic')?.valores[0]
    expect(cdb).toBe(tesouro)
  })

  it('CDB acima de 100% do CDI supera o Tesouro Selic', () => {
    const linhas = calcularOuFalhar({ ...BASE, percentualDoCdi: 12_000 }).valores.tabela?.linhas ?? []
    const cdb = linhas.find((l) => l.rotulo === 'CDB')?.valores[0] ?? 0
    const tesouro = linhas.find((l) => l.rotulo === 'Tesouro Selic')?.valores[0] ?? 0
    expect(cdb).toBeGreaterThan(tesouro)
  })

  it('CDB abaixo de 100% do CDI perde para o Tesouro Selic', () => {
    const linhas = calcularOuFalhar({ ...BASE, percentualDoCdi: 8_000 }).valores.tabela?.linhas ?? []
    const cdb = linhas.find((l) => l.rotulo === 'CDB')?.valores[0] ?? 0
    const tesouro = linhas.find((l) => l.rotulo === 'Tesouro Selic')?.valores[0] ?? 0
    expect(cdb).toBeLessThan(tesouro)
  })

  /**
   * A afirmação que o FAQ faz: a alíquota cai em degraus, então as aplicações
   * tributadas melhoram em relação à poupança conforme o prazo se alonga.
   */
  it('as tributadas ganham terreno sobre a poupança quando o prazo alonga', () => {
    const distancia = (meses: number) => {
      const linhas = calcularOuFalhar({ ...BASE, prazoMeses: meses }).valores.tabela?.linhas ?? []
      const cdb = linhas.find((l) => l.rotulo === 'CDB')?.valores[1] ?? 0
      const poupanca = linhas.find((l) => l.rotulo === 'Poupança')?.valores[1] ?? 0
      return cdb - poupanca
    }
    expect(distancia(48)).toBeGreaterThan(distancia(6))
  })
})

describe('CALC-040 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcular({ ...BASE, valorAplicado: 0 }, REF).ok).toBe(false)
    expect(calcular({ ...BASE, prazoMeses: 0 }, REF).ok).toBe(false)
  })

  it('a memória exibida é a da perna com imposto, que é a que tem o que explicar', () => {
    const r = calcularOuFalhar(BASE)
    expect(r.traco.etapas.some((e) => e.parametro !== undefined)).toBe(true)
    expect(r.traco.vigenciasAplicadas.length).toBeGreaterThan(0)
  })

  it('a taxa da poupança aparece com a data em que foi publicada', () => {
    const destaques = calcularOuFalhar(BASE).valores.destaques ?? []
    expect(destaques.some((d) => /Poupança publicada em \d{4}-\d{2}-\d{2}/.test(d.rotulo))).toBe(
      true,
    )
  })
})
