/**
 * Casos-ouro de CALC-013 — banco de horas.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * CLT, art. 59, lido no texto do Planalto:
 *
 *   § 2º (red. MP nº 2.164-41/2001) — compensação "no período máximo de um ano"
 *   por acordo ou convenção coletiva.
 *   § 3º (red. Lei nº 13.467/2017) — na rescisão sem compensação integral, as
 *   horas não compensadas são pagas "sobre o valor da remuneração na data da
 *   rescisão".
 *   § 5º — acordo individual escrito, "no período máximo de seis meses".
 *   § 6º — acordo individual tácito ou escrito, "no mesmo mês".
 *   Art. 59-B — descumpridas as exigências, "devido apenas o respectivo
 *   adicional"; e a habitualidade não descaracteriza o banco.
 *
 * O divisor e o adicional vêm de CALC-006, já conferidos desde o lançamento.
 */

import { describe, expect, it } from 'vitest'

import { calcularBancoDeHoras } from '../../src/lib/engine/calculadoras/banco-de-horas'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { BANCO_DE_HORAS } from '../../src/lib/params/data/banco-de-horas'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(BANCO_DE_HORAS, TRABALHISTA)
const REF = '2026-06-15' as DataISO

/** Horas em centésimos: 10h são `1000`; 12h30 são `1250`. */
const h = (horas: number) => Math.round(horas * 100)

const BASE = {
  salario: centavos(220_000),
  jornadaSemanal: 44,
  horasPositivas: h(10),
  horasNegativas: 0,
  modalidade: 'coletivo',
  adicionalPactuado: basisPoints(0),
} as const

describe('CALC-013 · o valor da hora sai do divisor de CALC-006', () => {
  const r = calcularBancoDeHoras(BASE, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  /** R$ 2.200,00 ÷ 220 = R$ 10,00 — jornada de 44h dá divisor 220. */
  it('44 horas semanais dão divisor 220 e hora de R$ 10,00', () => {
    expect(r.valores.divisor).toBe(220)
    expect(r.valores.valorHoraNormal).toBe(1_000)
  })

  it('a hora com adicional mínimo de 50% vale R$ 15,00', () => {
    expect(r.valores.adicionalAplicado).toBe(5_000)
    expect(r.valores.valorHoraComAdicional).toBe(1_500)
  })

  /** 10 horas × R$ 15,00 = R$ 150,00 — art. 59, § 3º. */
  it('dez horas de saldo valem R$ 150,00 na rescisão', () => {
    expect(r.valores.saldoHoras).toBe(1_000)
    expect(r.valores.valorSeNaoCompensado).toBe(15_000)
  })

  it('a etapa do valor cita o art. 59 da CLT', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo.startsWith('Saldo pago em rescisão'))
    expect(etapa?.fundamento?.dispositivo).toContain('§ 3º')
  })
})

describe('CALC-013 · os três prazos do art. 59', () => {
  const casos = [
    { modalidade: 'coletivo', meses: 12 },
    { modalidade: 'individual-escrito', meses: 6 },
    { modalidade: 'mesmo-mes', meses: 1 },
  ] as const

  for (const { modalidade, meses } of casos) {
    it(`${modalidade} dá ${meses} mês(es)`, () => {
      const r = calcularBancoDeHoras({ ...BASE, modalidade }, REF, registro)
      if (!r.ok) throw new Error('esperado sucesso')
      expect(r.valores.prazoEmMeses).toBe(meses)
    })
  }

  it('o prazo não muda o valor do saldo — só o tempo para compensar', () => {
    const a = calcularBancoDeHoras({ ...BASE, modalidade: 'coletivo' }, REF, registro)
    const b = calcularBancoDeHoras({ ...BASE, modalidade: 'mesmo-mes' }, REF, registro)
    if (!a.ok || !b.ok) throw new Error('esperado sucesso')
    expect(a.valores.valorSeNaoCompensado).toBe(b.valores.valorSeNaoCompensado)
  })
})

/**
 * A DATA SEPARA DOIS REGIMES, E ESTE É O TESTE QUE PROVA ISSO.
 *
 * Antes da Reforma Trabalhista o banco de horas só podia ser pactuado por norma
 * coletiva. As duas modalidades individuais são criação de 2017, e pedi-las em
 * data anterior tem de bloquear o cálculo — não devolver o prazo coletivo por
 * omissão.
 */
