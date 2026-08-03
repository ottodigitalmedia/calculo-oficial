/**
 * Casos-ouro de CALC-050 — INSS do contribuinte individual e do facultativo.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As alíquotas vêm do texto CONSOLIDADO da Lei nº 8.212/1991 no Planalto,
 * conferido em 03/08/2026:
 *
 *   Art. 21, caput (redação da Lei nº 9.876/1999)
 *     "A alíquota de contribuição dos segurados contribuinte individual e
 *      facultativo será de vinte por cento sobre o respectivo
 *      salário-de-contribuição."
 *
 *   Art. 21, § 2º (redação da Lei nº 12.470/2011)
 *     "No caso de opção pela exclusão do direito ao benefício de aposentadoria
 *      por tempo de contribuição, a alíquota de contribuição incidente sobre o
 *      limite mínimo mensal do salário de contribuição será de:
 *      I - 11% […] do segurado contribuinte individual […] que trabalhe por
 *      conta própria, sem relação de trabalho com empresa ou equiparado e do
 *      segurado facultativo […];
 *      II - 5%: […] b) do segurado facultativo sem renda própria que se dedique
 *      exclusivamente ao trabalho doméstico no âmbito de sua residência, desde
 *      que pertencente a família de baixa renda."
 *
 *   Art. 21, § 3º — complementação pela "diferença entre o percentual pago e o
 *   de 20% (vinte por cento)", sobre o limite mínimo, acrescida de juros.
 *
 * O salário mínimo e o teto são os já cadastrados em `inss.ts`, conferidos nas
 * portarias interministeriais: mínimo de R$ 1.621,00 e teto de R$ 8.475,55 em
 * 2026; mínimo de R$ 1.518,00 e teto de R$ 8.157,41 em 2025.
 *
 * As contas fecham à mão:
 *
 *   20% de 1.621,00 = 324,20      11% de 1.621,00 = 178,31
 *    5% de 1.621,00 =  81,05      20% de 8.475,55 = 1.695,11
 *
 * As propriedades que estes casos travam:
 *
 *   1. **A base dos planos reduzidos NÃO acompanha a renda.** É o defeito mais
 *      provável desta calculadora, e o mal-entendido mais comum do assunto.
 *   2. **A alíquota é única, não progressiva** — a tabela de 7,5% a 14% é a do
 *      empregado, e aplicá-la aqui daria número menor com cara de certo.
 *   3. **A base é presa entre o mínimo e o teto** no plano completo.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDef } from '../../src/lib/calculadoras/inss-autonomo'
import {
  calcularInssIndividual,
  diferencaMensal,
} from '../../src/lib/engine/calculadoras/inss-individual'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { INSS_INDIVIDUAL } from '../../src/lib/params/data/inss-individual'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, INSS_INDIVIDUAL)
const REF_2026 = '2026-06-15' as DataISO
const REF_2025 = '2025-06-15' as DataISO

const MINIMO_2026 = 162_100
const TETO_2026 = 847_555

function calcular(plano: 'completo' | 'simplificado' | 'baixa-renda', renda: number, ref = REF_2026) {
  const r = calcularInssIndividual(
    { plano, salarioDeContribuicao: centavos(renda) },
    ref,
    registro,
  )
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-050 · as três alíquotas, sobre a base que a lei manda', () => {
  it('plano completo: 20% sobre o que se declara', () => {
    const v = calcular('completo', 300_000)
    expect(v.aliquotaBp).toBe(2_000)
    expect(v.baseDeCalculo).toBe(300_000)
    expect(v.contribuicao).toBe(60_000)
  })

  it('plano simplificado: 11% sobre o salário mínimo', () => {
    const v = calcular('simplificado', 300_000)
    expect(v.aliquotaBp).toBe(1_100)
    expect(v.baseDeCalculo).toBe(MINIMO_2026)
    // 11% de R$ 1.621,00 = R$ 178,31
    expect(v.contribuicao).toBe(17_831)
  })

  it('facultativo de baixa renda: 5% sobre o salário mínimo', () => {
    const v = calcular('baixa-renda', 300_000)
    expect(v.aliquotaBp).toBe(500)
    expect(v.baseDeCalculo).toBe(MINIMO_2026)
    // 5% de R$ 1.621,00 = R$ 81,05
    expect(v.contribuicao).toBe(8_105)
  })

  it('20% sobre o mínimo são R$ 324,20', () => {
    expect(calcular('completo', MINIMO_2026).contribuicao).toBe(32_420)
  })
})

/**
 * A propriedade central, e o defeito mais provável: nos planos reduzidos a base
 * é FIXA no limite mínimo. Se alguém "melhorar" a conta fazendo-a acompanhar a
 * renda, estes casos reprovam.
 */
