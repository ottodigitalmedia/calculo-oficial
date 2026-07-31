import { absoluto, NOME_DO_SITE } from '@/lib/seo'

/**
 * Dados estruturados em JSON-LD.
 *
 * Só descrevem o que a página de fato mostra. `FAQPage` sai do mesmo array que
 * renderiza as perguntas visíveis, e `Article` do mesmo objeto que renderiza o
 * guia — não há como o marcado divergir do exibido, que é a causa mais comum
 * de penalização por dado estruturado.
 *
 * ⚠️ **Quando a política de segurança de conteúdo entrar** (adiada com os
 * cabeçalhos de `07-security` §5), este `<script>` precisa ser contemplado:
 * navegadores aplicam `script-src` a `application/ld+json` mesmo ele não sendo
 * executável. A saída correta é o hash `sha256` do conteúdo, nunca
 * `'unsafe-inline'` — que valeria para todo script da página.
 */

/** Escapa `<` para que nenhuma string possa fechar a tag e injetar markup. */
function serializar(dados: unknown): string {
  return JSON.stringify(dados).replace(/</g, '\\u003c')
}

export function DadosEstruturados({ dados }: { readonly dados: unknown }) {
  return (
    <script
      type="application/ld+json"
      // Conteúdo estático montado no servidor, já escapado acima.
      dangerouslySetInnerHTML={{ __html: serializar(dados) }}
    />
  )
}

// ---------------------------------------------------------------------------
// Construtores
// ---------------------------------------------------------------------------

/**
 * Editor do site. Referenciado por `@id` nos demais objetos, em vez de
 * repetido — é o que o vocabulário prevê e o que evita divergência.
 */
const EDITOR = {
  '@type': 'Organization',
  '@id': `${absoluto('/')}#organizacao`,
  name: NOME_DO_SITE,
  url: absoluto('/'),
}

export function dadosDoSite(descricao: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absoluto('/')}#site`,
    name: NOME_DO_SITE,
    url: absoluto('/'),
    description: descricao,
    inLanguage: 'pt-BR',
    publisher: EDITOR,
  }
}

export interface Migalha {
  readonly nome: string
  readonly caminho: string
}

export function dadosDeMigalhas(itens: readonly Migalha[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.nome,
      item: absoluto(item.caminho),
    })),
  }
}

export function dadosDeFaq(perguntas: readonly { readonly pergunta: string; readonly resposta: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: perguntas.map((p) => ({
      '@type': 'Question',
      name: p.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: p.resposta },
    })),
  }
}

/**
 * A calculadora em si.
 *
 * `WebApplication` com preço zero: o produto é gratuito e sem cadastro, e
 * declarar isso é honesto e útil no resultado de busca. `browserRequirements`
 * fica de fora — não exigimos nada além de um navegador.
 */
export function dadosDaCalculadora(params: {
  readonly nome: string
  readonly descricao: string
  readonly caminho: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: params.nome,
    description: params.descricao,
    url: absoluto(params.caminho),
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: 'pt-BR',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
    publisher: EDITOR,
  }
}

export function dadosDoGuia(params: {
  readonly titulo: string
  readonly descricao: string
  readonly caminho: string
  readonly atualizadoEm: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.titulo,
    description: params.descricao,
    url: absoluto(params.caminho),
    mainEntityOfPage: absoluto(params.caminho),
    inLanguage: 'pt-BR',
    // `dateModified` sem `datePublished` é aceito e é o que temos de verdade:
    // a data de revisão do texto. Inventar uma data de publicação para
    // preencher o campo seria dado estruturado falso.
    dateModified: params.atualizadoEm,
    author: EDITOR,
    publisher: EDITOR,
  }
}
