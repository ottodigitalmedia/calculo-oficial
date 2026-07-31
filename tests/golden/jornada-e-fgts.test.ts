/**
 * Casos-ouro de CALC-006 (horas extras) e CALC-007 (FGTS).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Derivados da norma, com o dispositivo citado ao lado de cada valor. Nenhum
 * número veio de calculadora concorrente — `CLAUDE.md` regra 10 / `CO-1`.
 *
 * **O teste que mais importa aqui é o da hora noturna.** Ela dura 52 minutos e
 * 30 segundos, e quem multiplica horas de relógio direto pelo adicional perde
 * um oitavo do valor. É um erro que produz um número plausível.
 */

import { describe, expect, it } from 'vitest'

import {
  calcularFgts,
  calcularHorasExtras,
} from '../../src/lib/engine/calculadoras/jornada-e-fgts'
import { centavos } from '../../src/lib/engine/types'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(TRABALHISTA)
const REF = '2026-06-15' as DataISO

const HORAS_BASE = {
  salario: centavos(220_000),
  jornadaSemanal: 44,
  horasExtras50: 0,
  horasExtras100: 0,
  horasNoturnas: 0,
  refletirDSR: false,
  diasUteis: 25,
  diasDescanso: 5,
}

// ---------------------------------------------------------------------------
// CALC-006 — Horas extras
// ---------------------------------------------------------------------------

describe('CALC-006 · o divisor sai da jornada — CLT art. 64 e Súmula 431 do TST', () => {
  it('44 horas semanais dão divisor 220', () => {
    const r = calcularHorasExtras(HORAS_BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.divisor).toBe(220)
    // R$ 2.200,00 ÷ 220 = R$ 10,00
    expect(r.valores.valorHoraNormal).toBe(1_000)
  })

  it('40 horas dão divisor 200 — o número fixado pela Súmula 431', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, jornadaSemanal: 40 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.divisor).toBe(200)
    // R$ 2.200,00 ÷ 200 = R$ 11,00
    expect(r.valores.valorHoraNormal).toBe(1_100)
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Valor da hora normal')
    expect(etapa?.fundamento?.norma).toContain('Súmula 431')
  })

  it('as demais jornadas seguem a mesma razão', () => {
    for (const [jornada, divisor] of [
      [36, 180],
      [30, 150],
      [20, 100],
    ] as const) {
      const r = calcularHorasExtras({ ...HORAS_BASE, jornadaSemanal: jornada }, REF, registro)
      if (!r.ok) throw new Error('esperado sucesso')
      expect(r.valores.divisor).toBe(divisor)
    }
  })
})

describe('CALC-006 · adicionais', () => {
  it('a hora a 50% vale uma vez e meia a normal — CF art. 7º, XVI', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, horasExtras50: 10 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    // R$ 10,00 + 50% = R$ 15,00 × 10h = R$ 150,00
    expect(r.valores.extras50).toBe(15_000)
  })

  it('a hora a 100% vale o dobro', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, horasExtras100: 10 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.extras100).toBe(20_000)
  })

  it('o adicional de 100% declara que não é mínimo legal', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, horasExtras100: 5 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('100'))
    expect(etapa?.justificativa).toContain('não é mínimo legal')
  })
})

/**
 * O teste central desta calculadora.
 */
describe('CALC-006 · RN-026 · a hora noturna dura 52min30s — CLT art. 73, § 1º', () => {
  it('sete horas de relógio valem OITO horas noturnas', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, horasNoturnas: 7 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    // 7 × 3.600 ÷ 3.150 = 8
    expect(r.valores.horasNoturnasComputadas).toBe(8)
  })

  it('o adicional é 20% sobre a hora normal, pelas horas COMPUTADAS', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, horasNoturnas: 7 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    // R$ 10,00 × 20% = R$ 2,00 × 8h = R$ 16,00
    expect(r.valores.adicionalNoturno).toBe(1_600)
  })

  it('ignorar a redução subestimaria o adicional em um oitavo', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, horasNoturnas: 7 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const ingenuo = 7 * 200 // 7 horas de relógio × R$ 2,00
    expect(r.valores.adicionalNoturno).toBeGreaterThan(ingenuo)
    expect(r.valores.adicionalNoturno).toBe(ingenuo + 200)
  })

  it('a etapa da conversão cita o dispositivo', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, horasNoturnas: 7 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Horas noturnas computadas')
    expect(etapa?.fundamento?.dispositivo).toContain('73')
  })
})

