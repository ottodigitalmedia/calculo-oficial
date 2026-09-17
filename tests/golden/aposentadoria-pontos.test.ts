/**
 * CALC-103 — casos-ouro da regra de transição por pontos.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a EC nº 103/2019, art. 15 — 30
 * anos de contribuição para a mulher e 35 para o homem (inciso I), somatório de
 * idade e tempo de 86 pontos para a mulher e 96 para o homem (inciso II), com
 * acréscimo de um ponto por ano a partir de 1º/01/2020 até 100 e 105 (§ 1º), e
 * apuração com frações (§ 2º).
 *
 * A pontuação de cada ano está cadastrada como vigência própria, e os casos
 * abaixo conferem a tabela ano a ano: 2026 exige 93 pontos da mulher e 103 do
 * homem; o teto masculino de 105 é alcançado em 2028, e o feminino de 100 em
 * 2033.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularRegraDePontos,
  type EntradaRegraDePontos,
} from '../../src/lib/engine/calculadoras/aposentadoria-pontos'
import { PREVIDENCIA_RGPS } from '../../src/lib/params/data/previdencia-rgps'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS)
const REF = '2026-06-15' as DataISO

const BASE: EntradaRegraDePontos = {
  sexo: 'mulher',
  idadeAnos: 60,
  idadeMeses: 0,
  tempoContribuicaoAnos: 33,
  tempoContribuicaoMeses: 0,
}

function pontos(over: Partial<EntradaRegraDePontos> = {}, ref = REF) {
  const r = calcularRegraDePontos({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-103 · a pontuação exigida sobe um ponto por ano', () => {
  it('a tabela da mulher, ano a ano', () => {
    const esperado: readonly (readonly [string, number])[] = [
      ['2019-12-01', 86],
      ['2020-06-15', 87],
      ['2023-06-15', 90],
      ['2026-06-15', 93],
      ['2032-06-15', 99],
      ['2033-06-15', 100],
      ['2040-06-15', 100],
    ]
    for (const [data, exigido] of esperado) {
      expect(pontos({}, data as DataISO).pontosExigidos, data).toBe(exigido)
    }
  })

  it('a tabela do homem, ano a ano', () => {
    const esperado: readonly (readonly [string, number])[] = [
      ['2019-12-01', 96],
      ['2020-06-15', 97],
      ['2026-06-15', 103],
      ['2027-06-15', 104],
      ['2028-06-15', 105],
      ['2035-06-15', 105],
    ]
    for (const [data, exigido] of esperado) {
      expect(
        pontos({ sexo: 'homem', idadeAnos: 62, tempoContribuicaoAnos: 38 }, data as DataISO).pontosExigidos,
        data,
      ).toBe(exigido)
    }
  })

  it('RN-003 — antes da Emenda não há regra de transição cadastrada', () => {
    const r = calcularRegraDePontos(BASE, '2019-11-12' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

describe('CALC-103 · os dois requisitos são cumulativos', () => {
  /** 60 + 33 = 93 pontos, exatamente a exigência de 2026, com 33 anos de contribuição. */
  it('mulher que cumpre os dois requisitos', () => {
    const v = pontos()
    expect(v.pontosAtuaisCentesimos).toBe(9_300)
    expect(v.cumpreOsPontos).toBe(true)
    expect(v.cumpreOTempo).toBe(true)
    expect(v.cumpreTudo).toBe(true)
    expect(v.anoDeCumprimento).toBe(2026)
    expect(v.anosAteLa).toBe(0)
  })

  /**
   * Pontos de sobra e tempo de contribuição curto: 70 + 25 = 95 pontos, acima
   * dos 93 exigidos, mas 25 anos não alcançam os 30 da mulher.
   */
  it('pontuação alta com pouco tempo de contribuição não aposenta', () => {
    const v = pontos({ idadeAnos: 70, tempoContribuicaoAnos: 25 })
    expect(v.cumpreOsPontos).toBe(true)
    expect(v.cumpreOTempo).toBe(false)
    expect(v.cumpreTudo).toBe(false)
    // Faltam 5 anos de contribuição: em 2031 ela terá 30 anos e 105 pontos.
    expect(v.anoDeCumprimento).toBe(2031)
  })

  /** As frações contam: 59 anos e 6 meses + 33 anos e 6 meses = 93 pontos exatos. */
  it('meses entram na soma', () => {
    const v = pontos({ idadeAnos: 59, idadeMeses: 6, tempoContribuicaoAnos: 33, tempoContribuicaoMeses: 6 })
    expect(v.pontosAtuaisCentesimos).toBe(9_300)
    expect(v.cumpreTudo).toBe(true)
  })

  /** Um mês a menos derruba: 92,92 pontos contra 93 exigidos. */
  it('um mês a menos não cumpre', () => {
    const v = pontos({ idadeAnos: 59, idadeMeses: 5, tempoContribuicaoAnos: 33, tempoContribuicaoMeses: 6 })
    expect(v.cumpreOsPontos).toBe(false)
    expect(v.cumpreTudo).toBe(false)
  })
})

