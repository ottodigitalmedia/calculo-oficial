/**
 * CALC-123 — Tesouro Selic.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`:
 *
 * - **Série mensal da Selic** já embarcada no produto (`series/dados/compacto`),
 *   gerada da série oficial do Banco Central. Série econômica NÃO é parâmetro
 *   legal (`ADR-006`): índice errado produz estimativa imprecisa, e é por isso
 *   que esta calculadora não tem vigência a auditar na parte do rendimento;
 * - **Decreto nº 12.814/2026, art. 3º** — a LFT rende pela taxa Selic, texto
 *   conferido no Planalto em 21/09/2026;
 * - **Lei nº 11.033/2004, art. 1º** — a tabela regressiva, já cadastrada;
 * - **Decreto nº 6.306/2007, Anexo** — a fronteira de trinta dias do IOF.
 *
 * Os valores foram conferidos por um cálculo feito à parte, fora do motor, com
 * a mesma aritmética inteira: fator acumulado em escala de 1e12, truncando a
 * cada mês, e imposto meio para cima sobre o rendimento. O mesmo cálculo em
 * frações exatas devolve os mesmos centavos, o que mostra que a truncagem
 * mensal não move o resultado nestes casos.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularTesouroSelic } from '../../src/lib/engine/calculadoras/tesouro-selic'
import { centavos } from '../../src/lib/engine/types'
import { RENDA_FIXA } from '../../src/lib/params/data/renda-fixa'
import { TITULOS_PUBLICOS } from '../../src/lib/params/data/titulos-publicos'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'
import { serieDoIndice } from '../../src/lib/calculadoras/indices-comuns'
import { porSlug } from '../../src/lib/calculadoras'

const registro = construirRegistro(TITULOS_PUBLICOS, RENDA_FIXA)
const REF = '2026-09-22' as DataISO
const serie = serieDoIndice('selic')

const render = (valor: number, primeiroMes: string, ultimoMes: string) =>
  calcularTesouroSelic(
    { valorAplicado: centavos(valor), primeiroMes, ultimoMes, serie },
    REF,
    registro,
  )

const valores = (...args: Parameters<typeof render>) => {
  const r = render(...args)
  if (!r.ok) throw new Error(r.detalhe)
  return r.valores
}

describe('CALC-123 · Tesouro Selic', () => {
  /**
   * R$ 20.000,00 de agosto de 2025 a julho de 2026: doze meses, 365 dias e
   * 14,70% de Selic acumulada. Bruto de R$ 22.941,34, imposto de 17,5% sobre o
   * rendimento — R$ 514,73 — e líquido de R$ 22.426,61.
   */
  it('doze meses cheios, na faixa de 17,5%', () => {
    const v = valores(2_000_000, '2025-08', '2026-07')
    expect(v.mesesAplicados).toBe(12)
    expect(v.diasCorridos).toBe(365)
    expect(v.variacaoBp).toBe(1_470)
    expect(v.bruto).toBe(2_294_134)
    expect(v.aliquotaIr).toBe(1_750)
    expect(v.imposto).toBe(51_473)
    expect(v.liquido).toBe(2_242_661)
  })

  /** Sete meses, 212 dias: a faixa de 20%. */
  it('a alíquota acompanha os dias da janela', () => {
    const v = valores(2_000_000, '2026-01', '2026-07')
    expect(v.diasCorridos).toBe(212)
    expect(v.aliquotaIr).toBe(2_000)
    expect(v.imposto).toBe(32_561)
    expect(v.liquido).toBe(2_130_244)
  })

  /** Dois meses, 61 dias: a primeira faixa, 22,5%. */
  it('janela curta, alíquota maior', () => {
    const v = valores(1_000_000, '2026-06', '2026-07')
    expect(v.mesesAplicados).toBe(2)
    expect(v.aliquotaIr).toBe(2_250)
    expect(v.liquido).toBe(1_018_240)
  })

  /**
   * A janela inclui os dois meses — é a diferença para CALC-060, em que o mês
   * de partida fica de fora. Um mês só é um mês de rendimento.
   */
  it('os dois meses escolhidos entram', () => {
    expect(valores(1_000_000, '2026-07', '2026-07').mesesAplicados).toBe(1)
    expect(valores(1_000_000, '2026-06', '2026-07').mesesAplicados).toBe(2)
  })

  it('fevereiro sozinho é recusado — 28 dias, ainda há IOF', () => {
    const r = render(1_000_000, '2026-02', '2026-02')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
    // Julho tem 31 dias, e passa.
    expect(render(1_000_000, '2026-07', '2026-07').ok).toBe(true)
  })

  it('mês que a série ainda não publicou é recusado', () => {
    const r = render(1_000_000, '2026-01', '2026-12')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })

  it('mês final antes do inicial é recusado', () => {
    const r = render(1_000_000, '2026-07', '2026-01')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('inconsistencia_temporal')
  })

  it('a página devolve o líquido', () => {
    const r = porSlug('tesouro-selic')!.calcular(
      { valorAplicado: 2_000_000, primeiroMes: '2025-08-01', ultimoMes: '2026-07-31' },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.principal).toBe(2_242_661)
  })
})
