/**
 * Casos-ouro de CALC-043 (independência), CALC-065 (energia) e CALC-069 (orçamento).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As três são aritmética sobre números que o usuário informa, e as três tratam
 * um **número de bolso como campo** — a regra dos 4%, a tarifa do kWh e o
 * 50/30/20. Nenhum deles é norma, e por isso não há fonte a conferir: o que se
 * confere é a conta.
 *
 *   R$ 5.000,00 por mês a 4% ao ano exigem R$ 1.500.000,00 — 60.000 ÷ 0,04.
 *   1.000 W por 2 h em 30 dias são 60 kWh; a R$ 0,90, R$ 54,00.
 *   R$ 4.000,00 em 50/30/20 são R$ 2.000,00, R$ 1.200,00 e R$ 800,00.
 *
 * O caso mais importante do arquivo é o de CALC-069: as fatias arredondadas
 * precisam somar exatamente a renda informada, com a diferença aparecendo como
 * linha nomeada em vez de sumir (`ESTADO-DO-PROJETO` §7.12).
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDoOrcamento } from '../../src/lib/calculadoras/orcamento'
import {
  calcularEnergia,
  calcularOrcamento,
  type EntradaEnergia,
  type EntradaOrcamento,
} from '../../src/lib/engine/calculadoras/consumo'
import {
  calcularIndependencia,
  type EntradaIndependencia,
} from '../../src/lib/engine/calculadoras/reserva'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-043 — Meta de independência financeira
// ---------------------------------------------------------------------------

const META: EntradaIndependencia = {
  despesaMensalDesejada: centavos(500_000),
  taxaDeRetiradaAnualBp: basisPoints(400),
  jaInvestido: centavos(50_000_000),
  aporteMensal: centavos(1_000_000),
  rendimentoMensalBp: basisPoints(0),
}

function metaOuFalhar(entrada: EntradaIndependencia) {
  const r = calcularIndependencia(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-043 · o patrimônio é a retirada anual dividida pela taxa', () => {
  const v = metaOuFalhar(META).valores

  it('R$ 5.000,00 por mês a 4% ao ano exigem R$ 1.500.000,00', () => {
    expect(v.despesaAnual).toBe(6_000_000)
    expect(v.patrimonioNecessario).toBe(150_000_000)
  })

  it('o patrimônio de hoje já sustenta uma parte, à mesma taxa', () => {
    // R$ 500.000,00 × 4% ÷ 12 = R$ 1.666,67
    expect(v.rendaMensalDeHoje).toBe(166_667)
  })

  it('o que falta é a diferença', () => {
    expect(v.faltaAcumular).toBe(100_000_000)
    expect(v.metaAlcancada).toBe(false)
  })

  /**
   * Dobrar a taxa de retirada divide o patrimônio pela metade — e é essa
   * sensibilidade que faz a taxa ser campo, e não escolha da calculadora.
   */
  it('a taxa escolhida domina o resultado', () => {
    const aOitoPorCento = metaOuFalhar({ ...META, taxaDeRetiradaAnualBp: basisPoints(800) })
    expect(aOitoPorCento.valores.patrimonioNecessario).toBe(75_000_000)
  })
})

describe('CALC-043 · o prazo até a meta', () => {
  it('sem rendimento, é a divisão exata pelo aporte', () => {
    const v = metaOuFalhar(META).valores
    expect(v.mesesAteAMeta).toBe(100)
    // 100 meses são 8,33 anos.
    expect(v.anosAteAMetaCentesimos).toBe(833)
    expect(v.totalAportado).toBe(100_000_000)
  })

  it('com rendimento a meta chega antes, e parte dela não vem do bolso', () => {
    const com = metaOuFalhar({ ...META, rendimentoMensalBp: basisPoints(50) }).valores
    expect(com.mesesAteAMeta).toBeLessThan(100)
    expect(com.rendimentoAcumulado).toBeGreaterThan(0)
  })

  it('sem aporte nenhum, a calculadora diz que não alcança', () => {
    const v = metaOuFalhar({ ...META, aporteMensal: centavos(0) }).valores
    expect(v.alcancavel).toBe(false)
    expect(v.mesesAteAMeta).toBe(0)
  })

  it('patrimônio já suficiente é meta alcançada, sem prazo', () => {
    const v = metaOuFalhar({ ...META, jaInvestido: centavos(200_000_000) }).valores
    expect(v.metaAlcancada).toBe(true)
    expect(v.faltaAcumular).toBe(0)
    expect(v.rendaMensalDeHoje).toBeGreaterThan(META.despesaMensalDesejada)
  })
})

