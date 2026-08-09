import { expect, test } from '@playwright/test'

/**
 * Imprimir e compartilhar o cálculo — `RF-006` / `US-009`, e `MC-7`.
 *
 * ## POR QUE ISTO PRECISA DE TESTE, E NÃO DE UMA OLHADA
 *
 * Folha de impressão é a superfície mais fácil de quebrar sem ninguém notar:
 * **ninguém abre o diálogo de impressão ao revisar uma mudança de layout.** Um
 * `display: none` acrescentado meses depois, num seletor genérico, tira a
 * memória de cálculo do papel — e o sintoma só aparece quando alguém leva o
 * documento ao RH e ele chega sem a conta.
 *
 * `emulateMedia({ media: 'print' })` resolve o que a inspeção manual não
 * alcança: o navegador aplica as regras de `@media print` de verdade.
 *
 * ## `window.print` É SUBSTITUÍDO, E NÃO CHAMADO
 *
 * O diálogo de impressão é do sistema operacional e travaria a suíte. O que se
 * verifica aqui é tudo o que acontece **antes** dele: a memória abrir e o
 * documento ficar com a forma certa. Chamar o diálogo de verdade não provaria
 * mais nada e não teria como fechar sozinho.
 */

const COM_VALORES = '/calculadora/salario-liquido?salarioBruto=538271'

/** Substitui o diálogo e registra que ele foi pedido. */
async function interceptarImpressao(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { __imprimiu: boolean }).__imprimiu = false
    window.print = () => {
      ;(window as unknown as { __imprimiu: boolean }).__imprimiu = true
    }
  })
}

test.describe('impressão do cálculo', () => {
  /**
   * `MC-7` exige a memória legível no papel. A primeira implementação deixava o
   * bloco sempre no DOM, escondido por CSS — e reprovou 170 testes: o `h3` dela
   * quebrava a hierarquia de títulos e cada valor passava a existir duas vezes
   * no documento. A garantia mudou de lugar: quem abre a memória é o botão,
   * antes de o diálogo aparecer.
   */
  test('MC-7 · o botão abre a memória antes de mandar imprimir', async ({ page }) => {
    await interceptarImpressao(page)
    await page.goto(COM_VALORES)

    const memoria = page.locator('#memoria-de-calculo')
    await expect(memoria, 'a memória abre recolhida, como sempre').toHaveCount(0)

    await page.getByRole('button', { name: /Imprimir/ }).click()

    await expect(
      memoria,
      'O botão de imprimir não abriu a memória de cálculo. Um resultado no papel ' +
        'sem a conta que o sustenta é o oposto do que este produto vende (MC-7).',
    ).toBeVisible()
    await expect(memoria.getByText('Como chegamos a este valor')).toBeVisible()

    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __imprimiu: boolean }).__imprimiu))
      .toBe(true)
  })

  test('o documento impresso não leva o cromo do site', async ({ page }) => {
    await interceptarImpressao(page)
    await page.goto(COM_VALORES)
    await page.getByRole('button', { name: /Imprimir/ }).click()
    await page.emulateMedia({ media: 'print' })

    // Cabeçalho, rodapé e navegação são do site, não do documento.
    // `banner`/`contentinfo` e não `header`/`footer`: a própria página tem um
    // `<header>` interno com o título, e o seletor de elemento casava com os dois.
    await expect(page.getByRole('banner')).toBeHidden()
    await expect(page.getByRole('contentinfo')).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Trilha de navegação' })).toBeHidden()

    // FAQ é conteúdo de aquisição, não prova.
    await expect(page.getByRole('heading', { name: 'Perguntas frequentes' })).toBeHidden()

    // Botão impresso é tinta gasta com o que ninguém pode clicar.
    await expect(page.getByRole('button', { name: /Imprimir/ })).toBeHidden()

    // E a memória continua lá, que é o ponto do documento.
    await expect(page.locator('#memoria-de-calculo')).toBeVisible()
  })

  test('o aviso de estimativa acompanha o documento', async ({ page }) => {
    await interceptarImpressao(page)
    await page.goto(COM_VALORES)
    await page.emulateMedia({ media: 'print' })

    // `RN-028`: o papel circula sem o site em volta, e precisa dizer o que é.
    await expect(page.getByText(/Estimativa com base/)).toBeVisible()
  })

  test('a norma citada sai conferível — com o endereço, e não só sublinhada', async ({ page }) => {
    await interceptarImpressao(page)
    await page.goto(COM_VALORES)
    await page.getByRole('button', { name: /Imprimir/ }).click()
    await page.emulateMedia({ media: 'print' })

    const links = page.locator('#memoria-de-calculo a[href^="http"]')
    expect(await links.count(), 'a memória do salário líquido cita normas oficiais').toBeGreaterThan(
      0,
    )

    // O `::after` com o href é o que torna o papel auditável fora da tela.
    const conteudo = await links
      .first()
      .evaluate((el) => window.getComputedStyle(el, '::after').content)
    expect(conteudo, 'o endereço da norma não é impresso ao lado do link').toContain('http')
  })
})

test.describe('compartilhar o cálculo', () => {
  /**
   * `US-009` terminava em *"copio a URL da barra de endereço"* — instrução de
   * quem já sabe, no aparelho onde isso é mais difícil de fazer. O botão é o
   * que faltava da história.
   */
  test('US-009 · o botão copia o link com o cenário preenchido', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto(COM_VALORES)

    await page.getByRole('button', { name: /Copiar link|Compartilhar/ }).click()

    const copiado = await page.evaluate(() => navigator.clipboard.readText())
    expect(copiado, 'o link copiado não reproduz o cálculo').toContain('salarioBruto=538271')
  })

  /**
   * O AVISO NÃO É EXCESSO DE ZELO, E ESTE CASO É O QUE O MANTÉM.
   *
   * `RF-006` põe o formulário na query, então o link carrega salário, pensão e
   * saldo de FGTS. Um botão que facilita o envio sem dizer o que vai junto
   * transforma decisão informada em acidente.
   */
  test('o usuário é avisado de que o link carrega o que ele digitou', async ({ page }) => {
    await page.goto(COM_VALORES)
    await expect(page.getByText(/carrega os valores que você digitou/)).toBeVisible()
  })
})
