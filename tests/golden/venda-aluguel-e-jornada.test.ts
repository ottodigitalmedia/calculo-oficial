/**
 * CALC-113 a CALC-115 — venda de bens, aluguel e horas trabalhadas.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre textos oficiais lidos em
 * 18/09/2026 no Planalto:
 *
 * - Lei nº 9.250/1995, art. 22, II e parágrafo único: isento o ganho quando o
 *   preço de alienação no mês, somados os bens da mesma natureza, não passa de
 *   R$ 35.000,00; Lei nº 8.981/1995, art. 21: 15% até R$ 5 milhões de ganho e
 *   17,5% na parcela seguinte — a tabela já cadastrada para CALC-020;
 * - RIR/2018 (Decreto nº 9.580), arts. 42 e 689: IPTU e taxas, condomínio,
 *   despesas de cobrança e o aluguel da sublocação não entram na base. O
 *   imposto sobre o que sobra é o do carnê-leão (CALC-053), que tem casos-ouro
 *   próprios — aqui o que se trava é a exclusão;
 * - Constituição, art. 7º, XIII (8h/44h); CLT, art. 71 (uma hora acima de seis,
 *   quinze minutos acima de quatro, até duas horas sem acordo; o suprimido pago
 *   com 50%) e art. 66 (onze horas entre jornadas).
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularImpostoSobreAluguel, type EntradaAluguel } from '../../src/lib/engine/calculadoras/aluguel'
import { calcularCarneLeao } from '../../src/lib/engine/calculadoras/carne-leao'
import { calcularHorasTrabalhadas, type EntradaHorasTrabalhadas } from '../../src/lib/engine/calculadoras/horas-trabalhadas'
import { calcularVendaDeBem } from '../../src/lib/engine/calculadoras/venda-de-bens'
import { ZERO, centavos } from '../../src/lib/engine/types'
import { GANHO_DE_CAPITAL } from '../../src/lib/params/data/ganho-de-capital'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { JORNADA } from '../../src/lib/params/data/jornada'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-113 — venda de bens
// ---------------------------------------------------------------------------

describe('CALC-113 · ganho de capital na venda de bens', () => {
  const registro = construirRegistro(GANHO_DE_CAPITAL)
  const venda = (valorDeVenda: number, custo: number, outras = 0) => {
    const r = calcularVendaDeBem(
      { valorDeVenda: centavos(valorDeVenda), custoDeAquisicao: centavos(custo), outrasVendasNoMes: centavos(outras) },
      REF,
      registro,
    )
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  /** Carro vendido por R$ 60.000,00, comprado por R$ 45.000,00: R$ 15.000,00 × 15% = R$ 2.250,00. */
  it('acima do teto: 15% sobre o ganho', () => {
    const v = venda(6_000_000, 4_500_000)
    expect(v.isento).toBe(false)
    expect(v.ganho).toBe(1_500_000)
    expect(v.imposto).toBe(225_000)
    expect(v.liquido).toBe(1_275_000)
  })

  it('até R$ 35.000,00 no mês: isento, mesmo com lucro', () => {
    expect(venda(3_000_000, 2_000_000).imposto).toBe(0)
    expect(venda(3_000_000, 2_000_000).isento).toBe(true)
    // "igual ou inferior": exatamente o teto ainda é isento.
    expect(venda(3_500_000, 1_000_000).isento).toBe(true)
  })

  /** Dois bens da mesma natureza de R$ 20.000,00 no mesmo mês: R$ 40.000,00 — sem isenção. Ganho de R$ 5.000,00 × 15%. */
  it('bens da mesma natureza no mesmo mês somam para o teto', () => {
    const v = venda(2_000_000, 1_500_000, 2_000_000)
    expect(v.conjuntoNoMes).toBe(4_000_000)
    expect(v.isento).toBe(false)
    expect(v.imposto).toBe(75_000)
  })

  it('prejuízo não gera imposto', () => {
    const v = venda(5_000_000, 5_500_000)
    expect(v.ganho).toBe(-500_000)
    expect(v.imposto).toBe(0)
  })

  /** Ganho de R$ 6 milhões: 15% sobre R$ 5 milhões (R$ 750.000,00) + 17,5% sobre R$ 1 milhão (R$ 175.000,00). */
  it('a segunda faixa incide só sobre a parcela dela', () => {
    expect(venda(800_000_000, 200_000_000).imposto).toBe(92_500_000)
  })

  it('entradas recusadas', () => {
    expect(calcularVendaDeBem({ valorDeVenda: ZERO, custoDeAquisicao: ZERO, outrasVendasNoMes: ZERO }, REF, registro).ok).toBe(false)
    expect(
      calcularVendaDeBem({ valorDeVenda: centavos(100), custoDeAquisicao: centavos(-1), outrasVendasNoMes: ZERO }, REF, registro).ok,
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CALC-114 — aluguel
// ---------------------------------------------------------------------------

describe('CALC-114 · imposto sobre aluguel', () => {
  const registro = construirRegistro(IRRF, INSS)
  const BASE: EntradaAluguel = {
    aluguel: centavos(600_000),
    impostosETaxas: centavos(20_000),
    condominio: centavos(80_000),
    administracao: centavos(60_000),
    sublocacao: ZERO,
    dependentes: 0,
    quemPaga: 'pessoa-fisica',
  }
  const aluguel = (over: Partial<EntradaAluguel> = {}, ref = REF) => {
    const r = calcularImpostoSobreAluguel({ ...BASE, ...over }, ref, registro)
    if (!r.ok) throw new Error(r.detalhe)
    return r
  }
  const carneLeao = (rendimento: number, ref = REF) => {
    const r = calcularCarneLeao(
      { rendimento: centavos(rendimento), livroCaixa: ZERO, excessoAnterior: ZERO, inss: ZERO, dependentes: 0, pensao: ZERO },
      ref,
      registro,
    )
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores.imposto
  }

  /** R$ 6.000,00 − (R$ 200,00 + R$ 800,00 + R$ 600,00) = R$ 4.400,00 tributáveis. */
  it('as exclusões saem da base antes do imposto', () => {
    const r = aluguel()
    expect(r.valores.exclusoes).toBe(160_000)
    expect(r.valores.baseAntesDasDeducoes).toBe(440_000)
    expect(r.valores.imposto).toBe(carneLeao(440_000))
  })

  it('sem exclusões, é o carnê-leão sobre o aluguel inteiro — e a diferença é real', () => {
    const cheio = aluguel({ impostosETaxas: ZERO, condominio: ZERO, administracao: ZERO }, '2025-06-15' as DataISO)
    const comExclusoes = aluguel({}, '2025-06-15' as DataISO)
    expect(cheio.valores.imposto).toBe(carneLeao(600_000, '2025-06-15' as DataISO))
    expect(comExclusoes.valores.imposto).toBeLessThan(cheio.valores.imposto)
  })

  it('o aluguel da sublocação também sai da base', () => {
    expect(aluguel({ sublocacao: centavos(100_000) }).valores.baseAntesDasDeducoes).toBe(340_000)
  })

  it('as exclusões não passam do próprio aluguel', () => {
    const r = aluguel({ condominio: centavos(900_000) })
    expect(r.valores.baseAntesDasDeducoes).toBe(0)
    expect(r.valores.imposto).toBe(0)
  })

  it('pago por empresa: mesma conta, fundamento do art. 689', () => {
    const pf = aluguel()
    const pj = aluguel({ quemPaga: 'pessoa-juridica' })
    expect(pj.valores.imposto).toBe(pf.valores.imposto)
    expect(pj.traco.etapas[0]?.fundamento?.dispositivo).toContain('689')
    expect(pf.traco.etapas[0]?.fundamento?.dispositivo).toContain('42')
  })

  it('sem aluguel, fica pendente', () => {
    const r = calcularImpostoSobreAluguel({ ...BASE, aluguel: ZERO }, REF, registro)
    expect(r.ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CALC-115 — horas trabalhadas
// ---------------------------------------------------------------------------

describe('CALC-115 · horas trabalhadas e intervalos', () => {
  const registro = construirRegistro(JORNADA)
  const BASE: EntradaHorasTrabalhadas = {
    entradaHora: 8,
    entradaMinuto: 0,
    saidaHora: 17,
    saidaMinuto: 48,
    intervaloMinutos: 60,
    diasPorSemana: 5,
    valorDaHora: ZERO,
  }
  const horas = (over: Partial<EntradaHorasTrabalhadas> = {}) => {
    const r = calcularHorasTrabalhadas({ ...BASE, ...over }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  /** 8h às 17h48 com uma hora de almoço: 8h48 por dia, 44h em cinco dias. Descanso de 14h12. */
  it('a jornada clássica de 44 horas', () => {
    const v = horas()
    expect(v.minutosPorDia).toBe(528)
    expect(v.minutosPorSemana).toBe(2_640)
    expect(v.minutosAlemDaDiaria).toBe(48)
    expect(v.minutosAlemDaSemanal).toBe(0)
    expect(v.intervaloSuprimido).toBe(0)
    expect(v.descansoEntreJornadas).toBe(852)
    expect(v.descansoAbaixoDoMinimo).toBe(false)
  })

  /**
   * 8h às 17h com 30 minutos de intervalo: 8h30 de trabalho, acima de seis
   * horas — faltam 30 minutos. Hora de R$ 20,00: R$ 10,00 + 50% = R$ 15,00 por
   * dia, R$ 75,00 na semana.
   */
  it('intervalo menor que uma hora: o que falta é pago com 50%', () => {
    const v = horas({ saidaHora: 17, saidaMinuto: 0, intervaloMinutos: 30, valorDaHora: centavos(2_000) })
    expect(v.minutosPorDia).toBe(510)
    expect(v.intervaloExigido).toBe(60)
    expect(v.intervaloSuprimido).toBe(30)
    expect(v.valorSuprimidoPorDia).toBe(1_500)
    expect(v.valorSuprimidoPorSemana).toBe(7_500)
  })

  it('mais de quatro e até seis horas: quinze minutos', () => {
    const v = horas({ saidaHora: 13, saidaMinuto: 0, intervaloMinutos: 0 })
    expect(v.minutosPorDia).toBe(300)
    expect(v.intervaloExigido).toBe(15)
    expect(v.intervaloSuprimido).toBe(15)
  })

  it('até quatro horas: nenhum intervalo exigido', () => {
    expect(horas({ saidaHora: 12, saidaMinuto: 0, intervaloMinutos: 0 }).intervaloExigido).toBe(0)
  })

  it('seis horas exatas não passam do limite: quinze minutos, não uma hora', () => {
    const v = horas({ saidaHora: 14, saidaMinuto: 15, intervaloMinutos: 15 })
    expect(v.minutosPorDia).toBe(360)
    expect(v.intervaloExigido).toBe(15)
  })

  /** 22h às 6h com uma hora: atravessa a meia-noite — 7 horas de trabalho, período noturno. */
  it('jornada que atravessa a meia-noite', () => {
    const v = horas({ entradaHora: 22, saidaHora: 6, saidaMinuto: 0 })
    expect(v.minutosPorDia).toBe(420)
    expect(v.passaPeloPeriodoNoturno).toBe(true)
    expect(v.descansoEntreJornadas).toBe(960)
  })

  /** 7h às 21h: 14 horas de presença — sobram 10 horas até a próxima entrada, menos que as 11. */
  it('descanso entre jornadas abaixo de onze horas', () => {
    const v = horas({ entradaHora: 7, saidaHora: 21, saidaMinuto: 0 })
    expect(v.descansoEntreJornadas).toBe(600)
    expect(v.descansoAbaixoDoMinimo).toBe(true)
    expect(v.passaPeloPeriodoNoturno).toBe(false)
  })

  it('intervalo de três horas passa do máximo sem acordo', () => {
    expect(horas({ saidaHora: 20, saidaMinuto: 0, intervaloMinutos: 180 }).intervaloAcimaDoMaximo).toBe(true)
  })

  it('entradas recusadas', () => {
    for (const over of [{ saidaHora: 8, saidaMinuto: 0 }, { intervaloMinutos: 600 }, { entradaHora: 24 }, { saidaMinuto: 60 }, { diasPorSemana: 0 }]) {
      expect(calcularHorasTrabalhadas({ ...BASE, ...over }, REF, registro).ok).toBe(false)
    }
  })

  it('antes da redação atual do § 4º, não há cobertura (RN-003)', () => {
    const r = calcularHorasTrabalhadas(BASE, '2017-11-10' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
