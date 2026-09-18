/**
 * Férias vencidas em dobro dentro da rescisão — CALC-001, CALC-002, CALC-003,
 * CALC-092, a rescisão do doméstico e o comparador de acordo.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * `fonte_verificacao`: aritmética direta sobre a CLT, na redação do Decreto-lei
 * nº 1.535/1977 lida no Planalto em 18/09/2026 — art. 146 ("será devida ao
 * empregado a remuneração simples ou em dobro, conforme o caso, correspondente
 * ao período de férias cujo direito tenha adquirido") e art. 137 (em dobro
 * quando concedidas após o prazo do art. 134) —, com o terço do art. 7º, XVII,
 * da Constituição. Para o doméstico, a LC nº 150/2015, art. 19, aplica a CLT
 * subsidiariamente, e o art. 17 dela não tem regra própria de prazo.
 *
 * Existe porque, até 18/09/2026, as rescisões pagavam as férias vencidas
 * sempre de forma simples.
 *
 * Nenhum número foi lido de calculadora concorrente, blog, planilha de terceiro
 * ou resposta de modelo de linguagem (`CO-1`).
 */

import { describe, expect, it } from 'vitest'

import { calcularJustaCausa } from '../../src/lib/engine/calculadoras/justa-causa'
import { calcularRescisao, type EntradaRescisao } from '../../src/lib/engine/calculadoras/rescisao'
import { centavos } from '../../src/lib/engine/types'
import { DOMESTICO } from '../../src/lib/params/data/domestico'
import { FERIAS_FORA_DO_PRAZO } from '../../src/lib/params/data/ferias-fora-do-prazo'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'
import { porSlug } from '../../src/lib/calculadoras'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA, DOMESTICO, FERIAS_FORA_DO_PRAZO)
const REF = '2026-06-15' as DataISO

const BASE: EntradaRescisao = {
  admissao: '2021-06-01' as DataISO,
  desligamento: '2026-06-15' as DataISO,
  salario: centavos(300_000),
  modalidade: 'sem-justa-causa',
  regime: 'clt',
  avisoPrevio: 'indenizado',
  temFeriasVencidas: true,
  saldoFgtsInformado: centavos(0),
  dependentes: 0,
}

function rescisao(over: Partial<EntradaRescisao> = {}) {
  const r = calcularRescisao({ ...BASE, ...over }, REF, registro)
  if (!r.ok) throw new Error(r.detalhe)
  return r
}

describe('rescisão · férias vencidas simples ou em dobro (CLT, art. 146)', () => {
  /** R$ 3.000,00 + ⅓ = R$ 4.000,00 — dentro do prazo de concessão. */
  it('dentro do prazo: simples, como antes', () => {
    expect(rescisao().valores.feriasVencidas).toBe(400_000)
    expect(rescisao({ feriasVencidasEmDobro: false }).valores.feriasVencidas).toBe(400_000)
  })

  /** Prazo vencido: R$ 4.000,00 × 2 = R$ 8.000,00. */
  it('prazo vencido: em dobro', () => {
    const r = rescisao({ feriasVencidasEmDobro: true })
    expect(r.valores.feriasVencidas).toBe(800_000)
    const etapa = r.traco.etapas.find((e) => e.rotulo.startsWith('Férias vencidas em dobro'))
    expect(etapa?.fundamento?.dispositivo).toContain('146')
    expect(etapa?.parametro?.dispositivo).toBe('Art. 137, caput')
  })

  /** A diferença entra inteira no bruto: são R$ 4.000,00 a mais. */
  it('a dobra entra no total bruto', () => {
    const simples = rescisao().valores.totalBruto
    expect(rescisao({ feriasVencidasEmDobro: true }).valores.totalBruto - simples).toBe(400_000)
  })

  it('sem férias vencidas, a marcação de dobro não acrescenta nada', () => {
    expect(rescisao({ temFeriasVencidas: false, feriasVencidasEmDobro: true }).valores.feriasVencidas).toBe(0)
  })

  it('vale para o doméstico e para o pedido de demissão', () => {
    expect(rescisao({ regime: 'domestico', feriasVencidasEmDobro: true }).valores.feriasVencidas).toBe(800_000)
    expect(rescisao({ modalidade: 'pedido-demissao', feriasVencidasEmDobro: true }).valores.feriasVencidas).toBe(800_000)
  })

  it('sem a regra cadastrada, a dobra bloqueia em vez de cair para o simples', () => {
    const semFerias = construirRegistro(INSS, IRRF, TRABALHISTA)
    const r = calcularRescisao({ ...BASE, feriasVencidasEmDobro: true }, REF, semFerias)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})

describe('justa causa · os períodos fora do prazo dobram', () => {
  const justa = (periodosVencidos: number, periodosEmDobro?: number) => {
    const r = calcularJustaCausa(
      {
        desligamento: '2026-06-15' as DataISO,
        salario: centavos(300_000),
        periodosVencidos,
        ...(periodosEmDobro === undefined ? {} : { periodosEmDobro }),
        dependentes: 0,
      },
      REF,
      registro,
    )
    return r
  }

  /** Dois períodos, um fora do prazo: R$ 4.000,00 + R$ 8.000,00 = R$ 12.000,00. */
  it('um de dois períodos em dobro', () => {
    const r = justa(2, 1)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.valores.feriasVencidas).toBe(1_200_000)
  })

  it('sem o campo novo, o resultado é o de antes', () => {
    const r = justa(2)
    if (!r.ok) throw new Error(r.detalhe)
    expect(r.valores.feriasVencidas).toBe(800_000)
  })

  it('mais períodos em dobro que vencidos é recusado', () => {
    const r = justa(1, 2)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_invalida')
  })
})

describe('as páginas levam a escolha ao motor', () => {
  it('"dobro" na página de rescisão sem justa causa paga em dobro', async () => {
    const d = porSlug('rescisao-sem-justa-causa')!
    const valores = { admissao: '2021-06-01', desligamento: '2026-06-15', salario: 300_000, avisoPrevio: 'indenizado', saldoFgts: 0, dependentes: 0 }
    const simples = d.calcular({ ...valores, feriasVencidas: 'sim' }, REF)
    const dobro = d.calcular({ ...valores, feriasVencidas: 'dobro' }, REF)
    if (!simples.ok || !dobro.ok) throw new Error('esperado sucesso')
    const linha = (r: typeof simples) => (r.ok ? r.valores.detalhamento.find((l) => l.rotulo.startsWith('Férias vencidas'))?.valor : undefined)
    expect(linha(simples)).toBe(400_000)
    expect(linha(dobro)).toBe(800_000)
  })
})
