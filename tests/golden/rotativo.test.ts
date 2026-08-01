/**
 * Casos-ouro de CALC-023 — rotativo do cartão.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Não há exemplo oficial de cálculo publicado para o rotativo — o Banco Central
 * publica estatística de taxa, não memória de cálculo. Os valores esperados aqui
 * são de duas naturezas, e nenhuma delas veio de outro site (`CO-1`):
 *
 * 1. **Aritmética conferível a lápis** com números redondos escolhidos para
 *    isso: R$ 1.000,00 a 15% ao mês dá R$ 150,00, não importa quem calcule.
 * 2. **A estrutura normativa**, que é o que esta calculadora tem de próprio e
 *    o que precisa ser travado por teste — um ciclo de rotativo, migração
 *    obrigatória, e o teto do art. 28, § 1º medido sobre o valor original e
 *    contado desde o início do rotativo.
 *
 * O caso mais importante do arquivo é o do teto: é a única afirmação da
 * calculadora que o usuário não tem como conferir sozinho, e é a que mais
 * importa para quem está endividado.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/rotativo-cartao'
import { calcularRotativo } from '../../src/lib/engine/calculadoras/rotativo'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { CREDITO } from '../../src/lib/params/data/credito'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(CREDITO)
const REF = '2026-06-15' as DataISO

/**
 * Fatura de R$ 2.000,00 com R$ 1.000,00 pagos: entram R$ 1.000,00 no rotativo.
 * A 15% ao mês, os juros do ciclo são exatos — R$ 150,00.
 */
const BASE = {
  valorDaFatura: centavos(200_000),
  valorPago: centavos(100_000),
  taxaRotativo: basisPoints(1_500),
  taxaParcelamento: basisPoints(800),
  parcelas: 12,
} as const

describe('CALC-023 · o valor original da dívida e o ciclo único', () => {
  const r = calcularRotativo(BASE, REF, registro)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)

  it('financia apenas a diferença entre a fatura e o que foi pago', () => {
    expect(r.valores.financiado).toBe(100_000)
  })

  it('cobra UM mês de rotativo, não doze — Resolução CMN 4.549, art. 1º', () => {
    // R$ 1.000,00 × 15% = R$ 150,00. Doze meses dariam R$ 4.350,00 de juros.
    expect(r.valores.jurosDoRotativo).toBe(15_000)
    expect(r.valores.dividaAposRotativo).toBe(115_000)
  })

  it('a etapa do rotativo cita a norma que limita o prazo a um ciclo', () => {
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Juros de um mês de rotativo')
    expect(etapa?.fundamento?.norma).toContain('4.549')
    expect(etapa?.justificativa).toContain('vencimento da fatura seguinte')
  })

  it('o restante é parcelado, e a taxa menor é a que vale', () => {
    expect(r.valores.taxaParcelamentoUsada).toBe(800)
    expect(r.valores.parcelamentoNaoEMaisVantajoso).toBe(false)
    expect(r.valores.jurosDoParcelamento).toBeGreaterThan(0)
  })

  it('os juros somam rotativo e parcelamento, e o total fecha', () => {
    expect(r.valores.jurosSemTeto).toBe(
      r.valores.jurosDoRotativo + r.valores.jurosDoParcelamento,
    )
    expect(r.valores.totalPago).toBe(r.valores.financiado + r.valores.jurosEEncargos)
  })
})

/**
 * O CASO QUE DÁ RAZÃO DE EXISTIR À CALCULADORA.
 *
 * Com taxa alta e prazo longo, os juros ultrapassariam o valor da dívida — e a
 * Lei nº 14.690/2023 não deixa. O teto é medido sobre o valor ORIGINAL e conta
 * desde o início do rotativo, não a partir do parcelamento.
 */
