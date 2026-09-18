/**
 * CALC-111 — aposentadoria do professor.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a EC nº 103/2019, no texto
 * compilado do Planalto, lido em 18/09/2026:
 *
 * - art. 15, § 3º (pontos): 25/30 anos de magistério; 81/91 pontos, mais um por
 *   ano desde 2020 até 92/100. Em 2026: 88 e 98;
 * - art. 16, § 2º (idade progressiva): idade e tempo do caput menos cinco anos
 *   — 51/56 anos e 25/30 de magistério —, mais seis meses por ano até 57/60.
 *   Em 2026: 54 anos e 6 meses, e 59 anos e 6 meses;
 * - art. 20, § 1º (pedágio de 100%): idade e tempo menos cinco — 52/55 anos e
 *   25/30 de magistério —, mais o tempo que faltava em 13/11/2019;
 * - art. 19, § 1º, II (permanente): 57/60 anos e 25 de magistério.
 *
 * Referência: 15/06/2026, projeção mês a mês — a conta vai escrita em cada caso.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  compararRegrasDoProfessor,
  type EntradaComparador,
} from '../../src/lib/engine/calculadoras/regras-de-aposentadoria'
import { PREVIDENCIA_RGPS } from '../../src/lib/params/data/previdencia-rgps'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(PREVIDENCIA_RGPS)
const REF = '2026-06-15' as DataISO

const PROFESSORA: EntradaComparador = {
  sexo: 'mulher',
  idadeAnos: 50,
  idadeMeses: 0,
  tempoAnos: 25,
  tempoMeses: 0,
  filiadoAntesDaEmenda: true,
  tempoNaEmendaAnos: 19,
  tempoNaEmendaMeses: 0,
}

function comparar(over: Partial<EntradaComparador> = {}, ref = REF) {
  const r = compararRegrasDoProfessor({ ...PROFESSORA, ...over }, ref, registro)
  if (!r.ok) throw new Error(r.detalhe)
  return r.valores
}
const regra = (v: ReturnType<typeof comparar>, id: string) => v.regras.find((r) => r.id === id)!

describe('CALC-111 · as escadas do professor', () => {
  /** A exigência é lida no ano da referência; a pessoa só varia o suficiente para não cumprir. */
  it('pontos exigidos em 2026: 88 da professora, 98 do professor', () => {
    const r = compararRegrasDoProfessor(PROFESSORA, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas.some((e) => e.rotulo.includes('Pontuação exigida — 88 pontos'))).toBe(true)
    const h = compararRegrasDoProfessor({ ...PROFESSORA, sexo: 'homem', tempoAnos: 30, idadeAnos: 55, tempoNaEmendaAnos: 23 }, REF, registro)
    if (!h.ok) throw new Error(h.detalhe)
    expect(h.traco.etapas.some((e) => e.rotulo.includes('Pontuação exigida — 98 pontos'))).toBe(true)
  })

  it('idade progressiva em 2026: 54 anos e 6 meses da professora', () => {
    const r = compararRegrasDoProfessor(PROFESSORA, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas.some((e) => e.rotulo.includes('Idade exigida — 54 anos e 6 meses'))).toBe(true)
  })

  it('o teto da pontuação: 92 da professora a partir de 2030, 100 do professor a partir de 2028', () => {
    const m = compararRegrasDoProfessor(PROFESSORA, '2030-06-15' as DataISO, registro)
    const h = compararRegrasDoProfessor(
      { ...PROFESSORA, sexo: 'homem', tempoAnos: 30, idadeAnos: 55, tempoNaEmendaAnos: 23 },
      '2028-06-15' as DataISO,
      registro,
    )
    if (!m.ok || !h.ok) throw new Error('esperado sucesso')
    expect(m.traco.etapas.some((e) => e.rotulo.includes('Pontuação exigida — 92 pontos'))).toBe(true)
    expect(h.traco.etapas.some((e) => e.rotulo.includes('Pontuação exigida — 100 pontos'))).toBe(true)
  })
})

