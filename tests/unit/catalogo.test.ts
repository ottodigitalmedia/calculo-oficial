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
import { carregarCalculo, SLUGS_COM_CALCULO } from '../../src/lib/calculadoras/calculo'
import { CATALOGO } from '../../src/lib/calculadoras/indice'
import { formularioDe } from '../../src/lib/calculadoras/tipos'
import { INSS } from '../../src/lib/params/data/inss'
import { IRRF } from '../../src/lib/params/data/irrf'
import { TRABALHISTA } from '../../src/lib/params/data/trabalhista'
import { construirRegistro } from '../../src/lib/params/registry'

const registro = construirRegistro(INSS, IRRF, TRABALHISTA)

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

/**
 * O mapa de carga adiada é a **terceira** lista do mesmo conjunto, e a mais
 * perigosa das três: as outras duas erram na vitrine, esta erra no produto.
 * Calculadora publicada sem entrada em `calculo.ts` renderiza o formulário
 * inteiro e nunca sai de "Calculando…", porque `carregarCalculo` devolve
 * `null` — falha silenciosa, e só na rota daquela calculadora.
 */
describe('carga adiada do cálculo', () => {
  it('cobre exatamente as calculadoras publicadas', () => {
    expect([...SLUGS_COM_CALCULO].sort()).toEqual(CALCULADORAS.map((c) => c.slug).sort())
  })

  it('entrega a mesma função que a definição declara', async () => {
    for (const definicao of CALCULADORAS) {
      const promessa = carregarCalculo(definicao.slug)
      expect(promessa, `"${definicao.slug}" não tem cálculo registrado`).not.toBeNull()
      // Identidade, não equivalência: garante que o mapa aponta para a
      // definição certa. Trocar duas entradas de lugar passaria em qualquer
      // verificação mais frouxa, e produziria a calculadora errada na rota
      // certa — o defeito mais caro que este projeto pode publicar.
      await expect(promessa).resolves.toBe(definicao.calcular)
    }
  })

  it('devolve nulo para slug inexistente, em vez de lançar', () => {
    expect(carregarCalculo('nao-existe')).toBeNull()
  })
})

/**
 * O recorte que vai para o navegador precisa ser serializável de verdade: é
 * propriedade de componente de cliente, e o Next recusa função na fronteira.
 * O erro aparece só em tempo de renderização, numa rota específica — barato de
 * pegar aqui, caro de descobrir em produção.
 */
describe('formulário entregue ao navegador', () => {
  it('não leva função nenhuma', () => {
    for (const definicao of CALCULADORAS) {
      const formulario = formularioDe(definicao, registro)
      expect(
        JSON.parse(JSON.stringify(formulario)),
        `o formulário de "${definicao.slug}" não sobrevive a uma ida e volta em JSON`,
      ).toEqual(formulario)
    }
  })

  it('não leva FAQ, texto de SEO nem relacionadas — só o servidor os renderiza', () => {
    for (const definicao of CALCULADORAS) {
      const chaves = Object.keys(formularioDe(definicao, registro))
      for (const proibida of ['faq', 'descricaoSeo', 'relacionadas', 'nome', 'linhaDeContexto']) {
        expect(
          chaves,
          `"${proibida}" voltou ao pacote do navegador em "${definicao.slug}" (RNF-004)`,
        ).not.toContain(proibida)
      }
    }
  })
})

/**
 * Texto de tela é TEXTO, não markdown.
 *
 * `notas`, `destaques`, FAQ e ajuda são renderizados como texto puro — não há
 * interpretador de markdown em nenhum deles, por decisão de `ADR-009`. Um
 * `**Simples Nacional**` escrito por hábito foi ao ar em CALC-011 com os
 * asteriscos à mostra, e a única coisa que o pegou foi olhar a página.
 *
 * O acento grave também entra: `RN-023` aparece bem no comentário do código e
 * mal na tela do usuário.
 */
describe('microcopy · nenhum resquício de markdown no texto de tela', () => {
  const textos = CALCULADORAS.flatMap((c) => [
    c.nome,
    c.linhaDeContexto,
    c.descricaoSeo,
    c.rotuloResultado,
    c.avisoAdicional ?? '',
    ...c.campos.flatMap((campo) => [campo.rotulo, campo.ajuda ?? '']),
    ...c.faq.flatMap((f) => [f.pergunta, f.resposta]),
  ])

  it('não usa asterisco de ênfase', () => {
    const comAsterisco = textos.filter((t) => t.includes('**'))
    expect(comAsterisco).toEqual([])
  })

  it('não usa acento grave de código', () => {
    const comCrase = textos.filter((t) => t.includes('`'))
    expect(comCrase).toEqual([])
  })
})

