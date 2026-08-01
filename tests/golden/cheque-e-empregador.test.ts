/**
 * Casos-ouro de CALC-030 (cheque especial) e CALC-011 (custo do funcionário).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As duas normas trazem os percentuais no próprio corpo, lidos no texto oficial:
 *
 *   Resolução CMN nº 4.765/2019, art. 3º — "as taxas de juros remuneratórios
 *   cobradas sobre o valor utilizado do cheque especial estão limitadas a, no
 *   máximo, 8% (oito por cento) ao mês", vigente desde 06/01/2020 pelo art. 6º.
 *
 *   Lei nº 8.212/1991, art. 22 — 20% de contribuição patronal (I) e RAT de 1%,
 *   2% ou 3% conforme o risco da atividade preponderante (II).
 *
 * Os valores esperados são aritmética conferível a lápis sobre números redondos.
 * `CO-1`: nenhum veio de outro site.
 */

import { describe, expect, it } from 'vitest'

import { calcularChequeEspecial } from '../../src/lib/engine/calculadoras/cheque-especial'
import { calcularCustoEmpregador } from '../../src/lib/engine/calculadoras/custo-empregador'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { CREDITO } from '../../src/lib/params/data/credito'
import { EMPREGADOR } from '../../src/lib/params/data/empregador'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-030 — Cheque especial
// ---------------------------------------------------------------------------

const registroCredito = construirRegistro(CREDITO)

const CHEQUE_BASE = {
  valorUsado: centavos(100_000),
  diasDeUso: 30,
  taxaMensal: basisPoints(800),
} as const

describe('CALC-030 · no teto legal, um mês cheio', () => {
  const r = calcularChequeEspecial(CHEQUE_BASE, REF, registroCredito)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  it('R$ 1.000,00 a 8% por 30 dias custa R$ 80,00', () => {
    expect(r.valores.jurosDoPeriodo).toBe(8_000)
    expect(r.valores.totalAPagar).toBe(108_000)
  })

  it('está no limite, não acima dele', () => {
    expect(r.valores.acimaDoTeto).toBe(false)
    expect(r.valores.excessoCobrado).toBe(0)
    expect(r.valores.tetoMensal).toBe(800)
  })

  /**
   * O NÚMERO QUE A CALCULADORA EXISTE PARA MOSTRAR.
   *
   * 1,08^12 = 2,518170… , logo a taxa anual equivalente é 151,8170…%. O teto é
   * alto, não baixo — e ninguém percebe isso olhando "8% ao mês".
   *
   * **O esperado é 15.181, não 15.182.** `anualizar` trunca na divisão inteira
   * do `BigInt`, e a fração descartada vale 0,007 ponto percentual. A primeira
   * versão deste caso arredondou de cabeça e reprovou — o cálculo estava certo.
   * O truncamento é o comportamento que CALC-024 publica desde 31/07/2026;
   * trocá-lo por arredondamento moveria um número que já está no ar, por sete
   * milésimos de ponto.
   */
  it('8% ao mês são mais de 150% ao ano', () => {
    expect(r.valores.tetoAnual).toBe(15_181)
    expect(r.valores.taxaAnual).toBe(r.valores.tetoAnual)
  })

  it('a etapa do teto cita a Resolução CMN nº 4.765, com vigência de 2020', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Teto legal da taxa')
    expect(etapa?.parametro?.norma).toContain('4.765')
    expect(etapa?.parametro?.vigenciaInicio).toBe('2020-01-06')
  })
})

describe('CALC-030 · a proporção dos dias', () => {
  it('quinze dias custam metade de trinta', () => {
    const meio = calcularChequeEspecial({ ...CHEQUE_BASE, diasDeUso: 15 }, REF, registroCredito)
    if (!meio.ok) throw new Error('esperado sucesso')
    expect(meio.valores.jurosDoPeriodo).toBe(4_000)
  })

  it('o juro cresce com os dias, sem saltos', () => {
    const um = calcularChequeEspecial({ ...CHEQUE_BASE, diasDeUso: 1 }, REF, registroCredito)
    const dois = calcularChequeEspecial({ ...CHEQUE_BASE, diasDeUso: 2 }, REF, registroCredito)
    if (!um.ok || !dois.ok) throw new Error('esperado sucesso')
    expect(dois.valores.jurosDoPeriodo).toBeGreaterThan(um.valores.jurosDoPeriodo)
  })
})

