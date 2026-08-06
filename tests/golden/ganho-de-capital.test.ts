/**
 * Casos-ouro de CALC-020 — ganho de capital na venda de imóvel.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Textos do Planalto, lidos em 06/08/2026:
 *
 *   Lei nº 8.981/1995, art. 21, com a redação da Lei nº 13.259, de 2016 — 15%
 *   até R$ 5 milhões; 17,5% de 5 a 10; 20% de 10 a 30; 22,5% acima de 30. O
 *   texto diz "sobre a parcela dos ganhos que…", logo é progressiva por faixa.
 *
 *   Lei nº 9.250/1995, art. 23 — isento o ganho na alienação "do único imóvel
 *   que o titular possua, cujo valor de alienação seja de até R$ 440.000,00
 *   [...] desde que não tenha sido realizada qualquer outra alienação nos
 *   últimos cinco anos".
 *
 *   Lei nº 11.196/2005, art. 39 — isenção por reinvestimento em 180 dias, com
 *   tributação proporcional à parcela não aplicada (§ 2º).
 *
 *   Lei nº 11.196/2005, art. 40 — FR1 = 1/1,0060^m1 e FR2 = 1/1,0035^m2. A lei
 *   foi publicada no DOU de 22/11/2005; o § 2º manda contar o FR1 a partir de
 *   1º/01/1996 para imóveis adquiridos até 31/12/1995.
 *
 * Os fatores conferem à mão com uma calculadora científica:
 *
 *   1 / 1,0060^70  = 0,6578      1 / 1,0035^246 = 0,4233
 *   1 / 1,0060^118 = 0,4936
 *
 * As propriedades que estes casos travam:
 *
 *   1. **O § 2º do art. 40** — imóvel anterior a 1996 conta m1 a partir de
 *      1996, e não da compra. É o detalhe que mais muda a base de imóvel antigo.
 *   2. **A tabela é progressiva por faixa**, não alíquota única.
 *   3. **A isenção do imóvel único exige as TRÊS condições.**
 *   4. **A isenção por reinvestimento é proporcional.**
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDef } from '../../src/lib/calculadoras/ganho-de-capital'
import { calcularGanhoDeCapital } from '../../src/lib/engine/calculadoras/ganho-de-capital'
import { centavos } from '../../src/lib/engine/types'
import { GANHO_DE_CAPITAL } from '../../src/lib/params/data/ganho-de-capital'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(GANHO_DE_CAPITAL)
const REF = '2026-06-15' as DataISO

const BASE = {
  valorDeVenda: centavos(100_000_000),
  custoDeAquisicao: centavos(20_000_000),
  dataDeAquisicao: '2000-01-15' as DataISO,
  dataDaVenda: '2026-06-10' as DataISO,
  imovelUnicoSemAlienacaoRecente: false,
  reinvestido: centavos(0),
}

function calc(over: Partial<typeof BASE> = {}, ref = REF) {
  const r = calcularGanhoDeCapital({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-020 · os fatores de redução', () => {
  it('conta m1 até novembro de 2005 e m2 de dezembro de 2005 até a venda', () => {
    const v = calc()
    // jan/2000 a nov/2005 = 70 meses; dez/2005 a jun/2026 = 246 meses.
    expect(v.meses1).toBe(70)
    expect(v.meses2).toBe(246)
  })

  /**
   * **A base é conferida ao centavo; o fator EXIBIDO, à resolução dele.**
   *
   * Os dois fatores são aplicados em inteiro grande, e só depois convertidos
   * para basis points para aparecer na tela. Cobrar do número exibido uma
   * precisão maior que 0,0001 seria cobrar do rótulo o que só a conta tem — e
   * foi essa distinção que fez a primeira versão do motor ser refeita: ela
   * convertia ANTES de aplicar, e isso custava mais de cem reais de base num
   * ganho de oitocentos mil.
   */
  it('a base reduzida bate com a conta de referência, ao centavo', () => {
    const v = calc()
    const esperado = Math.round((800_000_00 / 1.006 ** 70) / 1.0035 ** 246)
    expect(Math.abs(v.ganhoReduzido - esperado)).toBeLessThanOrEqual(2)
  })

  it('os fatores exibidos batem na resolução de basis points', () => {
    const v = calc()
    expect(v.fr1Bp / 10_000).toBeCloseTo(1 / 1.006 ** 70, 3)
    expect(v.fr2Bp / 10_000).toBeCloseTo(1 / 1.0035 ** 246, 3)
  })

  /**
   * O § 2º do art. 40, e o detalhe que mais muda a base de imóvel antigo: para
   * quem comprou antes de 1996, m1 conta de janeiro de 1996, não da compra.
   */
  it('imóvel anterior a 1996 conta m1 a partir de 1996', () => {
    const v = calc({ dataDeAquisicao: '1990-01-01' as DataISO })
    // jan/1996 a nov/2005 = 118 meses, e não os 190 desde 1990.
    expect(v.meses1).toBe(118)
    expect(v.fr1Bp / 10_000).toBeCloseTo(1 / 1.006 ** 118, 3)
  })

  it('imóvel comprado depois de novembro de 2005 não tem FR1', () => {
    const v = calc({ dataDeAquisicao: '2010-05-01' as DataISO })
    expect(v.meses1).toBe(0)
    expect(v.fr1Bp).toBe(10_000)
    // mai/2010 a jun/2026 = 193 meses.
    expect(v.meses2).toBe(193)
  })

  it('quanto mais antigo o imóvel, menor a base e menor o imposto', () => {
    const antigo = calc({ dataDeAquisicao: '1990-01-01' as DataISO })
    const meio = calc({ dataDeAquisicao: '2000-01-15' as DataISO })
    const novo = calc({ dataDeAquisicao: '2024-01-01' as DataISO })
    expect(antigo.baseTributavel).toBeLessThan(meio.baseTributavel)
    expect(meio.baseTributavel).toBeLessThan(novo.baseTributavel)
    expect(antigo.imposto).toBeLessThan(novo.imposto)
  })

  /**
   * A afirmação que a página faz sobre o mundo: ignorar os fatores produz um
   * imposto muito maior. Aqui a diferença é medida.
   */
  it('ignorar os fatores mais que dobraria o imposto de um imóvel dos anos 1990', () => {
    const v = calc({ dataDeAquisicao: '1990-01-01' as DataISO })
    const semFatores = Math.round(v.ganhoBruto * 0.15)
    expect(semFatores).toBeGreaterThan(v.imposto * 2)
  })
})

