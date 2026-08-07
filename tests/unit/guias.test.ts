/**
 * Integridade dos guias — `ADR-009`.
 *
 * O teste que importa aqui é **G-1**: nenhum valor legal escrito na prosa.
 *
 * Sem ele, a regra é disciplina, e disciplina falha em silêncio: a portaria do
 * ano seguinte entraria em `lib/params/`, a calculadora passaria a usá-la, e o
 * guia continuaria exibindo a tabela velha — correta na aparência, sem nada
 * quebrar. É o modo de falha que `CLAUDE.md` declara ser o mais provável do
 * projeto.
 */

import { describe, expect, it } from 'vitest'

import { CALCULADORAS, porSlug } from '../../src/lib/calculadoras'
import { GUIAS, guiaPorSlug, guiasDaCalculadora } from '../../src/lib/guias'
import { prosaDoGuia } from '../../src/lib/guias/tipos'
import { TODOS_OS_CONJUNTOS } from '../../src/lib/params/data/todos'
import { construirRegistro } from '../../src/lib/params/registry'

/**
 * O mesmo registro que `components/Guia.tsx` monta — o do servidor, completo.
 *
 * Montá-lo aqui com uma lista própria faria o teste verificar um universo
 * diferente do que a página renderiza: um `parametroId` fora da lista do
 * componente passaria no teste e sumiria da página. É a lição de `todos.ts`
 * aplicada ao segundo par de listas que existia deste conjunto.
 */
const registro = construirRegistro(...TODOS_OS_CONJUNTOS)

// ---------------------------------------------------------------------------
// G-1 · nenhum valor legal na prosa
// ---------------------------------------------------------------------------

/**
 * Padrões que denunciam valor legal digitado à mão.
 *
 * Deliberadamente amplos. Um falso positivo custa reescrever uma frase; um
 * falso negativo custa publicar um número desatualizado com cara de correto.
 */
const PADROES_DE_VALOR = [
  { nome: 'símbolo de moeda', regex: /R\$/ },
  { nome: 'percentual', regex: /\d\s*%/ },
  { nome: 'decimal em pt-BR', regex: /\d[\d.]*,\d/ },
  { nome: 'milhar com ponto', regex: /\b\d{1,3}(?:\.\d{3})+\b/ },
]

describe('G-1 · a prosa do guia não contém valor legal', () => {
  for (const guia of GUIAS) {
    for (const padrao of PADROES_DE_VALOR) {
      it(`${guia.slug} não tem ${padrao.nome}`, () => {
        const infratores = prosaDoGuia(guia).filter((texto) => padrao.regex.test(texto))
        expect(
          infratores,
          `Valor legal na prosa viola ADR-009 G-1. Use um bloco "tabelaDeFaixas" ou ` +
            `"valorVigente", que lê lib/params/ e exibe a norma junto.`,
        ).toEqual([])
      })
    }
  }
})

// ---------------------------------------------------------------------------
// G-2 · os blocos de parâmetro apontam para parâmetro que existe
// ---------------------------------------------------------------------------

