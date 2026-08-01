/**
 * Casos-ouro de CALC-018 — IR sobre renda fixa.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Lei nº 11.033/2004, art. 1º, lido no texto do Planalto:
 *
 *   "I - 22,5% [...] até 180 dias; II - 20% [...] de 181 até 360 dias;
 *    III - 17,5% [...] de 361 até 720 dias; IV - 15% [...] acima de 720 dias."
 *
 * E o art. 3º, II, que isenta letras hipotecárias, CRI e LCI.
 *
 * A tabela inteira está reproduzida abaixo, faixa a faixa, **nas fronteiras** —
 * que é onde ela decide alguma coisa. Os valores monetários são identidades:
 * imposto mais líquido tem de devolver o bruto, sempre.
 *
 * `CO-1`: nenhum valor veio de outro site.
 */

import { describe, expect, it } from 'vitest'

import { calcularRendaFixa } from '../../src/lib/engine/calculadoras/renda-fixa'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { RENDA_FIXA } from '../../src/lib/params/data/renda-fixa'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(RENDA_FIXA)
const REF = '2026-06-15' as DataISO

const BASE = {
  valorAplicado: centavos(1_000_000),
  taxaAnual: basisPoints(1_200),
  prazoMeses: 12,
  isenta: false,
} as const

// ---------------------------------------------------------------------------
// A tabela regressiva, nas fronteiras
// ---------------------------------------------------------------------------

describe('CALC-018 · a tabela do art. 1º, faixa a faixa', () => {
  /**
   * Os meses foram escolhidos para cair exatamente sobre as fronteiras da lei:
   * 6 meses são 180 dias, 12 são 360, 24 são 720. É onde a alíquota troca, e é
   * o único lugar em que um erro de comparação apareceria.
   */
  const casos = [
    { meses: 1, dias: 30, faixa: 1, bp: 2_250 },
    { meses: 6, dias: 180, faixa: 1, bp: 2_250 },
    { meses: 7, dias: 210, faixa: 2, bp: 2_000 },
    { meses: 12, dias: 360, faixa: 2, bp: 2_000 },
    { meses: 13, dias: 390, faixa: 3, bp: 1_750 },
    { meses: 24, dias: 720, faixa: 3, bp: 1_750 },
    { meses: 25, dias: 750, faixa: 4, bp: 1_500 },
    { meses: 120, dias: 3_600, faixa: 4, bp: 1_500 },
  ] as const

  for (const { meses, dias, faixa, bp } of casos) {
    it(`${meses} meses = ${dias} dias → ${faixa}ª faixa, ${bp / 100}%`, () => {
      const r = calcularRendaFixa({ ...BASE, prazoMeses: meses }, REF, registro)
      if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
      expect(r.valores.prazoDias).toBe(dias)
      expect(r.valores.faixa).toBe(faixa)
      expect(r.valores.aliquota).toBe(bp)
    })
  }

  /**
   * A fronteira dos 720 dias é a mais valiosa da tabela, e é inclusiva: "até
   * 720" fica em 17,5%, e só "acima de 720" cai para 15%.
   */
  it('720 dias ainda são 17,5%; 750 já são 15%', () => {
    const dentro = calcularRendaFixa({ ...BASE, prazoMeses: 24 }, REF, registro)
    const fora = calcularRendaFixa({ ...BASE, prazoMeses: 25 }, REF, registro)
    if (!dentro.ok || !fora.ok) throw new Error('esperado sucesso')
    expect(dentro.valores.aliquota).toBe(1_750)
    expect(fora.valores.aliquota).toBe(1_500)
  })
})

// ---------------------------------------------------------------------------
// As identidades do cálculo
// ---------------------------------------------------------------------------

describe('CALC-018 · imposto e líquido devolvem o bruto', () => {
  const r = calcularRendaFixa(BASE, REF, registro)
  if (!r.ok) throw new Error('esperado sucesso')

  it('rendimento líquido mais imposto é o rendimento bruto', () => {
    expect(r.valores.rendimentoLiquido + r.valores.imposto).toBe(r.valores.rendimentoBruto)
  })

  it('montante líquido mais imposto é o montante bruto', () => {
    expect(r.valores.montanteLiquido + r.valores.imposto).toBe(r.valores.montanteBruto)
  })

  it('o montante bruto é o aplicado mais o rendimento', () => {
    expect(r.valores.valorAplicado + r.valores.rendimentoBruto).toBe(r.valores.montanteBruto)
  })

  /** R$ 10.000,00 a 12% ao ano por 12 meses rendem R$ 1.200,00 brutos. */
  it('doze meses a 12% ao ano rendem 12% — a conversão de taxa fecha', () => {
    expect(Math.abs(r.valores.rendimentoBruto - 120_000)).toBeLessThanOrEqual(100)
  })

  it('o imposto é 20% do rendimento na 2ª faixa', () => {
    expect(r.valores.imposto).toBe(Math.round(r.valores.rendimentoBruto * 0.2))
  })
})

