import { expect, test } from '@playwright/test'

/**
 * TC-028 a TC-031 — permalink de cálculo (`RF-006`).
 *
 * É o que entrega "salvar cálculo" sem banco e sem conta, e o que torna
 * `ADR-002` sustentável.
 */

test('TC-028 · o estado do formulário aparece na URL', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')
  await page.getByLabel('Salário bruto mensal').fill('850000')
  await page.getByLabel('Número de dependentes').fill('2')
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()

  await expect(page).toHaveURL(/salarioBruto=850000/)
  await expect(page).toHaveURL(/dependentes=2/)
  // Valores monetários em CENTAVOS, sem separador (06-api-spec §2.3).
  await expect(page).not.toHaveURL(/8\.500,00/)
})

test('TC-029 · abrir a URL em contexto novo reproduz o mesmo resultado', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido?salarioBruto=850000&dependentes=2&ref=2026-06-15')
  // Conferido em tests/golden/salario-liquido.test.ts: R$ 6.459,14.
  await expect(page.getByText('R$ 6.459,14').first()).toBeVisible()
  await expect(page.getByLabel('Salário bruto mensal')).toHaveValue(/8\.500,00/)
})

test('TC-030 · valor inválido na query cai no padrão, sem quebrar a página', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido?salarioBruto=850000&dependentes=abacaxi&naoExiste=1')
  // O campo inválido volta ao padrão; o parâmetro desconhecido é ignorado.
  await expect(page.getByLabel('Número de dependentes')).toHaveValue('0')
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()
})

test('TC-031 · página com query recebe noindex e canônica sem query', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')
  // Sem query, indexável.
  await expect(page.locator('meta[name="robots"][data-query]')).toHaveCount(0)

  await page.getByLabel('Salário bruto mensal').fill('500000')
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()

  // A query carrega salário: a página não pode ser indexada com dados de
  // alguém (07-security §4.3).
  await expect(page.locator('meta[name="robots"][data-query]')).toHaveAttribute(
    'content',
    /noindex/,
  )
  const canonica = await page.locator('link[rel="canonical"]').getAttribute('href')
  expect(canonica).not.toContain('?')
})

test('a URL fica limpa quando o formulário está no padrão', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')
  await expect(page).not.toHaveURL(/\?/)
})

test('o período padrão NÃO entra na URL — se entrasse, toda calculadora ficaria noindex', async ({
  page,
}) => {
  // Regressão. A referência padrão era escrita sempre, dando query a qualquer
  // página recém-aberta; query implica noindex, e o produto vive de busca
  // orgânica. O defeito seria fatal e invisível.
  await page.goto('/calculadora/inss')
  await expect(page).not.toHaveURL(/ref=/)
  await expect(page.locator('meta[name="robots"][data-query]')).toHaveCount(0)

  // Trocar o período, aí sim, aparece.
  await page.getByLabel('Período de referência').selectOption({ label: '2025' })
  await expect(page).toHaveURL(/ref=2025/)
})
