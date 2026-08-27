/**
 * Rotas indexáveis, sitemap e robots — EP-013 e EP-014.
 *
 * O defeito que este arquivo existe para impedir é silencioso: publicar uma
 * calculadora e ela não entrar no sitemap. Nada quebra, nenhuma página some, e
 * o único canal de aquisição do produto simplesmente não a encontra.
 *
 * O `ref=` na URL já produziu um defeito dessa família no T-105 — toda página
 * recém-aberta ganhava query, e query implica `noindex`. Custou uma linha para
 * corrigir e teria custado o tráfego inteiro para descobrir em produção.
 */

import { describe, expect, it } from 'vitest'

import { CALCULADORAS } from '../../src/lib/calculadoras'
import { GUIAS } from '../../src/lib/guias'
import { SITE_URL, absoluto, rotasIndexaveis, tituloDeBusca } from '../../src/lib/seo'

const rotas = rotasIndexaveis()
const caminhos = rotas.map((r) => r.caminho)

describe('absoluto', () => {
  it('devolve a origem sem barra final para a raiz', () => {
    expect(absoluto('/')).toBe(SITE_URL)
    expect(absoluto('/')).not.toMatch(/\/$/)
  })

  it('monta a URL completa a partir da rota', () => {
    expect(absoluto('/guias')).toBe(`${SITE_URL}/guias`)
  })

  it('aceita rota sem barra inicial', () => {
    expect(absoluto('guias')).toBe(`${SITE_URL}/guias`)
  })
})

describe('rotas indexáveis', () => {
  it('inclui toda calculadora publicada', () => {
    for (const c of CALCULADORAS) {
      expect(caminhos, `"${c.slug}" está publicada e fora do sitemap`).toContain(
        `/calculadora/${c.slug}`,
      )
    }
  })

  it('inclui todo guia publicado', () => {
    for (const g of GUIAS) {
      expect(caminhos, `guia "${g.slug}" está publicado e fora do sitemap`).toContain(
        `/guia/${g.slug}`,
      )
    }
  })

  it('inclui a home e as páginas legais', () => {
    for (const rota of ['/', '/guias', '/aviso-legal', '/privacidade', '/termos', '/cookies']) {
      expect(caminhos).toContain(rota)
    }
  })

  it('não repete rota', () => {
    expect(new Set(caminhos).size).toBe(caminhos.length)
  })

  it('nenhuma rota tem query string', () => {
    // Query carrega salário e dados de contrato (RN-030). Uma rota com query
    // no sitemap convida o buscador a indexar exatamente o que a página marca
    // como `noindex`.
    for (const caminho of caminhos) {
      expect(caminho, `"${caminho}" tem query`).not.toContain('?')
      expect(caminho).not.toContain('&')
    }
  })

  it('nenhuma rota tem barra final', () => {
    // `06-api-spec` §2.1: barra final redireciona. Anunciar a versão que
    // redireciona gasta orçamento de rastreamento à toa.
    for (const caminho of caminhos.filter((c) => c !== '/')) {
      expect(caminho).not.toMatch(/\/$/)
    }
  })

  it('não expõe a verificação de saúde', () => {
    // EP-016 é a única rota dinâmica e responde `x-robots-tag: noindex`.
    expect(caminhos.some((c) => c.startsWith('/api'))).toBe(false)
  })

  it('toda rota começa com barra', () => {
    for (const caminho of caminhos) expect(caminho.startsWith('/')).toBe(true)
  })

  it('a prioridade fica no intervalo aceito', () => {
    for (const rota of rotas) {
      expect(rota.prioridade).toBeGreaterThan(0)
      expect(rota.prioridade).toBeLessThanOrEqual(1)
    }
  })

  it('a home tem a prioridade mais alta', () => {
    const home = rotas.find((r) => r.caminho === '/')
    expect(home?.prioridade).toBe(Math.max(...rotas.map((r) => r.prioridade)))
  })

  it('só declara data de modificação onde ela é real', () => {
    // Carimbar a data do build em tudo faz o site alegar, a cada deploy, que
    // todas as páginas mudaram — e o buscador passa a ignorar o campo.
    for (const rota of rotas) {
      if (rota.atualizadoEm === undefined) continue
      expect(rota.caminho.startsWith('/guia/')).toBe(true)
      expect(rota.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('origem do site', () => {
  it('é HTTPS e não termina em barra', () => {
    expect(SITE_URL).toMatch(/^https:\/\//)
    expect(SITE_URL).not.toMatch(/\/$/)
  })
})

/**
 * O que o buscador EXIBE — e por que isto precisa ser teste.
 *
 * Título comprido e descrição comprida não quebram nada: a página abre, o
 * cálculo funciona, nenhuma suíte reclama. O prejuízo acontece fora do
 * repositório, no resultado de busca, cortado com reticências — e busca
 * orgânica é o único canal de aquisição do produto (`01-prd` §5).
 *
 * Foi assim que 28 títulos e 21 descrições passaram do limite sem ninguém
 * notar, até a varredura de 27/08/2026 medir as 121 páginas publicadas. É a
 * mesma família de defeito silencioso que o resto deste arquivo vigia.
 */
describe('limites do resultado de busca', () => {
  /** ~60 caracteres é o corte usual do Google. Ver `tituloDeBusca`. */
  const LIMITE_TITULO = 60
  /** ~160 para a descrição, pelo mesmo motivo. */
  const LIMITE_DESCRICAO = 160

  it('nenhum título de calculadora passa do limite', () => {
    for (const c of CALCULADORAS) {
      const titulo = tituloDeBusca(c.nome)
      expect(
        titulo.length,
        `"${titulo}" tem ${titulo.length} caracteres e será cortado na busca. ` +
          'Encurte o nome da calculadora.',
      ).toBeLessThanOrEqual(LIMITE_TITULO)
    }
  })

  it('nenhum título de guia passa do limite', () => {
    for (const g of GUIAS) {
      const titulo = tituloDeBusca(g.tituloSeo ?? g.titulo)
      expect(
        titulo.length,
        `"${titulo}" tem ${titulo.length} caracteres e será cortado na busca. ` +
          'Declare um `tituloSeo` curto no guia — o `titulo` continua servindo ao h1.',
      ).toBeLessThanOrEqual(LIMITE_TITULO)
    }
  })

  it('nenhuma descrição passa do limite', () => {
    const todas = [
      ...CALCULADORAS.map((c) => [`calculadora "${c.slug}"`, c.descricaoSeo] as const),
      ...GUIAS.map((g) => [`guia "${g.slug}"`, g.descricaoSeo] as const),
    ]
    for (const [onde, descricao] of todas) {
      expect(
        descricao.length,
        `${onde}: descrição com ${descricao.length} caracteres, será cortada na busca`,
      ).toBeLessThanOrEqual(LIMITE_DESCRICAO)
    }
  })

  it('a marca entra no título quando há folga, e sai quando não há', () => {
    // Prova de mutação: sem esta dupla, `tituloDeBusca` poderia devolver o
    // título cru sempre e os casos acima continuariam passando.
    expect(tituloDeBusca('Salário líquido')).toBe('Salário líquido · Cálculo Oficial')

    const comprido = 'a'.repeat(50)
    expect(tituloDeBusca(comprido)).toBe(comprido)
  })
})
