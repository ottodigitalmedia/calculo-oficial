/**
 * Casos-ouro de CALC-009 — seguro-desemprego.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * O **número de parcelas** sai do texto da Lei nº 7.998/1990, art. 4º, § 2º, com
 * a redação da Lei nº 13.134/2015, lido no Planalto. A tabela inteira é
 * reproduzida abaixo, degrau a degrau, nas três solicitações.
 *
 * O **valor** sai do art. 5º, cujos fatores estão na lei, combinado com os
 * limites da tabela anual divulgada pelo Ministério do Trabalho e Emprego. Os
 * casos de fronteira foram calculados a lápis a partir dos números publicados —
 * e a fronteira é o que importa aqui, porque é onde a faixa troca.
 *
 * `CO-1`: nenhum valor veio de outro site. A tabela do MTE é a do órgão emissor.
 */

import { describe, expect, it } from 'vitest'

import { calcularSeguroDesemprego } from '../../src/lib/engine/calculadoras/seguro-desemprego'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { SEGURO_DESEMPREGO } from '../../src/lib/params/data/seguro-desemprego'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(SEGURO_DESEMPREGO, INSS)
const REF = '2026-06-15' as DataISO

const salariosDe = (valor: number) =>
  [centavos(valor), centavos(valor), centavos(valor)] as const

// ---------------------------------------------------------------------------
// Número de parcelas — art. 4º, § 2º
// ---------------------------------------------------------------------------

/**
 * A TABELA INTEIRA DA LEI, EM UMA LISTA.
 *
 * Os degraus de 4 e 5 parcelas são os mesmos nas três solicitações; o que muda
 * é o piso de acesso. Se algum destes casos mudar sem que a lei mude, é defeito.
 */
describe('CALC-009 · a tabela de parcelas do art. 4º, § 2º', () => {
  const casos = [
    // 1ª solicitação: mínimo de 12 meses.
    { solicitacao: 'primeira', meses: 11, parcelas: null },
    { solicitacao: 'primeira', meses: 12, parcelas: 4 },
    { solicitacao: 'primeira', meses: 23, parcelas: 4 },
    { solicitacao: 'primeira', meses: 24, parcelas: 5 },
    // 2ª solicitação: mínimo de 9 meses, e aí 3 parcelas.
    { solicitacao: 'segunda', meses: 8, parcelas: null },
    { solicitacao: 'segunda', meses: 9, parcelas: 3 },
    { solicitacao: 'segunda', meses: 11, parcelas: 3 },
    { solicitacao: 'segunda', meses: 12, parcelas: 4 },
    { solicitacao: 'segunda', meses: 24, parcelas: 5 },
    // 3ª em diante: mínimo de 6 meses.
    { solicitacao: 'terceira-ou-mais', meses: 5, parcelas: null },
    { solicitacao: 'terceira-ou-mais', meses: 6, parcelas: 3 },
    { solicitacao: 'terceira-ou-mais', meses: 11, parcelas: 3 },
    { solicitacao: 'terceira-ou-mais', meses: 12, parcelas: 4 },
    { solicitacao: 'terceira-ou-mais', meses: 36, parcelas: 5 },
  ] as const

  for (const { solicitacao, meses, parcelas } of casos) {
    it(`${solicitacao}, ${meses} meses → ${parcelas ?? 'sem direito'}`, () => {
      const r = calcularSeguroDesemprego(
        { salarios: salariosDe(300_000), mesesTrabalhados: meses, solicitacao },
        REF,
        registro,
      )
      if (parcelas === null) {
        expect(r.ok).toBe(false)
        if (r.ok) throw new Error('esperado erro')
        expect(r.detalhe).toContain('não há direito')
      } else {
        if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
        expect(r.valores.numeroDeParcelas).toBe(parcelas)
      }
    })
  }
})

// ---------------------------------------------------------------------------
// Valor da parcela — art. 5º e a tabela vigente
// ---------------------------------------------------------------------------

const comSalario = (valor: number) =>
  calcularSeguroDesemprego(
    { salarios: salariosDe(valor), mesesTrabalhados: 24, solicitacao: 'primeira' },
    REF,
    registro,
  )

