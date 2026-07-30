import { expect, test } from '@playwright/test'

/**
 * TC-037 — Conferir o holerite (`12-test-plan` §6).
 *
 * O primeiro dos três fluxos que, se quebrarem, tornam o produto inútil:
 * chegar na calculadora, preencher, ver o resultado, expandir a memória e
 * seguir o link da fonte.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')
})

test('calcula sem clique e mostra o resultado', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Salário líquido', level: 1 })).toBeVisible()
  // Estado vazio (§1.5).
  await expect(page.getByText('Preencha os campos ao lado para ver o resultado.')).toBeVisible()

  // R$ 5.000,00 digitado como centavos.
  await page.getByLabel('Salário bruto mensal').fill('500000')

  // §1.2: dispara sozinho, sem botão "Calcular".
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()

  // Conferido à mão contra as tabelas de 2026:
  //   INSS  R$ 501,51   IRRF  R$ 0,00 (zerado pelo redutor)
  //   líquido = 5.000,00 − 501,51 = R$ 4.498,49
  await expect(page.getByText('R$ 4.498,49').first()).toBeVisible()
})

test('a memória de cálculo abre, mostra as etapas e cita a fonte oficial', async ({ page }) => {
  await page.getByLabel('Salário bruto mensal').fill('500000')
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()

  // Ancorado em aria-controls, não no rótulo: o texto do botão muda ao abrir
  // ("Recolher memória de cálculo"), e localizar por nome quebraria depois do
  // clique — o que é comportamento correto da interface, não defeito.
  const acionador = page.locator('button[aria-controls="memoria-de-calculo"]')
  await expect(acionador).toHaveAttribute('aria-expanded', 'false')
  await acionador.click()
  await expect(acionador).toHaveAttribute('aria-expanded', 'true')

  // MC-1: etapas numeradas, em lista ordenada.
  const etapas = page.locator('#memoria-de-calculo ol > li')
  expect(await etapas.count()).toBeGreaterThan(5)

  // MC-3: vigência e link para a norma.
  await expect(page.getByText(/Parâmetro:.*Tabela de contribuição/).first()).toBeVisible()
  const fonte = page.locator('#memoria-de-calculo a[href^="https://"]').first()
  await expect(fonte).toBeVisible()
  const href = await fonte.getAttribute('href')
  expect(href).toMatch(/^https:\/\/[^/]*\.(gov|leg|jus)\.br\//)
})

test('RN-028 · o aviso de estimativa aparece com o resultado', async ({ page }) => {
  await page.getByLabel('Salário bruto mensal').fill('500000')
  await expect(page.getByText(/Estimativa com base nos dados informados/)).toBeVisible()
  // Proibido afirmar direito (RN-028).
  await expect(page.getByText(/você tem direito/i)).toHaveCount(0)
})

test('RF-004 · trocar o período muda o resultado e a vigência exibida', async ({ page }) => {
  await page.getByLabel('Salário bruto mensal').fill('500000')
  await expect(page.getByText('R$ 4.498,49').first()).toBeVisible()

  await page.getByLabel('Período de referência').selectOption({ label: '2025' })

  // Em 2025 NÃO há redutor, então o imposto não zera:
  //   INSS R$ 509,60 · IRRF R$ 312,89 · líquido = R$ 4.177,51
  await expect(page.getByText('R$ 4.177,51').first()).toBeVisible()

  await page.locator('button[aria-controls="memoria-de-calculo"]').click()
  // Escopado ao painel: sem isso o regex casa com a <option> oculta do
  // próprio seletor de período, e o teste passaria sem verificar nada.
  const memoria = page.locator('#memoria-de-calculo')
  await expect(memoria.getByText(/01\/01\/2025/).first()).toBeVisible()
  await expect(memoria.getByText(/Portaria Interministerial MPS\/MF nº 6/).first()).toBeVisible()
})

test('§1.5 · campo obrigatório vazio mantém estado pendente, sem número parcial', async ({ page }) => {
  await page.getByLabel('Número de dependentes').fill('2')
  await expect(page.getByText(/Falta preencher/)).toBeVisible()
  await expect(page.getByText('Salário líquido estimado')).toHaveCount(0)
})

test('§6 · o asterisco de obrigatório não é anunciado pelo leitor de tela', async ({ page }) => {
  // O nome acessível precisa ser "Salário bruto mensal", não "... *".
  // A obrigatoriedade vai por aria-required, que os leitores anunciam como
  // "obrigatório" — o asterisco é marca visual.
  // getByRole usa o NOME ACESSÍVEL; getByLabel usa o texto do rótulo, que
  // ainda contém o asterisco marcado como aria-hidden. Quem importa aqui é o
  // nome acessível, porque é ele que o leitor de tela anuncia.
  const campo = page.getByRole('textbox', { name: 'Salário bruto mensal', exact: true })
  await expect(campo).toBeVisible()
  await expect(campo).toHaveAttribute('aria-required', 'true')
})
