/**
 * Casos-ouro de CALC-060 — correção de valor por índice.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * **A série usada aqui é sintética, e isso é decisão.** Os índices reais mudam a
 * cada coleta, e um caso-ouro que dependesse deles falharia sozinho todo mês —
 * o que ensina a ignorar vermelho. A série de teste tem meses de 1% exatos, e o
 * que se confere é a mecânica: a janela aplicada, a composição em vez da soma, e
 * as recusas.
 *
 * A ligação com o dado real é feita à parte, em `tests/unit/series.test.ts`, que
 * cobra os invariantes do cache versionado sem fixar valor nenhum.
 *
 * O caso mais importante do arquivo é o da **janela**: corrigir de janeiro para
 * março aplica dois meses, não três. Errar isso produz um número plausível e
 * errado em todo intervalo.
 */

import { describe, expect, it } from 'vitest'

import { calcular } from '../../src/lib/calculadoras/correcao-por-indice'
import {
  corrigirPorIndice,
  type EntradaCorrecao,
} from '../../src/lib/engine/calculadoras/indices'
import { centavos } from '../../src/lib/engine/types'
import type { DataISO } from '../../src/lib/params/tipos'

const REF = '2026-06-15' as DataISO

/** Doze meses de 1% exato, a partir de janeiro de 2020. */
const UM_PORCENTO_AO_MES = {
  inicio: '2020-01',
  valores: Array.from({ length: 12 }, () => 10_000),
}

const BASE: EntradaCorrecao = {
  valorOriginal: centavos(100_000),
  de: '2020-01',
  ate: '2020-03',
  serie: UM_PORCENTO_AO_MES,
  nomeDoIndice: 'Índice de teste',
}

function corrigirOuFalhar(entrada: EntradaCorrecao) {
  const r = corrigirPorIndice(entrada, REF)
  if (!r.ok) throw new Error(`esperado sucesso, veio ${r.motivo}: ${r.detalhe}`)
  return r
}

// ---------------------------------------------------------------------------
// A janela — o caso que decide se a conta está certa
// ---------------------------------------------------------------------------

