import { expect, test } from '@playwright/test'

import { CATALOGO } from '../../src/lib/calculadoras/indice'

/**
 * Todas as calculadoras publicadas, sobre a mesma página genérica
 * (`ADR-008` E-1). Se o molde não fosse genérico de verdade, estes testes
 * exigiriam tratamento distinto por calculadora — e não exigem.
 *
 * **A lista É DERIVADA do registro, e isso não é conveniência.** Ela era fixa,
 * escrita no T-104 com as quatro do lançamento. As seis calculadoras
 * publicadas em 31/07/2026 nunca foram exercitadas de ponta a ponta — e foi
 * assim que CALC-006 foi ao ar sem calcular: a data de referência padrão caía
 * fora da vigência dos parâmetros de jornada, e nenhum teste abria a página.
 *
 * `indice.ts` é a lista leve, mantida em sincronia com as definições por
 * `catalogo.test.ts`. Derivar dela mantém este arquivo fora do pacote do
 * navegador e ainda assim completo.
 */

const CALCULADORAS = CATALOGO.map((c) => ({ slug: c.slug, titulo: c.nome }))

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

/**
 * O teste que teria pego CALC-006 quebrada.
 *
 * Abrir a página não basta: uma calculadora pode renderizar o formulário
 * inteiro e falhar no primeiro cálculo, que é exatamente o que aconteceu
 * quando a data de referência padrão caiu fora da vigência dos parâmetros.
 * Aqui todo campo obrigatório é preenchido e o resultado tem de aparecer.
 */
for (const c of CALCULADORAS) {
  test(`${c.slug} · calcula de verdade, não só renderiza`, async ({ page }) => {
    await page.goto(`/calculadora/${c.slug}`)

    /**
     * O valor precisa respeitar o tipo do campo. Campo inteiro tem máximo
     * pequeno — 12 meses, 20 dependentes, 27 dias úteis —, e enchê-lo com o
     * mesmo número do campo monetário deixa o formulário em erro de validação,
     * não em resultado. `inputMode` distingue os dois: `numeric` é inteiro,
     * `decimal` é monetário ou percentual.
     */
    const entradas = page.locator('main form input')
    for (let i = 0; i < (await entradas.count()); i += 1) {
      const campo = entradas.nth(i)
      if (!(await campo.isVisible())) continue

      /**
       * Só os obrigatórios. Encher todo campo com o mesmo valor produz cenário
       * degenerado — no CET, tarifas iguais ao empréstimo inteiro, que a
       * calculadora recusa com razão. O que este teste verifica é se a
       * calculadora computa com a entrada MÍNIMA, que é o caminho por onde a
       * maioria dos visitantes passa.
       */
      if ((await campo.getAttribute('aria-required')) !== 'true') continue

      const tipo = await campo.getAttribute('type')
      if (tipo === 'date') {
        await campo.fill(i === 0 ? '2020-03-10' : '2026-07-15')
        continue
      }

      const modo = await campo.getAttribute('inputMode')
      if (modo === 'numeric') {
        // 5 cabe em todo mínimo e em todo máximo inteiro do catálogo.
        await campo.fill('5')
        continue
      }

      // Monetário e percentual dividem `inputMode="decimal"`; o placeholder os
      // separa. A taxa tem máximo de 100%, e enchê-la com o valor do campo
      // monetário deixa o formulário em erro de validação.
      const marcador = await campo.getAttribute('placeholder')
      await campo.fill(marcador === 'R$ 0,00' ? '300000' : '100')
    }

    const resultado = page.locator('main [aria-live]')
    await expect(resultado).toContainText('R$')
    await expect(
      resultado,
      'a calculadora renderizou mas não calculou — parâmetro sem cobertura na data padrão?',
    ).not.toContainText('Não foi possível calcular')
  })
}

/**
 * "− R$ 0,00" anuncia um desconto que não existe. Em CALC-005 ele aparecia ao
 * lado de verbas reais, e nesse contexto lê-se como defeito de cálculo — não
 * como ausência de imposto.
 */
test('valor zerado no detalhamento não leva sinal de menos', async ({ page }) => {
  await page.goto('/calculadora/decimo-terceiro?salario=300000&mesesTrabalhados=3')
  const detalhamento = page.locator('main [aria-live]')
  await expect(detalhamento).toContainText('R$')
  await expect(detalhamento).not.toContainText('− R$ 0,00')
  await expect(detalhamento).not.toContainText('+ R$ 0,00')
})
