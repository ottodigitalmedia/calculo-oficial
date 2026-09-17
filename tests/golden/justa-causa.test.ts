/**
 * CALC-092 — casos-ouro da rescisão por justa causa.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a CLT — art. 64 (o dia do
 * mensalista é um trinta avos) e art. 146 (as férias adquiridas são devidas
 * "qualquer que seja a causa" da cessação) —, sobre a Lei nº 4.090/1962, art.
 * 3º (a gratificação proporcional é da rescisão SEM justa causa), sobre a
 * Súmula 171 do TST (as férias proporcionais não são devidas na justa causa) e
 * sobre a Lei nº 8.036/1990, art. 20, I (a justa causa não é hipótese de
 * movimentação da conta vinculada).
 *
 * Onde o caso depende de INSS ou de IRRF, quem calcula é o motor já conferido
 * contra os exemplos oficiais — mesma disciplina de `rescisao.test.ts`. Este
 * arquivo verifica a COMPOSIÇÃO e as decisões de incidência: o que entra, o que
 * fica de fora e sobre o que incide desconto.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularJustaCausa,
  type EntradaJustaCausa,
} from '../../src/lib/engine/calculadoras/justa-causa'
import { calcularRescisao } from '../../src/lib/engine/calculadoras/rescisao'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA)
const REF = '2026-06-15' as DataISO

const BASE: EntradaJustaCausa = {
  desligamento: '2026-06-15' as DataISO,
  salario: centavos(300_000),
  periodosVencidos: 0,
  dependentes: 0,
}

function justa(over: Partial<EntradaJustaCausa> = {}, ref = REF) {
  const r = calcularJustaCausa({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-092 · o que a justa causa paga', () => {
  /**
   * R$ 3.000,00 ÷ 30 × 15 = R$ 1.500,00 de saldo.
   * INSS na primeira faixa de 2026: R$ 1.500,00 × 7,5% = R$ 112,50.
   * Base do imposto R$ 1.387,50, abaixo da isenção — imposto zero.
   * Líquido: 1.500,00 − 112,50 = R$ 1.387,50.
   */
  it('sem férias vencidas, sobra o saldo de salário', () => {
    const v = justa()
    expect(v.saldoSalario).toBe(150_000)
    expect(v.feriasVencidas).toBe(0)
    expect(v.inss).toBe(11_250)
    expect(v.irrf).toBe(0)
    expect(v.totalBruto).toBe(150_000)
    expect(v.totalLiquido).toBe(138_750)
  })

  /**
   * Um período vencido: R$ 3.000,00 + R$ 1.000,00 de terço = R$ 4.000,00.
   * Total bruto R$ 5.500,00; o desconto continua sendo só o do saldo.
   */
  it('as férias já adquiridas são devidas, com o terço', () => {
    const v = justa({ periodosVencidos: 1 })
    expect(v.feriasVencidas).toBe(400_000)
    expect(v.totalBruto).toBe(550_000)
    expect(v.inss).toBe(11_250)
    expect(v.totalLiquido).toBe(538_750)
  })

  /** Dois períodos: R$ 6.000,00 + R$ 2.000,00 = R$ 8.000,00. */
  it('mais de um período acumulado multiplica a verba', () => {
    expect(justa({ periodosVencidos: 2 }).feriasVencidas).toBe(800_000)
  })

  /** R$ 2.500,00 × 1 período: terço = 833,333… → R$ 833,33; total R$ 3.333,33. */
  it('o terço arredonda uma vez, sobre o produto', () => {
    const v = justa({ salario: centavos(250_000), periodosVencidos: 1 })
    expect(v.feriasVencidas).toBe(333_333)
  })

  it('o dia do desligamento decide o saldo — dia 1 paga um trinta avos', () => {
    expect(justa({ desligamento: '2026-06-01' as DataISO }).saldoSalario).toBe(10_000)
    expect(justa({ desligamento: '2026-06-30' as DataISO }).saldoSalario).toBe(300_000)
  })
})

