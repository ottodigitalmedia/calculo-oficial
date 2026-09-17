/**
 * CALC-082 · CALC-083 · CALC-084 — casos-ouro do vale-transporte, do salário do
 * aprendiz e do recesso do estágio.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a norma, com a conta ao lado de
 * cada asserção:
 *
 * - vale-transporte: Lei nº 7.418/1985, art. 4º, parágrafo único — a parcela do
 *   empregado é limitada a 6% do salário básico —, e Decreto nº 10.854/2021,
 *   art. 114 — o desconto é o menor entre essa cota e o custo;
 * - aprendiz: CLT, art. 428, § 2º (salário mínimo hora), com o valor horário
 *   fixado nos decretos: R$ 6,90 em 2025 (Decreto nº 12.342/2024) e R$ 7,37 em
 *   2026 (Decreto nº 12.797/2025); CLT, art. 432 (6h, até 8h); Lei nº
 *   8.036/1990, art. 15, § 7º (FGTS de 2%). O INSS do aprendiz é conferido
 *   contra `calcularInss` chamado diretamente — o motor já travado nos exemplos
 *   publicados pela Receita em `inss.test.ts` —, e não congelado aqui;
 * - estágio: Lei nº 11.788/2008, art. 13 — 30 dias por ano, proporcional
 *   abaixo de um ano, remunerado quando há bolsa.
 *
 * Nenhum dos três tem exemplo oficial resolvido publicado por órgão público.
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de
 * terceiro ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularAprendiz,
  calcularRecessoEstagio,
} from '../../src/lib/engine/calculadoras/aprendizagem'
import { calcularValeTransporte } from '../../src/lib/engine/calculadoras/vale-transporte'
import { calcularInss } from '../../src/lib/engine/inss'
import { ZERO, centavos } from '../../src/lib/engine/types'
import { APRENDIZAGEM } from '../../src/lib/params/data/aprendizagem'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { VALE_TRANSPORTE } from '../../src/lib/params/data/vale-transporte'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF, VALE_TRANSPORTE, APRENDIZAGEM)
const R2026 = '2026-06-15' as DataISO
const R2025 = '2025-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-082 — Vale-transporte
// ---------------------------------------------------------------------------

function vt(salario: number, passagem = 500, viagens = 2, dias = 22) {
  const r = calcularValeTransporte(
    { salarioBasico: centavos(salario), valorPassagem: centavos(passagem), viagensPorDia: viagens, diasUteis: dias },
    R2026,
    registro,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-082 · desconto do vale-transporte', () => {
  /**
   * R$ 5,00 × 2 × 22 = R$ 220,00 de custo. Salário R$ 2.000,00 × 6% = R$ 120,00.
   * Desconto R$ 120,00; empregador paga R$ 100,00.
   */
  it('custo acima da cota: o empregado paga a cota', () => {
    const v = vt(200_000)
    expect(v.custoMensal).toBe(22_000)
    expect(v.cotaDoEmpregado).toBe(12_000)
    expect(v.desconto).toBe(12_000)
    expect(v.parteDoEmpregador).toBe(10_000)
    expect(v.limitadoAoCusto).toBe(false)
  })

  /** Salário R$ 5.000,00 × 6% = R$ 300,00 de cota, custo R$ 220,00: desconta R$ 220,00. */
  it('custo abaixo da cota: o desconto é o custo, nunca a cota', () => {
    const v = vt(500_000)
    expect(v.cotaDoEmpregado).toBe(30_000)
    expect(v.desconto).toBe(22_000)
    expect(v.parteDoEmpregador).toBe(0)
    expect(v.limitadoAoCusto).toBe(true)
  })

  it('sem passagem informada, o resultado fica pendente', () => {
    const r = calcularValeTransporte(
      { salarioBasico: centavos(200_000), valorPassagem: ZERO, viagensPorDia: 2, diasUteis: 22 },
      R2026,
      registro,
    )
    expect(r.ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CALC-083 — Salário do jovem aprendiz
// ---------------------------------------------------------------------------

function aprendiz(horas: number, dias: number, contratado = 0, ref = R2026) {
  const r = calcularAprendiz(
    { horasDiarias: horas, diasPorSemana: dias, valorHoraContratado: centavos(contratado) },
    ref,
    registro,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-083 · salário do aprendiz sobre o mínimo horário', () => {
  /** 4h × 5 dias = 20h/semana; × 5 = 100h/mês; × R$ 7,37 = R$ 737,00. */
  it('4 horas por dia, 5 dias — 2026', () => {
    const v = aprendiz(4, 5)
    expect(v.horasSemanais).toBe(20)
    expect(v.horasMensais).toBe(100)
    expect(v.salarioBruto).toBe(73_700)
  })

  /** Mesma jornada em 2025: 100h × R$ 6,90 = R$ 690,00. */
  it('o mesmo contrato em 2025 usa o decreto de 2025', () => {
    expect(aprendiz(4, 5, 0, R2025).salarioBruto).toBe(69_000)
  })

  /** 6h × 5 = 30h/semana; × 5 = 150h; × R$ 7,37 = R$ 1.105,50. */
  it('6 horas por dia — a jornada padrão', () => {
    const v = aprendiz(6, 5)
    expect(v.salarioBruto).toBe(110_550)
    expect(v.jornadaEstendida).toBe(false)
  })

  /** 8h × 5 = 40h/semana; × 5 = 200h; × R$ 7,37 = R$ 1.474,00. */
  it('8 horas por dia é aceito e sinalizado como jornada estendida', () => {
    const v = aprendiz(8, 5)
    expect(v.salarioBruto).toBe(147_400)
    expect(v.jornadaEstendida).toBe(true)
  })

  it('mais de 8 horas por dia é recusado', () => {
    const r = calcularAprendiz({ horasDiarias: 9, diasPorSemana: 5, valorHoraContratado: ZERO }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  /** Contratado a R$ 8,00: condição mais favorável. 100h × R$ 8,00 = R$ 800,00. */
  it('valor-hora contratado acima do mínimo prevalece', () => {
    const v = aprendiz(4, 5, 800)
    expect(v.valorHora).toBe(800)
    expect(v.salarioBruto).toBe(80_000)
    expect(v.aplicadoPiso).toBe(false)
  })

  /** Contratado a R$ 5,00, abaixo do piso: a conta usa R$ 7,37. */
  it('valor-hora abaixo do mínimo é substituído pelo piso', () => {
    const v = aprendiz(4, 5, 500)
    expect(v.valorHora).toBe(737)
    expect(v.aplicadoPiso).toBe(true)
  })

  /** R$ 737,00 × 2% = R$ 14,74. */
  it('FGTS de 2%, e não de 8%', () => {
    expect(aprendiz(4, 5).fgts).toBe(1_474)
  })

  it('o INSS é o da tabela progressiva, sobre o bruto do aprendiz', () => {
    const v = aprendiz(6, 5)
    const esperado = calcularInss({ salarioContribuicao: centavos(110_550) }, R2026, registro)
    if (!esperado.ok) throw new Error(esperado.detalhe)
    expect(v.inss).toBe(esperado.valores.contribuicao)
    expect(v.liquido).toBe(110_550 - esperado.valores.contribuicao - v.irrf)
  })

  it('RN-003 — antes do decreto de 2025 não há mínimo horário cadastrado', () => {
    const r = calcularAprendiz({ horasDiarias: 4, diasPorSemana: 5, valorHoraContratado: ZERO }, '2024-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// CALC-084 — Recesso do estágio
// ---------------------------------------------------------------------------

function recesso(meses: number, bolsa = 150_000, gozadosCentesimos = 0) {
  const r = calcularRecessoEstagio(
    { mesesDeEstagio: meses, bolsa: centavos(bolsa), diasGozadosCentesimos: gozadosCentesimos },
    R2026,
    registro,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-084 · recesso proporcional do estagiário', () => {
  /** 30 × 12 ÷ 12 = 30 dias; bolsa R$ 1.500,00 ÷ 30 × 30 = R$ 1.500,00. */
  it('um ano completo: 30 dias', () => {
    const v = recesso(12)
    expect(v.diasAdquiridosCentesimos).toBe(3_000)
    expect(v.valor).toBe(150_000)
  })

  /** 30 × 6 ÷ 12 = 15 dias; R$ 1.500,00 ÷ 30 × 15 = R$ 750,00. */
  it('seis meses: 15 dias', () => {
    const v = recesso(6)
    expect(v.diasAdquiridosCentesimos).toBe(1_500)
    expect(v.valor).toBe(75_000)
  })

  /** 30 × 7 ÷ 12 = 17,5 dias — a fração fica exata; R$ 1.500,00 ÷ 30 × 17,5 = R$ 875,00. */
  it('sete meses: 17,5 dias, sem arredondar a fração', () => {
    const v = recesso(7)
    expect(v.diasAdquiridosCentesimos).toBe(1_750)
    expect(v.valor).toBe(87_500)
  })

  it('um mês: 2,5 dias', () => {
    expect(recesso(1).diasAdquiridosCentesimos).toBe(250)
  })

  /** 18 meses: 30 × 18 ÷ 12 = 45 dias. */
  it('mais de um ano: 30 por ano e o restante proporcional', () => {
    expect(recesso(18).diasAdquiridosCentesimos).toBe(4_500)
  })

  /** 30 dias − 5 gozados = 25; R$ 1.500,00 ÷ 30 × 25 = R$ 1.250,00. */
  it('dias já gozados saem da conta', () => {
    const v = recesso(12, 150_000, 500)
    expect(v.diasRestantesCentesimos).toBe(2_500)
    expect(v.valor).toBe(125_000)
  })

  it('sem bolsa, os dias existem mas não são remunerados', () => {
    const v = recesso(12, 0)
    expect(v.diasRestantesCentesimos).toBe(3_000)
    expect(v.valor).toBe(0)
    expect(v.remunerado).toBe(false)
  })

  it('gozados acima dos adquiridos é recusado', () => {
    const r = calcularRecessoEstagio({ mesesDeEstagio: 6, bolsa: centavos(150_000), diasGozadosCentesimos: 2_000 }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})

describe('CALC-082 a CALC-084 · entradas recusadas e datas sem cobertura', () => {
  it('vale-transporte sem salário fica pendente', () => {
    const r = calcularValeTransporte({ salarioBasico: ZERO, valorPassagem: centavos(500), viagensPorDia: 2, diasUteis: 22 }, R2026, registro)
    expect(r.ok).toBe(false)
  })

  it('vale-transporte sem viagens fica pendente', () => {
    const r = calcularValeTransporte({ salarioBasico: centavos(200_000), valorPassagem: centavos(500), viagensPorDia: 0, diasUteis: 22 }, R2026, registro)
    expect(r.ok).toBe(false)
  })

  /** Uma passagem por dia: R$ 5,00 × 1 × 22 = R$ 110,00, abaixo da cota de R$ 120,00. */
  it('uma passagem por dia', () => {
    const v = vt(200_000, 500, 1)
    expect(v.custoMensal).toBe(11_000)
    expect(v.desconto).toBe(11_000)
  })

  /** RN-003: a Lei nº 7.418 é de 16/12/1985. */
  it('vale-transporte antes da lei é bloqueado', () => {
    const r = calcularValeTransporte({ salarioBasico: centavos(200_000), valorPassagem: centavos(500), viagensPorDia: 2, diasUteis: 22 }, '1980-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('aprendiz sem horas fica pendente', () => {
    const r = calcularAprendiz({ horasDiarias: 0, diasPorSemana: 5, valorHoraContratado: ZERO }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('aprendiz com sete dias por semana é recusado', () => {
    const r = calcularAprendiz({ horasDiarias: 4, diasPorSemana: 7, valorHoraContratado: ZERO }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  /** 4h × 1 dia = 4h/semana; × 5 = 20h; × R$ 7,37 = R$ 147,40. */
  it('aprendiz com um dia por semana', () => {
    expect(aprendiz(4, 1).salarioBruto).toBe(14_740)
  })

  /** RN-003: os limites de jornada vêm da Lei nº 10.097, de 20/12/2000. */
  it('aprendiz antes da Lei nº 10.097 é bloqueado', () => {
    const r = calcularAprendiz({ horasDiarias: 4, diasPorSemana: 5, valorHoraContratado: ZERO }, '1999-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('recesso sem meses fica pendente', () => {
    const r = calcularRecessoEstagio({ mesesDeEstagio: 0, bolsa: ZERO, diasGozadosCentesimos: 0 }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('recesso com valor negativo é recusado', () => {
    const r = calcularRecessoEstagio({ mesesDeEstagio: 6, bolsa: centavos(-1), diasGozadosCentesimos: 0 }, R2026, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  /** RN-003: a Lei nº 11.788 é de 26/09/2008. */
  it('recesso antes da lei do estágio é bloqueado', () => {
    const r = calcularRecessoEstagio({ mesesDeEstagio: 6, bolsa: ZERO, diasGozadosCentesimos: 0 }, '2007-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
