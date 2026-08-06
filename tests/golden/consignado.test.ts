/**
 * Casos-ouro de CALC-027 — empréstimo consignado.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Lei nº 10.820, de 17 de dezembro de 2003, no texto consolidado do Planalto,
 * lido em 06/08/2026:
 *
 *   Art. 2º, § 2º, I, com a redação da Lei nº 14.431, de 2022 — "a soma dos
 *   descontos referidos no art. 1º desta Lei não poderá exceder a 40% (quarenta
 *   por cento) da remuneração disponível, conforme definido em regulamento".
 *
 *   Art. 2º, VIII — "remuneração disponível, os vencimentos, subsídios, soldos,
 *   salários ou remunerações, DESCONTADAS AS CONSIGNAÇÕES COMPULSÓRIAS".
 *
 * A Lei nº 14.431/2022 é de 3 de agosto de 2022, publicada no DOU de 4/8/2022.
 * Ela elevou o limite de 35% para 40% e revogou a alínea que reservava 5% ao
 * cartão de crédito consignado.
 *
 * O INSS e o IRRF vêm dos motores já existentes e já conferidos contra os
 * exemplos oficiais — `inss.test.ts` e `irrf.test.ts` os cobrem.
 *
 * As propriedades que estes casos travam:
 *
 *   1. **A margem sai do LÍQUIDO, não do bruto.** É o engano mais comum sobre
 *      consignado, e a diferença cresce com o salário.
 *   2. **A margem limita a PARCELA, não o valor tomado** — e por isso prazo
 *      maior aumenta o empréstimo possível E o total pago.
 *   3. **Margem esgotada devolve zero**, e não um empréstimo negativo.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDef } from '../../src/lib/calculadoras/consignado'
import { calcularConsignado } from '../../src/lib/engine/calculadoras/consignado'
import { calcularInss } from '../../src/lib/engine/inss'
import { basisPoints, centavos } from '../../src/lib/engine/types'
import { CONSIGNADO } from '../../src/lib/params/data/consignado'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(CONSIGNADO, INSS, IRRF)
const REF = '2026-06-15' as DataISO

const BASE = {
  salarioBruto: centavos(500_000),
  dependentes: 0,
  outrosCompulsorios: centavos(0),
  jaConsignado: centavos(0),
  prazoMeses: 48,
  taxaMensalBp: basisPoints(150),
}

function calc(over: Partial<typeof BASE> = {}, ref = REF) {
  const r = calcularConsignado({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-027 · a margem sai do líquido, não do bruto', () => {
  it('a remuneração disponível é o bruto menos INSS e IRRF', () => {
    const v = calc()
    const inss = calcularInss({ salarioContribuicao: centavos(500_000) }, REF, registro)
    if (!inss.ok) throw new Error('esperado sucesso')
    expect(v.inss).toBe(inss.valores.contribuicao)
    expect(v.remuneracaoDisponivel).toBe(500_000 - v.inss - v.irrf)
  })

  it('a margem é 40% da disponível', () => {
    const v = calc()
    expect(v.margemBp).toBe(4_000)
    expect(v.margemTotal).toBe(Math.round(v.remuneracaoDisponivel * 0.4))
  })

  /**
   * A afirmação que a página faz sobre o mundo: usar o bruto superestima a
   * margem, e a diferença cresce com o salário — porque os descontos
   * obrigatórios crescem junto.
   */
  it('40% do bruto é sempre maior, e a diferença cresce com o salário', () => {
    const diferencas = [300_000, 800_000, 2_000_000].map((bruto) => {
      const v = calc({ salarioBruto: centavos(bruto) })
      expect(v.margemSobreOBruto).toBeGreaterThan(v.margemTotal)
      return v.margemSobreOBruto - v.margemTotal
    })
    for (let i = 1; i < diferencas.length; i += 1) {
      expect(diferencas[i] ?? 0).toBeGreaterThan(diferencas[i - 1] ?? 0)
    }
  })

  it('outros descontos obrigatórios reduzem a margem', () => {
    const com = calc({ outrosCompulsorios: centavos(50_000) })
    expect(com.margemTotal).toBeLessThan(calc().margemTotal)
  })

  it('a memória explica que a base é a disponível', () => {
    const r = calcularConsignado(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo === 'Margem consignável')
    expect(etapa?.justificativa).toContain('DISPONÍVEL')
    expect(etapa?.parametro?.url).toContain('planalto.gov.br')
  })
})

