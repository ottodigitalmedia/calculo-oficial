/**
 * Serialização do campo de lista — `lerLista`, `escreverLista`, `listaVazia` e
 * `FORMATO_DE_LISTA`.
 *
 * **Por que estes testes existem.** O valor do campo de lista viaja na URL
 * (`RF-006`), e a URL é a única entrada do sistema que vem do mundo: colada,
 * truncada, editada à mão, sobrevivente de um encurtador. Uma lista malformada
 * tem de virar dado incompleto — que a tela sabe tratar — e nunca exceção.
 *
 * A segunda propriedade é a ida e volta: o que o editor escreve, o leitor lê de
 * volta igual. Sem isso o permalink devolveria um formulário diferente do que
 * foi compartilhado, que é o defeito silencioso de RF-006.
 */

import { describe, expect, it } from 'vitest'

import {
  escreverLista,
  FORMATO_DE_LISTA,
  lerLista,
  listaVazia,
} from '../../src/lib/calculadoras/tipos'

describe('lerLista', () => {
  it('lê linhas separadas por ponto e vírgula e colunas por vírgula', () => {
    expect(lerLista({ x: '10,20;30,40' }, 'x', 2)).toEqual([
      [10, 20],
      [30, 40],
    ])
  })

  it('completa com zero a linha curta e trunca a longa', () => {
    expect(lerLista({ x: '10;20,30,40' }, 'x', 2)).toEqual([
      [10, 0],
      [20, 30],
    ])
  })

  it('campo ausente ou vazio é lista vazia, não exceção', () => {
    expect(lerLista({}, 'x', 2)).toEqual([])
    expect(lerLista({ x: '' }, 'x', 2)).toEqual([])
    expect(lerLista({ x: 42 }, 'x', 2)).toEqual([])
  })

  /**
   * O caso do mundo: URL editada à mão. Nada aqui pode lançar — célula
   * ininteligível vale zero, e a linha entra como incompleta.
   */
  it('célula ininteligível vale zero em vez de quebrar', () => {
    expect(lerLista({ x: 'abc,10;,;5' }, 'x', 2)).toEqual([
      [0, 10],
      [0, 0],
      [5, 0],
    ])
    expect(lerLista({ x: '-5,1e9;NaN' }, 'x', 2)).toEqual([
      [0, 0],
      [0, 0],
    ])
  })
})

describe('escreverLista', () => {
  it('escreve o que lerLista lê de volta igual', () => {
    const original = [
      [10, 20],
      [30, 40],
      [0, 0],
    ]
    expect(lerLista({ x: escreverLista(original) }, 'x', 2)).toEqual(original)
  })

  it('não emite negativo nem fração — a URL só carrega inteiro não negativo', () => {
    expect(escreverLista([[-5, 10.7]])).toBe('0,10')
  })

  it('o que escreve casa com o formato que a URL aceita', () => {
    for (const linhas of [[[1]], [[1, 2]], [[1, 2], [3, 4]], [[0, 0], [10, 0]]]) {
      expect(FORMATO_DE_LISTA.test(escreverLista(linhas)), JSON.stringify(linhas)).toBe(true)
    }
  })
})

describe('FORMATO_DE_LISTA', () => {
  it('recusa o que não é lista de inteiros', () => {
    for (const invalido of ['', 'a,b', '1,,2', '1;', ';1', '1.5,2', '-1,2', '1, 2']) {
      expect(FORMATO_DE_LISTA.test(invalido), invalido).toBe(false)
    }
  })
})

describe('listaVazia', () => {
  /**
   * O campo abre com linhas prontas para preencher. Elas não podem fazer o
   * formulário parecer preenchido — o estado pendente de §1.5 existe para esse
   * momento exato.
   */
  it('linhas de zeros continuam vazias', () => {
    expect(listaVazia('0,0;0,0')).toBe(true)
    expect(listaVazia('')).toBe(true)
    expect(listaVazia(undefined)).toBe(true)
    expect(listaVazia(0)).toBe(true)
  })

  it('uma célula com valor já é lista preenchida', () => {
    expect(listaVazia('0,0;10,0')).toBe(false)
    expect(listaVazia('1')).toBe(false)
  })
})
