/**
 * CALC-017 · CALC-019 — ajuste anual do ano-calendário de 2026 · CALC-121 — PGBL.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`:
 *
 * - **Tabela anual de 2026** — página "Tributação de 2026" da Receita Federal,
 *   conferida em 19/09/2026 (faixas, parcelas, dependente, instrução e o limite
 *   de R$ 17.640,00 do simplificado);
 * - **Redução anual** — Lei nº 9.250/1995, art. 11-A, incluído pela Lei nº
 *   15.270/2025, texto do Planalto conferido em 19/09/2026, e a mesma tabela na
 *   página da Receita;
 * - **PGBL** — Lei nº 9.532/1997, art. 11 (12% dos rendimentos, com a condição
 *   do regime), texto do Planalto conferido em 19/09/2026.
 *
 * **Não há exemplo oficial de ajuste anual com a redução** — a Receita publicou
 * só exemplos mensais. Os valores abaixo são a letra da tabela e do art. 11-A
 * aplicada a lápis e conferida por um cálculo em frações exatas feito à parte,
 * fora do motor. A primeira checagem é interna e forte: com R$ 60.000,00 de
 * rendimentos, o simplificado dá exatamente o teto da redução — R$ 2.694,15 —,
 * que é o que "de modo que o imposto devido seja zero" exige. A tabela e a
 * redução, cadastradas de fontes diferentes, fecham entre si ao centavo.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularEconomiaPgbl,
  calcularIrpfAnual,
  type EntradaIrpfAnual,
} from '../../src/lib/engine/calculadoras/irpf-anual'
import { centavos } from '../../src/lib/engine/types'
import { IRPF_ANUAL } from '../../src/lib/params/data/irpf-anual'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'
import { porSlug } from '../../src/lib/calculadoras'

const EM_2026 = '2026-06-15' as DataISO
const registro = construirRegistro(IRPF_ANUAL)

const entrada = (rendimentos: number, inss = 0, pgbl = 0, regime = true): EntradaIrpfAnual => ({
  rendimentosTributaveis: centavos(rendimentos),
  inss: centavos(inss),
  dependentes: 0,
  instrucao: centavos(0),
  medicas: centavos(0),
  pensao: centavos(0),
  impostoRetido: centavos(0),
  previdenciaPrivada: centavos(pgbl),
  contribuiParaRegime: regime,
})

const apurar = (e: EntradaIrpfAnual, data: DataISO = EM_2026) => {
  const r = calcularIrpfAnual(e, data, registro)
  if (!r.ok) throw new Error(r.detalhe)
  return r.valores
}

describe('ano-calendário 2026 — tabela e redução do art. 11-A', () => {
  /**
   * R$ 60.000,00: simplificado de 20% = R$ 12.000,00; base R$ 48.000,00, na
   * faixa de 22,5%: 10.800,00 − 8.105,85 = R$ 2.694,15 — o teto exato da
   * redução. Imposto final: zero.
   */
  it('R$ 60 mil: a tabela e a redução fecham ao centavo, e o imposto é zero', () => {
    const v = apurar(entrada(6_000_000))
    expect(v.reducaoSimplificado).toBe(269_415)
    expect(v.impostoSimplificado).toBe(0)
    expect(v.impostoDevido).toBe(0)
  })

  /**
   * R$ 50.000,00. Completo sem deduções: 22,5% × 50.000 − 8.105,85 = 3.144,15;
   * menos a redução de 2.694,15 = R$ 450,00. Simplificado: base 40.000,00;
   * 15% − 4.729,91 = 1.270,09, zerado pela redução.
   */
  it('R$ 50 mil: a redução é limitada ao imposto de cada modelo', () => {
    const v = apurar(entrada(5_000_000))
    expect(v.impostoCompleto).toBe(45_000)
    expect(v.reducaoSimplificado).toBe(127_009)
    expect(v.impostoSimplificado).toBe(0)
    expect(v.modeloAdotado).toBe('simplificado')
  })

  /**
   * R$ 70.000,00. Redução: 8.429,73 − 0,095575 × 70.000 = 8.429,73 − 6.690,25
   * = R$ 1.739,48. Simplificado: base 56.000,00; 27,5% − 10.904,66 = 4.495,34;
   * menos a redução = R$ 2.755,86.
   */
  it('R$ 70 mil: a faixa de transição', () => {
    const v = apurar(entrada(7_000_000))
    expect(v.reducaoSimplificado).toBe(173_948)
    expect(v.impostoSimplificado).toBe(275_586)
    expect(v.impostoDevido).toBe(275_586)
  })

  /** R$ 100.000,00: sem redução; simplificado no teto de R$ 17.640,00; base 82.360,00 → R$ 11.744,34. */
  it('R$ 100 mil: sem redução, simplificado no teto novo', () => {
    const v = apurar(entrada(10_000_000))
    expect(v.descontoSimplificado).toBe(1_764_000)
    expect(v.reducaoSimplificado).toBe(0)
    expect(v.impostoSimplificado).toBe(1_174_434)
  })

  /**
   * As fronteiras, pela letra da lei. Em R$ 60.000,01 a fórmula dá R$ 2.695,23 —
   * acima do teto da primeira faixa; em R$ 88.200,00, R$ 0,01; um centavo
   * acima, nada.
   */
  it('as fronteiras da tabela de redução', () => {
    // No completo sem deduções o imposto é maior que a redução, e ela aparece inteira.
    expect(apurar(entrada(6_000_000)).reducaoCompleto).toBe(269_415)
    expect(apurar(entrada(6_000_001)).reducaoCompleto).toBe(269_523)
    expect(apurar(entrada(8_820_000)).reducaoCompleto).toBe(1)
    expect(apurar(entrada(8_820_001)).reducaoCompleto).toBe(0)
  })

  it('2025 continua sem redução — o mecanismo não vigia', () => {
    const v = apurar(entrada(5_000_000), '2025-06-15' as DataISO)
    expect(v.reducaoCompleto).toBe(0)
    expect(v.reducaoSimplificado).toBe(0)
  })
})