/**
 * O caso que dá utilidade prática à calculadora: a taxa cobrada acima do limite.
 */
describe('CALC-030 · taxa acima do teto é sinalizada e quantificada', () => {
  const r = calcularChequeEspecial(
    { ...CHEQUE_BASE, taxaMensal: basisPoints(1_200) },
    REF,
    registroCredito,
  )
  if (!r.ok) throw new Error('esperado sucesso')

  it('reconhece que passou do limite', () => {
    expect(r.valores.acimaDoTeto).toBe(true)
  })

  it('diz quanto foi cobrado a mais — R$ 120,00 contra R$ 80,00', () => {
    expect(r.valores.jurosDoPeriodo).toBe(12_000)
    expect(r.valores.jurosNoTeto).toBe(8_000)
    expect(r.valores.excessoCobrado).toBe(4_000)
  })
})

describe('CALC-030 · a data importa', () => {
  it('antes de 06/01/2020 não havia teto, e o cálculo é bloqueado', () => {
    const r = calcularChequeEspecial(CHEQUE_BASE, '2020-01-05' as DataISO, registroCredito)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.motivo).toBe('vigencia_ausente')
  })
})

describe('CALC-030 · entradas incompletas', () => {
  it('valor, dias ou taxa ausentes mantêm o estado pendente', () => {
    for (const parcial of [
      { valorUsado: centavos(0) },
      { diasDeUso: 0 },
      { taxaMensal: basisPoints(0) },
    ]) {
      expect(calcularChequeEspecial({ ...CHEQUE_BASE, ...parcial }, REF, registroCredito).ok).toBe(
        false,
      )
    }
  })
})

// ---------------------------------------------------------------------------
// CALC-011 — Custo do funcionário
// ---------------------------------------------------------------------------

const registroEmpregador = construirRegistro(EMPREGADOR, TRABALHISTA)

const CUSTO_BASE = {
  salario: centavos(300_000),
  grauDeRisco: 'leve',
  terceiros: basisPoints(0),
  beneficios: centavos(0),
} as const

describe('CALC-011 · encargos sobre um salário de R$ 3.000,00', () => {
  const r = calcularCustoEmpregador(CUSTO_BASE, REF, registroEmpregador)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  it('patronal de 20% dá R$ 600,00 — art. 22, I', () => {
    expect(r.valores.patronal).toBe(60_000)
  })

  it('RAT leve de 1% dá R$ 30,00 — art. 22, II, "a"', () => {
    expect(r.valores.rat).toBe(3_000)
  })

  it('FGTS de 8% dá R$ 240,00', () => {
    expect(r.valores.fgts).toBe(24_000)
  })

  it('sem terceiros informados, a parcela é zero e não entra na conta', () => {
    expect(r.valores.terceiros).toBe(0)
  })

  it('a alíquota somada de encargos é 29%', () => {
    expect(r.valores.aliquotaDeEncargosBp).toBe(2_900)
  })
})

describe('CALC-011 · o RAT muda com o grau de risco', () => {
  const casos = [
    { grau: 'leve', bp: 100, valor: 3_000 },
    { grau: 'medio', bp: 200, valor: 6_000 },
    { grau: 'grave', bp: 300, valor: 9_000 },
  ] as const

  for (const { grau, valor } of casos) {
    it(`risco ${grau} dá R$ ${valor / 100},00`, () => {
      const r = calcularCustoEmpregador({ ...CUSTO_BASE, grauDeRisco: grau }, REF, registroEmpregador)
      if (!r.ok) throw new Error('esperado sucesso')
      expect(r.valores.rat).toBe(valor)
    })
  }
})

