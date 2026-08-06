/**
 * CASOS-OURO — imposto de renda sobre criptoativos (CALC-021).
 *
 * fonte_verificacao: **conferência manual contra o texto da norma** — Lei nº
 * 9.250/1995, art. 22, II e parágrafo único, e Lei nº 8.981/1995, art. 21, na
 * redação da Lei nº 13.259/2016 — e contra a resposta 653 do "Perguntas e
 * Respostas IRPF 2026" da Receita, que aplica a isenção a criptoativos.
 *
 * É a primeira das três origens de `CO-1`.
 *
 * O que estes casos precisam travar são as três propriedades que quase toda
 * planilha de cripto erra:
 *
 *   1. o teto olha o TOTAL VENDIDO, não o ganho;
 *   2. o teto é DEGRAU — passou, tributa o ganho inteiro;
 *   3. o conjunto soma Brasil e exterior, e todos os tipos de criptoativo.
 */

import { describe, expect, it } from 'vitest'

import { calcularCripto } from '../../src/lib/engine/calculadoras/cripto'
import { centavos } from '../../src/lib/engine/types'
import { GANHO_DE_CAPITAL } from '../../src/lib/params/data/ganho-de-capital'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(GANHO_DE_CAPITAL)
const EM_2026 = '2026-06-15'

function calcular(brasil: number, custo: number, exterior = 0, data = EM_2026) {
  const r = calcularCripto(
    {
      alienadoBrasil: centavos(brasil),
      alienadoExterior: centavos(exterior),
      custoAquisicao: centavos(custo),
    },
    data,
    registro,
  )
  if (!r.ok) throw new Error(`cálculo falhou: ${r.motivo} — ${r.detalhe}`)
  return r.valores
}

describe('a isenção olha o total vendido no mês', () => {
  /*
   * Vendeu R$ 30.000,00, lucrou R$ 10.000,00. Abaixo do teto de R$ 35.000,00
   * → isento, com R$ 5.000,00 de folga para o resto do mês.
   */
  it('abaixo do teto é isento, e informa a folga que resta', () => {
    const v = calcular(3_000_000, 2_000_000)
    expect(v.isento).toBe(true)
    expect(v.imposto).toBe(0)
    expect(v.ganho).toBe(1_000_000)
    expect(v.folgaAteOTeto).toBe(500_000)
  })

  /*
   * A FRONTEIRA. Exatamente R$ 35.000,00 ainda é isento — o texto diz "igual ou
   * inferior a". Um centavo acima, tributa.
   */
  it('exatamente no teto é isento; um centavo acima, não', () => {
    const noTeto = calcular(3_500_000, 2_500_000)
    expect(noTeto.isento).toBe(true)
    expect(noTeto.imposto).toBe(0)

    const acima = calcular(3_500_001, 2_500_001)
    expect(acima.isento).toBe(false)
    expect(acima.imposto).toBeGreaterThan(0)
  })

  /*
   * O DEGRAU, que é a propriedade mais cara de errar.
   *
   * Vendeu um centavo acima do teto com ganho de R$ 10.000,00. O imposto incide
   * sobre o ganho INTEIRO — 15% de R$ 10.000,00 = R$ 1.500,00 —, e não sobre a
   * parte que excedeu o teto, que seria um centavo.
   */
  it('passou do teto, o ganho inteiro é tributado — não só o excedente', () => {
    const v = calcular(3_500_001, 2_500_001)
    expect(v.ganho).toBe(1_000_000)
    expect(v.imposto).toBe(150_000)
    expect(v.folgaAteOTeto).toBe(0)
  })

  /*
   * Vender muito com lucro pequeno NÃO é isento: o teste é sobre o total
   * alienado. R$ 200.000,00 vendidos com R$ 1.000,00 de lucro pagam imposto.
   */
  it('lucro pequeno não salva quem vendeu muito', () => {
    const v = calcular(20_000_000, 19_900_000)
    expect(v.isento).toBe(false)
    expect(v.ganho).toBe(100_000)
    expect(v.imposto).toBe(15_000)
  })
})

describe('o conjunto soma Brasil e exterior', () => {
  /*
   * R$ 20.000,00 no Brasil e R$ 20.000,00 no exterior somam R$ 40.000,00 e
   * passam do teto — ainda que nenhuma das duas, sozinha, passasse.
   *
   * O imposto apurado aqui é só o das vendas no Brasil; o do exterior segue a
   * Lei nº 14.754/2023 e está fora deste motor, o que a tela declara.
   */
  it('cada uma abaixo do teto, somadas acima — e o ganho do Brasil é tributado', () => {
    const soBrasil = calcular(2_000_000, 1_000_000)
    expect(soBrasil.isento).toBe(true)

    const comExterior = calcular(2_000_000, 1_000_000, 2_000_000)
    expect(comExterior.totalAlienadoNoMes).toBe(4_000_000)
    expect(comExterior.isento).toBe(false)
    expect(comExterior.ganho).toBe(1_000_000)
    expect(comExterior.imposto).toBe(150_000)
    expect(comExterior.temExterior).toBe(true)
  })
})

describe('a tabela progressiva do art. 21', () => {
  /*
   * Ganho de R$ 6.000.000,00, sem custo, atravessando a primeira faixa:
   *
   *   R$ 5.000.000,00 × 15%   = R$ 750.000,00
   *   R$ 1.000.000,00 × 17,5% = R$ 175.000,00
   *                             ---------------
   *                             R$ 925.000,00
   *
   * Aplicar 17,5% ao ganho inteiro daria R$ 1.050.000,00 — R$ 125.000,00 a
   * mais. É a mesma propriedade que CALC-020 trava, aqui pela porta do cripto.
   */
  it('cada alíquota incide só sobre a parcela do ganho na sua faixa', () => {
    const v = calcular(600_000_000, 0)
    expect(v.imposto).toBe(92_500_000)
    expect(v.liquido).toBe(507_500_000)
  })

  it('ganho dentro da primeira faixa paga 15% cheios', () => {
    const v = calcular(100_000_000, 0)
    expect(v.imposto).toBe(15_000_000)
  })
})

describe('prejuízo e ausência de ganho', () => {
  it('venda com prejuízo não gera imposto, e o prejuízo aparece com sinal', () => {
    const v = calcular(10_000_000, 12_000_000)
    expect(v.isento).toBe(false)
    expect(v.ganho).toBe(-2_000_000)
    expect(v.imposto).toBe(0)
  })

  it('vender pelo custo não gera imposto', () => {
    const v = calcular(10_000_000, 10_000_000)
    expect(v.ganho).toBe(0)
    expect(v.imposto).toBe(0)
  })
})

describe('a memória mostra a decisão da isenção', () => {
  it('nomeia o teste do teto e cita o parâmetro', () => {
    const r = calcularCripto(
      {
        alienadoBrasil: centavos(5_000_000),
        alienadoExterior: centavos(0),
        custoAquisicao: centavos(3_000_000),
      },
      EM_2026,
      registro,
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const rotulos = r.traco.etapas.map((e) => e.rotulo).join(' | ')
    expect(rotulos).toContain('Total alienado no mês')
    expect(rotulos).toContain('passou do teto')
    expect(r.traco.etapas.some((e) => e.parametro !== undefined)).toBe(true)
  })
})
