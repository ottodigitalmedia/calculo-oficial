/**
 * Casos-ouro de CALC-035 (rentabilidade de aluguel) e CALC-044 (reserva).
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Nenhuma das duas tem parâmetro legal — e, mais que isso, nenhuma das duas tem
 * um número "certo" a consultar: os seis meses de reserva e os dez por cento de
 * imobiliária são praxe, não norma, e por isso são campo. O que se confere aqui
 * é a **aritmética**, com valores escolhidos para fechar de cabeça:
 *
 *   Imóvel de R$ 400.000,00, aluguel de R$ 2.000,00, um mês vago por ano.
 *   Onze aluguéis somam R$ 22.000,00; 10% de taxa são R$ 2.200,00.
 *
 *   Despesa de R$ 3.000,00 por seis meses são R$ 18.000,00 de meta.
 *
 * O caso mais importante do arquivo é o da rentabilidade bruta contra a
 * líquida: é a única afirmação que a página faz sobre o mundo, e é a razão de
 * ela existir.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDaLocacao } from '../../src/lib/calculadoras/locacao'
import { calcular as calcularDaReserva } from '../../src/lib/calculadoras/reserva'
import { calcularLocacao, type EntradaLocacao } from '../../src/lib/engine/calculadoras/locacao'
import { calcularReserva, type EntradaReserva } from '../../src/lib/engine/calculadoras/reserva'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-035 — rentabilidade de imóvel para locação
// ---------------------------------------------------------------------------

const IMOVEL: EntradaLocacao = {
  valorDoImovel: centavos(40_000_000),
  aluguelMensal: centavos(200_000),
  taxaAdministracaoBp: basisPoints(1_000),
  iptuAnual: centavos(120_000),
  condominioMensal: centavos(50_000),
  manutencaoAnual: centavos(100_000),
  mesesVagosPorAno: 1,
}

function locacaoOuFalhar(entrada: EntradaLocacao) {
  const r = calcularLocacao(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-035 · o ano de aluguel, aberto', () => {
  const v = locacaoOuFalhar(IMOVEL).valores

  it('a vacância tira um aluguel do ano, não um doze avos de cada mês', () => {
    expect(v.aluguelRecebidoNoAno).toBe(200_000 * 11)
  })

  it('a taxa da imobiliária incide sobre o que foi recebido, não sobre doze aluguéis', () => {
    expect(v.custoAdministracao).toBe(220_000)
  })

  it('o condomínio dos meses vagos volta para o proprietário', () => {
    expect(v.custoCondominioVago).toBe(50_000)
  })

  it('a sobra do ano é o recebido menos as quatro despesas', () => {
    // 22.000 − (2.200 + 1.200 + 500 + 1.000) = 17.100
    expect(v.despesasTotais).toBe(220_000 + 120_000 + 50_000 + 100_000)
    expect(v.liquidoAnual).toBe(1_710_000)
    expect(v.liquidoMensal).toBe(142_500)
  })
})

/**
 * A afirmação que a página faz sobre o mundo — e por isso a que precisa de
 * teste, não de confiança.
 */
describe('CALC-035 · a rentabilidade do anúncio não é a que chega', () => {
  const v = locacaoOuFalhar(IMOVEL).valores

  it('a bruta ignora vacância e despesas: doze aluguéis sobre o valor do imóvel', () => {
    // R$ 24.000,00 ÷ R$ 400.000,00 = 6,00%
    expect(v.rentabilidadeBrutaAnualBp).toBe(600)
  })

  it('a líquida é a que sobra sobre o que foi imobilizado', () => {
    // R$ 17.100,00 ÷ R$ 400.000,00 = 4,275% → 4,28% ao arredondar
    expect(v.rentabilidadeLiquidaAnualBp).toBe(428)
  })

  it('a distância entre as duas é o que o anúncio não menciona', () => {
    expect(v.rentabilidadeLiquidaAnualBp).toBeLessThan(v.rentabilidadeBrutaAnualBp)
  })

  it('sem despesa nenhuma e sem vacância, as duas coincidem', () => {
    const limpo = locacaoOuFalhar({
      ...IMOVEL,
      taxaAdministracaoBp: basisPoints(0),
      iptuAnual: centavos(0),
      condominioMensal: centavos(0),
      manutencaoAnual: centavos(0),
      mesesVagosPorAno: 0,
    })
    expect(limpo.valores.rentabilidadeLiquidaAnualBp).toBe(
      limpo.valores.rentabilidadeBrutaAnualBp,
    )
  })
})