describe('CALC-027 · a margem limita a parcela, não o valor', () => {
  it('a parcela que cabe é a margem livre', () => {
    const v = calc()
    // A parcela derivada do valor presente volta à margem, a menos do
    // arredondamento de um centavo.
    expect(Math.abs(v.parcela - v.margemLivre)).toBeLessThanOrEqual(1)
  })

  /**
   * As duas consequências do prazo maior, juntas — é por isso que comparar
   * proposta pela parcela leva a decisão ruim.
   */
  it('prazo maior aumenta o empréstimo possível E o total pago', () => {
    const curto = calc({ prazoMeses: 24 })
    const longo = calc({ prazoMeses: 72 })
    expect(longo.emprestimoPossivel).toBeGreaterThan(curto.emprestimoPossivel)
    expect(longo.totalPago).toBeGreaterThan(curto.totalPago)
    expect(longo.custoDoCredito).toBeGreaterThan(curto.custoDoCredito)
  })

  it('taxa maior reduz o quanto cabe na mesma margem', () => {
    expect(calc({ taxaMensalBp: basisPoints(300) }).emprestimoPossivel).toBeLessThan(
      calc({ taxaMensalBp: basisPoints(150) }).emprestimoPossivel,
    )
  })

  it('o custo do crédito é o total menos o que foi tomado', () => {
    const v = calc()
    expect(v.custoDoCredito).toBe(v.totalPago - v.emprestimoPossivel)
  })

  it('sem tarifa, o CET é a própria taxa do contrato', () => {
    expect(calc().cetMensal).toBe(150)
  })
})

describe('CALC-027 · o que já está consignado', () => {
  it('reduz a margem livre sem mexer na total', () => {
    const v = calc({ jaConsignado: centavos(50_000) })
    expect(v.margemTotal).toBe(calc().margemTotal)
    expect(v.margemLivre).toBe(v.margemTotal - 50_000)
  })

  /**
   * Margem esgotada devolve zero, e não um empréstimo negativo — que é o que
   * uma subtração sem guarda produziria.
   */
  it('margem esgotada devolve zero, não valor negativo', () => {
    const v = calc({ jaConsignado: centavos(900_000) })
    expect(v.margemEsgotada).toBe(true)
    expect(v.margemLivre).toBe(0)
    expect(v.emprestimoPossivel).toBe(0)
    expect(v.parcela).toBe(0)
    expect(v.totalPago).toBe(0)
  })

  it('consignado exatamente igual à margem também esgota', () => {
    const margem = calc().margemTotal
    const v = calc({ jaConsignado: centavos(margem) })
    expect(v.margemEsgotada).toBe(true)
  })
})

describe('CALC-027 · vigência e recusas', () => {
  it('em 2025 a margem já é de 40%', () => {
    expect(calc({}, '2025-06-15' as DataISO).margemBp).toBe(4_000)
  })

  it('data anterior à Lei nº 14.431/2022 não tem margem cadastrada', () => {
    const r = calcularConsignado(BASE, '2020-06-15' as DataISO, registro)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.motivo).toBe('vigencia_ausente')
  })

  it('sem salário, prazo ou taxa, o estado é pendente', () => {
    expect(calcularConsignado({ ...BASE, salarioBruto: centavos(0) }, REF, registro).ok).toBe(false)
    expect(calcularConsignado({ ...BASE, prazoMeses: 0 }, REF, registro).ok).toBe(false)
    expect(calcularConsignado({ ...BASE, taxaMensalBp: basisPoints(0) }, REF, registro).ok).toBe(false)
  })
})

describe('CALC-027 · a definição publicada', () => {
  it('a coluna do resultado fecha com o bruto', () => {
    const r = calcularDef(
      { salarioBruto: 500_000, prazoMeses: 48, taxaMensal: 150 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    const [bruto, inss, irrf, disponivel] = r.valores.detalhamento
    expect((bruto?.valor ?? 0) - (inss?.valor ?? 0) - (irrf?.valor ?? 0)).toBe(disponivel?.valor)
  })

  it('o destaque compara a margem correta com a do bruto', () => {
    const r = calcularDef({ salarioBruto: 500_000, prazoMeses: 48, taxaMensal: 150 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect((r.valores.destaques ?? []).some((d) => d.rotulo.includes('do BRUTO'))).toBe(true)
  })

  it('com margem esgotada, os destaques do empréstimo somem', () => {
    const r = calcularDef(
      { salarioBruto: 500_000, prazoMeses: 48, taxaMensal: 150, jaConsignado: 900_000 },
      REF,
    )
    if (!r.ok) throw new Error('esperado sucesso')
    expect((r.valores.destaques ?? []).some((d) => d.rotulo.includes('CET'))).toBe(false)
    expect((r.valores.notas ?? []).some((n) => n.includes('totalmente comprometida'))).toBe(true)
  })

  it('a ressalva sobre aposentados e servidores aparece sempre', () => {
    const r = calcularDef({ salarioBruto: 500_000, prazoMeses: 48, taxaMensal: 150 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect((r.valores.notas ?? []).some((n) => n.includes('medida provisória'))).toBe(true)
  })
})