describe('CALC-111 · qual regra se cumpre primeiro', () => {
  /**
   * Professora com 50 anos, 25 de magistério hoje e 19 em 13/11/2019:
   * - pontos: 75 hoje, 1/6 de ponto por mês; alcança 92 em dezembro de 2034
   *   (102 meses) — em dezembro de 2033 teria 90;
   * - idade progressiva: 50 anos contra a escada que chega a 57 em 2031;
   *   alcança em junho de 2033 (84 meses);
   * - pedágio de 100%: faltavam 6 anos em 2019; exigido 31 anos; faltam 6 anos
   *   (72 meses) e a idade de 52 chega em 24 — junho de 2032.
   */
  it('professora: o pedágio de 100% chega primeiro', () => {
    const v = comparar()
    expect(regra(v, 'pontos').mesesAteCumprir).toBe(102)
    expect(regra(v, 'pontos').anoDeCumprimento).toBe(2034)
    expect(regra(v, 'pontos').mesDeCumprimento).toBe(12)
    expect(regra(v, 'idade-progressiva').mesesAteCumprir).toBe(84)
    expect(regra(v, 'pedagio-100').mesesAteCumprir).toBe(72)
    expect(regra(v, 'pedagio-100').anoDeCumprimento).toBe(2032)
    expect(regra(v, 'permanente').situacao).toBe('nao_se_aplica')
    expect(v.maisCedo?.id).toBe('pedagio-100')
    expect(v.maisCedo?.nome).toBe('Pedágio de 100% do professor')
  })

  /**
   * Professor com 55 anos, 30 de magistério e 23 em 13/11/2019:
   * - pontos: 85 contra 98, com o teto de 100 a partir de 2028 — dezembro de
   *   2033 (90 meses);
   * - idade progressiva: 55 anos contra 60 a partir de 2027 — junho de 2031
   *   (60 meses);
   * - pedágio de 100%: faltavam 7 anos; exigido 37; faltam 7 — junho de 2033.
   */
  it('professor: a idade progressiva chega primeiro', () => {
    const v = comparar({ sexo: 'homem', idadeAnos: 55, tempoAnos: 30, tempoNaEmendaAnos: 23 })
    expect(regra(v, 'pontos').mesesAteCumprir).toBe(90)
    expect(regra(v, 'idade-progressiva').mesesAteCumprir).toBe(60)
    expect(regra(v, 'idade-progressiva').anoDeCumprimento).toBe(2031)
    expect(regra(v, 'pedagio-100').mesesAteCumprir).toBe(84)
    expect(v.maisCedo?.id).toBe('idade-progressiva')
  })

  /** Filiada depois: 57 anos e 25 de magistério. Com 40 e 10, faltam 17 anos de idade — junho de 2043. */
  it('filiada depois da Emenda: só a regra permanente', () => {
    const v = comparar({ idadeAnos: 40, tempoAnos: 10, filiadoAntesDaEmenda: false, tempoNaEmendaAnos: 0 })
    expect(regra(v, 'permanente').mesesAteCumprir).toBe(204)
    expect(regra(v, 'permanente').anoDeCumprimento).toBe(2043)
    for (const id of ['pontos', 'idade-progressiva', 'pedagio-100']) expect(regra(v, id).situacao).toBe('nao_se_aplica')
  })

  it('sem o tempo de 2019, o pedágio pede o dado', () => {
    const v = comparar({ tempoNaEmendaAnos: 0 })
    expect(regra(v, 'pedagio-100').situacao).toBe('falta_dado')
    expect(v.maisCedo?.id).toBe('idade-progressiva')
  })

  it('a memória cita os parágrafos do professor', () => {
    const r = compararRegrasDoProfessor(PROFESSORA, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    const dispositivos = r.traco.etapas.map((e) => e.parametro?.dispositivo).filter(Boolean)
    expect(dispositivos).toContain('Art. 15, § 3º')
    expect(dispositivos).toContain('Art. 16, § 2º')
    expect(dispositivos).toContain('Art. 20, § 1º')
  })

  it('entradas incoerentes são recusadas', () => {
    for (const over of [{ tempoNaEmendaAnos: 26 }, { idadeAnos: 20, tempoAnos: 25 }, { idadeAnos: 0 }]) {
      expect(compararRegrasDoProfessor({ ...PROFESSORA, ...over }, REF, registro).ok).toBe(false)
    }
  })
})
