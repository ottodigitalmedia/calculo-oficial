import { expect, test } from '@playwright/test'

/**
 * SEO técnico e guias — T-106.
 *
 * O que os testes de unidade não alcançam: `sitemap.ts` e `robots.ts` só viram
 * arquivo servido no build, e a canônica só existe no HTML entregue. É aqui
 * que se verifica o que o buscador vai de fato receber.
 */

const CALCULADORAS = ['salario-liquido', 'inss', 'irrf', 'juros-compostos']
const GUIAS = ['salario-bruto-e-liquido', 'como-o-inss-e-calculado', 'imposto-de-renda-na-folha']

// ---------------------------------------------------------------------------
// EP-013 e EP-014
// ---------------------------------------------------------------------------

test('EP-013 · o sitemap traz todas as rotas indexáveis e nenhuma query', async ({ request }) => {
  const resposta = await request.get('/sitemap.xml')
  expect(resposta.status()).toBe(200)

  const xml = await resposta.text()

  for (const slug of CALCULADORAS) expect(xml).toContain(`/calculadora/${slug}<`)
  for (const slug of GUIAS) expect(xml).toContain(`/guia/${slug}<`)
  for (const rota of ['/guias', '/privacidade', '/termos', '/cookies', '/aviso-legal']) {
    expect(xml).toContain(`${rota}<`)
  }

  // Query carrega salário e dados de contrato (RN-030). Uma URL com query no
  // sitemap convidaria o buscador a indexar exatamente o que a página marca
  // como `noindex`.
  //
  // A verificação é sobre as URLs, não sobre o documento: `<?xml ... ?>` tem
  // interrogação e não é endereço nenhum.
  const enderecos = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? '')
  expect(enderecos.length).toBeGreaterThanOrEqual(13)
  for (const endereco of enderecos) {
    expect(endereco, `"${endereco}" tem query`).not.toContain('?')
    expect(endereco).toMatch(/^https?:\/\//)
    // A verificação de saúde fica fora (EP-016).
    expect(endereco).not.toContain('/api/')
  }
})

test('EP-014 · o robots.txt libera o site, bloqueia a API e aponta o sitemap', async ({
  request,
}) => {
  const resposta = await request.get('/robots.txt')
  expect(resposta.status()).toBe(200)

  const texto = await resposta.text()
  expect(texto).toContain('Allow: /')
  expect(texto).toContain('Disallow: /api/')
  expect(texto).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/)
})

test('EP-016 · a verificação de saúde não é indexável', async ({ request }) => {
  const resposta = await request.get('/api/health')
  expect(resposta.status()).toBe(200)
  expect(resposta.headers()['x-robots-tag']).toContain('noindex')
})

// ---------------------------------------------------------------------------
// Metadados por rota
// ---------------------------------------------------------------------------

const ROTAS = [
  '/',
  '/guias',
  '/privacidade',
  '/termos',
  '/cookies',
  '/aviso-legal',
  ...CALCULADORAS.map((s) => `/calculadora/${s}`),
  ...GUIAS.map((s) => `/guia/${s}`),
]

for (const rota of ROTAS) {
  test(`${rota} tem título, descrição e canônica próprios`, async ({ page }) => {
    await page.goto(rota)

    await expect(page).toHaveTitle(/.{15,}/)

    const descricao = page.locator('meta[name="description"]')
    await expect(descricao).toHaveAttribute('content', /.{50,}/)

    const canonica = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonica, `${rota} sem canônica`).toBeTruthy()
    expect(canonica).toMatch(/^https?:\/\//)
    // Sem query e sem barra final: `06-api-spec` §2.1.
    expect(canonica).not.toContain('?')
    expect(canonica?.replace(/^https?:\/\/[^/]+/, '') || '/').toBe(rota)
  })
}

test('os títulos não se repetem entre rotas', async ({ page }) => {
  // Título repetido faz o buscador escolher uma página e descartar as outras.
  const vistos = new Map<string, string>()
  for (const rota of ROTAS) {
    await page.goto(rota)
    const titulo = await page.title()
    expect(vistos.has(titulo), `"${titulo}" repetido em ${rota} e ${vistos.get(titulo)}`).toBe(false)
    vistos.set(titulo, rota)
  }
})

// ---------------------------------------------------------------------------
// Dados estruturados
// ---------------------------------------------------------------------------

async function jsonLd(page: import('@playwright/test').Page): Promise<readonly unknown[]> {
  const textos = await page.locator('script[type="application/ld+json"]').allTextContents()
  return textos.map((t) => JSON.parse(t))
}

