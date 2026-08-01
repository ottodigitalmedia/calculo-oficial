/**
 * Casos-ouro de CALC-032 — capacidade de financiamento.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * **Nenhuma norma.** O percentual de comprometimento da renda não está em lei —
 * é política de crédito —, e a matemática é a mesma de CALC-024, lida de trás
 * para frente. Os valores esperados são **identidades verificadas por
 * construção**: monta-se o cenário a partir de uma parcela conhecida e exige-se
 * que o cálculo devolva o valor que a gera.
 *
 * É conferência mais forte que número tabelado, porque não depende de nenhuma
 * fonte externa estar certa. `CO-1` continua valendo: nada veio de outro site.
 */

import { describe, expect, it } from 'vitest'

import { calcularCapacidade } from '../../src/lib/engine/calculadoras/capacidade'
import { parcelaPrice } from '../../src/lib/engine/financeira'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

const BASE = {
  rendaMensal: centavos(1_000_000),
  dividasAtuais: centavos(0),
  comprometimentoBp: basisPoints(3_000),
  taxaMensal: basisPoints(100),
  prazoMeses: 360,
  entrada: centavos(0),
} as const

describe('CALC-032 · a margem sai da renda', () => {
  const r = calcularCapacidade(BASE, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  /** 30% de R$ 10.000,00 = R$ 3.000,00. */
  it('30% de R$ 10.000,00 dão parcela máxima de R$ 3.000,00', () => {
    expect(r.valores.parcelaMaxima).toBe(300_000)
  })

  it('sem entrada, o teto do bem é o próprio valor financiável', () => {
    expect(r.valores.valorTotalDoBem).toBe(r.valores.valorFinanciavel)
  })
})

/**
 * A IDENTIDADE QUE PROVA A INVERSÃO.
 *
 * Se o valor financiável está certo, a prestação do sistema francês sobre ele,
 * no mesmo prazo e à mesma taxa, tem de devolver a parcela máxima de onde ele
 * saiu.
 */
describe('CALC-032 · a conta fecha nos dois sentidos', () => {
  const r = calcularCapacidade(BASE, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  it('a parcela do valor financiável devolve a parcela máxima', () => {
    const volta = parcelaPrice(r.valores.valorFinanciavel, BASE.prazoMeses, BASE.taxaMensal)
    expect(Math.abs(volta - r.valores.parcelaMaxima)).toBeLessThanOrEqual(100)
  })

  it('total pago menos juros é o valor financiado', () => {
    expect(r.valores.totalPago - r.valores.jurosTotais).toBe(r.valores.valorFinanciavel)
  })

  /** Em 360 meses a 1% ao mês, os juros superam o valor financiado. */
  it('em trinta anos os juros superam o principal', () => {
    expect(r.valores.jurosTotais).toBeGreaterThan(r.valores.valorFinanciavel)
  })
})

describe('CALC-032 · as dívidas atuais consomem a margem', () => {
  const r = calcularCapacidade({ ...BASE, dividasAtuais: centavos(100_000) }, REF)
  if (!r.ok) throw new Error('esperado sucesso')

  it('a parcela máxima cai exatamente o valor já comprometido', () => {
    expect(r.valores.parcelaMaxima).toBe(200_000)
  })

  it('e o valor financiável cai na mesma proporção', () => {
    const semDividas = calcularCapacidade(BASE, REF)
    if (!semDividas.ok) throw new Error('esperado sucesso')
    const proporcao = r.valores.valorFinanciavel / semDividas.valores.valorFinanciavel
    expect(Math.abs(proporcao - 2 / 3)).toBeLessThan(0.001)
  })

  it('dívidas que consomem a margem inteira bloqueiam o cálculo, com explicação', () => {
    const r2 = calcularCapacidade({ ...BASE, dividasAtuais: centavos(300_000) }, REF)
    expect(r2.ok).toBe(false)
    if (r2.ok) throw new Error('esperado erro')
    expect(r2.detalhe).toContain('já consomem toda a margem')
  })
})

/**
 * A entrada é a alavanca mais barata do cálculo, e o teste diz por quê.
 */
describe('CALC-032 · a entrada soma direto, sem juros por cima', () => {
  const sem = calcularCapacidade(BASE, REF)
  const com = calcularCapacidade({ ...BASE, entrada: centavos(5_000_000) }, REF)
  if (!sem.ok || !com.ok) throw new Error('esperado sucesso')

  it('o valor financiável não muda com a entrada', () => {
    expect(com.valores.valorFinanciavel).toBe(sem.valores.valorFinanciavel)
  })

  it('o teto do bem sobe exatamente o valor da entrada', () => {
    expect(com.valores.valorTotalDoBem - sem.valores.valorTotalDoBem).toBe(5_000_000)
  })

  it('e os juros do contrato não mudam', () => {
    expect(com.valores.jurosTotais).toBe(sem.valores.jurosTotais)
  })
})

describe('CALC-032 · o prazo troca parcela por juros', () => {
  it('alongar aumenta o financiável e aumenta muito mais os juros', () => {
    const curto = calcularCapacidade({ ...BASE, prazoMeses: 120 }, REF)
    const longo = calcularCapacidade({ ...BASE, prazoMeses: 360 }, REF)
    if (!curto.ok || !longo.ok) throw new Error('esperado sucesso')

    expect(longo.valores.valorFinanciavel).toBeGreaterThan(curto.valores.valorFinanciavel)
    // O financiável cresce menos que proporcionalmente; os juros, muito mais.
    const ganhoNoValor = longo.valores.valorFinanciavel / curto.valores.valorFinanciavel
    const ganhoNosJuros = longo.valores.jurosTotais / curto.valores.jurosTotais
    expect(ganhoNosJuros).toBeGreaterThan(ganhoNoValor)
  })
})

describe('CALC-032 · a juros zero o financiável é a soma das parcelas', () => {
  it('sem juros, não há desconto a aplicar', () => {
    const r = calcularCapacidade({ ...BASE, taxaMensal: basisPoints(0), prazoMeses: 12 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.valorFinanciavel).toBe(300_000 * 12)
    expect(r.valores.jurosTotais).toBe(0)
  })
})

describe('CALC-032 · entradas inválidas', () => {
  it('renda, comprometimento ou prazo ausentes mantêm o estado pendente', () => {
    for (const parcial of [
      { rendaMensal: centavos(0) },
      { comprometimentoBp: basisPoints(0) },
      { prazoMeses: 0 },
    ]) {
      expect(calcularCapacidade({ ...BASE, ...parcial }, REF).ok).toBe(false)
    }
  })

  it('taxa e dívidas negativas são recusadas', () => {
    expect(calcularCapacidade({ ...BASE, taxaMensal: basisPoints(-1) }, REF).ok).toBe(false)
    expect(calcularCapacidade({ ...BASE, dividasAtuais: centavos(-1) }, REF).ok).toBe(false)
  })
})

describe('CALC-032 · C-M1 · não existe cálculo sem memória', () => {
  it('a etapa da margem declara que o percentual não é legal', () => {
    const r = calcularCapacidade(BASE, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Margem admitida sobre a renda')
    expect(etapa?.justificativa).toContain('NÃO está em lei')
  })

  it('registra a inversão e o custo, com valores substituídos', () => {
    const r = calcularCapacidade(BASE, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Quanto essa parcela financia')
    expect(rotulos).toContain('Juros ao longo do contrato')
    for (const e of r.traco.etapas) expect(e.formula.length).toBeGreaterThan(0)
  })

  it('não aplica vigência nenhuma — não há parâmetro legal', () => {
    const r = calcularCapacidade(BASE, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.traco.vigenciasAplicadas).toEqual([])
  })
})