describe('CALC-043 · fronteiras e memória', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularIndependencia({ ...META, despesaMensalDesejada: centavos(0) }, REF).ok).toBe(false)
    expect(calcularIndependencia({ ...META, taxaDeRetiradaAnualBp: basisPoints(0) }, REF).ok).toBe(false)
  })

  it('a etapa do patrimônio declara que a taxa foi escolha do usuário', () => {
    const etapa = metaOuFalhar(META).traco.etapas.find((e) =>
      e.rotulo.startsWith('Patrimônio que sustenta'),
    )
    expect(etapa?.justificativa).toContain('você quem escolheu')
    expect(etapa?.justificativa).toContain('Não é norma')
  })
})

// ---------------------------------------------------------------------------
// CALC-065 — Consumo de energia por aparelho
// ---------------------------------------------------------------------------

const APARELHO: EntradaEnergia = {
  potencia: 1_000,
  horasPorDia: 200,
  diasPorMes: 30,
  quantidade: 1,
  tarifaKwh: centavos(90),
}

function energiaOuFalhar(entrada: EntradaEnergia) {
  const r = calcularEnergia(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-065 · potência vezes tempo, dividido por mil', () => {
  const v = energiaOuFalhar(APARELHO).valores

  it('1.000 W por 2 h em 30 dias são 60 kWh', () => {
    expect(v.horasNoMes).toBe(6_000)
    expect(v.kwhPorMes).toBe(6_000)
    expect(v.kwhPorDia).toBe(200)
  })

  it('60 kWh a R$ 0,90 são R$ 54,00 no mês e R$ 648,00 no ano', () => {
    expect(v.custoMensal).toBe(5_400)
    expect(v.custoAnual).toBe(64_800)
  })

  it('dois aparelhos iguais dobram tudo', () => {
    const dois = energiaOuFalhar({ ...APARELHO, quantidade: 2 }).valores
    expect(dois.kwhPorMes).toBe(v.kwhPorMes * 2)
    expect(dois.custoMensal).toBe(v.custoMensal * 2)
  })

  it('a etapa da tarifa declara que ela é da fatura do usuário', () => {
    const etapa = energiaOuFalhar(APARELHO).traco.etapas.find((e) => e.rotulo === 'Custo no mês')
    expect(etapa?.justificativa).toContain('sua fatura')
  })
})

describe('CALC-065 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularEnergia({ ...APARELHO, potencia: 0 }, REF).ok).toBe(false)
    expect(calcularEnergia({ ...APARELHO, horasPorDia: 0 }, REF).ok).toBe(false)
    expect(calcularEnergia({ ...APARELHO, tarifaKwh: centavos(0) }, REF).ok).toBe(false)
  })

  it('dias e quantidade precisam ser positivos', () => {
    expect(calcularEnergia({ ...APARELHO, diasPorMes: 0 }, REF).ok).toBe(false)
    expect(calcularEnergia({ ...APARELHO, quantidade: 0 }, REF).ok).toBe(false)
  })

  /** Uma lâmpada de LED, que é o outro extremo da escala. */
  it('vale para potências pequenas sem perder o centavo', () => {
    const v = energiaOuFalhar({ ...APARELHO, potencia: 9, horasPorDia: 500 }).valores
    // 9 W × 5 h × 30 dias = 1.350 Wh = 1,35 kWh
    expect(v.kwhPorMes).toBe(135)
    expect(v.custoMensal).toBe(122)
  })
})

// ---------------------------------------------------------------------------
// CALC-069 — Orçamento 50/30/20
// ---------------------------------------------------------------------------