describe('CALC-013 · o acordo individual é criação da Reforma Trabalhista', () => {
  const ANTES = '2017-11-10' as DataISO
  const DEPOIS = '2017-11-11' as DataISO

  it('em 10/11/2017 o acordo individual escrito ainda não existia', () => {
    const r = calcularBancoDeHoras({ ...BASE, modalidade: 'individual-escrito' }, ANTES, registro)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.motivo).toBe('vigencia_ausente')
    expect(r.detalhe).toContain('Reforma Trabalhista')
  })

  it('em 11/11/2017 ele passa a valer', () => {
    expect(calcularBancoDeHoras({ ...BASE, modalidade: 'individual-escrito' }, DEPOIS, registro).ok).toBe(
      true,
    )
  })

  it('o prazo coletivo, esse, já valia em 2017 — vem de 2001', () => {
    expect(calcularBancoDeHoras({ ...BASE, modalidade: 'coletivo' }, ANTES, registro).ok).toBe(true)
  })
})

describe('CALC-013 · saldo negativo não vira dívida em dinheiro', () => {
  const r = calcularBancoDeHoras(
    { ...BASE, horasPositivas: h(4), horasNegativas: h(10) },
    REF,
    registro,
  )
  if (!r.ok) throw new Error('esperado sucesso')

  it('o saldo é negativo e o valor a receber é zero', () => {
    expect(r.valores.saldoHoras).toBe(h(-6))
    expect(r.valores.valorSeNaoCompensado).toBe(0)
  })

  it('a memória cita o art. 59-B para explicar por quê', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Sem valor a receber')
    expect(etapa?.fundamento?.dispositivo).toContain('59-B')
    expect(etapa?.justificativa).toContain('não à repetição das horas')
  })
})

describe('CALC-013 · o adicional pactuado, quando maior que o legal', () => {
  it('adicional de 100% dobra o valor da hora', () => {
    const r = calcularBancoDeHoras(
      { ...BASE, adicionalPactuado: basisPoints(10_000) },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.adicionalAplicado).toBe(10_000)
    expect(r.valores.valorHoraComAdicional).toBe(2_000)
    expect(r.valores.valorSeNaoCompensado).toBe(20_000)
  })

  /**
   * Adicional informado ABAIXO do mínimo legal não rebaixa o cálculo: a norma
   * coletiva pode melhorar a condição do trabalhador, nunca piorá-la.
   */
  it('adicional informado abaixo do mínimo não rebaixa o cálculo', () => {
    const r = calcularBancoDeHoras({ ...BASE, adicionalPactuado: basisPoints(2_000) }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.adicionalAplicado).toBe(5_000)
  })
})

describe('CALC-013 · jornada de 40 horas', () => {
  it('dá divisor 200, o da Súmula 431 do TST', () => {
    const r = calcularBancoDeHoras({ ...BASE, jornadaSemanal: 40 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.divisor).toBe(200)
    expect(r.valores.valorHoraNormal).toBe(1_100)
  })
})

describe('CALC-013 · horas fracionadas', () => {
  /** 12h30 × R$ 15,00 = R$ 187,50. */
  it('meia hora entra na conta', () => {
    const r = calcularBancoDeHoras({ ...BASE, horasPositivas: h(12.5) }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.saldoHoras).toBe(1_250)
    expect(r.valores.valorSeNaoCompensado).toBe(18_750)
  })
})

describe('CALC-013 · entradas incompletas', () => {
  it('sem salário, sem jornada ou sem horas o estado é pendente', () => {
    for (const parcial of [
      { salario: centavos(0) },
      { jornadaSemanal: 0 },
      { horasPositivas: 0, horasNegativas: 0 },
    ]) {
      expect(calcularBancoDeHoras({ ...BASE, ...parcial }, REF, registro).ok).toBe(false)
    }
  })

  it('horas negativas informadas como número negativo são recusadas', () => {
    expect(calcularBancoDeHoras({ ...BASE, horasNegativas: -1 }, REF, registro).ok).toBe(false)
  })
})

describe('CALC-013 · C-M1 · não existe cálculo sem memória', () => {
  it('registra saldo, prazo, valor da hora e o total', () => {
    const r = calcularBancoDeHoras(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Saldo do banco de horas')
    expect(rotulos).toContain('Prazo máximo para compensar')
    expect(rotulos).toContain('Valor da hora normal')
    for (const e of r.traco.etapas) expect(e.formula.length).toBeGreaterThan(0)
  })

  it('saldo e prazo saem em unidade de número, não em moeda', () => {
    const r = calcularBancoDeHoras(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.traco.etapas.find((e) => e.rotulo === 'Saldo do banco de horas')?.unidade).toBe('numero')
    expect(r.traco.etapas.find((e) => e.rotulo === 'Prazo máximo para compensar')?.unidade).toBe(
      'numero',
    )
  })
})