describe('CALC-092 · o que a justa causa retira', () => {
  /**
   * A mesma entrada na dispensa SEM justa causa tem aviso, 13º, férias
   * proporcionais e multa. O total precisa ser muito maior — e a diferença é
   * exatamente o que esta calculadora existe para mostrar.
   */
  it('a dispensa sem justa causa, com a mesma entrada, paga bem mais', () => {
    const semJustaCausa = calcularRescisao(
      {
        admissao: '2020-03-10' as DataISO,
        desligamento: '2026-06-15' as DataISO,
        salario: centavos(300_000),
        modalidade: 'sem-justa-causa',
        regime: 'clt',
        avisoPrevio: 'indenizado',
        temFeriasVencidas: false,
        saldoFgtsInformado: centavos(0),
        dependentes: 0,
      },
      REF,
      registro,
    )
    if (!semJustaCausa.ok) throw new Error(semJustaCausa.detalhe)

    const comJustaCausa = justa()
    expect(comJustaCausa.totalBruto).toBeLessThan(semJustaCausa.valores.totalBruto)
    // Nenhuma das verbas que a justa causa retira aparece nesta conta.
    expect(comJustaCausa.totalBruto).toBe(comJustaCausa.saldoSalario)
  })

  it('a memória declara cada exclusão com a norma', () => {
    const r = calcularJustaCausa(BASE, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    const rotulos = r.traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Sem 13º proporcional')
    expect(rotulos).toContain('Sem férias proporcionais')
    expect(rotulos).toContain('Sem multa do FGTS e sem saque')
    expect(rotulos).toContain('Sem aviso prévio')

    const normas = r.traco.etapas.flatMap((e) => (e.fundamento ? [e.fundamento.norma] : []))
    expect(normas.some((n) => n.includes('4.090'))).toBe(true)
    expect(normas.some((n) => n.includes('Súmula 171'))).toBe(true)
    expect(normas.some((n) => n.includes('8.036'))).toBe(true)
  })

  /**
   * As férias vencidas pagas na rescisão são indenizatórias: fora da base do
   * INSS (Lei nº 8.212/1991, art. 28, § 9º, "d") e isentas de imposto (Súmula
   * 386 do STJ). Se alguém as somar à base, o desconto sobe.
   */
  it('as férias vencidas não entram na base do INSS nem do imposto', () => {
    expect(justa({ periodosVencidos: 3 }).inss).toBe(justa().inss)
    expect(justa({ periodosVencidos: 3 }).irrf).toBe(justa().irrf)
  })
})

describe('CALC-092 · incidências sobre o saldo', () => {
  /** Salário alto: o saldo sozinho já produz imposto, e o INSS passa da primeira faixa. */
  it('saldo alto produz INSS e imposto', () => {
    const v = justa({ salario: centavos(900_000), desligamento: '2026-06-30' as DataISO })
    expect(v.inss).toBeGreaterThan(11_250)
    expect(v.irrf).toBeGreaterThan(0)
    expect(v.totalLiquido).toBe(v.totalBruto - v.inss - v.irrf)
  })

  it('dependentes reduzem o imposto e não mudam o INSS', () => {
    const sem = justa({ salario: centavos(900_000), desligamento: '2026-06-30' as DataISO })
    const com = justa({ salario: centavos(900_000), desligamento: '2026-06-30' as DataISO, dependentes: 3 })
    expect(com.irrf).toBeLessThan(sem.irrf)
    expect(com.inss).toBe(sem.inss)
  })

  it('RF-004 — a vigência de 2025 dá desconto diferente da de 2026', () => {
    const em2025 = justa({ salario: centavos(900_000), desligamento: '2025-06-30' as DataISO }, '2025-06-15' as DataISO)
    const em2026 = justa({ salario: centavos(900_000), desligamento: '2026-06-30' as DataISO })
    expect(em2025.inss).not.toBe(em2026.inss)
  })
})

describe('CALC-092 · entradas recusadas', () => {
  it('sem salário ou sem data, fica pendente', () => {
    const semSalario = calcularJustaCausa({ ...BASE, salario: centavos(0) }, REF, registro)
    expect(semSalario.ok).toBe(false)
    if (!semSalario.ok) expect(semSalario.motivo).toBe('entrada_incompleta')

    const semData = calcularJustaCausa({ ...BASE, desligamento: '' as DataISO }, REF, registro)
    expect(semData.ok).toBe(false)
    if (!semData.ok) expect(semData.motivo).toBe('entrada_incompleta')
  })

  it('períodos de férias fora da faixa são recusados', () => {
    for (const periodos of [-1, 6, 1.5]) {
      const r = calcularJustaCausa({ ...BASE, periodosVencidos: periodos }, REF, registro)
      expect(r.ok, `${periodos} períodos`).toBe(false)
      if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    }
  })

  it('RN-003 — data sem tabela cadastrada bloqueia', () => {
    const r = calcularJustaCausa(BASE, '2015-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