const ORCAMENTO: EntradaOrcamento = {
  rendaLiquida: centavos(400_000),
  percentualNecessidadesBp: basisPoints(5_000),
  percentualDesejosBp: basisPoints(3_000),
  percentualPoupancaBp: basisPoints(2_000),
}

function orcamentoOuFalhar(entrada: EntradaOrcamento) {
  const r = calcularOrcamento(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-069 · a divisão da renda', () => {
  const v = orcamentoOuFalhar(ORCAMENTO).valores

  it('R$ 4.000,00 em 50/30/20', () => {
    expect(v.necessidades).toBe(200_000)
    expect(v.desejos).toBe(120_000)
    expect(v.poupanca).toBe(80_000)
  })

  it('as três fatias fecham a renda, sem sobra', () => {
    expect(v.naoAlocado).toBe(0)
    expect(v.somaDosPercentuais).toBe(10_000)
  })

  it('a fatia de poupança acumula doze vezes em um ano, sem rendimento', () => {
    expect(v.poupancaEmDozeMeses).toBe(960_000)
  })

  it('percentuais diferentes acompanham, porque a regra não é norma', () => {
    const apertado = orcamentoOuFalhar({
      ...ORCAMENTO,
      percentualNecessidadesBp: basisPoints(7_000),
      percentualDesejosBp: basisPoints(2_000),
      percentualPoupancaBp: basisPoints(1_000),
    }).valores
    expect(apertado.necessidades).toBe(280_000)
    expect(apertado.poupanca).toBe(40_000)
    expect(apertado.naoAlocado).toBe(0)
  })
})

describe('CALC-069 · o que não foi alocado aparece, em vez de sumir', () => {
  it('percentuais abaixo de cem deixam renda sem destino declarado', () => {
    const v = orcamentoOuFalhar({
      ...ORCAMENTO,
      percentualPoupancaBp: basisPoints(1_000),
    }).valores
    expect(v.somaDosPercentuais).toBe(9_000)
    expect(v.naoAlocado).toBe(40_000)
  })

  it('acima de cem é recusado, e o motivo diz quanto somaram', () => {
    const r = calcularOrcamento(
      { ...ORCAMENTO, percentualDesejosBp: basisPoints(6_000) },
      REF,
    )
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    // 50 + 60 + 20 = 130.
    expect(r.detalhe).toContain('130,00%')
  })

  it('sem percentual nenhum não há o que dividir', () => {
    expect(
      calcularOrcamento(
        {
          ...ORCAMENTO,
          percentualNecessidadesBp: basisPoints(0),
          percentualDesejosBp: basisPoints(0),
          percentualPoupancaBp: basisPoints(0),
        },
        REF,
      ).ok,
    ).toBe(false)
  })

  it('renda ausente mantém o estado pendente', () => {
    expect(calcularOrcamento({ ...ORCAMENTO, rendaLiquida: centavos(0) }, REF).ok).toBe(false)
  })
})

/**
 * O caso que a linha "ainda sem destino" existe para garantir: com percentuais
 * que não dividem redondo, os centavos que sobram precisam aparecer, e não
 * evaporar entre a soma das fatias e a renda informada.
 */
describe('CALC-069 · a coluna do resultado soma a renda, ao centavo', () => {
  const rendas = [400_000, 333_333, 1_000_001, 787_879]
  const divisoes = [
    [5_000, 3_000, 2_000],
    [3_333, 3_333, 3_334],
    [4_000, 3_500, 2_500],
  ] as const

  for (const renda of rendas) {
    for (const [n, d, p] of divisoes) {
      it(`fecha com renda ${renda} e divisão ${n}/${d}/${p}`, () => {
        const r = calcularDoOrcamento(
          {
            rendaLiquida: renda,
            percentualNecessidades: n,
            percentualDesejos: d,
            percentualPoupanca: p,
          },
          REF,
        )
        if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
        const linhas = r.valores.detalhamento
        const soma = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
        expect(soma).toBe(linhas[linhas.length - 1]?.valor)
        expect(linhas[linhas.length - 1]?.valor).toBe(renda)
      })
    }
  }
})
