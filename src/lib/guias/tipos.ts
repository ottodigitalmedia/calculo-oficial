/**
 * Guia como dado declarativo — `ADR-009`.
 *
 * Mesmo padrão do molde das calculadoras (`ADR-008` E-1): o guia declara
 * seções, e **uma** página genérica em `/guia/[slug]` renderiza qualquer um.
 *
 * A restrição que dá razão a este arquivo é a regra G-1: **nenhum valor legal
 * na prosa**. Alíquota, faixa, teto e dedução entram por bloco que lê
 * `lib/params/` e vem acompanhado de norma, vigência e link.
 *
 * Sem isso, a portaria do ano seguinte atualizaria a calculadora e deixaria o
 * guia exibindo a tabela velha — com aparência de correto e sem nenhum teste
 * falhando. `tests/unit/guias.test.ts` verifica G-1; não é disciplina, é teste.
 */

import type { DataISO } from '../params/tipos'

// ---------------------------------------------------------------------------
// Blocos
// ---------------------------------------------------------------------------

/**
 * Um pedaço de guia.
 *
 * `paragrafo`, `lista` e `destaque` carregam prosa — e prosa não contém número
 * legal. Os dois últimos carregam número, e por isso não carregam prosa: eles
 * o buscam em `lib/params/`.
 */
export type Bloco =
  | { readonly tipo: 'paragrafo'; readonly texto: string }
  | { readonly tipo: 'lista'; readonly itens: readonly string[] }
  /** Caixa de atenção. Uma frase, não um parágrafo. */
  | { readonly tipo: 'destaque'; readonly texto: string }
  /**
   * Tabela progressiva renderizada a partir do parâmetro (G-2).
   * O `parametroId` precisa ser de tipo `tabela_faixas`.
   */
  | {
      readonly tipo: 'tabelaDeFaixas'
      readonly parametroId: string
      /** Legenda acima da tabela. Descreve, não repete valores. */
      readonly legenda: string
    }
  /** Valor único renderizado a partir do parâmetro (G-2). */
  | {
      readonly tipo: 'valorVigente'
      readonly parametroId: string
      readonly legenda: string
    }
  /** Chamada para uma calculadora. `slug` precisa existir no registro. */
  | { readonly tipo: 'chamada'; readonly slug: string; readonly texto: string }

export interface Secao {
  /** Âncora da seção. `kebab-case`, sem acento — vira `#id` na URL. */
  readonly id: string
  readonly titulo: string
  readonly blocos: readonly Bloco[]
}

// ---------------------------------------------------------------------------
// Guia
// ---------------------------------------------------------------------------

export interface Guia {
  /** Parte da URL. **Nunca alterado após publicação** (regra R-1 de `06-api-spec`). */
  readonly slug: string
  readonly titulo: string
  /** Uma linha sob o título. */
  readonly subtitulo: string
  readonly descricaoSeo: string
  /**
   * Data da última revisão do texto.
   *
   * Alimenta o `lastModified` do sitemap e o `dateModified` dos dados
   * estruturados. É a única data do sitemap que não é inventada — as demais
   * rotas simplesmente não a declaram, porque declarar data falsa ao buscador
   * é pior que omiti-la.
   */
  readonly atualizadoEm: DataISO
  /** Slugs das calculadoras a que o guia leva. `03-functional-spec` §4. */
  readonly calculadoras: readonly string[]
  readonly secoes: readonly Secao[]
}

// ---------------------------------------------------------------------------
// Extração de prosa — usada pelo teste de G-1
// ---------------------------------------------------------------------------

/**
 * Todo o texto livre de um guia, para varredura.
 *
 * Deixa de fora `legenda` de bloco de parâmetro? Não: legenda também é prosa e
 * também não pode conter número legal. O que fica de fora é apenas o que vem
 * de `lib/params/`, que não passa por aqui.
 */
export function prosaDoGuia(guia: Guia): readonly string[] {
  const partes: string[] = [guia.titulo, guia.subtitulo, guia.descricaoSeo]

  for (const secao of guia.secoes) {
    partes.push(secao.titulo)
    for (const bloco of secao.blocos) {
      switch (bloco.tipo) {
        case 'paragrafo':
        case 'destaque':
          partes.push(bloco.texto)
          break
        case 'lista':
          partes.push(...bloco.itens)
          break
        case 'tabelaDeFaixas':
        case 'valorVigente':
          partes.push(bloco.legenda)
          break
        case 'chamada':
          partes.push(bloco.texto)
          break
      }
    }
  }
  return partes
}