describe('CALC-020 · a tabela é progressiva por faixa', () => {
  /**
   * Ganho recente e grande, para o FR2 quase não reduzir e as faixas
   * aparecerem.
   */
  const recente = { dataDeAquisicao: '2026-01-01' as DataISO, dataDaVenda: '2026-06-10' as DataISO }

  it('ganho dentro da primeira faixa paga 15%', () => {
    const v = calc({
      ...recente,
      valorDeVenda: centavos(400_000_000_00),
      custoDeAquisicao: centavos(300_000_000_00),
    })
    expect(v.aliquotaEfetivaBp).toBeGreaterThan(1_400)
    expect(v.aliquotaEfetivaBp).toBeLessThanOrEqual(1_500)
  })

  /**
   * A propriedade central: a alíquota EFETIVA fica entre a da primeira faixa e
   * a da faixa alcançada — nunca igual à da faixa alcançada sobre tudo.
   */
  it('ganho acima de R$ 5 milhões tem efetiva entre 15% e 17,5%', () => {
    const v = calc({
      ...recente,
      valorDeVenda: centavos(900_000_000_00),
      custoDeAquisicao: centavos(100_000_000_00),
    })
    expect(v.baseTributavel).toBeGreaterThan(500_000_000_00)
    expect(v.aliquotaEfetivaBp).toBeGreaterThan(1_500)
    expect(v.aliquotaEfetivaBp).toBeLessThan(1_750)
  })

  it('a alíquota efetiva sobe com o ganho, sem saltos', () => {
    const efetivas = [1_000_000_00, 600_000_000_00, 2_000_000_000_00].map((venda) => {
      const v = calc({ ...recente, valorDeVenda: centavos(venda), custoDeAquisicao: centavos(0) })
      return v.aliquotaEfetivaBp
    })
    for (let i = 1; i < efetivas.length; i += 1) {
      expect(efetivas[i] ?? 0).toBeGreaterThan(efetivas[i - 1] ?? 0)
    }
  })
})

describe('CALC-020 · as isenções', () => {
  it('o imóvel único isenta quando as três condições valem', () => {
    const v = calc({
      valorDeVenda: centavos(40_000_000),
      custoDeAquisicao: centavos(20_000_000),
      imovelUnicoSemAlienacaoRecente: true,
    })
    expect(v.isentoPorImovelUnico).toBe(true)
    expect(v.imposto).toBe(0)
    expect(v.liquidoDaVenda).toBe(40_000_000)
  })

  it('acima do teto de R$ 440.000 não isenta, mesmo sendo único', () => {
    const v = calc({
      valorDeVenda: centavos(50_000_000),
      custoDeAquisicao: centavos(20_000_000),
      imovelUnicoSemAlienacaoRecente: true,
    })
    expect(v.isentoPorImovelUnico).toBe(false)
    expect(v.imposto).toBeGreaterThan(0)
  })

  it('sem a declaração do usuário, não isenta nem abaixo do teto', () => {
    const v = calc({
      valorDeVenda: centavos(40_000_000),
      custoDeAquisicao: centavos(20_000_000),
      imovelUnicoSemAlienacaoRecente: false,
    })
    expect(v.isentoPorImovelUnico).toBe(false)
  })

  /**
   * O § 2º do art. 39: aplicação parcial tributa proporcionalmente à parcela
   * não aplicada.
   */
  it('o reinvestimento total zera o imposto', () => {
    const v = calc({ reinvestido: centavos(100_000_000) })
    expect(v.baseTributavel).toBe(0)
    expect(v.imposto).toBe(0)
  })

  it('o reinvestimento parcial isenta na mesma proporção', () => {
    const semReinvestir = calc()
    const metade = calc({ reinvestido: centavos(50_000_000) })
    expect(metade.parcelaIsentaPorReinvestimento).toBe(
      Math.round(semReinvestir.ganhoReduzido / 2),
    )
    expect(metade.baseTributavel).toBe(
      semReinvestir.baseTributavel - metade.parcelaIsentaPorReinvestimento,
    )
  })

  it('reinvestir mais que o valor da venda não isenta além do total', () => {
    const v = calc({ reinvestido: centavos(500_000_000) })
    expect(v.baseTributavel).toBe(0)
    expect(v.imposto).toBe(0)
  })
})