/**
 * `RN-028` · a calculadora estima, não declara direito.
 *
 * A LACUNA QUE ESTE BLOCO FECHA ESTAVA ABERTA DESDE O COMEÇO, E DOEU.
 *
 * A mesma verificação existia em `tests/unit/guias.test.ts` desde `ADR-009`, e
 * olhava **só os guias**. Ninguém olhava os textos das calculadoras — que é
 * onde a afirmação de direito é mais perigosa, porque vem colada ao número.
 *
 * O resultado foi CALC-009 no ar com *"Quantas parcelas VOCÊ TEM DIREITO A
 * receber"* como subtítulo da página e como chamada no índice da home: a frase
 * que a regra 8 de `CLAUDE.md` nomeia, literalmente, como proibida.
 *
 * A lista de padrões é a MESMA de `guias.test.ts`, de propósito. Duas listas do
 * mesmo conjunto divergem — a lição que este projeto já pagou três vezes.
 */
describe('RN-028 · a calculadora estima, não determina direito', () => {
  const PROIBIDOS = [
    /você tem direito/i,
    /voce tem direito/i,
    /tem direito a receber/i,
    /\bdeve receber\b/i,
    /\bgarante o direito\b/i,
    /\bfaz jus\b/i,
  ]

  for (const c of CALCULADORAS) {
    it(`${c.slug} não usa expressão prescritiva`, () => {
      const seus = [
        c.nome,
        c.linhaDeContexto,
        c.descricaoSeo,
        c.rotuloResultado,
        c.avisoAdicional ?? '',
        ...c.campos.flatMap((campo) => [
          campo.rotulo,
          campo.ajuda ?? '',
          ...(campo.opcoes ?? []).map((o) => o.rotulo),
        ]),
        ...c.faq.flatMap((f) => [f.pergunta, f.resposta]),
      ]

      for (const texto of seus) {
        for (const proibido of PROIBIDOS) {
          expect(
            proibido.test(texto),
            `"${texto}" viola RN-028 em ${c.slug}. A formulação obrigatória é ` +
              `"estimativa com base nos dados informados" — nunca afirmação de direito.`,
          ).toBe(false)
        }
      }
    })
  }
})

/**
 * Os dois contratos que `tipos.ts` declara em prosa e que nada cobrava.
 *
 * `relacionadas` é "slugs de 2 a 4"; o passo 7 de "Ao adicionar uma calculadora"
 * pede FAQ com no mínimo quatro perguntas. Nenhum dos dois tinha verificação:
 * o e2e olha UMA página, e uma página não é o catálogo.
 *
 * CALC-022 estava com **uma** relacionada — e é a única do v1 na vertical de
 * maior valor publicitário, recebendo link de 24 outras calculadoras e sem
 * mandar ninguém a lugar nenhum.
 */
describe('contratos da definição', () => {
  for (const c of CALCULADORAS) {
    it(`${c.slug} · de 2 a 4 relacionadas`, () => {
      expect(
        c.relacionadas.length,
        `"${c.slug}" tem ${c.relacionadas.length} relacionada(s). ` +
          `O fim da página é o que leva o visitante ao cluster seguinte.`,
      ).toBeGreaterThanOrEqual(2)
      expect(c.relacionadas.length).toBeLessThanOrEqual(4)
      expect(new Set(c.relacionadas).size, 'relacionada repetida').toBe(c.relacionadas.length)
    })

    it(`${c.slug} · FAQ com no mínimo 4 perguntas`, () => {
      expect(c.faq.length, `"${c.slug}" tem ${c.faq.length} pergunta(s)`).toBeGreaterThanOrEqual(4)
    })
  }

  /**
   * A descrição de SEO precisa CABER no que o buscador mostra.
   *
   * O Google trunca por volta de 160 caracteres. Trinta e oito das 76 passavam
   * disso em 08/08/2026 — uma chegava a **234** —, e o efeito não era um erro:
   * era a segunda metade de uma frase escrita com cuidado sendo cortada com
   * reticências no único lugar onde ela disputa o clique.
   *
   * O piso existe pelo motivo oposto: descrição curta demais desperdiça o
   * espaço que o buscador dá de graça.
   */
  for (const c of CALCULADORAS) {
    it(`${c.slug} · descrição de SEO entre 70 e 160 caracteres`, () => {
      expect(
        c.descricaoSeo.length,
        `"${c.slug}" tem ${c.descricaoSeo.length} caracteres. Acima de 160 o buscador corta.`,
      ).toBeLessThanOrEqual(160)
      expect(c.descricaoSeo.length).toBeGreaterThanOrEqual(70)
    })
  }

  it('nenhum id nem slug se repete', () => {
    const ids = CALCULADORAS.map((c) => c.id)
    const slugs = CALCULADORAS.map((c) => c.slug)
    expect(new Set(ids).size, 'id repetido — o catálogo não recicla ID').toBe(ids.length)
    expect(new Set(slugs).size, 'slug repetido — duas calculadoras na mesma URL').toBe(slugs.length)
  })
})