describe('CALC-060 · o índice do mês inicial não entra', () => {
  const v = corrigirOuFalhar(BASE).valores

  it('de janeiro a março são DOIS meses, não três', () => {
    expect(v.mesesAplicados).toBe(2)
    expect(v.primeiroMesAplicado).toBe('2020-02')
    expect(v.ultimoMesAplicado).toBe('2020-03')
  })

  it('dois meses de 1% dão 2,01%, e R$ 1.000,00 viram R$ 1.020,10', () => {
    expect(v.variacaoBp).toBe(201)
    expect(v.valorCorrigido).toBe(102_010)
    expect(v.correcao).toBe(2_010)
  })

  it('um único mês aplica um único índice', () => {
    const um = corrigirOuFalhar({ ...BASE, ate: '2020-02' }).valores
    expect(um.mesesAplicados).toBe(1)
    expect(um.valorCorrigido).toBe(101_000)
  })

  it('mês inicial igual ao final não corrige nada', () => {
    const nenhum = corrigirOuFalhar({ ...BASE, ate: '2020-01' }).valores
    expect(nenhum.mesesAplicados).toBe(0)
    expect(nenhum.valorCorrigido).toBe(BASE.valorOriginal)
    expect(nenhum.variacaoBp).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Composição, e não soma
// ---------------------------------------------------------------------------

/**
 * A afirmação que a página faz sobre o mundo, e por isso a que precisa de
 * teste: doze meses de 1% não dão 12%.
 */
describe('CALC-060 · índices se multiplicam', () => {
  const v = corrigirOuFalhar({ ...BASE, ate: '2020-12' }).valores

  it('onze meses de 1% acumulam mais que 11%', () => {
    expect(v.mesesAplicados).toBe(11)
    // 1,01^11 − 1 = 11,567%
    expect(v.variacaoBp).toBe(1_156)
    expect(v.variacaoBp).toBeGreaterThan(11 * 100)
  })

  it('a diferença para a soma cresce com o prazo', () => {
    const curto = corrigirOuFalhar({ ...BASE, ate: '2020-03' }).valores
    const excessoCurto = curto.variacaoBp - curto.mesesAplicados * 100
    const excessoLongo = v.variacaoBp - v.mesesAplicados * 100
    expect(excessoLongo).toBeGreaterThan(excessoCurto)
  })

  it('a etapa do acumulado sai em percentual, não em reais', () => {
    const etapa = corrigirOuFalhar(BASE).traco.etapas.find((e) =>
      e.rotulo.startsWith('Índices aplicados'),
    )
    expect(etapa?.unidade).toBe('percentual')
    expect(etapa?.resultado).toBe(201)
  })
})

describe('CALC-060 · índice negativo devolve valor menor', () => {
  /** Deflação existe, e o IGP-M produz meses negativos com frequência. */
  const deflacao = {
    inicio: '2020-01',
    valores: [0, -10_000, -10_000],
  }

  it('dois meses de −1% derrubam o valor', () => {
    const v = corrigirOuFalhar({ ...BASE, serie: deflacao }).valores
    expect(v.variacaoBp).toBeLessThan(0)
    expect(v.valorCorrigido).toBeLessThan(BASE.valorOriginal)
    expect(v.correcao).toBeLessThan(0)
  })
})

// ---------------------------------------------------------------------------
// As recusas
// ---------------------------------------------------------------------------

describe('CALC-060 · o que a calculadora recusa, e por quê', () => {
  it('mês final anterior ao inicial é inconsistência temporal', () => {
    const r = corrigirPorIndice({ ...BASE, de: '2020-05', ate: '2020-02' }, REF)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.motivo).toBe('inconsistencia_temporal')
  })

  /**
   * O caso que a defasagem de publicação cria todo mês: o usuário quer corrigir
   * até o mês corrente, e o índice dele ainda não saiu. A mensagem precisa
   * dizer QUAL é o último mês publicado — sem isso o usuário não sabe o que
   * escolher.
   */
  it('mês além do publicado é recusado, dizendo qual é o último', () => {
    const r = corrigirPorIndice({ ...BASE, ate: '2021-06' }, REF)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.detalhe).toContain('2020-12')
    expect(r.detalhe).toContain('defasagem')
  })

  it('mês anterior ao início da série é recusado, dizendo onde ela começa', () => {
    const r = corrigirPorIndice({ ...BASE, de: '2019-01', ate: '2020-03' }, REF)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.detalhe).toContain('2020-01')
  })

  it('valor ausente mantém o estado pendente', () => {
    expect(corrigirPorIndice({ ...BASE, valorOriginal: centavos(0) }, REF).ok).toBe(false)
  })

  it('data incompleta mantém o estado pendente, sem lançar', () => {
    expect(corrigirPorIndice({ ...BASE, de: '', ate: '' }, REF).ok).toBe(false)
  })

  /**
   * `ADR-006` prevê o cenário de primeira execução sem cache. Aqui ele vira
   * recusa explicada, e nunca uma tela quebrada.
   */
  it('série vazia é recusada com mensagem própria', () => {
    const r = corrigirPorIndice({ ...BASE, serie: { inicio: '', valores: [] } }, REF)
    expect(r.ok).toBe(false)
    if (r.ok) throw new Error('esperado erro')
    expect(r.detalhe).toContain('série disponível')
  })
})

// ---------------------------------------------------------------------------
// A definição, sobre a série REAL
// ---------------------------------------------------------------------------

/**
 * Aqui o dado é o de verdade, e por isso nada de valor é fixado: o que se cobra
 * é que a calculadora publicada funcione com o cache que está no repositório, e
 * que a coluna feche.
 */
describe('CALC-060 · a calculadora publicada, sobre o cache versionado', () => {
  const ENTRADA = {
    valorOriginal: 100_000,
    indice: 'ipca',
    de: '2015-01-01',
    ate: '2020-01-01',
  }

  it('calcula com a série que está no repositório', () => {
    const r = calcular(ENTRADA, REF)
    if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
    expect(r.valores.principal).toBeGreaterThan(100_000)
  })

  it('o valor original mais a correção é o valor corrigido', () => {
    const r = calcular(ENTRADA, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const [original, correcao, corrigido] = r.valores.detalhamento
    expect((original?.valor ?? 0) + (correcao?.valor ?? 0)).toBe(corrigido?.valor)
    expect(r.valores.principal).toBe(corrigido?.valor)
  })

  it('os três índices disponíveis calculam', () => {
    for (const indice of ['ipca', 'inpc', 'igpm']) {
      const r = calcular({ ...ENTRADA, indice }, REF)
      expect(r.ok, indice).toBe(true)
    }
  })

  /**
   * Selic e TR estão declaradas como indisponíveis no campo. Se um dia entrarem,
   * este teste passa a falhar — que é o comportamento desejado: quem as
   * habilitar precisa decidir a convenção de série diária para mensal no mesmo
   * commit.
   */
  it('índice ainda não coberto cai no padrão em vez de quebrar', () => {
    const r = calcular({ ...ENTRADA, indice: 'selic' }, REF)
    expect(r.ok).toBe(true)
  })
})