describe('CALC-009 · 1ª faixa — média × 0,8', () => {
  /**
   * O salário escolhido está ACIMA do ponto de equilíbrio do piso, e isso não é
   * detalhe: a primeira versão deste caso usava R$ 2.000,00 esperando
   * R$ 1.600,00 — e 0,8 × R$ 2.000,00 fica abaixo do salário mínimo, então o
   * § 2º eleva o benefício ao piso. O caso estava errado, não o cálculo. Ele
   * virou o primeiro caso do bloco do piso, adiante.
   */
  it('R$ 2.100,00 dá R$ 1.680,00', () => {
    const r = comSalario(210_000)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.faixaAplicada).toBe(1)
    expect(r.valores.parcela).toBe(168_000)
    expect(r.valores.aplicouPiso).toBe(false)
  })

  /** A fronteira exata da tabela: R$ 2.222,17 × 0,8 = R$ 1.777,736 → R$ 1.777,74. */
  it('no limite da faixa, o valor coincide com a parcela publicada', () => {
    const r = comSalario(222_217)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.faixaAplicada).toBe(1)
    expect(r.valores.parcela).toBe(177_774)
  })
})

describe('CALC-009 · 2ª faixa — só o excedente sofre o fator menor', () => {
  /** (250.000 − 222.217) × 0,5 = 13.891,5 → 13.892; + 177.774 = 191.666. */
  it('R$ 2.500,00 dá R$ 1.916,66', () => {
    const r = comSalario(250_000)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.faixaAplicada).toBe(2)
    expect(r.valores.parcela).toBe(191_666)
  })

  /**
   * A identidade que prova que a fórmula não aplica o fator maior sobre o
   * salário inteiro: um centavo acima do limite da 1ª faixa, o benefício sobe
   * um centavo — não dá salto.
   */
  it('a passagem de faixa é contínua, sem degrau', () => {
    const dentro = comSalario(222_217)
    const acima = comSalario(222_218)
    if (!dentro.ok || !acima.ok) throw new Error('esperado sucesso')
    expect(acima.valores.faixaAplicada).toBe(2)
    expect(acima.valores.parcela - dentro.valores.parcela).toBeLessThanOrEqual(100)
  })

  /** No limite superior: (370.399 − 222.217) × 0,5 + 177.774 = 251.865 — o teto. */
  it('no limite da 2ª faixa, a fórmula encontra exatamente o teto', () => {
    const r = comSalario(370_399)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.faixaAplicada).toBe(2)
    expect(r.valores.parcela).toBe(251_865)
  })
})

describe('CALC-009 · 3ª faixa — o teto', () => {
  it('acima do segundo limite, o valor é invariável', () => {
    const dez = comSalario(1_000_000)
    const cem = comSalario(10_000_000)
    if (!dez.ok || !cem.ok) throw new Error('esperado sucesso')
    expect(dez.valores.faixaAplicada).toBe(3)
    expect(dez.valores.parcela).toBe(251_865)
    expect(cem.valores.parcela).toBe(dez.valores.parcela)
    expect(dez.valores.aplicouTeto).toBe(true)
  })
})

/**
 * O PISO ALCANÇA MUITO MAIS GENTE DO QUE A INTUIÇÃO SUGERE.
 *
 * Ele não vale só para quem ganhava o mínimo: como o fator da 1ª faixa é 0,8, o
 * benefício só ultrapassa o salário mínimo a partir de uma média de R$ 2.026,25.
 * Abaixo disso — o que cobre boa parte dos salários do país — todo mundo recebe
 * exatamente o mesmo valor.
 */
