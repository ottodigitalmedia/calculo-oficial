/**
 * Casos-ouro de CALC-031 — financiamento imobiliário com os encargos dentro.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Esta calculadora não tem parâmetro legal: tudo o que entra é digitado, e os
 * prêmios de seguro variam por seguradora e por idade. Não há tabela oficial
 * contra a qual conferir — e por isso os casos abaixo são de dois tipos, ambos
 * mais fortes que comparar com um resultado tabelado de terceiro:
 *
 * 1. **Identidades.** O total pago tem de ser exatamente o valor financiado
 *    mais juros, seguros e tarifa. As amortizações devolvem o principal; tudo
 *    o mais é custo. Uma conta errada em qualquer mês quebra a soma.
 *
 * 2. **Concordância com CALC-025.** Com os três encargos zerados, este motor
 *    tem de reproduzir `calcularAmortizacao` centavo a centavo, nos dois
 *    sistemas. São duas implementações independentes da mesma amortização, e
 *    exigir que coincidam pega o erro que nenhuma das duas pegaria sozinha.
 *
 * Os poucos números escritos à mão são conferíveis em uma linha: R$ 300.000,00
 * em 360 meses amortiza R$ 833,33 por mês no SAC, e 0,80% sobre o saldo cheio
 * são R$ 2.400,00.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/financiamento-imobiliario'
import { calcularAmortizacao } from '../../src/lib/engine/calculadoras/credito'
import {
  calcularFinanciamentoImobiliario,
  type EntradaFinanciamento,
} from '../../src/lib/engine/calculadoras/imobiliario'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

/** R$ 300.000,00 em 30 anos a 0,80% ao mês, com MIP, DFI e tarifa. */
const BASE: EntradaFinanciamento = {
  valorFinanciado: centavos(30_000_000),
  prazoMeses: 360,
  taxaMensal: basisPoints(80),
  sistema: 'sac',
  mipPrimeiraParcela: centavos(6_000),
  dfiMensal: centavos(1_500),
  tarifaMensal: centavos(2_500),
}

const SEM_ENCARGOS: EntradaFinanciamento = {
  ...BASE,
  mipPrimeiraParcela: centavos(0),
  dfiMensal: centavos(0),
  tarifaMensal: centavos(0),
}

