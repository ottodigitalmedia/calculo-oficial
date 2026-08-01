/**
 * Casos-ouro de CALC-036 — amortização extra: prazo ou parcela.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Sem parâmetro legal e sem tabela oficial contra a qual conferir. O contrato de
 * base foi escolhido para ser **conferível de cabeça**: R$ 200.000,00 em 200
 * prestações no SAC amortizam R$ 1.000,00 por mês, e 0,80% sobre o saldo cheio
 * são R$ 1.600,00 — prestação inicial de R$ 2.600,00.
 *
 * Com isso, amortizar R$ 20.000,00 mantendo o ritmo elimina exatamente vinte
 * prestações, porque vinte mil dividido por mil é vinte. Nenhum número precisa
 * ser aceito por confiança.
 *
 * O resto são identidades: a economia é a diferença entre os dois totais, e
 * reduzir o prazo economiza mais que reduzir a parcela — que é a afirmação que a
 * página faz e que, portanto, precisa de teste.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/amortizacao-extra'
import {
  calcularAmortizacaoExtra,
  type EntradaAmortizacaoExtra,
} from '../../src/lib/engine/calculadoras/amortizacao-extra'
import { parcelaPrice } from '../../src/lib/engine/financeira'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

/** R$ 200.000,00 em 200 prestações a 0,80% ao mês, com R$ 20.000,00 de extra. */
const BASE: EntradaAmortizacaoExtra = {
  saldoDevedor: centavos(20_000_000),
  prazoRestanteMeses: 200,
  taxaMensal: basisPoints(80),
  sistema: 'sac',
  valorExtra: centavos(2_000_000),
}