test('a calculadora marca FAQ, aplicação e trilha — e o FAQ bate com o visível', async ({
  page,
}) => {
  await page.goto('/calculadora/salario-liquido')

  const dados = (await jsonLd(page)) as { '@type': string; mainEntity?: { name: string }[] }[]
  const tipos = dados.map((d) => d['@type'])
  expect(tipos).toContain('WebApplication')
  expect(tipos).toContain('FAQPage')
  expect(tipos).toContain('BreadcrumbList')

  // Marcar pergunta que a página não exibe é a causa mais comum de penalização
  // por dado estruturado.
  const faq = dados.find((d) => d['@type'] === 'FAQPage')
  expect(faq?.mainEntity?.length).toBeGreaterThanOrEqual(4)
  for (const pergunta of faq?.mainEntity ?? []) {
    await expect(page.getByText(pergunta.name, { exact: true })).toBeVisible()
  }
})

test('o guia marca Article com a data de revisão exibida', async ({ page }) => {
  await page.goto('/guia/como-o-inss-e-calculado')

  const dados = (await jsonLd(page)) as { '@type': string; dateModified?: string }[]
  const artigo = dados.find((d) => d['@type'] === 'Article')
  expect(artigo).toBeDefined()
  expect(artigo?.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)

  const exibida = await page.locator('time[datetime]').first().getAttribute('datetime')
  expect(exibida).toBe(artigo?.dateModified)
})

test('a home marca o site', async ({ page }) => {
  await page.goto('/')
  const tipos = ((await jsonLd(page)) as { '@type': string }[]).map((d) => d['@type'])
  expect(tipos).toContain('WebSite')
})

// ---------------------------------------------------------------------------
// Guias
// ---------------------------------------------------------------------------

test('o guia exibe a tabela legal com norma, vigência e link oficial', async ({ page }) => {
  await page.goto('/guia/como-o-inss-e-calculado')

  // A tabela vem de lib/params (ADR-009 G-2), nunca digitada na prosa.
  const tabela = page.getByRole('table').first()
  await expect(tabela).toBeVisible()
  await expect(tabela.getByText(/R\$/).first()).toBeVisible()

  const fonte = page.getByRole('link', { name: 'ver a norma' }).first()
  const url = await fonte.getAttribute('href')
  // BV-07 / regra F-1: domínio oficial e HTTPS.
  expect(url).toMatch(/^https:\/\/[^/]*\.(gov|leg|jus)\.br(\/|$)/)
})

test('o guia fecha com o aviso de natureza informativa (RN-028)', async ({ page }) => {
  for (const slug of GUIAS) {
    await page.goto(`/guia/${slug}`)
    await expect(page.getByText(/não constitui aconselhamento jurídico/)).toBeVisible()
  }
})

test('o sumário do guia leva às seções', async ({ page }) => {
  await page.goto('/guia/salario-bruto-e-liquido')
  const sumario = page.getByRole('navigation', { name: 'Nesta página' })
  await expect(sumario).toBeVisible()

  const primeiro = sumario.getByRole('link').first()
  const destino = await primeiro.getAttribute('href')
  await primeiro.click()
  await expect(page).toHaveURL(new RegExp(`${destino?.replace('#', '\\#')}$`))
})

test('/guias lista os três guias e cada um abre', async ({ page }) => {
  await page.goto('/guias')
  for (const slug of GUIAS) {
    // `.first()`: o rodapé também lista os guias, em toda página.
    await expect(page.locator(`main a[href="/guia/${slug}"]`).first()).toBeVisible()
  }
})

// ---------------------------------------------------------------------------
// Ligação interna
// ---------------------------------------------------------------------------

test('T-104 · a calculadora mostra as relacionadas no fim da página', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')
  const secao = page.getByRole('heading', { name: 'Calculadoras relacionadas' })
  await expect(secao).toBeVisible()
  await expect(page.locator('a[href="/calculadora/inss"]').first()).toBeVisible()
  await expect(page.locator('a[href="/calculadora/irrf"]').first()).toBeVisible()
})

test('a calculadora leva aos guias que a explicam', async ({ page }) => {
  await page.goto('/calculadora/inss')
  await expect(page.getByRole('heading', { name: 'Entenda a conta' })).toBeVisible()
  await expect(page.locator('a[href="/guia/como-o-inss-e-calculado"]').first()).toBeVisible()
})

test('o rodapé não anuncia como "em breve" calculadora já publicada', async ({ page }) => {
  await page.goto('/')
  const rodape = page.getByRole('contentinfo')
  for (const slug of CALCULADORAS) {
    await expect(rodape.locator(`a[href="/calculadora/${slug}"]`)).toBeVisible()
  }
  await expect(rodape.getByText('em breve', { exact: false })).toHaveCount(0)
})
