/**
 * CASOS-OURO — CALC-001 Salário líquido.
 *
 * fonte_verificacao: cálculo manual conferido contra as tabelas cadastradas em
 * T-101, ambas de fonte oficial. A memória de cada cálculo manual está no
 * comentário do caso.
 *
 * Data de referência sempre explícita (`12-test-plan` §3.2).
 */

import { describe, expect, it } from 'vitest'

import { calcularSalarioLiquido } from '../../src/lib/engine/calculadoras/salario-liquido'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(INSS, IRRF)

const vazio = { dependentes: 0, pensao: centavos(0), outrosDescontos: centavos(0) }

function calcular(salario: number, data: string, over: Partial<typeof vazio> = {}) {
  const r = calcularSalarioLiquido(
    { salarioBruto: centavos(salario), ...vazio, ...over },
    data,
    registro,
  )
  if (!r.ok) throw new Error(r.detalhe)
  return r
}

describe('salário líquido em 2026', () => {
  /**
   *   R$ 5.000,00 · sem dependentes
   *   INSS      R$   501,51   (tabela 2026, arredondado no total)
   *   base      R$ 4.392,80   (simplificado, mais favorável)
   *   imposto   R$   312,89   zerado pelo redutor (teto R$ 312,89)
   *   líquido   R$ 4.498,49
   */
  it('R$ 5.000,00 tem o imposto zerado pelo redutor', () => {
    const r = calcular(500_000, '2026-06-15')
    expect(r.valores.inss).toBe(50_151)
    expect(r.valores.irrf).toBe(0)
    expect(r.valores.liquido).toBe(449_849)
  })

  /**
   *   R$ 8.500,00 · 2 dependentes — acima do teto e acima do redutor
   *   INSS      R$   988,09   (base limitada ao teto de R$ 8.475,55)
   *   base      R$ 7.132,73   (deduções legais: 8.500 − 988,09 − 379,18)
   *   imposto   R$ 1.052,77   sem redução (rendimento > R$ 7.350,00)
   *   líquido   R$ 6.459,14
   */
  it('R$ 8.500,00 com 2 dependentes passa do teto e não tem redução', () => {
    const r = calcular(850_000, '2026-06-15', { dependentes: 2 })
    expect(r.valores.inss).toBe(98_809)
    expect(r.valores.irrf).toBe(105_277)
    expect(r.valores.liquido).toBe(645_914)
  })

  /**
   *   R$ 3.000,00 · pensão R$ 200,00 · outros descontos R$ 150,00
   *   INSS      R$   248,60
   *   base      R$ 2.392,80   (simplificado) → faixa isenta
   *   imposto   R$     0,00
   *   líquido   3.000 − 248,60 − 0 − 200 − 150 = R$ 2.401,40
   */
  it('pensão e outros descontos entram no líquido', () => {
    const r = calcular(300_000, '2026-06-15', {
      pensao: centavos(20_000),
      outrosDescontos: centavos(15_000),
    })
    expect(r.valores.inss).toBe(24_860)
    expect(r.valores.irrf).toBe(0)
    expect(r.valores.liquido).toBe(240_140)
  })
})

describe('RF-004 · o mesmo salário em 2025 e em 2026', () => {
  it('difere por DOIS motivos somados: tabela de INSS e existência do redutor', () => {
    const em2026 = calcular(500_000, '2026-06-15')
    const em2025 = calcular(500_000, '2025-06-15')

    expect(em2026.valores.inss).toBe(50_151)
    expect(em2025.valores.inss).toBe(50_960)

    // Em 2025 não havia redutor, então o imposto aparece.
    expect(em2026.valores.irrf).toBe(0)
    expect(em2025.valores.irrf).toBe(31_289)

    expect(em2026.valores.liquido).toBe(449_849)
    expect(em2025.valores.liquido).toBe(417_751)
  })
})

describe('C-M1 · o traço encadeia previdência, imposto e líquido', () => {
  it('a última etapa é o líquido e bate com o valor exibido (MC-8)', () => {
    const r = calcular(500_000, '2026-06-15')
    const ultima = r.traco.etapas[r.traco.etapas.length - 1]
    expect(ultima?.rotulo).toBe('Salário líquido')
    expect(ultima?.resultado).toBe(r.valores.liquido)
  })

  it('as vigências de INSS e IRRF aparecem juntas, sem duplicar', () => {
    const r = calcular(500_000, '2026-06-15')
    expect(r.traco.vigenciasAplicadas).toContain('inss-tabela-2026')
    expect(r.traco.vigenciasAplicadas).toContain('irrf-tabela-2025-05')
    expect(new Set(r.traco.vigenciasAplicadas).size).toBe(r.traco.vigenciasAplicadas.length)
  })

  it('outros descontos só viram etapa quando existem', () => {
    const sem = calcular(300_000, '2026-06-15')
    const com = calcular(300_000, '2026-06-15', { outrosDescontos: centavos(15_000) })
    expect(sem.traco.etapas.some((e) => e.rotulo === 'Outros descontos')).toBe(false)
    expect(com.traco.etapas.some((e) => e.rotulo === 'Outros descontos')).toBe(true)
  })
})

describe('C-M3 · erros de domínio', () => {
  it('salário zero devolve entrada_incompleta, não zero', () => {
    const r = calcularSalarioLiquido(
      { salarioBruto: centavos(0), ...vazio },
      '2026-06-15',
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('entrada_incompleta')
  })

  it('data sem cobertura propaga o erro do motor de INSS', () => {
    const r = calcularSalarioLiquido(
      { salarioBruto: centavos(500_000), ...vazio },
      '2019-01-01',
      registro,
    )
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })
})
