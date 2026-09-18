/**
 * CALC-116 — DAS do Simples Nacional · CALC-117 — DAE do empregador doméstico.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre textos oficiais lidos em
 * 18/09/2026 no Planalto:
 *
 * - LC nº 123/2006, art. 18, § 1º-A (alíquota efetiva = (RBT12 × Aliq − PD) ÷
 *   RBT12) e Anexos I a V na redação da LC nº 155/2016, transcritos em
 *   `fontes.ts`; § 5º-J (fator R de 28%);
 * - LC nº 150/2015, art. 34 (8% patronal e 0,8% de seguro-acidente sobre o
 *   salário de contribuição; 8% de FGTS; 3,2% do art. 22), com a tabela do INSS
 *   de 2026 já cadastrada: 7,5% até R$ 1.621,00, 9% até R$ 2.902,84, 12% até
 *   R$ 4.354,27 e 14% até o teto de R$ 8.475,55.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularDae } from '../../src/lib/engine/calculadoras/dae-domestico'
import { calcularDas, type EntradaDas } from '../../src/lib/engine/calculadoras/simples-das'
import { centavos } from '../../src/lib/engine/types'
import { DOMESTICO } from '../../src/lib/params/data/domestico'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { SIMPLES_NACIONAL } from '../../src/lib/params/data/simples-nacional'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-116
// ---------------------------------------------------------------------------

describe('CALC-116 · DAS do Simples Nacional', () => {
  const registro = construirRegistro(SIMPLES_NACIONAL)
  const das = (atividade: EntradaDas['atividade'], rbt12: number, receita: number, folha12 = 0) => {
    const r = calcularDas(
      { atividade, rbt12: centavos(rbt12), receitaDoMes: centavos(receita), folha12: centavos(folha12) },
      REF,
      registro,
    )
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  /** 1ª faixa: sem parcela a deduzir, a efetiva é a própria nominal — 4% de R$ 15.000,00. */
  it('comércio na 1ª faixa: efetiva igual à nominal', () => {
    const v = das('comercio', 18_000_000, 1_500_000)
    expect(v.anexo).toBe('I')
    expect(v.efetivaCentesimosBp).toBe(40_000)
    expect(v.das).toBe(60_000)
  })

  /**
   * Comércio com R$ 500.000,00 em doze meses: 3ª faixa, 9,50%, deduzir
   * R$ 13.860,00. (500.000 × 9,5% − 13.860) ÷ 500.000 = 6,728%. Sobre
   * R$ 40.000,00: R$ 2.691,20.
   */
  it('comércio na 3ª faixa: a parcela a deduzir baixa a alíquota', () => {
    const v = das('comercio', 50_000_000, 4_000_000)
    expect(v.faixa).toBe(3)
    expect(v.efetivaCentesimosBp).toBe(67_280)
    expect(v.das).toBe(269_120)
  })

  /** Indústria com R$ 1.000.000,00: 4ª faixa, (112.000 − 22.500) ÷ 1.000.000 = 8,95%. R$ 80.000,00 → R$ 7.160,00. */
  it('indústria na 4ª faixa', () => {
    const v = das('industria', 100_000_000, 8_000_000)
    expect(v.anexo).toBe('II')
    expect(v.efetivaCentesimosBp).toBe(89_500)
    expect(v.das).toBe(716_000)
  })

  /**
   * Serviços com R$ 600.000,00 de receita e R$ 180.000,00 de folha: fator R de
   * 30%, Anexo III, 3ª faixa — (81.000 − 17.640) ÷ 600.000 = 10,56%. R$ 50.000,00
   * → R$ 5.280,00. Com folha de R$ 120.000,00 (20%): Anexo V — (117.000 −
   * 9.900) ÷ 600.000 = 17,85%, R$ 8.925,00.
   */
  it('o fator R escolhe entre o Anexo III e o V', () => {
    const iii = das('servicos-fator-r', 60_000_000, 5_000_000, 18_000_000)
    expect(iii.anexo).toBe('III')
    expect(iii.fatorRBp).toBe(3_000)
    expect(iii.das).toBe(528_000)
    const v = das('servicos-fator-r', 60_000_000, 5_000_000, 12_000_000)
    expect(v.anexo).toBe('V')
    expect(v.das).toBe(892_500)
  })

  it('fator R exatamente em 28% já leva ao Anexo III', () => {
    expect(das('servicos-fator-r', 60_000_000, 5_000_000, 16_800_000).anexo).toBe('III')
    expect(das('servicos-fator-r', 60_000_000, 5_000_000, 16_799_999).anexo).toBe('V')
  })

  /** Anexo IV com R$ 300.000,00: 2ª faixa, (27.000 − 8.100) ÷ 300.000 = 6,3%. R$ 25.000,00 → R$ 1.575,00. */
  it('Anexo IV', () => {
    const v = das('servicos-anexo-iv', 30_000_000, 2_500_000)
    expect(v.efetivaCentesimosBp).toBe(63_000)
    expect(v.das).toBe(157_500)
  })

  /**
   * Sem arredondar no meio: comércio com R$ 333.333,33 — 2ª faixa, 7,30%,
   * deduzir R$ 5.940,00 —, efetiva de 5,51799998…%, que aparece como 5,5180%.
   * Sobre R$ 30.000,00: R$ 1.655,39999… → R$ 1.655,40.
   */
  it('a fórmula sem arredondamento intermediário', () => {
    const v = das('comercio', 33_333_333, 3_000_000)
    expect(v.faixa).toBe(2)
    expect(v.efetivaCentesimosBp).toBe(55_180)
    expect(v.das).toBe(165_540)
  })

  /** Última faixa: comércio com R$ 4.000.000,00 — (760.000 − 378.000) ÷ 4.000.000 = 9,55%. */
  it('a 6ª faixa e o aviso do sublimite', () => {
    const v = das('comercio', 400_000_000, 30_000_000)
    expect(v.faixa).toBe(6)
    expect(v.efetivaCentesimosBp).toBe(95_500)
    expect(v.acimaDoSublimite).toBe(true)
  })

  it('acima de R$ 4.800.000,00 está fora do Simples; exatamente no teto, ainda dentro', () => {
    expect(calcularDas({ atividade: 'comercio', rbt12: centavos(480_000_001), receitaDoMes: centavos(100), folha12: centavos(0) }, REF, registro).ok).toBe(false)
    expect(das('comercio', 480_000_000, 100).faixa).toBe(6)
  })

  it('RN-003 — a partir de 2027 os anexos são outros, e o cálculo bloqueia', () => {
    const r = calcularDas({ atividade: 'comercio', rbt12: centavos(18_000_000), receitaDoMes: centavos(100), folha12: centavos(0) }, '2027-01-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

// ---------------------------------------------------------------------------
// CALC-117
// ---------------------------------------------------------------------------

describe('CALC-117 · DAE do empregador doméstico', () => {
  const registro = construirRegistro(INSS, IRRF, TRABALHISTA, DOMESTICO)
  const dae = (salario: number, dependentes = 0) => {
    const r = calcularDae({ salario: centavos(salario), dependentes }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    return r.valores
  }

  /**
   * Salário mínimo de 2026, R$ 1.621,00:
   * - INSS 7,5% = R$ 121,575 → R$ 121,58; imposto de renda: zero;
   * - patronal 8% = R$ 129,68; seguro-acidente 0,8% = R$ 12,968 → R$ 12,97;
   * - FGTS 8% = R$ 129,68; indenização 3,2% = R$ 51,872 → R$ 51,87;
   * - DAE = R$ 445,78; custo do empregador = R$ 1.621,00 + R$ 324,20 = R$ 1.945,20.
   */
  it('um salário mínimo', () => {
    const v = dae(162_100)
    expect(v.inssEmpregado).toBe(12_158)
    expect(v.irrf).toBe(0)
    expect(v.patronal).toBe(12_968)
    expect(v.seguroAcidente).toBe(1_297)
    expect(v.fgts).toBe(12_968)
    expect(v.indenizacao).toBe(5_187)
    expect(v.dae).toBe(44_578)
    expect(v.custoDoEmpregador).toBe(194_520)
    expect(v.liquidoDoEmpregado).toBe(149_942)
  })

  /**
   * R$ 2.500,00: INSS R$ 121,575 + (2.500 − 1.621) × 9% = R$ 79,11 → R$ 200,69;
   * encargos do empregador R$ 200,00 + R$ 20,00 + R$ 200,00 + R$ 80,00 = R$ 500,00
   * — 20% do salário.
   */
  it('os encargos do empregador somam 20% do salário', () => {
    const v = dae(250_000)
    expect(v.inssEmpregado).toBe(20_069)
    expect(v.custoDoEmpregador).toBe(300_000)
    expect(v.dae).toBe(v.inssEmpregado + v.irrf + 50_000)
  })

  /**
   * Acima do teto: patronal e seguro-acidente sobre R$ 8.475,55 (R$ 678,04 e
   * R$ 67,80); FGTS e indenização sobre o salário inteiro de R$ 10.000,00
   * (R$ 800,00 e R$ 320,00).
   */
  it('salário acima do teto: a base previdenciária para, o FGTS não', () => {
    const v = dae(1_000_000)
    expect(v.baseLimitadaPeloTeto).toBe(true)
    expect(v.patronal).toBe(67_804)
    expect(v.seguroAcidente).toBe(6_780)
    expect(v.fgts).toBe(80_000)
    expect(v.indenizacao).toBe(32_000)
    expect(v.dae).toBe(v.inssEmpregado + v.irrf + 67_804 + 6_780 + 80_000 + 32_000)
  })

  it('a memória cita o art. 34 da LC nº 150', () => {
    const r = calcularDae({ salario: centavos(162_100), dependentes: 0 }, REF, registro)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.traco.etapas.at(-1)?.fundamento?.dispositivo).toContain('Art. 34')
  })

  it('RN-003 — antes do Simples Doméstico, não há DAE', () => {
    const r = calcularDae({ salario: centavos(162_100), dependentes: 0 }, '2015-09-30' as DataISO, registro)
    expect(r.ok).toBe(false)
  })

  it('sem salário, fica pendente', () => {
    expect(calcularDae({ salario: centavos(0), dependentes: 0 }, REF, registro).ok).toBe(false)
  })
})
