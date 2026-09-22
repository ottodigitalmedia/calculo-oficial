/**
 * A ressalva que aparece abaixo do resultado — `lib/calculadoras/ressalvas.ts`.
 *
 * O aviso dizia, em toda calculadora com parâmetro legal, que o valor podia
 * variar "conforme acordos, convenções coletivas e particularidades do seu
 * contrato". Numa rescisão isso é verdade; numa restituição de imposto, no
 * PGBL ou no Tesouro Selic, não. Estes testes travam as duas pontas: a lista
 * não pode ter slug inventado, e quem não é trabalhista não pode receber a
 * frase de convenção coletiva.
 */

import { describe, expect, it } from 'vitest'

import { CALCULADORAS, porSlug } from '../../src/lib/calculadoras'
import { ressalvaDe, SLUGS_TRABALHISTAS } from '../../src/lib/calculadoras/ressalvas'

describe('ressalva por categoria', () => {
  it('todo slug da lista existe no catálogo', () => {
    const existentes = new Set(CALCULADORAS.map((c) => c.slug))
    for (const slug of SLUGS_TRABALHISTAS) {
      expect(existentes.has(slug), `${slug} não está no registro`).toBe(true)
    }
  })

  it('as trabalhistas falam de convenção coletiva', () => {
    for (const slug of ['rescisao-sem-justa-causa', 'ferias', 'horas-extras', 'escala-12x36']) {
      expect(porSlug(slug), slug).toBeDefined()
      expect(ressalvaDe(slug)).toBe('coletiva')
    }
  })

  /** O defeito que originou o módulo: convenção coletiva não muda imposto nem título público. */
  it('as de imposto e de investimento, não', () => {
    for (const slug of [
      'restituicao-irpf',
      'pgbl-imposto-de-renda',
      'tesouro-selic',
      'tesouro-prefixado',
      'come-cotas',
      'imposto-sobre-aluguel',
    ]) {
      expect(porSlug(slug), slug).toBeDefined()
      expect(ressalvaDe(slug), slug).toBe('caso')
    }
  })

  it('o formulário entregue ao navegador carrega a ressalva', () => {
    const trabalhista = CALCULADORAS.find((c) => c.slug === 'ferias')
    const tributaria = CALCULADORAS.find((c) => c.slug === 'restituicao-irpf')
    expect(trabalhista).toBeDefined()
    expect(tributaria).toBeDefined()
    expect(ressalvaDe(trabalhista!.slug)).toBe('coletiva')
    expect(ressalvaDe(tributaria!.slug)).toBe('caso')
  })
})
