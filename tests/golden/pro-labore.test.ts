/**
 * Casos-ouro de CALC-051 — pró-labore e encargos do sócio.
 *
 * ORIGEM DOS VALORES ESPERADOS, DECLARADA
 *
 * Textos do Planalto, lidos em 06/08/2026:
 *
 *   Lei nº 8.212/1991, art. 22, III (redação da Lei nº 9.876/1999) — "vinte por
 *   cento sobre o total das remunerações pagas ou creditadas a qualquer título,
 *   no decorrer do mês, aos segurados contribuintes individuais que lhe prestem
 *   serviços".
 *
 *   Art. 30, § 4º (redação da Lei nº 9.876/1999) — "Na hipótese de o
 *   contribuinte individual prestar serviço a uma ou mais empresas, poderá
 *   deduzir, da sua contribuição mensal, quarenta e cinco por cento da
 *   contribuição da empresa [...] limitada a dedução a nove por cento do
 *   respectivo salário-de-contribuição."
 *
 *   Lei nº 10.666/2003, art. 4º — a empresa arrecada a contribuição do
 *   contribuinte individual a seu serviço, descontando-a da remuneração.
 *
 * A tabela do IRRF, a dedução por dependente e o teto do salário-de-contribuição
 * são os já cadastrados e conferidos.
 *
 * As propriedades que estes casos travam:
 *
 *   1. **Os 11% são DERIVADOS, não cadastrados** — 20% do caput menos os 9% de
 *      teto da dedução. Se alguém cadastrar 11% direto, a derivação some da
 *      memória e o número deixa de ser auditável.
 *   2. **O desconto do sócio tem teto; a patronal não.** A partir do teto os
 *      dois deixam de crescer juntos.
 *   3. **A patronal é escolha do usuário**, e muda o custo da empresa sem mexer
 *      em nada do que o sócio recebe.
 */

import { describe, expect, it } from 'vitest'

import { calcular as calcularDef } from '../../src/lib/calculadoras/pro-labore'
import { calcularProLabore } from '../../src/lib/engine/calculadoras/pro-labore'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { INSS_INDIVIDUAL } from '../../src/lib/params/data/inss-individual'
import { IRRF } from '../../src/lib/params/data/irrf'
import { construirRegistro } from '../../src/lib/params/registry'
import type { DataISO } from '../../src/lib/params/tipos'

const registro = construirRegistro(INSS, INSS_INDIVIDUAL, IRRF)
const REF = '2026-06-15' as DataISO

const TETO_2026 = 847_555

const BASE = {
  proLabore: centavos(500_000),
  patronalPorFora: false,
  dependentes: 0,
  pensao: centavos(0),
}

function calc(over: Partial<typeof BASE> = {}, ref = REF) {
  const r = calcularProLabore({ ...BASE, ...over }, ref, registro)
  if (!r.ok) throw new Error(`esperado sucesso: ${r.detalhe}`)
  return r.valores
}

describe('CALC-051 · os 11% são derivados, não cadastrados', () => {
  it('a alíquota do sócio é 20% menos os 9% de teto da dedução', () => {
    expect(calc().aliquotaDoSocioBp).toBe(1_100)
  })

  it('11% de R$ 5.000,00 são R$ 550,00', () => {
    expect(calc().inssDoSocio).toBe(55_000)
  })

  /**
   * A derivação precisa APARECER. Se ela sumir da memória, o número deixa de
   * ser auditável — e é o único jeito de alguém conferir de onde vêm os 11%.
   */
  it('a memória mostra a subtração que produz os 11%', () => {
    const r = calcularProLabore(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('depois da dedução'))
    expect(etapa).toBeDefined()
    expect(etapa?.formula).toContain('20,00%')
    expect(etapa?.formula).toContain('9,00%')
    expect(etapa?.justificativa).toContain('Nenhuma norma escreve "11%"')
  })

  it('a memória cita quem faz a retenção', () => {
    const r = calcularProLabore(BASE, REF, registro)
    if (!r.ok) throw new Error('esperado sucesso')
    const etapa = r.traco.etapas.find((e) => e.rotulo.includes('INSS descontado'))
    expect(etapa?.fundamento?.norma).toContain('10.666')
    expect(etapa?.justificativa).toContain('EMPRESA')
  })
})

describe('CALC-051 · o teto separa o sócio da empresa', () => {
  it('abaixo do teto, os dois crescem juntos', () => {
    const v = calc({ proLabore: centavos(500_000), patronalPorFora: true })
    expect(v.limitadoPeloTeto).toBe(false)
    expect(v.inssDoSocio).toBe(55_000)
    expect(v.patronal).toBe(100_000)
  })

  /**
   * A diferença que mais surpreende quem compara com o empregado: a patronal
   * não tem teto.
   */
  it('acima do teto, o desconto do sócio para e a patronal continua', () => {
    const v = calc({ proLabore: centavos(2_000_000), patronalPorFora: true })
    expect(v.limitadoPeloTeto).toBe(true)
    expect(v.baseInss).toBe(TETO_2026)
    // 11% do teto, não do pró-labore.
    expect(v.inssDoSocio).toBe(Math.round(TETO_2026 * 0.11))
    // 20% do pró-labore INTEIRO.
    expect(v.patronal).toBe(400_000)
  })

  it('dobrar o pró-labore acima do teto não muda o INSS do sócio', () => {
    const a = calc({ proLabore: centavos(2_000_000) })
    const b = calc({ proLabore: centavos(4_000_000) })
    expect(b.inssDoSocio).toBe(a.inssDoSocio)
  })
})