describe('CALC-050 · a base dos planos reduzidos não acompanha a renda', () => {
  it('renda diferente, mesmo valor a pagar', () => {
    for (const plano of ['simplificado', 'baixa-renda'] as const) {
      const valores = [MINIMO_2026, 300_000, 900_000, 5_000_000].map(
        (renda) => calcular(plano, renda).contribuicao,
      )
      expect(new Set(valores).size, plano).toBe(1)
    }
  })

  it('nem mesmo renda acima do teto muda a base', () => {
    expect(calcular('simplificado', 2_000_000).baseDeCalculo).toBe(MINIMO_2026)
    expect(calcular('simplificado', 2_000_000).ajuste).toBeNull()
  })
})

describe('CALC-050 · o mínimo e o teto prendem a base no plano completo', () => {
  it('renda abaixo do mínimo é elevada ao mínimo', () => {
    const v = calcular('completo', 50_000)
    expect(v.baseDeCalculo).toBe(MINIMO_2026)
    expect(v.ajuste).toBe('minimo')
    expect(v.contribuicao).toBe(32_420)
  })

  it('renda acima do teto é limitada ao teto', () => {
    const v = calcular('completo', 2_000_000)
    expect(v.baseDeCalculo).toBe(TETO_2026)
    expect(v.ajuste).toBe('teto')
    // 20% de R$ 8.475,55 = R$ 1.695,11
    expect(v.contribuicao).toBe(169_511)
  })

  it('exatamente no teto não conta como limitada', () => {
    const v = calcular('completo', TETO_2026)
    expect(v.ajuste).toBeNull()
    expect(v.baseDeCalculo).toBe(TETO_2026)
  })

  it('contribuir mais que o teto é impossível, e o valor não cresce', () => {
    const noTeto = calcular('completo', TETO_2026).contribuicao
    expect(calcular('completo', 100_000_00).contribuicao).toBe(noTeto)
  })
})

/**
 * A afirmação que a página faz sobre o mundo: a tabela progressiva do empregado
 * NÃO se aplica aqui, e aplicá-la daria um número bem menor.
 */
describe('CALC-050 · a alíquota é única, não progressiva', () => {
  it('20% sobre o teto é muito acima do que a tabela do empregado cobraria', () => {
    const individual = calcular('completo', TETO_2026).contribuicao
    // A do empregado, no teto de 2026, fica em torno de R$ 951 — nem metade.
    expect(individual).toBeGreaterThan(160_000)
  })

  it('a memória de cálculo nomeia a alíquota como única', () => {
    const r = calcularInssIndividual(
      { plano: 'completo', salarioDeContribuicao: centavos(300_000) },
      REF_2026,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('contribuição do mês'))
    expect(etapa?.justificativa).toContain('ÚNICA')
  })
})

describe('CALC-050 · a complementação do § 3º', () => {
  it('quem paga 11% tem 9 pontos de diferença até os 20%', () => {
    // 9% de R$ 1.621,00 = R$ 145,89
    expect(calcular('simplificado', 300_000).complementacaoMensal).toBe(14_589)
  })

  it('quem paga 5% tem 15 pontos de diferença', () => {
    // 15% de R$ 1.621,00 = R$ 243,15
    expect(calcular('baixa-renda', 300_000).complementacaoMensal).toBe(24_315)
  })

  it('no plano completo não há o que complementar', () => {
    expect(calcular('completo', 300_000).complementacaoMensal).toBe(0)
  })

  /**
   * A norma manda acrescer juros, e a página não os projeta. O traço precisa
   * dizer isso — omitir seria publicar valor menor que o devido.
   */
  it('a memória declara que os juros ficam de fora', () => {
    const r = calcularInssIndividual(
      { plano: 'simplificado', salarioDeContribuicao: centavos(300_000) },
      REF_2026,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('Diferença até os 20%'))
    expect(etapa?.justificativa).toContain('SEM os juros')
  })
})