describe('G-2 · blocos de parâmetro resolvem', () => {
  for (const guia of GUIAS) {
    for (const secao of guia.secoes) {
      for (const bloco of secao.blocos) {
        if (bloco.tipo === 'tabelaDeFaixas') {
          it(`${guia.slug} · ${bloco.parametroId} é tabela de faixas com vigência`, () => {
            const resolvida = registro.maisRecente(bloco.parametroId)
            expect(resolvida, `parâmetro "${bloco.parametroId}" não existe`).not.toBeNull()
            expect(resolvida?.vigencia.valor.tipo).toBe('tabela_faixas')
            // Sem fonte o bloco não renderiza a procedência, e um número sem
            // norma neste site está fora do padrão da casa (RN-029).
            expect(resolvida?.fonte.url).toMatch(/^https:\/\//)
          })
        }

        if (bloco.tipo === 'valorVigente') {
          it(`${guia.slug} · ${bloco.parametroId} tem valor exibível`, () => {
            const resolvida = registro.maisRecente(bloco.parametroId)
            expect(resolvida, `parâmetro "${bloco.parametroId}" não existe`).not.toBeNull()
            expect(['valor_monetario', 'percentual', 'inteiro']).toContain(
              resolvida?.vigencia.valor.tipo,
            )
            expect(resolvida?.fonte.url).toMatch(/^https:\/\//)
          })
        }
      }
    }
  }
})

// ---------------------------------------------------------------------------
// Integridade referencial
// ---------------------------------------------------------------------------

describe('integridade referencial', () => {
  it('todo slug de guia é único', () => {
    const slugs = GUIAS.map((g) => g.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('toda calculadora citada por um guia existe', () => {
    for (const guia of GUIAS) {
      for (const slug of guia.calculadoras) {
        expect(porSlug(slug), `guia "${guia.slug}" cita calculadora inexistente "${slug}"`).toBeDefined()
      }
    }
  })

  it('toda chamada aponta para calculadora que existe', () => {
    for (const guia of GUIAS) {
      for (const secao of guia.secoes) {
        for (const bloco of secao.blocos) {
          if (bloco.tipo === 'chamada') {
            expect(
              porSlug(bloco.slug),
              `guia "${guia.slug}" chama calculadora inexistente "${bloco.slug}"`,
            ).toBeDefined()
          }
        }
      }
    }
  })

  it('toda relacionada declarada numa calculadora existe', () => {
    // A página de calculadora as renderiza desde o T-106. Apontar para slug
    // inexistente produziria um cartão faltando, em silêncio.
    for (const c of CALCULADORAS) {
      for (const slug of c.relacionadas) {
        expect(porSlug(slug), `"${c.slug}" relaciona "${slug}", que não existe`).toBeDefined()
      }
      expect(c.relacionadas).not.toContain(c.slug)
    }
  })

  it('a relação invertida encontra os guias da calculadora', () => {
    for (const guia of GUIAS) {
      for (const slug of guia.calculadoras) {
        expect(guiasDaCalculadora(slug).map((g) => g.slug)).toContain(guia.slug)
      }
    }
  })

  it('guiaPorSlug devolve o guia certo e nada para slug inexistente', () => {
    for (const guia of GUIAS) expect(guiaPorSlug(guia.slug)).toBe(guia)
    expect(guiaPorSlug('nao-existe')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Âncoras e forma
// ---------------------------------------------------------------------------

describe('seções', () => {
  for (const guia of GUIAS) {
    it(`${guia.slug} · âncoras únicas e em kebab-case sem acento`, () => {
      const ids = guia.secoes.map((s) => s.id)
      expect(new Set(ids).size, 'âncora repetida quebra o link do sumário').toBe(ids.length)
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    })

    it(`${guia.slug} · tem conteúdo em toda seção`, () => {
      expect(guia.secoes.length).toBeGreaterThanOrEqual(3)
      for (const secao of guia.secoes) expect(secao.blocos.length).toBeGreaterThan(0)
    })

    it(`${guia.slug} · a data de revisão é ISO`, () => {
      expect(guia.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  }
})

// ---------------------------------------------------------------------------
// RN-028 · nenhuma linguagem prescritiva de direito
// ---------------------------------------------------------------------------

describe('RN-028 · o guia explica, não determina direito', () => {
  const PROIBIDOS = [
    /você tem direito/i,
    /voce tem direito/i,
    /tem direito a receber/i,
    /\bdeve receber\b/i,
    /\bgarante o direito\b/i,
    /\bfaz jus\b/i,
  ]

  for (const guia of GUIAS) {
    it(`${guia.slug} não usa expressão prescritiva`, () => {
      for (const texto of prosaDoGuia(guia)) {
        for (const proibido of PROIBIDOS) {
          expect(proibido.test(texto), `"${texto}" viola RN-028`).toBe(false)
        }
      }
    })
  }
})

// ---------------------------------------------------------------------------
// Cobertura — toda calculadora tem guia
// ---------------------------------------------------------------------------

/**
 * A LACUNA QUE ESTE TESTE FECHA JÁ EXISTIA, E FOI REGISTRADA ANTES DE DOER.
 *
 * Em 07/08/2026 a cobertura chegou a 75 de 75, e `ESTADO-DO-PROJETO` §11.7
 * anotou que nada a mantinha: o comando que a mede existia, e ninguém o
 * executava sozinho. É a mesma estrutura do defeito de §7.67 — a home anunciou
 * cinco calculadoras publicadas como "Em breve" por semanas porque o
 * verificador olhava o rodapé, e o silêncio dele não distinguia "está certo" de
 * "não foi olhado".
 *
 * Aqui o silêncio passa a significar cobertura. Calculadora nova sem guia
 * reprova, e a mensagem diz o que fazer.
 *
 * **Por que isto não é excesso de rigor.** O guia é o que traz a busca orgânica
 * e o que explica a conta a quem não sabe conferir sozinho. Uma calculadora sem
 * guia é uma página que ninguém encontra e que ninguém entende — e o custo de
 * lembrar disso na revisão é maior que o de um teste.
 */
describe('cobertura · toda calculadora publicada tem pelo menos um guia', () => {
  const cobertas = new Set(GUIAS.flatMap((g) => g.calculadoras))

  for (const c of CALCULADORAS) {
    it(`${c.slug} está ligada a algum guia`, () => {
      expect(
        cobertas.has(c.slug),
        `"${c.slug}" (${c.id}) não aparece em nenhum guia. Acrescente o slug ao ` +
          `campo "calculadoras" de um guia existente que responda à mesma pergunta, ` +
          `ou escreva um guia novo. Ver ESTADO-DO-PROJETO §11 — agrupar por pergunta ` +
          `do leitor, não criar um texto por calculadora.`,
      ).toBe(true)
    })
  }

  it('nenhum guia aponta para calculadora que não existe', () => {
    // Já verificado acima em "integridade referencial"; repetido aqui como
    // contraparte explícita: a cobertura vale nos dois sentidos.
    const slugs = new Set(CALCULADORAS.map((c) => c.slug))
    for (const guia of GUIAS) {
      for (const slug of guia.calculadoras) {
        expect(slugs.has(slug), `guia "${guia.slug}" cita "${slug}", que não existe`).toBe(true)
      }
    }
  })
})