describe('CALC-035 · anos para o imóvel se pagar', () => {
  it('é o valor do imóvel dividido pela sobra de um ano', () => {
    // R$ 400.000,00 ÷ R$ 17.100,00 = 23,39 anos
    expect(locacaoOuFalhar(IMOVEL).valores.anosParaSePagarCentesimos).toBe(2_339)
  })

  /**
   * Com despesa maior que a receita não existe prazo — e devolver um número
   * aqui sugeriria que existe.
   */
  it('não existe quando o imóvel dá prejuízo', () => {
    const v = locacaoOuFalhar({ ...IMOVEL, manutencaoAnual: centavos(5_000_000) }).valores
    expect(v.liquidoAnual).toBeLessThan(0)
    expect(v.anosParaSePagarCentesimos).toBe(0)
  })
})

describe('CALC-035 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularLocacao({ ...IMOVEL, valorDoImovel: centavos(0) }, REF).ok).toBe(false)
    expect(calcularLocacao({ ...IMOVEL, aluguelMensal: centavos(0) }, REF).ok).toBe(false)
  })

  it('doze meses vagos é recusado — não haveria aluguel nenhum a medir', () => {
    expect(calcularLocacao({ ...IMOVEL, mesesVagosPorAno: 12 }, REF).ok).toBe(false)
    expect(calcularLocacao({ ...IMOVEL, mesesVagosPorAno: -1 }, REF).ok).toBe(false)
  })

  it('sem vacância, as etapas de condomínio vago não existem', () => {
    const rotulos = locacaoOuFalhar({ ...IMOVEL, mesesVagosPorAno: 0 }).traco.etapas.map(
      (e) => e.rotulo,
    )
    expect(rotulos).not.toContain('Condomínio nos meses vagos')
  })

  it('a memória mostra as duas rentabilidades em percentual, não em reais', () => {
    for (const rotulo of ['Rentabilidade bruta ao ano', 'Rentabilidade líquida ao ano']) {
      const etapa = locacaoOuFalhar(IMOVEL).traco.etapas.find((e) => e.rotulo === rotulo)
      expect(etapa?.unidade, rotulo).toBe('percentual')
    }
  })
})