describe('CALC-050 · a comparação entre os planos', () => {
  it('o plano completo sobre a mesma renda custa mais', () => {
    const v = calcular('simplificado', 500_000)
    expect(v.contribuicaoNoCompleto).toBe(100_000)
    expect(diferencaMensal(v)).toBe(100_000 - 17_831)
  })

  it('com renda no mínimo, a diferença some para o plano completo', () => {
    const v = calcular('completo', MINIMO_2026)
    expect(diferencaMensal(v)).toBe(0)
  })
})

describe('CALC-050 · vigência e cobertura', () => {
  it('2025 usa o mínimo e o teto de 2025', () => {
    const v = calcular('simplificado', 300_000, REF_2025)
    // 11% de R$ 1.518,00 = R$ 166,98
    expect(v.limiteMinimo).toBe(151_800)
    expect(v.contribuicao).toBe(16_698)
    expect(calcular('completo', 2_000_000, REF_2025).baseDeCalculo).toBe(815_741)
  })

  /**
   * `RN-003`: data sem cobertura bloqueia. As alíquotas são abertas, mas o
   * salário mínimo e a tabela não — e é a interseção que manda.
   */
  it('data anterior à cobertura do salário mínimo bloqueia o cálculo', () => {
    const r = calcularInssIndividual(
      { plano: 'simplificado', salarioDeContribuicao: centavos(300_000) },
      '2015-06-15' as DataISO,
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('a memória cita a vigência de cada parâmetro usado', () => {
    const r = calcularInssIndividual(
      { plano: 'simplificado', salarioDeContribuicao: centavos(300_000) },
      REF_2026,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.traco.vigenciasAplicadas).toContain('salario-minimo-2026')
    expect(r.traco.vigenciasAplicadas).toContain('inss-individual-simplificada-2011')
    /**
     * Toda etapa com parâmetro cita URL de domínio OFICIAL — regra 1 e `CO-1`.
     * Aqui convivem duas origens legítimas: a lei no Planalto e o salário
     * mínimo na portaria interministerial, publicada em domínio do governo.
     */
    const comParametro = r.traco.etapas.filter((e) => e.parametro !== undefined)
    expect(comParametro.length).toBeGreaterThanOrEqual(3)
    expect(
      comParametro.every((e) => /https:\/\/(www\.)?(planalto|gov)\.br|gov\.br\//.test(e.parametro?.url ?? '')),
      comParametro.map((e) => e.parametro?.url).join(' · '),
    ).toBe(true)
  })
})

describe('CALC-050 · a definição publicada', () => {
  it('a coluna do resultado mostra base e contribuição', () => {
    const r = calcularDef({ plano: 'simplificado', renda: 300_000 }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(17_831)
    const [base, contribuicao] = r.valores.detalhamento
    expect(base?.valor).toBe(MINIMO_2026)
    expect(contribuicao?.valor).toBe(17_831)
  })

  it('plano desconhecido na URL cai no completo em vez de quebrar', () => {
    const r = calcularDef({ plano: 'inventado', renda: 300_000 }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(60_000)
  })

  it('o plano reduzido destaca a comparação com o completo', () => {
    const r = calcularDef({ plano: 'baixa-renda', renda: 300_000 }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = (r.valores.destaques ?? []).map((d) => d.rotulo)
    expect(rotulos).toContain('No plano completo, seria')
    expect(rotulos.some((x) => x.includes('sem juros'))).toBe(true)
  })

  it('a nota sobre o MEI aparece sempre — ele não usa esta página', () => {
    const r = calcularDef({ plano: 'completo', renda: 300_000 }, REF_2026)
    if (!r.ok) throw new Error('esperado sucesso')
    expect((r.valores.notas ?? []).some((n) => n.includes('microempreendedor'))).toBe(true)
  })
})