describe('CALC-020 · o que a calculadora recusa e o que declara', () => {
  it('venda com prejuízo não gera imposto', () => {
    const v = calc({ custoDeAquisicao: centavos(150_000_000) })
    expect(v.ganhoBruto).toBe(0)
    expect(v.imposto).toBe(0)
    expect(v.liquidoDaVenda).toBe(100_000_000)
  })

  it('venda antes da aquisição é recusada', () => {
    const r = calcularGanhoDeCapital(
      { ...BASE, dataDeAquisicao: '2026-06-10' as DataISO, dataDaVenda: '2020-01-01' as DataISO },
      REF,
      registro,
    )
    expect(r.ok).toBe(false)
  })

  it('data ausente mantém o estado pendente', () => {
    expect(
      calcularGanhoDeCapital({ ...BASE, dataDaVenda: '' as DataISO }, REF, registro).ok,
    ).toBe(false)
    expect(
      calcularGanhoDeCapital({ ...BASE, valorDeVenda: centavos(0) }, REF, registro).ok,
    ).toBe(false)
  })

  /**
   * A redução do art. 18 da Lei nº 7.713/1988 não é aplicada, e não aplicá-la
   * erra para MAIS. A página precisa declarar isso.
   */
  it('aquisição anterior a 1989 é sinalizada', () => {
    expect(calc({ dataDeAquisicao: '1985-01-01' as DataISO }).temReducaoNaoAplicada).toBe(true)
    expect(calc({ dataDeAquisicao: '1990-01-01' as DataISO }).temReducaoNaoAplicada).toBe(false)
  })

  it('a memória cita a lei em cada etapa com parâmetro', () => {
    const r = calcularGanhoDeCapital(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const comParametro = r.traco.etapas.filter((e) => e.parametro !== undefined)
    expect(comParametro.length).toBeGreaterThanOrEqual(3)
    expect(comParametro.every((e) => e.parametro?.url.includes('planalto.gov.br'))).toBe(true)
  })
})

describe('CALC-020 · a definição publicada', () => {
  it('a coluna do resultado fecha com o valor da venda', () => {
    const r = calcularDef(
      {
        valorDeVenda: 100_000_000,
        custoDeAquisicao: 20_000_000,
        dataDeAquisicao: '2000-01-15',
        dataDaVenda: '2026-06-10',
      },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const [venda, imposto, sobra] = r.valores.detalhamento
    expect((venda?.valor ?? 0) - (imposto?.valor ?? 0)).toBe(sobra?.valor)
    expect(r.valores.principal).toBe(imposto?.valor)
  })

  it('o aviso da redução não aplicada aparece só para imóvel anterior a 1989', () => {
    const antigo = calcularDef(
      {
        valorDeVenda: 100_000_000,
        custoDeAquisicao: 20_000_000,
        dataDeAquisicao: '1985-01-01',
        dataDaVenda: '2026-06-10',
      },
      REF,
    )
    if (!antigo.ok) throw new Error('esperado sucesso')
    expect((antigo.valores.notas ?? []).some((n) => n.includes('antes de 1989'))).toBe(true)

    const novo = calcularDef(
      {
        valorDeVenda: 100_000_000,
        custoDeAquisicao: 20_000_000,
        dataDeAquisicao: '2000-01-15',
        dataDaVenda: '2026-06-10',
      },
      REF,
    )
    if (!novo.ok) throw new Error('esperado sucesso')
    expect((novo.valores.notas ?? []).some((n) => n.includes('antes de 1989'))).toBe(false)
  })

  it('a isenção do imóvel único troca os destaques', () => {
    const r = calcularDef(
      {
        valorDeVenda: 40_000_000,
        custoDeAquisicao: 20_000_000,
        dataDeAquisicao: '2000-01-15',
        dataDaVenda: '2026-06-10',
        imovelUnico: 'sim',
      },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(0)
    expect((r.valores.destaques ?? []).some((d) => d.valor.includes('Isento'))).toBe(true)
  })
})
