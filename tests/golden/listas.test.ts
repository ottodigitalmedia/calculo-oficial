/**
 * Casos-ouro de CALC-073 (divisão de conta), CALC-075 (média ponderada) e
 * CALC-028 (plano de quitação) — as três de entrada em lista.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * As três são aritmética sobre dados do usuário — sem parâmetro legal e sem
 * série. Os números foram escolhidos para fechar de cabeça:
 *
 *   Consumos de R$ 30, R$ 50 e R$ 20 somam R$ 100. Com 10% de gorjeta, R$ 110.
 *   Notas 8,00 e 6,00 com pesos 1 e 3: (8+18) ÷ 4 = 6,50.
 *   Duas dívidas iguais em saldo, com taxas diferentes: a ordem decide o juro.
 *
 * As três propriedades que estes casos existem para travar:
 *
 *   1. **A soma das partes fecha com o total, ao centavo** (CALC-073). É §7.12,
 *      e é o defeito que alguém confere na mesa do restaurante.
 *   2. **A nota necessária arredonda para CIMA** (CALC-075). Para baixo, tirar
 *      exatamente o valor devolvido deixaria a média abaixo da pedida.
 *   3. **A avalanche nunca custa mais que a bola de neve** (CALC-028), com o
 *      MESMO desembolso mensal nas duas — sem isso a comparação mede a carteira
 *      em vez da ordem.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDivisaoDef } from '../../src/lib/calculadoras/divisao-de-conta'
import { calcular as calcularMediaDef } from '../../src/lib/calculadoras/media-ponderada'
import { calcular as calcularQuitacaoDef } from '../../src/lib/calculadoras/plano-de-quitacao'
import {
  calcularMediaPonderada,
  calcularPlanoDeQuitacao,
  dividirConta,
} from '../../src/lib/engine/calculadoras/listas'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

// ---------------------------------------------------------------------------
// CALC-073 — Divisão de conta
// ---------------------------------------------------------------------------

const MESA = {
  consumos: [[3_000], [5_000], [2_000]],
  compartilhado: centavos(0),
  gorjetaBp: basisPoints(1_000),
}

describe('CALC-073 · a conta da mesa', () => {
  const r = dividirConta(MESA, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('R$ 30 + R$ 50 + R$ 20 somam R$ 100, e 10% levam a R$ 110', () => {
    expect(v.somaDosConsumos).toBe(10_000)
    expect(v.gorjeta).toBe(1_000)
    expect(v.total).toBe(11_000)
  })

  it('a gorjeta segue a proporção do consumo', () => {
    expect(v.partes.map((p) => p.gorjeta)).toEqual([300, 500, 200])
  })

  it('linha em branco não vira pessoa', () => {
    const comVazias = dividirConta({ ...MESA, consumos: [[3_000], [0], [5_000], [0], [2_000]] }, REF)
    if (!comVazias.ok) throw new Error('esperado sucesso')
    expect(comVazias.valores.pessoas).toBe(3)
    expect(comVazias.valores.total).toBe(11_000)
  })

  /**
   * A propriedade central: um centavo faltando numa conta de restaurante é
   * exatamente o que alguém confere. Vale com valores que NÃO dividem exato.
   */
  it('a soma das partes fecha com o total, mesmo com divisão inexata', () => {
    const casos = [
      { consumos: [[3_333], [3_333], [3_334]], compartilhado: centavos(1_000) },
      { consumos: [[1_00], [7]], compartilhado: centavos(101) },
      { consumos: [[9_999], [1]], compartilhado: centavos(7) },
      { consumos: [[5_000], [5_000], [5_000], [5_000], [5_000], [5_000], [5_000]], compartilhado: centavos(100) },
    ]
    for (const caso of casos) {
      for (const gorjeta of [0, 1_000, 1_337]) {
        const r2 = dividirConta({ ...caso, gorjetaBp: basisPoints(gorjeta) }, REF)
        if (!r2.ok) throw new Error('esperado sucesso')
        const soma = r2.valores.partes.reduce((t, p) => t + p.total, 0)
        expect(soma, `${JSON.stringify(caso)} com ${gorjeta}`).toBe(r2.valores.total)
      }
    }
  })

  it('o compartilhado divide igual, e a sobra fica com a última', () => {
    const r2 = dividirConta(
      { consumos: [[1_000], [1_000], [1_000]], compartilhado: centavos(100), gorjetaBp: basisPoints(0) },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    // R$ 1,00 ÷ 3 = 33 centavos, com 1 centavo de sobra.
    expect(r2.valores.partes.map((p) => p.rateio)).toEqual([33, 33, 34])
  })

  it('lista vazia mantém o estado pendente', () => {
    expect(dividirConta({ ...MESA, consumos: [] }, REF).ok).toBe(false)
    expect(dividirConta({ ...MESA, consumos: [[0], [0]] }, REF).ok).toBe(false)
  })

  it('sem gorjeta e sem compartilhado, a memória não inventa etapa', () => {
    const seco = dividirConta({ ...MESA, gorjetaBp: basisPoints(0) }, REF)
    if (!seco.ok) throw new Error('esperado sucesso')
    expect(seco.valores.total).toBe(10_000)
    expect(seco.traco.etapas.some((e) => e.rotulo === 'Gorjeta')).toBe(false)
    expect(seco.traco.etapas.some((e) => e.rotulo.includes('de todos'))).toBe(false)
  })

  it('uma pessoa só não vira "1 pessoas" na memória', () => {
    const sozinho = dividirConta({ ...MESA, consumos: [[5_000]] }, REF)
    if (!sozinho.ok) throw new Error('esperado sucesso')
    expect(sozinho.traco.etapas[0]?.rotulo).toContain('1 pessoa consumiu')
  })

  it('a definição publicada fecha a coluna do resultado', () => {
    const r2 = calcularDivisaoDef(
      { consumos: '3000;5000;2000', compartilhado: 0, gorjeta: 1_000 },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    const linhas = r2.valores.detalhamento
    const total = linhas[linhas.length - 1]
    const parcelas = linhas.slice(0, -1).reduce((t, l) => t + l.valor, 0)
    expect(parcelas).toBe(total?.valor)
    expect(r2.valores.principal).toBe(11_000)
  })
})