describe('CALC-009 · o piso do art. 5º, § 2º', () => {
  it('R$ 2.000,00 de média também cai no piso, e não em R$ 1.600,00', () => {
    const r = comSalario(200_000)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.parcela).toBe(162_100)
    expect(r.valores.aplicouPiso).toBe(true)
  })

  /** R$ 1.621,00 × 0,8 = R$ 1.296,80, abaixo do mínimo — a lei não permite. */
  it('quem ganhava o salário mínimo recebe o próprio salário mínimo', () => {
    const r = comSalario(162_100)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.parcela).toBe(162_100)
    expect(r.valores.aplicouPiso).toBe(true)
  })

  it('a etapa do piso cita o salário mínimo como parâmetro, com vigência', () => {
    const r = comSalario(162_100)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Piso do salário mínimo')
    expect(etapa?.parametro?.parametroId).toBe('salario-minimo')
    expect(etapa?.parametro?.vigenciaInicio).toBe('2026-01-01')
  })

  it('acima do ponto de equilíbrio o piso não interfere', () => {
    // O piso deixa de valer quando média × 0,8 ≥ R$ 1.621,00, ou seja a partir
    // de R$ 2.026,25 de média.
    const r = comSalario(203_000)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.aplicouPiso).toBe(false)
    expect(r.valores.parcela).toBeGreaterThan(162_100)
  })
})

describe('CALC-009 · a média dos três meses — art. 5º, § 1º', () => {
  it('salários diferentes entram pela média', () => {
    const r = calcularSeguroDesemprego(
      {
        salarios: [centavos(300_000), centavos(200_000), centavos(250_000)],
        mesesTrabalhados: 24,
        solicitacao: 'primeira',
      },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.media).toBe(250_000)
  })

  it('meses em branco não entram na média nem a zeram', () => {
    const r = calcularSeguroDesemprego(
      {
        salarios: [centavos(300_000), centavos(0), centavos(0)],
        mesesTrabalhados: 24,
        solicitacao: 'primeira',
      },
      REF,
      registro,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.media).toBe(300_000)
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Média dos últimos salários')
    expect(etapa?.justificativa).toContain('informe os três')
  })
})

describe('CALC-009 · o total é a parcela vezes o número de parcelas', () => {
  it('fecha por identidade', () => {
    const r = comSalario(250_000)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.total).toBe(r.valores.parcela * r.valores.numeroDeParcelas)
  })
})

describe('CALC-009 · a data importa', () => {
  it('antes de 11/01/2026 não há tabela de valor, e o cálculo é bloqueado', () => {
    const r = calcularSeguroDesemprego(
      { salarios: salariosDe(300_000), mesesTrabalhados: 24, solicitacao: 'primeira' },
      '2026-01-10' as DataISO,
      registro,
    )
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.motivo).toBe('vigencia_ausente')
  })

  it('a regra de parcelas vige desde a Lei nº 13.134/2015, não desde 2026', () => {
    const r = registro.resolver('seguro-desemprego-meses-minimos-1a', '2015-06-17' as DataISO)
    expect(r.ok).toBe(true)
    expect(registro.resolver('seguro-desemprego-meses-minimos-1a', '2015-06-16' as DataISO).ok).toBe(
      false,
    )
  })
})

describe('CALC-009 · entradas incompletas', () => {
  it('sem salário ou sem meses, o estado é pendente', () => {
    expect(
      calcularSeguroDesemprego(
        { salarios: salariosDe(0), mesesTrabalhados: 24, solicitacao: 'primeira' },
        REF,
        registro,
      ).ok,
    ).toBe(false)
    expect(
      calcularSeguroDesemprego(
        { salarios: salariosDe(300_000), mesesTrabalhados: 0, solicitacao: 'primeira' },
        REF,
        registro,
      ).ok,
    ).toBe(false)
  })
})

describe('CALC-009 · C-M1 · não existe cálculo sem memória', () => {
  it('registra parcelas, média, faixa e total, com fórmulas substituídas', () => {
    const r = comSalario(250_000)
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Número de parcelas')
    expect(rotulos).toContain('Média dos últimos salários')
    expect(rotulos).toContain('Total do benefício')
    for (const e of r.traco.etapas) expect(e.formula.length).toBeGreaterThan(0)
  })

  it('a etapa de parcelas sai em unidade de número, não em moeda', () => {
    const r = comSalario(250_000)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Número de parcelas')
    expect(etapa?.unidade).toBe('numero')
    expect(etapa?.resultado).toBe(500)
  })
})
