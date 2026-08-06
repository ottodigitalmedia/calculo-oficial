import { expect, test } from '@playwright/test'

/** Busca local, navegação e páginas legais — `RF-007`, `RF-010`. */

test('US-011 · a busca filtra sem requisição de rede', async ({ page }) => {
  const requisicoes: string[] = []
  page.on('request', (r) => requisicoes.push(r.url()))

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const antes = requisicoes.length

  await page.getByLabel('Buscar calculadora').fill('holerite')

  /*
   * A verificação é ESCOPADA à lista de resultados, e o motivo é uma armadilha
   * real: a home também lista os guias, e o guia de juros compostos tem no
   * título o nome da calculadora. Como `getByRole` casa o nome acessível por
   * subcadeia, a asserção sem escopo passou a reprovar quando o guia foi
   * publicado — apontando para a busca, que estava certa.
   *
   * Asserção de ausência precisa dizer ONDE a coisa não pode estar. Sem isso,
   * ela mede a página inteira e falha por conteúdo que nada tem com o que o
   * teste verifica.
   */
  const resultados = page.getByRole('list', { name: 'Resultados da busca' })

  // Sinônimo: "holerite" não está no nome da calculadora.
  await expect(resultados.getByRole('heading', { name: 'Salário líquido' })).toBeVisible()
  await expect(resultados.getByRole('heading', { name: 'Juros compostos' })).toHaveCount(0)

  expect(requisicoes.length).toBe(antes)
})

test('busca sem resultado explica e oferece saída', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Buscar calculadora').fill('xyzabc')
  await expect(page.getByText('Não encontramos nada com esse termo.')).toBeVisible()
  await page.getByRole('button', { name: 'Veja todas as calculadoras.' }).click()
  await expect(page.getByRole('heading', { name: 'Salário líquido' })).toBeVisible()
})

test('qualquer calculadora está a um clique da home', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Salário líquido/ }).first().click()
  await expect(page).toHaveURL(/\/calculadora\/salario-liquido/)
})

for (const [rota, titulo] of [
  ['/aviso-legal', 'Aviso legal'],
  ['/privacidade', 'Privacidade'],
  ['/termos', 'Termos de uso'],
  ['/cookies', 'Cookies'],
] as const) {
  test(`RF-010 · ${rota} existe e tem título único`, async ({ page }) => {
    await page.goto(rota)
    await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })
}

test('o aviso legal declara que o site NÃO é órgão público', async ({ page }) => {
  await page.goto('/aviso-legal')
  await expect(page.getByText(/não é órgão público/)).toBeVisible()
  await expect(page.getByText(/não constituem aconselhamento/)).toBeVisible()
})

test('a política de privacidade afirma que não há banco de dados', async ({ page }) => {
  await page.goto('/privacidade')
  await expect(page.getByText(/Não há banco de dados neste site/)).toBeVisible()
})