describe('CALC-051 · a patronal é escolha, e muda só o custo da empresa', () => {
  it('no DAS, não há patronal separada', () => {
    const v = calc({ patronalPorFora: false })
    expect(v.patronal).toBe(0)
    expect(v.custoDaEmpresa).toBe(500_000)
  })

  it('por fora, ela entra no custo', () => {
    const v = calc({ patronalPorFora: true })
    expect(v.patronal).toBe(100_000)
    expect(v.custoDaEmpresa).toBe(600_000)
    expect(v.custoAnual).toBe(600_000 * 12)
  })

  it('a escolha não muda nada do que o sócio recebe', () => {
    const dentro = calc({ patronalPorFora: false })
    const fora = calc({ patronalPorFora: true })
    expect(fora.inssDoSocio).toBe(dentro.inssDoSocio)
    expect(fora.irrf).toBe(dentro.irrf)
    expect(fora.liquidoDoSocio).toBe(dentro.liquidoDoSocio)
  })

  it('a parte que chega ao sócio cai quando a patronal entra', () => {
    expect(calc({ patronalPorFora: true }).parteQueChegaBp).toBeLessThan(
      calc({ patronalPorFora: false }).parteQueChegaBp,
    )
  })
})

describe('CALC-051 · o IRRF entra depois do INSS', () => {
  it('o líquido é o bruto menos INSS e IRRF', () => {
    const v = calc()
    expect(v.liquidoDoSocio).toBe(500_000 - v.inssDoSocio - v.irrf)
  })

  /**
   * Com R$ 5.000,00 o imposto é zero — o desconto simplificado cobre a faixa.
   * As deduções só se distinguem acima dela, e é lá que estes casos olham.
   */
  it('pró-labore dentro da faixa isenta não gera imposto', () => {
    expect(calc({ proLabore: centavos(200_000) }).irrf).toBe(0)
    expect(calc({ proLabore: centavos(500_000) }).irrf).toBe(0)
  })

  it('acima da faixa isenta, dependentes reduzem o imposto', () => {
    const alto = { proLabore: centavos(1_200_000) }
    expect(calc(alto).irrf).toBeGreaterThan(0)
    expect(calc({ ...alto, dependentes: 3 }).irrf).toBeLessThan(calc(alto).irrf)
  })

  it('pensão judicial também reduz', () => {
    const alto = { proLabore: centavos(1_200_000) }
    expect(calc({ ...alto, pensao: centavos(100_000) }).irrf).toBeLessThan(calc(alto).irrf)
  })

  it('sem pró-labore, o estado é pendente', () => {
    expect(calcularProLabore({ ...BASE, proLabore: centavos(0) }, REF, registro).ok).toBe(false)
  })
})

describe('CALC-051 · a definição publicada', () => {
  it('a coluna do resultado fecha com o bruto', () => {
    const r = calcularDef({ proLabore: 500_000, patronal: 'fora' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    const [bruto, inss, irrf, liquido] = r.valores.detalhamento
    expect((bruto?.valor ?? 0) - (inss?.valor ?? 0) - (irrf?.valor ?? 0)).toBe(liquido?.valor)
    expect(r.valores.principal).toBe(liquido?.valor)
  })

  it('a nota muda conforme a escolha da patronal', () => {
    const fora = calcularDef({ proLabore: 500_000, patronal: 'fora' }, REF)
    if (!fora.ok) throw new Error('esperado sucesso')
    expect((fora.valores.notas ?? []).some((n) => n.includes('sem teto'))).toBe(true)

    const das = calcularDef({ proLabore: 500_000, patronal: 'das' }, REF)
    if (!das.ok) throw new Error('esperado sucesso')
    expect((das.valores.notas ?? []).some((n) => n.includes('dentro do DAS'))).toBe(true)
  })

  it('a nota sobre distribuição de lucros aparece sempre', () => {
    const r = calcularDef({ proLabore: 500_000 }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect((r.valores.notas ?? []).some((n) => n.includes('distribuição de lucros'))).toBe(true)
  })

  it('opção desconhecida na URL cai no DAS, sem quebrar', () => {
    const r = calcularDef({ proLabore: 500_000, patronal: 'inventado' }, REF)
    if (!r.ok) throw new Error('esperado sucesso')
    expect(r.valores.destaques?.some((d) => d.rotulo.includes('por fora'))).toBe(false)
  })
})