describe('CALC-023 · o teto do art. 28, § 1º', () => {
  const caro = calcularRotativo(
    { ...BASE, taxaParcelamento: basisPoints(1_400), parcelas: 24 },
    REF,
    registro,
  )
  if (!caro.ok) throw new Error('esperado sucesso')

  it('sem o teto, os juros passariam do valor da dívida', () => {
    expect(caro.valores.jurosSemTeto).toBeGreaterThan(caro.valores.financiado)
  })

  it('o teto é exatamente o valor original da dívida', () => {
    expect(caro.valores.tetoLegal).toBe(caro.valores.financiado)
    expect(caro.valores.tetoAtingido).toBe(true)
  })

  it('a cobrança fica limitada ao teto, e o total é o dobro da dívida', () => {
    expect(caro.valores.jurosEEncargos).toBe(caro.valores.tetoLegal)
    expect(caro.valores.totalPago).toBe(caro.valores.financiado * 2)
  })

  it('a etapa do teto cita o parâmetro legal, com vigência e fonte', () => {
    const etapa = caro.traco.etapas.find((e) => e.rotulo === 'Teto legal de juros e encargos')
    expect(etapa?.parametro?.parametroId).toBe('cartao-teto-juros-encargos')
    expect(etapa?.parametro?.norma).toContain('14.690')
    expect(etapa?.parametro?.vigenciaInicio).toBe('2024-01-03')
  })

  it('a vigência aplicada aparece no traço', () => {
    expect(caro.traco.vigenciasAplicadas).toContain('cartao-teto-juros-encargos-2024')
  })

  /**
   * A regra do art. 2º-A, parágrafo único, II: os juros são apurados desde o
   * início do rotativo. Se fossem contados só a partir do parcelamento, o mês
   * de rotativo ficaria fora do teto e a cobrança total passaria do dobro.
   */
  it('o mês de rotativo entra na conta do teto, e não fica de fora dele', () => {
    expect(caro.valores.jurosSemTeto).toBeGreaterThan(caro.valores.jurosDoParcelamento)
    expect(caro.valores.totalPago).toBeLessThanOrEqual(caro.valores.financiado * 2)
  })
})

describe('CALC-023 · a data importa — o teto não existia antes de 03/01/2024', () => {
  it('em 2023 não há vigência, e o cálculo é bloqueado em vez de extrapolado', () => {
    const r = calcularRotativo(BASE, '2023-11-30' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.motivo).toBe('vigencia_ausente')
  })

  it('no primeiro dia de eficácia o teto já vale', () => {
    const r = calcularRotativo(BASE, '2024-01-03' as DataISO, registro)
    expect(r.ok).toBe(true)
  })
})

describe('CALC-023 · o parcelamento tem de ser mais vantajoso — art. 2º', () => {
  it('taxa de parcelamento igual à do rotativo é sinalizada', () => {
    const r = calcularRotativo({ ...BASE, taxaParcelamento: basisPoints(1_500) }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.parcelamentoNaoEMaisVantajoso).toBe(true)
  })

  it('sem taxa de parcelamento informada, repete a do rotativo — o pior caso', () => {
    const r = calcularRotativo({ ...BASE, taxaParcelamento: basisPoints(0) }, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.taxaParcelamentoUsada).toBe(BASE.taxaRotativo)
    expect(r.valores.parcelamentoNaoEMaisVantajoso).toBe(true)
  })

  it('quanto menor a taxa do parcelamento, menor o custo', () => {
    const barato = calcularRotativo({ ...BASE, taxaParcelamento: basisPoints(500) }, REF, registro)
    const caro = calcularRotativo({ ...BASE, taxaParcelamento: basisPoints(1_200) }, REF, registro)
    if (!barato.ok || !caro.ok) throw new Error('esperado sucesso')
    expect(barato.valores.jurosEEncargos).toBeLessThan(caro.valores.jurosEEncargos)
  })
})

/**
 * O conselho da calculadora, verificado em vez de afirmado: pagar mais reduz a
 * base dos juros do rotativo, dos juros do parcelamento e do próprio teto.
 */