function calcularOuFalhar(entrada: EntradaAmortizacaoExtra) {
  const r = calcularAmortizacaoExtra(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

// ---------------------------------------------------------------------------
// O contrato de partida
// ---------------------------------------------------------------------------

describe('CALC-036 · o contrato como está', () => {
  const r = calcularOuFalhar(BASE)

  it('a prestação atual é amortização mais juros do saldo cheio', () => {
    // R$ 200.000,00 ÷ 200 = R$ 1.000,00 · 0,80% de R$ 200.000,00 = R$ 1.600,00
    expect(r.valores.parcelaOriginal).toBe(100_000 + 160_000)
  })

  /**
   * No SAC os juros somam i × (n·S − q·n(n−1)/2). Com os números do caso:
   * 0,008 × (200 × 200.000 − 1.000 × 19.900) = R$ 160.800,00.
   */
  it('o total sem amortizar é o saldo mais os juros de todo o prazo', () => {
    expect(Math.abs(r.valores.totalSemAmortizar - (20_000_000 + 16_080_000))).toBeLessThanOrEqual(200)
  })
})

// ---------------------------------------------------------------------------
// As duas escolhas
// ---------------------------------------------------------------------------

describe('CALC-036 · reduzir o prazo mantém o ritmo e encurta o contrato', () => {
  const r = calcularOuFalhar(BASE)

  it('elimina exatamente as prestações que o extra cobre', () => {
    // R$ 20.000,00 de extra ÷ R$ 1.000,00 de amortização mensal = 20 prestações
    expect(r.valores.novoPrazo).toBe(180)
    expect(r.valores.mesesEliminados).toBe(20)
  })

  it('a prestação não muda — é o prazo que cede', () => {
    const semExtra = calcularOuFalhar({ ...BASE, valorExtra: centavos(1) })
    expect(semExtra.valores.parcelaOriginal).toBe(r.valores.parcelaOriginal)
  })
})

describe('CALC-036 · reduzir a parcela mantém o prazo e baixa a prestação', () => {
  const r = calcularOuFalhar(BASE)

  it('a nova prestação sai do saldo já abatido', () => {
    // R$ 180.000,00 ÷ 200 = R$ 900,00 · 0,80% de R$ 180.000,00 = R$ 1.440,00
    expect(r.valores.novaParcela).toBe(90_000 + 144_000)
  })

  it('a prestação nova é menor que a atual', () => {
    expect(r.valores.novaParcela).toBeLessThan(r.valores.parcelaOriginal)
  })
})

/**
 * A afirmação que a página faz — e que por isso precisa de teste, não de
 * confiança.
 */
describe('CALC-036 · com o mesmo dinheiro, encurtar o prazo economiza mais', () => {
  for (const sistema of ['sac', 'price'] as const) {
    it(`vale no sistema ${sistema}`, () => {
      const r = calcularOuFalhar({ ...BASE, sistema })
      expect(r.valores.economiaPrazo).toBeGreaterThan(r.valores.economiaParcela)
      expect(r.valores.diferencaEntreEscolhas).toBe(
        r.valores.economiaPrazo - r.valores.economiaParcela,
      )
      expect(r.valores.totalReduzindoPrazo).toBeLessThan(r.valores.totalReduzindoParcela)
    })
  }

  it('as duas economias são a diferença entre os totais', () => {
    const v = calcularOuFalhar(BASE).valores
    expect(v.economiaPrazo).toBe(v.totalSemAmortizar - v.totalReduzindoPrazo)
    expect(v.economiaParcela).toBe(v.totalSemAmortizar - v.totalReduzindoParcela)
  })

  it('os dois totais incluem o que foi pago hoje — senão a economia mentiria', () => {
    const v = calcularOuFalhar(BASE).valores
    expect(v.totalReduzindoPrazo).toBeGreaterThan(v.valorAmortizado)
    expect(v.totalReduzindoParcela).toBeGreaterThan(v.valorAmortizado)
  })
})

// ---------------------------------------------------------------------------
// Concordância com o sistema francês
// ---------------------------------------------------------------------------

describe('CALC-036 · no Price o contrato de partida fecha com a fórmula', () => {
  const r = calcularOuFalhar({ ...BASE, sistema: 'price' })

  it('a prestação atual é a do sistema francês', () => {
    expect(r.valores.parcelaOriginal).toBe(
      parcelaPrice(BASE.saldoDevedor, BASE.prazoRestanteMeses, BASE.taxaMensal),
    )
  })

  it('o total sem amortizar é a prestação vezes o prazo, a menos do arredondamento', () => {
    const parcela = parcelaPrice(BASE.saldoDevedor, BASE.prazoRestanteMeses, BASE.taxaMensal)
    expect(Math.abs(r.valores.totalSemAmortizar - parcela * 200)).toBeLessThanOrEqual(200)
  })

  it('reduzir a parcela devolve a prestação do saldo abatido', () => {
    expect(r.valores.novaParcela).toBe(parcelaPrice(centavos(18_000_000), 200, basisPoints(80)))
  })
})

// ---------------------------------------------------------------------------
// Fronteiras
// ---------------------------------------------------------------------------

describe('CALC-036 · fronteiras', () => {
  it('extra igual ou maior que o saldo é quitação total, não troco', () => {
    const r = calcularOuFalhar({ ...BASE, valorExtra: centavos(50_000_000) })
    expect(r.valores.quitacaoTotal).toBe(true)
    expect(r.valores.valorAmortizado).toBe(BASE.saldoDevedor)
    expect(r.valores.novoPrazo).toBe(0)
    expect(r.valores.mesesEliminados).toBe(200)
    expect(r.valores.totalReduzindoPrazo).toBe(BASE.saldoDevedor)
    // Sem contrato pela frente, as duas escolhas viram a mesma coisa.
    expect(r.valores.diferencaEntreEscolhas).toBe(0)
  })

  it('a juros zero não há economia nenhuma — só antecipação', () => {
    const r = calcularOuFalhar({ ...BASE, taxaMensal: basisPoints(0) })
    expect(r.valores.totalSemAmortizar).toBe(BASE.saldoDevedor)
    expect(r.valores.economiaPrazo).toBe(0)
    expect(r.valores.economiaParcela).toBe(0)
  })

  it('campo obrigatório vazio mantém o estado pendente', () => {
    expect(calcularAmortizacaoExtra({ ...BASE, saldoDevedor: centavos(0) }, REF).ok).toBe(false)
    expect(calcularAmortizacaoExtra({ ...BASE, prazoRestanteMeses: 0 }, REF).ok).toBe(false)
    expect(calcularAmortizacaoExtra({ ...BASE, valorExtra: centavos(0) }, REF).ok).toBe(false)
  })

  it('taxa negativa é recusada', () => {
    expect(calcularAmortizacaoExtra({ ...BASE, taxaMensal: basisPoints(-1) }, REF).ok).toBe(false)
  })

  it('uma prestação restante ainda produz resultado coerente', () => {
    const r = calcularOuFalhar({ ...BASE, prazoRestanteMeses: 1, valorExtra: centavos(500_000) })
    expect(r.valores.economiaPrazo).toBeGreaterThanOrEqual(r.valores.economiaParcela)
    expect(r.valores.novoPrazo).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// C-M1 e a soma da tela
// ---------------------------------------------------------------------------

describe('CALC-036 · a memória abre as duas escolhas', () => {
  const rotulos = calcularOuFalhar(BASE).traco.etapas.map((e) => e.rotulo)

  it('registra as duas, e o que a diferença entre elas vale', () => {
    expect(rotulos).toContain('Escolha 1 — manter a prestação e encurtar o contrato')
    expect(rotulos).toContain('Escolha 2 — manter o prazo e baixar a prestação')
    expect(rotulos).toContain('Quanto a escolha certa vale')
  })

  it('a etapa do prazo é contada em meses, não em reais', () => {
    const etapa = calcularOuFalhar(BASE).traco.etapas.find((e) =>
      e.rotulo.startsWith('Escolha 1'),
    )
    expect(etapa?.unidade).toBe('numero')
    expect(etapa?.resultado).toBe(20 * 100)
  })
})

describe('CALC-036 · a coluna do resultado fecha', () => {
  const ENTRADA = {
    saldoDevedor: 20_000_000,
    prazoRestante: 200,
    taxaMensal: 80,
    valorExtra: 2_000_000,
  }

  for (const sistema of ['sac', 'price']) {
    it(`a primeira linha menos a segunda é a terceira, no ${sistema}`, () => {
      const r = calcular({ ...ENTRADA, sistema }, REF)
      if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
      const [semAmortizar, comAmortizacao, economia] = r.valores.detalhamento
      expect((semAmortizar?.valor ?? 0) - (comAmortizacao?.valor ?? 0)).toBe(economia?.valor)
      expect(r.valores.principal).toBe(economia?.valor)
    })
  }
})