describe('CALC-103 · a projeção do ano de cumprimento', () => {
  /**
   * Mulher com 55 anos e 30 de contribuição em 2026: 85 pontos contra 93.
   * Cada ano soma dois pontos e a exigência sobe um — a diferença cai um por
   * ano. Faltam 8 pontos: em 2034 ela terá 55+8 + 30+8 = 101 pontos, contra a
   * exigência de 100, já no teto.
   */
  it('projeta o ano em que os requisitos se cumprem', () => {
    const v = pontos({ idadeAnos: 55, tempoContribuicaoAnos: 30 })
    expect(v.cumpreTudo).toBe(false)
    expect(v.anoDeCumprimento).toBe(2034)
    expect(v.anosAteLa).toBe(8)
    expect(v.pontosExigidosNoAno).toBe(100)
  })

  /**
   * Homem com 58 anos e 36 de contribuição em 2026: 94 pontos contra 103.
   * Em 2031: 63 + 41 = 104, contra o teto de 105 — ainda não. Em 2032: 64 + 42
   * = 106 ≥ 105. O teto congela a exigência e a diferença passa a cair de dois
   * em dois.
   */
  it('o teto da exigência acelera o cumprimento', () => {
    const v = pontos({ sexo: 'homem', idadeAnos: 58, tempoContribuicaoAnos: 36 })
    expect(v.pontosExigidos).toBe(103)
    expect(v.anoDeCumprimento).toBe(2032)
    expect(v.pontosExigidosNoAno).toBe(105)
  })

  it('a memória registra a projeção e a premissa de contribuição contínua', () => {
    const r = calcularRegraDePontos({ ...BASE, idadeAnos: 55, tempoContribuicaoAnos: 30 }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('Projeção'))
    expect(etapa?.justificativa).toContain('sem interrupção')
  })
})

describe('CALC-103 · entradas recusadas', () => {
  it('sem idade ou sem tempo de contribuição, fica pendente', () => {
    const semIdade = calcularRegraDePontos({ ...BASE, idadeAnos: 0, idadeMeses: 0 }, REF, registro)
    expect(semIdade.ok).toBe(false)
    if (!semIdade.ok) expect(semIdade.motivo).toBe('entrada_incompleta')

    const semTempo = calcularRegraDePontos(
      { ...BASE, tempoContribuicaoAnos: 0, tempoContribuicaoMeses: 0 },
      REF,
      registro,
    )
    expect(semTempo.ok).toBe(false)
    if (!semTempo.ok) expect(semTempo.motivo).toBe('entrada_incompleta')
  })

  it('valores incoerentes são recusados', () => {
    for (const over of [
      { idadeMeses: 12 },
      { tempoContribuicaoMeses: 12 },
      { idadeAnos: -1 },
      { tempoContribuicaoAnos: 2.5 },
      { idadeAnos: 30, tempoContribuicaoAnos: 31 },
    ]) {
      const r = calcularRegraDePontos({ ...BASE, ...over }, REF, registro)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })
})