describe('CALC-023 · pagar mais reduz as três coisas ao mesmo tempo', () => {
  const pouco = calcularRotativo({ ...BASE, valorPago: centavos(50_000) }, REF, registro)
  const muito = calcularRotativo({ ...BASE, valorPago: centavos(150_000) }, REF, registro)
  if (!pouco.ok || !muito.ok) throw new Error('esperado sucesso')

  it('a base do rotativo cai', () => {
    expect(muito.valores.financiado).toBeLessThan(pouco.valores.financiado)
  })

  it('os juros do ciclo caem', () => {
    expect(muito.valores.jurosDoRotativo).toBeLessThan(pouco.valores.jurosDoRotativo)
  })

  it('o teto legal cai junto, porque é medido sobre o valor original', () => {
    expect(muito.valores.tetoLegal).toBeLessThan(pouco.valores.tetoLegal)
  })
})

describe('CALC-023 · entradas que não produzem cálculo', () => {
  it('fatura paga por inteiro não gera juros, e a mensagem diz isso', () => {
    const r = calcularRotativo({ ...BASE, valorPago: centavos(200_000) }, REF, registro)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.detalhe).toContain('paga por inteiro')
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    for (const parcial of [
      { valorDaFatura: centavos(0) },
      { taxaRotativo: basisPoints(0) },
      { parcelas: 0 },
    ]) {
      expect(calcularRotativo({ ...BASE, ...parcial }, REF, registro).ok).toBe(false)
    }
  })

  it('valor pago negativo é recusado', () => {
    expect(calcularRotativo({ ...BASE, valorPago: centavos(-1) }, REF, registro).ok).toBe(false)
  })
})

/**
 * O DETALHAMENTO TEM DE FECHAR.
 *
 * Defeito encontrado à mão em produção, em 01/08/2026: quando o teto cortava, a
 * tela mostrava os juros SEM teto abertos por operação ao lado de um total JÁ
 * limitado. Cada número certo isoladamente, a soma não batendo — e quem lê não
 * tem como saber por quê; lê como defeito de cálculo.
 *
 * O teste roda a função da DEFINIÇÃO, e não a do motor, porque é ali que o
 * detalhamento é montado. Nenhum caso-ouro do motor pegaria isto.
 */
describe('CALC-023 · o que aparece na tela soma', () => {
  const somaDoDetalhamento = (valores: Record<string, number | string>) => {
    const r = calcular(valores, REF)
    if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
    const linhas = r.valores.detalhamento
    const total = linhas[linhas.length - 1]
    // Todas as linhas menos a última, com o sinal que a tela exibe.
    const parcelas = linhas.slice(0, -1).reduce((acc, l) => acc + l.valor, 0)
    return { parcelas, total: total?.valor ?? 0 }
  }

  it('fecha no cenário sem teto', () => {
    const { parcelas, total } = somaDoDetalhamento({
      valorDaFatura: 200_000,
      valorPago: 100_000,
      taxaRotativo: 1_500,
      taxaParcelamento: 800,
      parcelas: 12,
    })
    expect(parcelas).toBe(total)
  })

  it('fecha no cenário em que o teto corta — o caso do defeito', () => {
    const { parcelas, total } = somaDoDetalhamento({
      valorDaFatura: 200_000,
      valorPago: 100_000,
      taxaRotativo: 1_500,
      taxaParcelamento: 1_400,
      parcelas: 24,
    })
    expect(parcelas).toBe(total)
  })

  it('quando o teto corta, a nota informa o valor que seria cobrado sem ele', () => {
    const r = calcular(
      {
        valorDaFatura: 200_000,
        valorPago: 100_000,
        taxaRotativo: 1_500,
        taxaParcelamento: 1_400,
        parcelas: 24,
      },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    // A abertura por operação não some do produto: ela migra para a nota e para
    // a memória de cálculo, onde o contexto explica a diferença.
    expect(r.valores.notas?.join(' ')).toContain('a lei limita a cobrança')
  })
})

describe('CALC-023 · C-M1 · não existe cálculo sem memória', () => {
  it('registra a sequência inteira, com valores substituídos', () => {
    const r = calcularRotativo(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const rotulos = r.traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Saldo que entrou no rotativo')
    expect(rotulos).toContain('Juros de um mês de rotativo')
    expect(rotulos).toContain('Teto legal de juros e encargos')
    expect(rotulos).toContain('Total a pagar')
    for (const e of r.traco.etapas) expect(e.formula.length).toBeGreaterThan(0)
  })
})