describe('PGBL no ajuste anual', () => {
  /**
   * R$ 100.000,00 com R$ 10.000,00 de INSS e R$ 12.000,00 de PGBL (o limite de
   * 12%). Completo: base 78.000,00; 27,5% − 10.904,66 = R$ 10.545,34, contra
   * R$ 11.744,34 do simplificado. O completo passa à frente: economia de R$ 1.199,00.
   */
  it('o limite de 12%, e o completo passando à frente', () => {
    const v = apurar(entrada(10_000_000, 1_000_000, 1_200_000))
    expect(v.previdenciaDedutivel).toBe(1_200_000)
    expect(v.impostoCompleto).toBe(1_054_534)
    expect(v.modeloAdotado).toBe('completo')
  })

  it('o que passa de 12% não deduz', () => {
    expect(apurar(entrada(10_000_000, 1_000_000, 2_000_000)).previdenciaDedutivel).toBe(1_200_000)
  })

  it('sem contribuição ao regime, não deduz', () => {
    expect(apurar(entrada(10_000_000, 1_000_000, 1_200_000, false)).previdenciaDedutivel).toBe(0)
  })

  describe('CALC-121 — a economia', () => {
    const economia = (rendimentos: number, inss: number, pgbl: number) => {
      const r = calcularEconomiaPgbl(
        {
          rendimentosTributaveis: centavos(rendimentos),
          inss: centavos(inss),
          dependentes: 0,
          instrucao: centavos(0),
          medicas: centavos(0),
          pensao: centavos(0),
          previdenciaPrivada: centavos(pgbl),
        },
        EM_2026,
        registro,
      )
      if (!r.ok) throw new Error(r.detalhe)
      return r.valores
    }

    /** R$ 11.744,34 − R$ 10.545,34 = R$ 1.199,00; contribuição zerada simula os 12%. */
    it('R$ 100 mil: R$ 1.199,00, com a contribuição informada ou simulada', () => {
      expect(economia(10_000_000, 1_000_000, 1_200_000).economia).toBe(119_900)
      const simulada = economia(10_000_000, 1_000_000, 0)
      expect(simulada.contribuicao).toBe(1_200_000)
      expect(simulada.economia).toBe(119_900)
    })

    /**
     * R$ 5.000,00 de PGBL: completo com base 85.000,00 dá R$ 12.470,34, ainda
     * acima do simplificado. Economia zero.
     */
    it('contribuição pequena não vence o simplificado: economia zero', () => {
      expect(economia(10_000_000, 1_000_000, 500_000).economia).toBe(0)
    })

    /**
     * R$ 70.000,00, INSS 7.000,00, PGBL 8.400,00: completo, base 54.600,00 →
     * 22,5% − 8.105,85 = 4.179,15, menos a redução de 1.739,48 = 2.439,67;
     * sem o PGBL, o simplificado: 2.755,86. Economia de R$ 316,19.
     */
    it('na faixa da redução, a economia encolhe', () => {
      expect(economia(7_000_000, 700_000, 840_000).economia).toBe(31_619)
    })

    it('até R$ 60 mil, o imposto já é zero: economia zero', () => {
      expect(economia(5_000_000, 500_000, 0).economia).toBe(0)
    })

    it('a página devolve a economia', () => {
      const r = porSlug('pgbl-imposto-de-renda')!.calcular(
        { rendimentos: 10_000_000, inss: 1_000_000, contribuicao: 0, regime: 'sim' },
        EM_2026,
      )
      if (!r.ok) throw new Error('esperado sucesso')
      expect(r.valores.principal).toBe(119_900)
    })
  })
})
