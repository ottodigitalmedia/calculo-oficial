/**
 * O índice leve não pode divergir das definições.
 *
 * `calculadoras/indice.ts` existe para manter o motor de cálculo fora do pacote
 * da home. O preço é uma segunda lista do mesmo conjunto — e duas listas do
 * mesmo conjunto divergem. Já divergiram: o rodapé passou o T-104 inteiro
 * anunciando "em breve" três calculadoras que já estavam publicadas.
 *
 * Este arquivo é o que torna a divergência impossível de passar despercebida.
 */

import { describe, expect, it } from 'vitest'

import { CALCULADORAS } from '../../src/lib/calculadoras'
import { CATALOGO } from '../../src/lib/calculadoras/indice'

describe('índice do catálogo', () => {
  it('tem exatamente as mesmas calculadoras, na mesma ordem', () => {
    expect(CATALOGO.map((c) => c.slug)).toEqual(CALCULADORAS.map((c) => c.slug))
  })

  it('reproduz nome e linha de contexto de cada definição', () => {
    for (const definicao of CALCULADORAS) {
      const item = CATALOGO.find((c) => c.slug === definicao.slug)
      expect(item, `"${definicao.slug}" está publicada e fora do índice`).toBeDefined()
      expect(item?.nome).toBe(definicao.nome)
      expect(item?.linhaDeContexto).toBe(definicao.linhaDeContexto)
    }
  })

  it('não traz calculadora que não existe', () => {
    const publicados = new Set(CALCULADORAS.map((c) => c.slug))
    for (const item of CATALOGO) {
      expect(publicados.has(item.slug), `índice cita "${item.slug}", que não existe`).toBe(true)
    }
  })
})