describe('CALC-006 · RN-025 · reflexo no DSR — Lei 605/1949 e Súmula 172', () => {
  it('divide pelas horas úteis e multiplica pelos dias de descanso', () => {
    const r = calcularHorasExtras(
      { ...HORAS_BASE, horasExtras50: 10, refletirDSR: true, diasUteis: 25, diasDescanso: 5 },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    // R$ 150,00 ÷ 25 × 5 = R$ 30,00
    expect(r.valores.reflexoDsr).toBe(3_000)
    expect(r.valores.total).toBe(15_000 + 3_000)
  })

  it('sem habitualidade declarada, não há reflexo', () => {
    const r = calcularHorasExtras({ ...HORAS_BASE, horasExtras50: 10 }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.reflexoDsr).toBe(0)
  })

  it('o reflexo alcança também o adicional noturno', () => {
    const r = calcularHorasExtras(
      { ...HORAS_BASE, horasNoturnas: 7, refletirDSR: true },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.reflexoDsr).toBeGreaterThan(0)
  })

  it('dias úteis ausentes com reflexo pedido é entrada inválida, não zero silencioso', () => {
    const r = calcularHorasExtras(
      { ...HORAS_BASE, horasExtras50: 10, refletirDSR: true, diasUteis: 0 },
      REF,
      registro,
    )
    expect(r.ok).toBe(false)
  })
})

describe('CALC-006 · entradas inválidas', () => {
  it('salário zerado mantém o estado pendente', () => {
    expect(calcularHorasExtras({ ...HORAS_BASE, salario: centavos(0) }, REF, registro).ok).toBe(false)
  })

  it('horas negativas são recusadas', () => {
    expect(calcularHorasExtras({ ...HORAS_BASE, horasExtras50: -1 }, REF, registro).ok).toBe(false)
  })

  it('data sem cobertura bloqueia o cálculo — RN-003', () => {
    const r = calcularHorasExtras(HORAS_BASE, '1900-01-01' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// CALC-007 — FGTS
// ---------------------------------------------------------------------------

const FGTS_BASE = {
  salario: centavos(300_000),
  mesesTrabalhados: 12,
  incluir13: false,
  motivoSaida: 'trabalhando' as const,
}

describe('CALC-007 · depósito e saldo — Lei 8.036/1990, art. 15', () => {
  it('o depósito mensal é 8% da remuneração', () => {
    const r = calcularFgts(FGTS_BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.depositoMensal).toBe(24_000)
  })

  it('doze meses acumulam doze depósitos', () => {
    const r = calcularFgts(FGTS_BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.saldoEstimado).toBe(288_000)
  })

  it('com 13º, o ano tem treze depósitos — a lei o inclui na base', () => {
    const r = calcularFgts({ ...FGTS_BASE, incluir13: true }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    // 12 × 13/12 = 13 depósitos
    expect(r.valores.saldoEstimado).toBe(24_000 * 13)
  })

  it('a etapa do saldo declara que é ESTIMATIVA, sem eufemismo — RN-023', () => {
    const r = calcularFgts(FGTS_BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo.startsWith('Saldo estimado'))
    expect(etapa?.justificativa).toContain('ESTIMATIVA')
  })
})

describe('CALC-007 · a multa depende do motivo, e não é escolha livre', () => {
  it('dispensa sem justa causa: 40% — Lei 8.036, art. 18, § 1º', () => {
    const r = calcularFgts({ ...FGTS_BASE, motivoSaida: 'sem-justa-causa' }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.temMulta).toBe(true)
    expect(r.valores.percentualMulta).toBe(4_000)
    expect(r.valores.multa).toBe(115_200) // 288.000 × 40%
  })

  it('acordo mútuo: metade — CLT art. 484-A, I, "b"', () => {
    const r = calcularFgts({ ...FGTS_BASE, motivoSaida: 'acordo-mutuo' }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.percentualMulta).toBe(2_000)
    expect(r.valores.multa).toBe(57_600) // 288.000 × 20%
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Multa rescisória')
    expect(etapa?.justificativa).toContain('80%')
  })

  it('pedido de demissão: não há multa, e o traço diz por quê', () => {
    const r = calcularFgts({ ...FGTS_BASE, motivoSaida: 'pedido-demissao' }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.temMulta).toBe(false)
    expect(r.valores.multa).toBe(0)
    expect(r.traco.etapas.map((e) => e.rotulo)).toContain('Sem multa rescisória')
  })

  it('contrato em vigor: não há multa', () => {
    const r = calcularFgts(FGTS_BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.temMulta).toBe(false)
    expect(r.valores.totalComMulta).toBe(r.valores.saldoEstimado)
  })
})

describe('CALC-007 · entradas inválidas', () => {
  it('meses ausentes mantêm o estado pendente', () => {
    expect(calcularFgts({ ...FGTS_BASE, mesesTrabalhados: 0 }, REF, registro).ok).toBe(false)
  })

  it('salário zerado mantém o estado pendente', () => {
    expect(calcularFgts({ ...FGTS_BASE, salario: centavos(0) }, REF, registro).ok).toBe(false)
  })
})