// ---------------------------------------------------------------------------
// CALC-075 — Média ponderada
// ---------------------------------------------------------------------------

const BOLETIM = {
  notas: [
    [800, 100],
    [600, 300],
  ],
  mediaDesejada: 0,
  pesoRestante: 0,
}

describe('CALC-075 · a média com pesos', () => {
  const r = calcularMediaPonderada(BOLETIM, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('8,00 com peso 1 e 6,00 com peso 3 dão 6,50', () => {
    // (800×1 + 600×3) ÷ 4 = 2.600 ÷ 4 = 650
    expect(v.mediaPonderada).toBe(650)
    expect(v.somaDosPesos).toBe(400)
  })

  it('a média simples ignora os pesos, e por isso difere', () => {
    expect(v.mediaSimples).toBe(700)
  })

  it('com pesos iguais as duas coincidem', () => {
    const iguais = calcularMediaPonderada(
      { ...BOLETIM, notas: [[800, 100], [600, 100], [1_000, 100]] },
      REF,
    )
    if (!iguais.ok) throw new Error('esperado sucesso')
    expect(iguais.valores.mediaPonderada).toBe(iguais.valores.mediaSimples)
  })

  it('avaliação com peso zero não entra — é o que ainda não aconteceu', () => {
    const comPendente = calcularMediaPonderada(
      { ...BOLETIM, notas: [[800, 100], [600, 300], [0, 0]] },
      REF,
    )
    if (!comPendente.ok) throw new Error('esperado sucesso')
    expect(comPendente.valores.avaliacoes).toBe(2)
    expect(comPendente.valores.mediaPonderada).toBe(650)
  })

  /**
   * A propriedade que justifica o arredondamento para cima: tirar exatamente a
   * nota devolvida tem de deixar a média NO valor pedido ou acima dele.
   */
  it('a nota necessária nunca deixa a média abaixo da desejada', () => {
    for (const desejada of [700, 750, 733, 601]) {
      for (const pesoRestante of [100, 200, 300, 700]) {
        const alvo = calcularMediaPonderada({ ...BOLETIM, mediaDesejada: desejada, pesoRestante }, REF)
        if (!alvo.ok) throw new Error('esperado sucesso')
        const necessaria = alvo.valores.notaNecessaria ?? 0
        const produto = 800 * 100 + 600 * 300 + necessaria * pesoRestante
        const mediaFinal = produto / (400 + pesoRestante)
        expect(mediaFinal, `${desejada} com peso ${pesoRestante}`).toBeGreaterThanOrEqual(desejada)
      }
    }
  })

  it('sem peso restante não há pergunta a responder', () => {
    const semFalta = calcularMediaPonderada({ ...BOLETIM, mediaDesejada: 700 }, REF)
    if (!semFalta.ok) throw new Error('esperado sucesso')
    expect(semFalta.valores.notaNecessaria).toBeNull()
  })

  it('média fora de alcance é sinalizada em vez de escondida', () => {
    const impossivel = calcularMediaPonderada(
      { ...BOLETIM, mediaDesejada: 950, pesoRestante: 100 },
      REF,
    )
    if (!impossivel.ok) throw new Error('esperado sucesso')
    expect(impossivel.valores.inalcancavel).toBe(true)
  })

  /**
   * Quem já passou da média pedida não precisa de nota nenhuma — e a resposta
   * correta é zero, não um número negativo com cara de defeito.
   */
  it('média já alcançada devolve zero, não negativo', () => {
    const folgado = calcularMediaPonderada(
      { notas: [[1_000, 100]], mediaDesejada: 500, pesoRestante: 100 },
      REF,
    )
    if (!folgado.ok) throw new Error('esperado sucesso')
    expect(folgado.valores.notaNecessaria).toBe(0)
    expect(folgado.valores.inalcancavel).toBe(false)
  })

  it('média desejada sem peso restante não produz etapa', () => {
    const semFalta = calcularMediaPonderada({ ...BOLETIM, mediaDesejada: 700 }, REF)
    if (!semFalta.ok) throw new Error('esperado sucesso')
    expect(semFalta.traco.etapas.some((e) => e.rotulo.includes('necessária'))).toBe(false)
  })

  it('a definição publicada mostra a nota necessária quando ela existe', () => {
    const r2 = calcularMediaDef(
      { notas: '800,100;600,300', mediaDesejada: 700, pesoRestante: 200 },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    expect(r2.valores.destaques?.some((d) => d.rotulo.includes('Nota necessária'))).toBe(true)
  })

  it('lista sem peso mantém o estado pendente', () => {
    expect(calcularMediaPonderada({ ...BOLETIM, notas: [] }, REF).ok).toBe(false)
    expect(calcularMediaPonderada({ ...BOLETIM, notas: [[800, 0]] }, REF).ok).toBe(false)
  })

  it('a definição publicada lê a lista da tela', () => {
    const r2 = calcularMediaDef(
      { notas: '800,100;600,300', mediaDesejada: 0, pesoRestante: 0 },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    expect(r2.valores.principal).toBe(650)
    expect(r2.valores.unidade).toBe('numero')
    expect(r2.valores.detalhamento).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// CALC-028 — Plano de quitação
// ---------------------------------------------------------------------------

/**
 * Duas dívidas de saldos diferentes: a de MAIOR taxa é a de MAIOR saldo. É o
 * caso em que as duas estratégias divergem — avalanche ataca a de 12% ao mês,
 * bola de neve ataca a de R$ 1.000,00.
 */
const DIVIDAS = {
  dividas: [
    [500_000, 1_200, 25_000],
    [100_000, 300, 10_000],
  ],
  extraMensal: centavos(50_000),
}

describe('CALC-028 · as duas estratégias', () => {
  const r = calcularPlanoDeQuitacao(DIVIDAS, REF)
  if (!r.ok) throw new Error('esperado sucesso')
  const v = r.valores

  it('o saldo e os mínimos somam o que foi informado', () => {
    expect(v.saldoTotal).toBe(600_000)
    expect(v.parcelasMinimas).toBe(35_000)
    expect(v.desembolsoMensal).toBe(85_000)
  })

  /**
   * A propriedade central: as duas gastam o MESMO por mês. Se o desembolso
   * divergisse, a comparação estaria medindo a carteira em vez da ordem.
   */
  it('a avalanche nunca custa mais que a bola de neve', () => {
    const casos = [
      DIVIDAS,
      { dividas: [[200_000, 1_500, 5_000], [800_000, 200, 20_000]], extraMensal: centavos(30_000) },
      { dividas: [[300_000, 900, 15_000], [300_000, 400, 15_000], [50_000, 1_400, 5_000]], extraMensal: centavos(20_000) },
    ]
    for (const caso of casos) {
      const r2 = calcularPlanoDeQuitacao(caso, REF)
      if (!r2.ok) throw new Error('esperado sucesso')
      expect(r2.valores.avalanche.totalPago).toBeLessThanOrEqual(r2.valores.bolaDeNeve.totalPago)
      expect(r2.valores.economiaDaAvalanche).toBeGreaterThanOrEqual(0)
    }
  })

  it('as duas quitam tudo, e o total pago cobre saldo mais juros', () => {
    expect(v.avalanche.quitou).toBe(true)
    expect(v.bolaDeNeve.quitou).toBe(true)
    expect(v.avalanche.totalPago).toBe(v.saldoTotal + v.avalanche.jurosPagos)
    expect(v.bolaDeNeve.totalPago).toBe(v.saldoTotal + v.bolaDeNeve.jurosPagos)
  })

  it('com uma dívida só, as duas dão exatamente no mesmo', () => {
    const uma = calcularPlanoDeQuitacao(
      { dividas: [[300_000, 800, 20_000]], extraMensal: centavos(10_000) },
      REF,
    )
    if (!uma.ok) throw new Error('esperado sucesso')
    expect(uma.valores.economiaDaAvalanche).toBe(0)
    expect(uma.valores.mesesDeDiferenca).toBe(0)
  })

  it('sobra maior encurta o plano', () => {
    const rapido = calcularPlanoDeQuitacao({ ...DIVIDAS, extraMensal: centavos(200_000) }, REF)
    if (!rapido.ok) throw new Error('esperado sucesso')
    expect(rapido.valores.avalanche.meses).toBeLessThan(v.avalanche.meses)
    expect(rapido.valores.avalanche.jurosPagos).toBeLessThan(v.avalanche.jurosPagos)
  })

  /**
   * O caso que a página precisa recusar em vez de responder: com pagamento
   * abaixo dos juros, o saldo nunca chega a zero.
   */
  it('pagamento que não cobre os juros vira erro, não número', () => {
    const impossivel = calcularPlanoDeQuitacao(
      { dividas: [[1_000_000, 1_500, 100]], extraMensal: centavos(0) },
      REF,
    )
    expect(impossivel.ok).toBe(false)
  })

  it('linha em branco não vira dívida', () => {
    const comVazias = calcularPlanoDeQuitacao(
      { ...DIVIDAS, dividas: [[500_000, 1_200, 25_000], [0, 0, 0], [100_000, 300, 10_000]] },
      REF,
    )
    if (!comVazias.ok) throw new Error('esperado sucesso')
    expect(comVazias.valores.saldoTotal).toBe(600_000)
  })

  it('lista vazia mantém o estado pendente', () => {
    expect(calcularPlanoDeQuitacao({ ...DIVIDAS, dividas: [] }, REF).ok).toBe(false)
  })

  it('dívida sem nenhum pagamento mensal mantém o estado pendente', () => {
    const semPagar = calcularPlanoDeQuitacao(
      { dividas: [[300_000, 800, 0]], extraMensal: centavos(0) },
      REF,
    )
    expect(semPagar.ok).toBe(false)
  })

  it('uma dívida só não vira "1 dívidas" na memória', () => {
    const uma = calcularPlanoDeQuitacao(
      { dividas: [[300_000, 800, 20_000]], extraMensal: centavos(10_000) },
      REF,
    )
    if (!uma.ok) throw new Error('esperado sucesso')
    expect(uma.traco.etapas[0]?.rotulo).toContain('1 dívida')
    expect(uma.traco.etapas[0]?.rotulo).not.toContain('dívidas')
  })

  /**
   * Sem juros a conta é divisão pura, e serve de âncora: R$ 6.000,00 com
   * R$ 850,00 por mês são sete meses e nenhum juro.
   */
  it('sem juros, o plano é o saldo dividido pelo desembolso', () => {
    const semJuros = calcularPlanoDeQuitacao(
      { dividas: [[500_000, 0, 25_000], [100_000, 0, 10_000]], extraMensal: centavos(50_000) },
      REF,
    )
    if (!semJuros.ok) throw new Error('esperado sucesso')
    expect(semJuros.valores.avalanche.jurosPagos).toBe(0)
    expect(semJuros.valores.avalanche.totalPago).toBe(600_000)
    expect(semJuros.valores.avalanche.meses).toBe(Math.ceil(600_000 / 85_000))
    expect(semJuros.valores.economiaDaAvalanche).toBe(0)
  })

  it('a definição publicada fecha a coluna do resultado', () => {
    const r2 = calcularQuitacaoDef(
      { dividas: '500000,1200,25000;100000,300,10000', extraMensal: 50_000 },
      REF,
    )
    if (!r2.ok) throw new Error('esperado sucesso')
    const [saldo, juros, total] = r2.valores.detalhamento
    expect((saldo?.valor ?? 0) + (juros?.valor ?? 0)).toBe(total?.valor)
    expect(r2.valores.principal).toBe(total?.valor)
  })
})