describe('CALC-011 · as provisões', () => {
  const r = calcularCustoEmpregador(CUSTO_BASE, REF, registroEmpregador)
  if (!r.ok) throw new Error('esperado sucesso')

  it('13º é um doze avos — R$ 250,00', () => {
    expect(r.valores.provisaoDecimoTerceiro).toBe(25_000)
  })

  /** Um doze avos acrescido de um terço: 3.000 × 4 ÷ 36 = R$ 333,33. */
  it('férias com o terço dão R$ 333,33', () => {
    expect(r.valores.provisaoFerias).toBe(33_333)
  })

  /**
   * O Tema 985 do STF em número: os encargos incidem sobre a soma das provisões,
   * terço incluído. Se o terço ficasse de fora, a base seria R$ 500,00 em vez de
   * R$ 583,33.
   */
  it('os encargos incidem sobre as duas provisões, terço incluído', () => {
    const base = r.valores.provisaoDecimoTerceiro + r.valores.provisaoFerias
    expect(base).toBe(58_333)
    // 29% de R$ 583,33 = R$ 169,17.
    expect(r.valores.encargosSobreProvisoes).toBe(16_917)
  })

  it('a etapa das provisões cita o Tema 985 do STF', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Encargos sobre as provisões')
    expect(etapa?.fundamento?.norma).toContain('985')
    expect(etapa?.justificativa).toContain('terço constitucional')
  })
})

describe('CALC-011 · o total, e o quanto ele supera o salário', () => {
  const r = calcularCustoEmpregador(CUSTO_BASE, REF, registroEmpregador)
  if (!r.ok) throw new Error('esperado sucesso')

  /** 3.000 + 870 (29%) + 250 + 333,33 + 169,17 = R$ 4.622,50. */
  it('o custo mensal fecha por soma', () => {
    expect(r.valores.custoMensal).toBe(462_250)
  })

  it('o acréscimo sobre o salário passa de 54%', () => {
    expect(r.valores.acrescimoBp).toBe(5_408)
  })

  it('o custo anual são doze meses do mensal', () => {
    expect(r.valores.custoAnual).toBe(r.valores.custoMensal * 12)
  })
})

describe('CALC-011 · terceiros e benefícios entram quando informados', () => {
  it('terceiros informados aumentam a alíquota e o custo', () => {
    const sem = calcularCustoEmpregador(CUSTO_BASE, REF, registroEmpregador)
    const com = calcularCustoEmpregador(
      { ...CUSTO_BASE, terceiros: basisPoints(580) },
      REF,
      registroEmpregador,
    )
    if (!sem.ok || !com.ok) throw new Error('esperado sucesso')
    expect(com.valores.terceiros).toBe(17_400)
    expect(com.valores.aliquotaDeEncargosBp).toBe(3_480)
    expect(com.valores.custoMensal).toBeGreaterThan(sem.valores.custoMensal)
  })

  /**
   * Benefícios entram pelo VALOR e não sofrem encargos — vale-transporte e
   * plano de saúde, nas condições usuais, não integram o salário de
   * contribuição. O teste trava isso: o custo sobe exatamente o valor informado.
   */
  it('benefícios entram pelo valor, sem encargos por cima', () => {
    const sem = calcularCustoEmpregador(CUSTO_BASE, REF, registroEmpregador)
    const com = calcularCustoEmpregador(
      { ...CUSTO_BASE, beneficios: centavos(50_000) },
      REF,
      registroEmpregador,
    )
    if (!sem.ok || !com.ok) throw new Error('esperado sucesso')
    expect(com.valores.custoMensal - sem.valores.custoMensal).toBe(50_000)
  })
})

describe('CALC-011 · entradas inválidas', () => {
  it('salário ausente mantém o estado pendente', () => {
    expect(calcularCustoEmpregador({ ...CUSTO_BASE, salario: centavos(0) }, REF, registroEmpregador).ok).toBe(false)
  })

  it('terceiros negativos são recusados', () => {
    expect(
      calcularCustoEmpregador({ ...CUSTO_BASE, terceiros: basisPoints(-1) }, REF, registroEmpregador).ok,
    ).toBe(false)
  })
})

describe('CALC-030 e CALC-011 · C-M1 · não existe cálculo sem memória', () => {
  it('as duas registram etapas com valores substituídos', () => {
    const a = calcularChequeEspecial(CHEQUE_BASE, REF, registroCredito)
    const b = calcularCustoEmpregador(CUSTO_BASE, REF, registroEmpregador)
    if (!a.ok || !b.ok) throw new Error('esperado sucesso')
    for (const r of [a, b]) {
      expect(r.traco.etapas.length).toBeGreaterThan(3)
      for (const e of r.traco.etapas) expect(e.formula.length).toBeGreaterThan(0)
    }
  })

  it('a taxa anual do cheque especial sai em unidade percentual', () => {
    const r = calcularChequeEspecial(CHEQUE_BASE, REF, registroCredito)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'A taxa informada, ao ano')
    expect(etapa?.unidade).toBe('percentual')
  })
})
