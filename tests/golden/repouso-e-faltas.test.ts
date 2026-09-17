/**
 * CALC-080 · CALC-081 — casos-ouro do repouso sobre variáveis e do desconto de
 * faltas.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a Lei nº 605/1949 — art. 7º, "c"
 * (o ganho do período dividido pelos dias de serviço é o valor de um dia de
 * repouso), art. 6º (a falta injustificada na semana tira o repouso daquela
 * semana) — e sobre o art. 64 da CLT (o dia do mensalista é um trinta avos do
 * salário). A Súmula 27 do TST estende o repouso ao comissionista.
 *
 * Nenhuma das duas tem exemplo oficial resolvido publicado por órgão público.
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de
 * terceiro ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularDescontoDeFaltas,
  calcularDsrVariavel,
} from '../../src/lib/engine/calculadoras/repouso'
import { centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-080 — DSR sobre comissões e variáveis
// ---------------------------------------------------------------------------

function dsr(valor: number, diasUteis: number, domingosEFeriados: number) {
  const r = calcularDsrVariavel({ valorVariavel: centavos(valor), diasUteis, domingosEFeriados }, REF)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-080 · repouso sobre a remuneração variável', () => {
  /** R$ 2.500,00 ÷ 25 = R$ 100,00 por dia; × 5 = R$ 500,00; total R$ 3.000,00. */
  it('caso redondo', () => {
    const v = dsr(250_000, 25, 5)
    expect(v.valorPorDia).toBe(10_000)
    expect(v.dsr).toBe(50_000)
    expect(v.totalComDsr).toBe(300_000)
  })

  /**
   * R$ 1.000,00, 26 dias úteis, 4 domingos:
   *   produto primeiro:  1.000,00 × 4 ÷ 26 = 153,846… → R$ 153,85
   *   dia arredondado:   1.000,00 ÷ 26 = 38,46 → × 4 = R$ 153,84
   * Um centavo, e a direção importa: a conta certa arredonda uma vez só.
   */
  it('multiplica antes de dividir — um arredondamento só', () => {
    const v = dsr(100_000, 26, 4)
    expect(v.valorPorDia).toBe(3_846)
    expect(v.dsr).toBe(15_385)
  })

  it('mês sem domingo nem feriado informado não gera repouso', () => {
    expect(dsr(100_000, 26, 0).dsr).toBe(0)
  })

  it('dias que passam de 31 são recusados', () => {
    const r = calcularDsrVariavel({ valorVariavel: centavos(100_000), diasUteis: 28, domingosEFeriados: 5 }, REF)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('sem dias úteis, o resultado fica pendente', () => {
    const r = calcularDsrVariavel({ valorVariavel: centavos(100_000), diasUteis: 0, domingosEFeriados: 4 }, REF)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })
})

// ---------------------------------------------------------------------------
// CALC-081 — Desconto de faltas
// ---------------------------------------------------------------------------

function faltas(salario: number, dias: number, semanas: number) {
  const r = calcularDescontoDeFaltas({ salario: centavos(salario), faltas: dias, semanasComFalta: semanas }, REF)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-081 · desconto das faltas e do repouso', () => {
  /**
   * R$ 3.000,00 ÷ 30 = R$ 100,00 por dia.
   * 2 faltas = R$ 200,00; 1 semana de repouso perdido = R$ 100,00; total R$ 300,00.
   */
  it('caso redondo', () => {
    const v = faltas(300_000, 2, 1)
    expect(v.salarioDia).toBe(10_000)
    expect(v.descontoDosDias).toBe(20_000)
    expect(v.descontoDoRepouso).toBe(10_000)
    expect(v.descontoTotal).toBe(30_000)
    expect(v.salarioAposDesconto).toBe(270_000)
  })

  /**
   * R$ 2.500,00, 3 faltas em 2 semanas:
   *   dias:    2.500,00 × 3 ÷ 30 = R$ 250,00
   *   repouso: 2.500,00 × 2 ÷ 30 = 166,666… → R$ 166,67
   * O desconto sai do produto, não do dia arredondado (R$ 83,33 × 2 = R$ 166,66).
   */
  it('arredonda sobre o produto', () => {
    const v = faltas(250_000, 3, 2)
    expect(v.descontoDosDias).toBe(25_000)
    expect(v.descontoDoRepouso).toBe(16_667)
    expect(v.descontoTotal).toBe(41_667)
  })

  it('falta sem semana de repouso perdido desconta só os dias', () => {
    const v = faltas(300_000, 2, 0)
    expect(v.descontoDoRepouso).toBe(0)
    expect(v.descontoTotal).toBe(20_000)
  })

  it('mais semanas que faltas é incoerente e recusado', () => {
    const r = calcularDescontoDeFaltas({ salario: centavos(300_000), faltas: 2, semanasComFalta: 3 }, REF)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('faltas acima de 30 são recusadas', () => {
    const r = calcularDescontoDeFaltas({ salario: centavos(300_000), faltas: 31, semanasComFalta: 1 }, REF)
    expect(r.ok).toBe(false)
  })

  it('sem faltas informadas, o resultado fica pendente', () => {
    const r = calcularDescontoDeFaltas({ salario: centavos(300_000), faltas: 0, semanasComFalta: 0 }, REF)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })
})

describe('CALC-080 e CALC-081 · entradas recusadas', () => {
  it('DSR sem valor variável fica pendente', () => {
    const r = calcularDsrVariavel({ valorVariavel: centavos(0), diasUteis: 25, domingosEFeriados: 5 }, REF)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('DSR com domingos negativos é recusado', () => {
    const r = calcularDsrVariavel({ valorVariavel: centavos(100_000), diasUteis: 25, domingosEFeriados: -1 }, REF)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('faltas sem salário fica pendente', () => {
    const r = calcularDescontoDeFaltas({ salario: centavos(0), faltas: 2, semanasComFalta: 1 }, REF)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('mais de cinco semanas num mês é recusado', () => {
    const r = calcularDescontoDeFaltas({ salario: centavos(300_000), faltas: 10, semanasComFalta: 6 }, REF)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})
