/**
 * CASOS-OURO — contribuição previdenciária do segurado.
 *
 * `fonte_verificacao` de cada bloco está no comentário que o precede, conforme
 * `CO-1`. Origem proibida: resultado de site concorrente, de software de
 * terceiro ou de resposta gerada por modelo de linguagem.
 *
 * **Data de referência sempre explícita.** Caso-ouro que dependa da data atual
 * passa a falhar sozinho na virada do exercício, e é assim que suítes morrem
 * (`12-test-plan` §3.2).
 */

import { describe, expect, it } from 'vitest'

import { calcularInss } from '../../src/lib/engine/inss'
import { centavos } from '../../src/lib/engine/types'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(INSS, IRRF)

function contribuicao(salario: number, data: string): number {
  const r = calcularInss({ salarioContribuicao: centavos(salario) }, data, registro)
  if (!r.ok) throw new Error(`cálculo falhou: ${r.detalhe}`)
  return r.valores.contribuicao
}

/**
 * fonte_verificacao: exemplos numéricos publicados pela Receita Federal em
 * "Exemplos de Aplicação da Lei 15.270/2025". Os quatro rendimentos ali trazem
 * a contribuição previdenciária já calculada.
 *
 * NOTA IMPORTANTE. Os exemplos foram publicados em dezembro de 2025, antes da
 * Portaria MPS/MF nº 13/2026 existir — e usam a tabela de 2025. Conferido: os
 * quatro batem com a tabela de 2025 e nenhum bate com a de 2026. Daí a data de
 * referência destes casos ser 2025, e não 2026.
 *
 * Vale como corroboração independente da transcrição: são valores publicados
 * pela Receita conferindo com a tabela publicada pela Previdência.
 */
describe('INSS 2025 · valores publicados pela Receita Federal', () => {
  const EM_2025 = '2025-06-15'

  it.each([
    ['R$ 3.036,00', 303_600, 25_773],
    ['R$ 4.000,00', 400_000, 37_341],
    ['R$ 5.000,00', 500_000, 50_960],
    ['R$ 6.000,00', 600_000, 64_960],
  ])('%s → contribuição publicada', (_rotulo, salario, esperado) => {
    expect(contribuicao(salario, EM_2025)).toBe(esperado)
  })
})

/**
 * fonte_verificacao: cálculo manual conferido contra a tabela do Anexo II da
 * Portaria Interministerial MPS/MF nº 13, de 09/01/2026.
 *
 * Memória do cálculo manual, para o teto (R$ 8.475,55):
 *
 *   1ª faixa  R$ 1.621,00 × 7,5%  =  R$   121,575
 *   2ª faixa  R$ 1.281,84 ×   9%  =  R$   115,3656
 *   3ª faixa  R$ 1.451,43 ×  12%  =  R$   174,1716
 *   4ª faixa  R$ 4.121,28 ×  14%  =  R$   576,9792
 *                                     ─────────────
 *                              soma =  R$   988,0914  →  R$ 988,09
 */
describe('INSS 2026 · fronteiras de faixa e teto', () => {
  const EM_2026 = '2026-06-15'

  it('TC-001 · salário exatamente no limite superior da 1ª faixa', () => {
    // R$ 1.621,00 × 7,5% = R$ 121,575 → R$ 121,58
    expect(contribuicao(162_100, EM_2026)).toBe(12_158)
  })

  it('TC-002 · um centavo acima do limite da 1ª faixa entra na 2ª', () => {
    const r = calcularInss({ salarioContribuicao: centavos(162_101) }, EM_2026, registro)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // O valor arredondado coincide, mas a 2ª faixa passa a existir no traço —
    // que é o que prova a transição.
    expect(r.valores.contribuicao).toBe(12_158)
    expect(r.traco.etapas.filter((e) => e.rotulo.includes('faixa'))).toHaveLength(2)
  })

  it('TC-003 · salário exatamente no teto', () => {
    expect(contribuicao(847_555, EM_2026)).toBe(98_809)
  })

  it('TC-004 · salário muito acima do teto é limitado (RN-009)', () => {
    const r = calcularInss({ salarioContribuicao: centavos(2_000_000) }, EM_2026, registro)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.valores.contribuicao).toBe(98_809)
    expect(r.valores.limitadaPeloTeto).toBe(true)
    expect(r.valores.baseAplicada).toBe(847_555)
  })

  it('salário zero produz contribuição zero', () => {
    expect(contribuicao(0, EM_2026)).toBe(0)
  })
})

/**
 * fonte_verificacao: comparação entre as duas tabelas cadastradas, ambas
 * conferidas em fonte oficial. O mesmo salário em exercícios diferentes deve
 * produzir resultados diferentes — é a propriedade que `RF-004` entrega.
 */
describe('RF-004 · o mesmo salário em vigências diferentes', () => {
  it('TC-018 · resultados diferem entre 2025 e 2026', () => {
    const em2025 = contribuicao(400_000, '2025-06-15')
    const em2026 = contribuicao(400_000, '2026-06-15')
    expect(em2025).toBe(37_341)
    expect(em2026).toBe(36_860)
    expect(em2025).not.toBe(em2026)
  })

  it('a virada do exercício é exata: 31/12 e 01/01 usam tabelas distintas', () => {
    expect(contribuicao(400_000, '2025-12-31')).toBe(37_341)
    expect(contribuicao(400_000, '2026-01-01')).toBe(36_860)
  })
})

describe('RN-003 · data sem cobertura bloqueia, nunca extrapola', () => {
  it('TC-016 · data anterior à menor vigência', () => {
    const r = calcularInss({ salarioContribuicao: centavos(400_000) }, '2020-01-01', registro)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.motivo).toBe('vigencia_ausente')
      expect(r.detalhe).toContain('2025-01-01')
    }
  })
})

describe('C-M1 · não existe cálculo sem traço', () => {
  it('o traço reproduz a conta e cita a fonte em cada faixa', () => {
    const r = calcularInss({ salarioContribuicao: centavos(500_000) }, '2026-06-15', registro)
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const comParametro = r.traco.etapas.filter((e) => e.parametro !== undefined)
    expect(comParametro.length).toBeGreaterThan(0)
    for (const etapa of comParametro) {
      expect(etapa.parametro?.url).toMatch(/^https:\/\//)
      expect(etapa.parametro?.norma).toContain('Portaria')
      expect(etapa.parametro?.vigenciaInicio).toBe('2026-01-01')
    }
    expect(r.traco.dataReferencia).toBe('2026-06-15')
    expect(r.traco.vigenciasAplicadas).toContain('inss-tabela-2026')
  })
})