describe('CALC-035 · a coluna do resultado fecha', () => {
  it('o recebido menos as despesas é a última linha', () => {
    const r = calcularDaLocacao(
      {
        valorDoImovel: 40_000_000,
        aluguelMensal: 200_000,
        taxaAdministracao: 1_000,
        iptuAnual: 120_000,
        condominioMensal: 50_000,
        manutencaoAnual: 100_000,
        mesesVagos: 1,
      },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)

    const linhas = r.valores.detalhamento
    const soma = linhas
      .slice(0, -1)
      .reduce((total, l) => (l.sinal === 'debito' ? total - l.valor : total + l.valor), 0)
    expect(soma).toBe(linhas[linhas.length - 1]?.valor)
    expect(r.valores.principal).toBe(1_710_000)
  })

  it('despesa não informada não vira linha zerada', () => {
    const r = calcularDaLocacao(
      { valorDoImovel: 40_000_000, aluguelMensal: 200_000, taxaAdministracao: 0, mesesVagos: 0 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.detalhamento).toHaveLength(2)
    expect(r.valores.detalhamento.every((l) => l.valor !== 0)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// CALC-044 — reserva de emergência
// ---------------------------------------------------------------------------

const RESERVA: EntradaReserva = {
  despesaMensal: centavos(300_000),
  mesesDeCobertura: 6,
  jaGuardado: centavos(600_000),
  aporteMensal: centavos(100_000),
  rendimentoMensalBp: basisPoints(0),
}

function reservaOuFalhar(entrada: EntradaReserva) {
  const r = calcularReserva(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

describe('CALC-044 · a meta e a distância até ela', () => {
  const v = reservaOuFalhar(RESERVA).valores

  it('a meta é a despesa vezes os meses escolhidos', () => {
    expect(v.meta).toBe(300_000 * 6)
  })

  it('o que falta é a meta menos o que já existe', () => {
    expect(v.faltaReunir).toBe(1_800_000 - 600_000)
    expect(v.metaAlcancada).toBe(false)
  })

  it('sem rendimento, o prazo é a divisão exata pelo aporte', () => {
    // R$ 12.000,00 a reunir, R$ 1.000,00 por mês
    expect(v.mesesAteAMeta).toBe(12)
    expect(v.totalAportado).toBe(1_200_000)
    expect(v.rendimentoAcumulado).toBe(0)
  })
})

describe('CALC-044 · o rendimento encurta o caminho e aparece separado', () => {
  const com = reservaOuFalhar({ ...RESERVA, rendimentoMensalBp: basisPoints(100) })
  const sem = reservaOuFalhar(RESERVA)

  it('com rendimento a meta chega antes', () => {
    expect(com.valores.mesesAteAMeta).toBeLessThan(sem.valores.mesesAteAMeta)
  })

  it('o que não veio do bolso veio do rendimento', () => {
    expect(com.valores.rendimentoAcumulado).toBeGreaterThan(0)
    expect(com.valores.totalAportado).toBeLessThan(sem.valores.totalAportado)
  })

  it('a etapa do prazo é contada em meses, não em reais', () => {
    const etapa = com.traco.etapas.find((e) => e.rotulo.startsWith('Meses de aporte'))
    expect(etapa?.unidade).toBe('numero')
    expect(etapa?.resultado).toBe(com.valores.mesesAteAMeta * 100)
  })
})

describe('CALC-044 · quando não há prazo a estimar', () => {
  /**
   * Sem aporte e sem rendimento o saldo fica parado. Devolver o teto do laço
   * como se fosse resposta seria pior que dizer que não alcança — e é o tipo de
   * número que o usuário lê como cálculo, não como limite de simulação.
   */
  it('sem aporte nenhum, a calculadora diz que não alcança em vez de inventar prazo', () => {
    const v = reservaOuFalhar({ ...RESERVA, aporteMensal: centavos(0) }).valores
    expect(v.alcancavel).toBe(false)
    expect(v.mesesAteAMeta).toBe(0)
    expect(v.totalAportado).toBe(0)
  })

  it('e a memória registra isso como etapa, não como silêncio', () => {
    const rotulos = reservaOuFalhar({ ...RESERVA, aporteMensal: centavos(0) }).traco.etapas.map(
      (e) => e.rotulo,
    )
    expect(rotulos).toContain('Com este aporte, a meta não é alcançada')
  })

  it('meta já alcançada não tem prazo, tem sobra', () => {
    const v = reservaOuFalhar({ ...RESERVA, jaGuardado: centavos(5_000_000) }).valores
    expect(v.metaAlcancada).toBe(true)
    expect(v.alcancavel).toBe(true)
    expect(v.faltaReunir).toBe(0)
    expect(v.mesesAteAMeta).toBe(0)
  })
})

describe('CALC-044 · fronteiras', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularReserva({ ...RESERVA, despesaMensal: centavos(0) }, REF).ok).toBe(false)
    expect(calcularReserva({ ...RESERVA, mesesDeCobertura: 0 }, REF).ok).toBe(false)
  })

  it('valores negativos são recusados', () => {
    expect(calcularReserva({ ...RESERVA, jaGuardado: centavos(-1) }, REF).ok).toBe(false)
    expect(calcularReserva({ ...RESERVA, aporteMensal: centavos(-1) }, REF).ok).toBe(false)
  })

  it('a etapa da meta declara que o prazo foi escolha do usuário', () => {
    const etapa = reservaOuFalhar(RESERVA).traco.etapas.find((e) => e.rotulo === 'Meta da reserva')
    expect(etapa?.justificativa).toContain('você quem escolheu')
  })
})

describe('CALC-044 · a coluna do resultado fecha', () => {
  it('a meta menos o guardado é o que falta', () => {
    const r = calcularDaReserva(
      { despesaMensal: 300_000, mesesDeCobertura: 6, jaGuardado: 600_000, aporteMensal: 100_000 },
      REF,
    )
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const [meta, guardado, falta] = r.valores.detalhamento
    expect((meta?.valor ?? 0) - (guardado?.valor ?? 0)).toBe(falta?.valor)
    expect(r.valores.principal).toBe(falta?.valor)
  })
})