// ---------------------------------------------------------------------------
// O degrau seguinte — a informação acionável
// ---------------------------------------------------------------------------

describe('CALC-018 · quanto vale esperar a próxima faixa', () => {
  const r = calcularRendaFixa({ ...BASE, prazoMeses: 24 }, REF, registro)
  if (!r.ok) throw new Error('esperado sucesso')

  it('diz quantos dias faltam para a faixa seguinte', () => {
    // 24 meses são 720 dias; a 4ª faixa começa em 721.
    expect(r.valores.diasParaProximaFaixa).toBe(1)
  })

  it('a economia é a diferença de alíquota sobre o mesmo rendimento', () => {
    const esperada =
      Math.round(r.valores.rendimentoBruto * 0.175) - Math.round(r.valores.rendimentoBruto * 0.15)
    expect(Math.abs(r.valores.economiaNaProximaFaixa - esperada)).toBeLessThanOrEqual(1)
  })

  it('na última faixa não há próxima, e a economia é zero', () => {
    const ultima = calcularRendaFixa({ ...BASE, prazoMeses: 36 }, REF, registro)
    if (!ultima.ok) throw new Error('esperado sucesso')
    expect(ultima.valores.faixa).toBe(4)
    expect(ultima.valores.economiaNaProximaFaixa).toBe(0)
    expect(ultima.valores.diasParaProximaFaixa).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// A isenção do art. 3º, II
// ---------------------------------------------------------------------------

describe('CALC-018 · aplicação isenta', () => {
  const isenta = calcularRendaFixa({ ...BASE, isenta: true }, REF, registro)
  const tributada = calcularRendaFixa(BASE, REF, registro)
  if (!isenta.ok || !tributada.ok) throw new Error('esperado sucesso')

  it('não há imposto, e o líquido é o bruto', () => {
    expect(isenta.valores.imposto).toBe(0)
    expect(isenta.valores.aliquota).toBe(0)
    expect(isenta.valores.montanteLiquido).toBe(isenta.valores.montanteBruto)
  })

  it('o rendimento bruto é o mesmo da tributada — só o imposto muda', () => {
    expect(isenta.valores.rendimentoBruto).toBe(tributada.valores.rendimentoBruto)
    expect(isenta.valores.montanteLiquido).toBeGreaterThan(tributada.valores.montanteLiquido)
  })

  it('a memória cita o art. 3º da Lei nº 11.033', () => {
    const etapa = isenta.traco.etapas.find((e) => e.rotulo.startsWith('Aplicação isenta'))
    expect(etapa?.fundamento?.norma).toContain('11.033')
    expect(etapa?.fundamento?.dispositivo).toContain('3º')
  })

  /**
   * O que a calculadora existe para deixar comparável: uma isenta a taxa menor
   * pode ganhar de uma tributada a taxa maior. Aqui, 10% isenta contra 12%
   * tributada em doze meses.
   */
  it('uma isenta a 10% bate uma tributada a 12% em doze meses', () => {
    const lci = calcularRendaFixa(
      { ...BASE, taxaAnual: basisPoints(1_000), isenta: true },
      REF,
      registro,
    )
    if (!lci.ok) throw new Error('esperado sucesso')
    expect(lci.valores.montanteLiquido).toBeGreaterThan(tributada.valores.montanteLiquido)
  })
})

describe('CALC-018 · a data importa', () => {
  it('antes de 2005 não há tabela, e o cálculo é bloqueado', () => {
    const r = calcularRendaFixa(BASE, '2004-12-31' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.motivo).toBe('vigencia_ausente')
  })

  it('a partir de 1º de janeiro de 2005 a tabela vale', () => {
    expect(calcularRendaFixa(BASE, '2005-01-01' as DataISO, registro).ok).toBe(true)
  })
})

describe('CALC-018 · entradas incompletas', () => {
  it('valor, taxa ou prazo ausentes mantêm o estado pendente', () => {
    for (const parcial of [
      { valorAplicado: centavos(0) },
      { taxaAnual: basisPoints(0) },
      { prazoMeses: 0 },
    ]) {
      expect(calcularRendaFixa({ ...BASE, ...parcial }, REF, registro).ok).toBe(false)
    }
  })
})

describe('CALC-018 · C-M1 · não existe cálculo sem memória', () => {
  it('registra rendimento, faixa, imposto e líquido', () => {
    const r = calcularRendaFixa(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Rendimento bruto no período')
    expect(rotulos).toContain('Imposto retido na fonte')
    expect(rotulos).toContain('Rendimento líquido')
    for (const e of r.traco.etapas) expect(e.formula.length).toBeGreaterThan(0)
  })

  it('a etapa da alíquota sai em unidade percentual e cita a lei', () => {
    const r = calcularRendaFixa(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('faixa'))
    expect(etapa?.unidade).toBe('percentual')
    expect(etapa?.parametro?.norma).toContain('11.033')
    expect(etapa?.parametro?.vigenciaInicio).toBe('2005-01-01')
  })
})
