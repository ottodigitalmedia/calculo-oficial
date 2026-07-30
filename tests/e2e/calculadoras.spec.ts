import { expect, test } from '@playwright/test'

/**
 * As quatro calculadoras do lançamento, sobre a mesma página genérica
 * (`ADR-008` E-1). Se o molde não fosse genérico de verdade, estes testes
 * exigiriam tratamento distinto por calculadora — e não exigem.
 */

const CALCULADORAS = [
  { slug: 'salario-liquido', titulo: 'Salário líquido' },
  { slug: 'inss', titulo: 'INSS mensal' },
  { slug: 'irrf', titulo: 'Imposto de Renda na fonte' },
  { slug: 'juros-compostos', titulo: 'Juros compostos' },
]

for (const c of CALCULADORAS) {
  test(`${c.slug} · abre, tem título único e aviso legal`, async ({ page }) => {
    await page.goto(`/calculadora/${c.slug}`)
    await expect(page.getByRole('heading', { name: c.titulo, level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Perguntas frequentes' })).toBeVisible()
  })
}

test('INSS · mostra a alíquota efetiva, que é a saída secundária de CALC-016', async ({ page }) => {
  await page.goto('/calculadora/inss')
  await page.getByLabel('Salário de contribuição').fill('500000')
  // Conferido à mão contra a tabela de 2026: R$ 501,51 sobre R$ 5.000,00.
  await expect(page.getByText('R$ 501,51').first()).toBeVisible()
  // Escopado ao bloco de resultado: "alíquota efetiva" também aparece na
  // linha de contexto e no FAQ, e sem escopo o localizador é ambíguo.
  const resultado = page.locator('[aria-live="polite"]')
  await expect(resultado.getByText('Alíquota efetiva:')).toBeVisible()
  await expect(resultado.getByText('10,03%')).toBeVisible()
})

test('IRRF · a contribuição é campo editável e a memória registra a origem', async ({ page }) => {
  await page.goto('/calculadora/irrf')
  await page.getByLabel('Rendimento bruto do mês').fill('600000')
  await expect(page.getByText(/calculada pela tabela do período/)).toBeVisible()

  await page.getByLabel('Contribuição previdenciária descontada').fill('64960')
  await expect(page.getByText(/valor de contribuição previdenciária que você informou/)).toBeVisible()
  // Exemplo 4 da Receita: imposto de R$ 382,88.
  await expect(page.getByText('R$ 382,88').first()).toBeVisible()
})

test('juros compostos · não tem seletor de período, por não ter parâmetro legal', async ({
  page,
}) => {
  await page.goto('/calculadora/juros-compostos')
  await expect(page.getByLabel('Período de referência')).toBeHidden()

  await page.getByLabel('Valor inicial').fill('100000')
  await page.getByLabel('Taxa de juros').fill('100')
  // O padrão do período da taxa é "ao ano"; aqui queremos 1% AO MÊS.
  await page.getByLabel('Período da taxa').selectOption('mes')
  await expect(page.getByText('Evolução ano a ano')).toBeVisible()
  // R$ 1.000,00 a 1% ao mês por 12 meses, capitalizando mês a mês.
  await expect(page.getByText('R$ 1.126,84').first()).toBeVisible()
})
