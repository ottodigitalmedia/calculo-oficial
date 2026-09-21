/**
 * CALC-095 — limites da antecipação do saque-aniversário.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`:
 *
 * - **Resolução CCFGTS nº 958, de 24/04/2020, com a redação da Resolução
 *   CCFGTS nº 1.130, de 07/10/2025** — texto conferido no Diário Oficial da
 *   União em 21/09/2026: três saques cedíveis (art. 1º, § 3º), cinco até
 *   31/10/2026 (art. 2º da nº 1.130), valor cedido de cada saque entre R$
 *   100,00 e R$ 500,00 (§ 4º) e carência de noventa dias (§ 2º);
 * - **Portaria MGI nº 7.588, de 28/11/2023** — DOU de 29/11/2023, conferida na
 *   mesma data: 1,80% ao mês, o limite que o art. 5º da Resolução nº 958/2020
 *   manda que as taxas fiquem ABAIXO, por remissão ao Decreto nº 8.690/2016;
 * - **Lei nº 8.036/1990, Anexo** — a tabela do saque-aniversário, já cadastrada.
 *
 * O valor LIBERADO pelo banco não é testado porque não é publicado: nenhuma
 * norma define o desconto aplicado até cada aniversário. O motor entrega os
 * limites, e a página diz o que falta.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import {
  calcularLimitesDaAntecipacao,
  calcularSaqueAniversario,
} from '../../src/lib/engine/calculadoras/saque-aniversario'
import { centavos } from '../../src/lib/engine/types'
import { SAQUE_ANIVERSARIO } from '../../src/lib/params/data/saque-aniversario'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'
import { porSlug } from '../../src/lib/calculadoras'

const registro = construirRegistro(SAQUE_ANIVERSARIO)
const ANTES_DA_VIRADA = '2026-09-21' as DataISO
const DEPOIS_DA_VIRADA = '2026-11-01' as DataISO

const saqueDe = (saldo: number, data: DataISO) => {
  const r = calcularSaqueAniversario({ saldo: centavos(saldo) }, data, registro)
  if (!r.ok) throw new Error(r.detalhe)
  return r.valores.saque
}

const limites = (saldo: number, data: DataISO) => {
  const r = calcularLimitesDaAntecipacao(saqueDe(saldo, data), data, registro)
  if (!r.ok) throw new Error(r.detalhe)
  return r.valores
}

describe('limites da antecipação', () => {
  /**
   * Saldo de R$ 10.000,00: a faixa de 20% com parcela adicional de R$ 650,00 dá
   * saque de R$ 2.650,00. Cedível por saque: o teto de R$ 500,00. Em 21/09/2026
   * valem cinco saques — R$ 2.500,00 no total.
   */
  it('até 31/10/2026, cinco saques', () => {
    const v = limites(1_000_000, ANTES_DA_VIRADA)
    expect(v.saquesMaximos).toBe(5)
    expect(v.cedivelPorSaque).toBe(50_000)
    expect(v.totalCedivel).toBe(250_000)
    expect(v.carenciaDias).toBe(90)
    expect(v.jurosTetoBp).toBe(180)
  })

  /** A partir de 1º/11/2026, a regra permanente: três saques, R$ 1.500,00. */
  it('a partir de 1º/11/2026, três saques', () => {
    const v = limites(1_000_000, DEPOIS_DA_VIRADA)
    expect(v.saquesMaximos).toBe(3)
    expect(v.totalCedivel).toBe(150_000)
  })

  /**
   * Saldo de R$ 600,00: 40% mais R$ 50,00 de parcela adicional = R$ 290,00 de
   * saque, abaixo do teto de R$ 500,00 — cede-se o saque inteiro.
   */
  it('quando o saque é menor que o teto, cede-se o saque', () => {
    const v = limites(60_000, ANTES_DA_VIRADA)
    expect(v.cedivelPorSaque).toBe(29_000)
    expect(v.totalCedivel).toBe(145_000)
    expect(v.atendeMinimo).toBe(true)
  })

  /** Saldo de R$ 150,00: saque de R$ 75,00, abaixo do mínimo de R$ 100,00. */
  it('saque abaixo do mínimo não permite contratação', () => {
    const v = limites(15_000, ANTES_DA_VIRADA)
    expect(v.atendeMinimo).toBe(false)
    expect(v.totalCedivel).toBe(0)
  })

  it('RN-003 — antes de 20/10/2025 a resolução não fixava estes limites', () => {
    const r = calcularLimitesDaAntecipacao(centavos(265_000), '2025-10-19' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  /**
   * O seletor de período da página resolve o ano em 15 de junho, e a virada é em
   * 1º de novembro: sem data própria, o limite antigo apareceria nos dois
   * últimos meses de 2026. O campo da contratação é o que impede isso.
   */
  it('a página resolve os limites pela data da contratação, e não pelo período', () => {
    const d = porSlug('saque-aniversario-do-fgts')!
    const antes = d.calcular(
      { saldo: 1_000_000, antecipacao: 'sim', dataDaContratacao: '2026-10-31' },
      ANTES_DA_VIRADA,
    )
    const depois = d.calcular(
      { saldo: 1_000_000, antecipacao: 'sim', dataDaContratacao: '2026-11-01' },
      ANTES_DA_VIRADA,
    )
    if (!antes.ok || !depois.ok) throw new Error('esperado sucesso')
    const cedidos = (r: typeof antes) =>
      r.ok ? r.valores.destaques?.find((x) => x.rotulo === 'Saques que podem ser cedidos')?.valor : null
    expect(cedidos(antes)).toBe('5')
    expect(cedidos(depois)).toBe('3')
  })

  it('a página mostra os limites só quando pedidos, e o saque não muda', () => {
    const d = porSlug('saque-aniversario-do-fgts')!
    const sem = d.calcular({ saldo: 1_000_000, antecipacao: 'nao' }, ANTES_DA_VIRADA)
    const com = d.calcular({ saldo: 1_000_000, antecipacao: 'sim' }, ANTES_DA_VIRADA)
    if (!sem.ok || !com.ok) throw new Error('esperado sucesso')
    expect(sem.valores.principal).toBe(265_000)
    expect(com.valores.principal).toBe(265_000)
    expect(sem.valores.destaques).toHaveLength(2)
    expect(com.valores.destaques?.some((d2) => d2.rotulo === 'Total que pode ser cedido')).toBe(true)
  })
})