function calcularOuFalhar(entrada: EntradaFinanciamento) {
  const r = calcularFinanciamentoImobiliario(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

// ---------------------------------------------------------------------------
// A prestação que o banco cobra, e a que ele anuncia
// ---------------------------------------------------------------------------

describe('CALC-031 · a primeira prestação, aberta', () => {
  const r = calcularOuFalhar(BASE)

  it('a parte de amortização e juros é a que a taxa anunciada descreve', () => {
    // R$ 300.000,00 ÷ 360 = R$ 833,33 · 0,80% de R$ 300.000,00 = R$ 2.400,00
    expect(r.valores.primeiraSemEncargos).toBe(83_333 + 240_000)
  })

  it('a prestação que sai da conta traz os três encargos por cima', () => {
    expect(r.valores.primeiraPrestacao).toBe(83_333 + 240_000 + 6_000 + 1_500 + 2_500)
  })

  /** A razão de a calculadora existir: a diferença entre as duas linhas acima. */
  it('a diferença entre as duas é exatamente o que a taxa não menciona', () => {
    expect(r.valores.primeiraPrestacao - r.valores.primeiraSemEncargos).toBe(10_000)
  })

  it('no SAC a prestação cai do começo ao fim', () => {
    expect(r.valores.ultimaPrestacao).toBeLessThan(r.valores.primeiraPrestacao)
  })
})

// ---------------------------------------------------------------------------
// A identidade que prova a apuração mês a mês
// ---------------------------------------------------------------------------

describe('CALC-031 · o total é o financiado mais o custo do crédito', () => {
  for (const sistema of ['sac', 'price'] as const) {
    it(`fecha no sistema ${sistema}`, () => {
      const r = calcularOuFalhar({ ...BASE, sistema })
      const v = r.valores
      expect(v.totalJuros + v.totalSeguros + v.totalTarifas + BASE.valorFinanciado).toBe(
        v.totalPago,
      )
    })
  }

  it('o saldo devedor zera na última linha da evolução', () => {
    const r = calcularOuFalhar(BASE)
    const ultima = r.valores.evolucao[r.valores.evolucao.length - 1]
    expect(ultima?.saldo).toBe(0)
  })

  it('trinta anos produzem trinta linhas de evolução', () => {
    expect(calcularOuFalhar(BASE).valores.evolucao).toHaveLength(30)
  })
})

// ---------------------------------------------------------------------------
// Concordância com CALC-025 — duas implementações, o mesmo contrato
// ---------------------------------------------------------------------------

describe('CALC-031 · sem encargos, reproduz CALC-025 centavo a centavo', () => {
  const amortizacao = calcularAmortizacao(
    {
      principal: BASE.valorFinanciado,
      prazoMeses: BASE.prazoMeses,
      taxaMensal: BASE.taxaMensal,
    },
    REF,
  )
  if (!amortizacao.ok) throw new Error('esperado sucesso')

  const r = calcularOuFalhar(SEM_ENCARGOS)

  it('o total do SAC coincide', () => {
    expect(r.valores.totalSac).toBe(amortizacao.valores.totalSac)
  })

  it('o total do Price coincide', () => {
    expect(r.valores.totalPrice).toBe(amortizacao.valores.totalPrice)
  })

  it('a primeira prestação do SAC coincide', () => {
    expect(r.valores.primeiraPrestacao).toBe(amortizacao.valores.primeiraParcelaSac)
  })

  it('a prestação do Price coincide com a fórmula do sistema francês', () => {
    const price = calcularOuFalhar({ ...SEM_ENCARGOS, sistema: 'price' })
    expect(price.valores.primeiraPrestacao).toBe(amortizacao.valores.parcelaPriceConstante)
  })

  it('sem encargos não há seguro nem tarifa a somar', () => {
    expect(r.valores.totalSeguros).toBe(0)
    expect(r.valores.totalTarifas).toBe(0)
    expect(r.valores.parteDosEncargosBp).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// O comportamento de cada encargo
// ---------------------------------------------------------------------------

describe('CALC-031 · cada encargo se comporta como a sua base manda', () => {
  it('o DFI e a tarifa são fixos: entram inteiros em todas as prestações', () => {
    const r = calcularOuFalhar({ ...SEM_ENCARGOS, dfiMensal: centavos(1_500), tarifaMensal: centavos(2_500) })
    expect(r.valores.totalSeguros).toBe(1_500 * 360)
    expect(r.valores.totalTarifas).toBe(2_500 * 360)
  })

  /**
   * O MIP incide sobre o saldo devedor. Como o saldo do primeiro mês é o valor
   * financiado inteiro, a proporção devolve exatamente o que o usuário
   * informou — a conta reproduz o dado onde ele foi medido.
   */
  it('o MIP do primeiro mês é o valor informado, sem distorção', () => {
    const r = calcularOuFalhar({ ...SEM_ENCARGOS, mipPrimeiraParcela: centavos(6_000) })
    expect(r.valores.primeiraPrestacao - r.valores.primeiraSemEncargos).toBe(6_000)
  })

  it('o MIP cai com o saldo, e por isso soma bem menos que o prêmio inicial vezes o prazo', () => {
    const r = calcularOuFalhar({ ...SEM_ENCARGOS, mipPrimeiraParcela: centavos(6_000) })
    expect(r.valores.totalSeguros).toBeLessThan(6_000 * 360)
    expect(r.valores.totalSeguros).toBeGreaterThan(0)
  })

  /**
   * No SAC o saldo cai em passos iguais, então o MIP acumulado tende à média
   * entre o primeiro prêmio e o último — cerca de metade do prêmio inicial
   * vezes o prazo. É a conferência de ordem de grandeza que separa "cai junto
   * com o saldo" de "cai de qualquer jeito".
   */
  it('no SAC o MIP acumulado fica perto da metade do prêmio inicial vezes o prazo', () => {
    const r = calcularOuFalhar({ ...SEM_ENCARGOS, mipPrimeiraParcela: centavos(6_000) })
    const metade = (6_000 * 360) / 2
    expect(Math.abs(r.valores.totalSeguros - metade)).toBeLessThan(metade / 10)
  })

  it('os encargos acrescentam ao total exatamente o que somam', () => {
    const sem = calcularOuFalhar(SEM_ENCARGOS)
    const com = calcularOuFalhar(BASE)
    expect(com.valores.totalPago - sem.valores.totalPago).toBe(
      com.valores.totalSeguros + com.valores.totalTarifas,
    )
    // Os juros não mudam: seguro e tarifa não são financiados.
    expect(com.valores.totalJuros).toBe(sem.valores.totalJuros)
  })
})

// ---------------------------------------------------------------------------
// A comparação entre os dois sistemas
// ---------------------------------------------------------------------------

describe('CALC-031 · SAC e Price sob o mesmo contrato', () => {
  const sac = calcularOuFalhar({ ...BASE, sistema: 'sac' })
  const price = calcularOuFalhar({ ...BASE, sistema: 'price' })

  it('os dois enxergam os mesmos totais, escolha quem escolher', () => {
    expect(sac.valores.totalSac).toBe(price.valores.totalSac)
    expect(sac.valores.totalPrice).toBe(price.valores.totalPrice)
  })

  it('o total escolhido é o do sistema escolhido', () => {
    expect(sac.valores.totalPago).toBe(sac.valores.totalSac)
    expect(price.valores.totalPago).toBe(price.valores.totalPrice)
  })

  it('o SAC custa menos no total e mais na primeira prestação', () => {
    expect(sac.valores.totalPago).toBeLessThan(price.valores.totalPago)
    expect(sac.valores.primeiraPrestacao).toBeGreaterThan(price.valores.primeiraPrestacao)
    expect(sac.valores.economiaDoSac).toBe(price.valores.totalPrice - sac.valores.totalSac)
  })

  /**
   * No Price a prestação de amortização e juros é constante — o que faz a
   * prestação cheia variar é só o MIP, que acompanha o saldo.
   */
  it('no Price a prestação só cai pelo seguro', () => {
    expect(price.valores.ultimaPrestacao).toBeLessThan(price.valores.primeiraPrestacao)
    const semMip = calcularOuFalhar({ ...BASE, sistema: 'price', mipPrimeiraParcela: centavos(0) })
    expect(Math.abs(semMip.valores.ultimaPrestacao - semMip.valores.primeiraPrestacao)).toBeLessThanOrEqual(100)
  })
})

// ---------------------------------------------------------------------------
// Fronteiras
// ---------------------------------------------------------------------------

describe('CALC-031 · fronteiras e entradas recusadas', () => {
  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularFinanciamentoImobiliario({ ...BASE, valorFinanciado: centavos(0) }, REF).ok).toBe(false)
    expect(calcularFinanciamentoImobiliario({ ...BASE, prazoMeses: 0 }, REF).ok).toBe(false)
  })

  it('taxa negativa e encargo negativo são recusados', () => {
    expect(calcularFinanciamentoImobiliario({ ...BASE, taxaMensal: basisPoints(-1) }, REF).ok).toBe(false)
    expect(calcularFinanciamentoImobiliario({ ...BASE, dfiMensal: centavos(-1) }, REF).ok).toBe(false)
  })

  it('a juros zero os dois sistemas coincidem, e o custo é só encargo', () => {
    const r = calcularOuFalhar({ ...BASE, taxaMensal: basisPoints(0) })
    expect(r.valores.totalJuros).toBe(0)
    expect(r.valores.economiaDoSac).toBe(0)
    expect(r.valores.totalPago).toBe(
      BASE.valorFinanciado + r.valores.totalSeguros + r.valores.totalTarifas,
    )
  })

  it('prazo de um mês quita tudo na primeira prestação', () => {
    const r = calcularOuFalhar({ ...BASE, prazoMeses: 1 })
    expect(r.valores.primeiraPrestacao).toBe(r.valores.ultimaPrestacao)
    expect(r.valores.totalPago).toBe(r.valores.primeiraPrestacao)
    expect(r.valores.evolucao).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// C-M1 — não existe cálculo sem memória
// ---------------------------------------------------------------------------

describe('CALC-031 · a memória registra as etapas com os valores substituídos', () => {
  it('nomeia o sistema escolhido e abre a composição do total', () => {
    const rotulos = calcularOuFalhar(BASE).traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('SAC — a parte que amortiza é constante')
    expect(rotulos).toContain('Primeira prestação, com tudo o que é cobrado')
    expect(rotulos).toContain('Do que esse total é feito')
    expect(rotulos).toContain('Comparação entre os dois sistemas')
  })

  it('no Price a primeira etapa é a fórmula do sistema francês', () => {
    const rotulos = calcularOuFalhar({ ...BASE, sistema: 'price' }).traco.etapas.map((e) => e.rotulo)
    expect(rotulos).toContain('Price — a prestação de amortização e juros é constante')
    expect(rotulos).not.toContain('SAC — a parte que amortiza é constante')
  })

  it('sem encargos, as etapas de seguro não existem — não há zero a explicar', () => {
    const rotulos = calcularOuFalhar(SEM_ENCARGOS).traco.etapas.map((e) => e.rotulo)
    expect(rotulos).not.toContain('Seguro MIP da primeira prestação')
    expect(rotulos).not.toContain('Seguro DFI e tarifa, iguais todo mês')
    expect(rotulos).not.toContain('Quanto os seguros e a tarifa pesam')
  })

  it('toda etapa traz fórmula preenchida', () => {
    for (const e of calcularOuFalhar(BASE).traco.etapas) {
      expect(e.formula.length).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// O que aparece na tela soma — ESTADO-DO-PROJETO §7.12
// ---------------------------------------------------------------------------

/**
 * Roda a função da DEFINIÇÃO, não a do motor.
 *
 * O defeito que este bloco tranca não é de cálculo: em CALC-023 cada número
 * estava certo isoladamente e a coluna do detalhamento não somava, porque a
 * escolha de quais valores exibir foi feita fora do motor. Nenhum caso-ouro do
 * motor pegaria — e é a soma que não fecha que o usuário lê como erro.
 */
describe('CALC-031 · a coluna do resultado soma o total exibido', () => {
  const somaDoDetalhamento = (valores: Record<string, number | string>) => {
    const r = calcular(valores, REF)
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    const linhas = r.valores.detalhamento
    const total = linhas[linhas.length - 1]
    const parcelas = linhas.slice(0, -1).reduce((soma, l) => soma + l.valor, 0)
    return { parcelas, total: total?.valor ?? 0, principal: r.valores.principal }
  }

  const ENTRADA = {
    valorFinanciado: 30_000_000,
    prazoMeses: 360,
    taxaMensal: 80,
    mip: 6_000,
    dfi: 1_500,
    tarifa: 2_500,
  }

  for (const sistema of ['sac', 'price']) {
    it(`as parcelas somam a última linha no sistema ${sistema}`, () => {
      const { parcelas, total, principal } = somaDoDetalhamento({ ...ENTRADA, sistema })
      expect(parcelas).toBe(total)
      expect(principal).toBe(total)
    })
  }

  it('com os encargos em branco a soma continua fechando', () => {
    const { parcelas, total } = somaDoDetalhamento({
      ...ENTRADA,
      sistema: 'sac',
      mip: 0,
      dfi: 0,
      tarifa: 0,
    })
    expect(parcelas).toBe(total)
  })
})
