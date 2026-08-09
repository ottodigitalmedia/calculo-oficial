import { expect, test } from '@playwright/test'

/**
 * A página 404 — a única rota pública que ninguém revisa.
 *
 * Até 08/08/2026 este projeto não tinha `not-found.tsx`, e servia a página
 * padrão do Next: *"This page could not be found."*, em inglês, com estilo
 * embutido e sem contêiner, entre o cabeçalho e o rodapé estilizados do site.
 * Ninguém tinha visto porque ninguém digita endereço errado de propósito — ela
 * foi encontrada procurando outra coisa.
 *
 * A entrada dominante deste produto é busca externa direto na calculadora
 * (`10-ux-ui-spec` §8), então o 404 recebe resultado de busca velho e link de
 * terceiro quebrado: gente com intenção clara, a um passo da ferramenta certa.
 *
 * O caso do idioma é o que impede a regressão mais provável — alguém remove o
 * arquivo, ou o move, e o padrão do framework volta sem nada ficar vermelho.
 */

const INEXISTENTE = '/calculadora/isto-nao-existe-em-lugar-nenhum'

test('responde 404 de verdade, e não 200 com cara de erro', async ({ request }) => {
  // Página de erro que responde 200 faz o buscador indexar o erro.
  const resposta = await request.get(INEXISTENTE)
  expect(resposta.status()).toBe(404)
})

test('fala português, e não a mensagem padrão do framework', async ({ page }) => {
  await page.goto(INEXISTENTE)

  await expect(page.getByRole('heading', { name: 'Esta página não existe', level: 1 })).toBeVisible()
  await expect(
    page.getByText('This page could not be found'),
    'a página padrão do Next voltou — `src/app/not-found.tsx` sumiu ou foi movido',
  ).toHaveCount(0)
})

test('usa a moldura do site, alinhada como as demais rotas', async ({ page }) => {
  await page.goto(INEXISTENTE)

  // O alvo do "pular para o conteúdo" precisa existir aqui como em toda rota.
  await expect(page.locator('#conteudo')).toBeVisible()

  // A grade é uma só (`lib/layout.ts`): o título alinha com o logotipo.
  const logo = await page.locator('header a').first().boundingBox()
  const titulo = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(logo).not.toBeNull()
  expect(titulo).not.toBeNull()
  expect(
    Math.round(titulo!.x),
    'o conteúdo do 404 não alinha com o cabeçalho — ver lib/layout.ts',
  ).toBe(Math.round(logo!.x))
})

test('oferece saída para o catálogo e para os guias', async ({ page }) => {
  await page.goto(INEXISTENTE)

  // Quem chega aqui tem intenção clara. Mandar embora sem caminho desperdiça o
  // único canal de aquisição do projeto.
  await page.getByRole('link', { name: 'Ver todas as calculadoras' }).click()
  await expect(page).toHaveURL(/#calculadoras$/)
})

test('não é indexável', async ({ page }) => {
  await page.goto(INEXISTENTE)
  /**
   * A página emite MAIS DE UMA etiqueta `robots`, e isso é do Next: a do
   * `layout` e a da própria página convivem. No 404 sob `/calculadora/`, a do
   * layout vem primeiro e diz `index, follow`.
   *
   * Não é falha de proteção. O que decide é o **status 404**, verificado no
   * primeiro caso deste arquivo, e o buscador aplica a diretiva mais restritiva
   * quando há conflito. O que se cobra aqui é que a página se declare fora do
   * índice — não que ela o faça uma vez só.
   */
  const conteudos = await page.locator('meta[name="robots"]').evaluateAll((ms) =>
    ms.map((m) => m.getAttribute('content') ?? ''),
  )
  expect(conteudos.length, 'nenhuma etiqueta robots na página').toBeGreaterThan(0)
  expect(
    conteudos.some((c) => c.includes('noindex')),
    `nenhuma etiqueta robots declara noindex: ${conteudos.join(' | ')}`,
  ).toBe(true)
})
