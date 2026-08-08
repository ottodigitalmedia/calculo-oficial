/**
 * O mapa de sinônimos da busca — `RF-007`.
 *
 * ## POR QUE ISTO PRECISA DE TESTE
 *
 * O mapa é indexado por slug, e um slug errado **não produz erro nenhum**: o
 * sinônimo fica no arquivo, parece cobertura, e nunca casa com nada. É a mesma
 * família de defeito do rodapé que anunciava "em breve" calculadoras já
 * publicadas (T-106) e do índice leve que podia divergir das definições — duas
 * listas do mesmo conjunto, mantidas por disciplina.
 *
 * O segundo caso é o que importa de verdade: **sinônimo que repete o nome não
 * faz nada**, porque o filtro já casa contra nome e linha de contexto. Ele custa
 * bytes no pacote da home e dá a impressão de que o termo está coberto.
 */

import { describe, expect, it } from 'vitest'

import { CATALOGO } from '../../src/lib/calculadoras/indice'
import { SINONIMOS } from '../../src/lib/calculadoras/sinonimos'

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

describe('sinônimos da busca', () => {
  const slugs = new Set(CATALOGO.map((c) => c.slug))

  it('toda chave é uma calculadora que existe', () => {
    for (const slug of Object.keys(SINONIMOS)) {
      expect(
        slugs.has(slug),
        `"${slug}" não é slug de calculadora nenhuma. O sinônimo nunca vai casar, ` +
          `e o arquivo continua parecendo que cobre o termo.`,
      ).toBe(true)
    }
  })

  it('nenhum sinônimo repete o que o nome ou a linha de contexto já dizem', () => {
    for (const c of CATALOGO) {
      const jaCoberto = normalizar(`${c.nome} ${c.linhaDeContexto}`)
      for (const sinonimo of SINONIMOS[c.slug] ?? []) {
        expect(
          jaCoberto.includes(normalizar(sinonimo)),
          `"${sinonimo}" em ${c.slug} já é encontrado pelo nome ou pela linha de ` +
            `contexto. Sinônimo existe para o termo que a pessoa digita e que NÃO ` +
            `está na página.`,
        ).toBe(false)
      }
    }
  })

  it('nenhum sinônimo está vazio nem repetido dentro da mesma calculadora', () => {
    for (const [slug, lista] of Object.entries(SINONIMOS)) {
      expect(lista.length, `${slug} tem lista vazia`).toBeGreaterThan(0)
      for (const s of lista) expect(s.trim(), `${slug} tem sinônimo vazio`).not.toBe('')
      expect(new Set(lista).size, `${slug} repete sinônimo`).toBe(lista.length)
    }
  })

  /**
   * A cobertura em si. Não exige sinônimo para toda calculadora — algumas têm
   * nome autoexplicativo —, mas exige que o mapa **acompanhe o catálogo**.
   *
   * Foi essa proporção que ficou para trás: quatro chaves para 76 calculadoras,
   * congeladas desde o lançamento.
   */
  it('cobre a maior parte do catálogo', () => {
    const cobertas = Object.keys(SINONIMOS).length
    expect(
      cobertas / CATALOGO.length,
      `Só ${cobertas} de ${CATALOGO.length} calculadoras têm sinônimo. ` +
        `Quem digita a palavra que usa no dia a dia recebe "não encontramos nada" ` +
        `em cima de um catálogo que tem a resposta.`,
    ).toBeGreaterThan(0.7)
  })
})
