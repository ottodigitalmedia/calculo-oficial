import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

/**
 * Acessibilidade — T-107, `RNF-006`, `10-ux-ui-spec` §6.
 *
 * O verificador automático encontra talvez metade das barreiras reais. Por isso
 * há duas camadas aqui: a varredura da ferramenta e os percursos manuais de
 * teclado e de anúncio, que é onde vivem as barreiras que nenhuma ferramenta vê
 * — armadilha de foco, ordem de tabulação e região dinâmica que interrompe
 * quem está digitando.
 */

const CALCULADORAS = ['salario-liquido', 'inss', 'irrf', 'juros-compostos']
const GUIAS = ['salario-bruto-e-liquido', 'como-o-inss-e-calculado', 'imposto-de-renda-na-folha']

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

/** Níveis A e AA, que é o que `RNF-006` exige. */
const NIVEIS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

// ---------------------------------------------------------------------------
// Varredura automática
// ---------------------------------------------------------------------------

for (const rota of ROTAS) {
  test(`${rota} não tem violação de nível A nem AA`, async ({ page }) => {
    await page.goto(rota)

    const { violations } = await new AxeBuilder({ page }).withTags(NIVEIS).analyze()

    // A mensagem precisa dizer O QUE quebrou e ONDE. Um teste de
    // acessibilidade que falha com "esperado 0, recebido 3" leva quem for
    // corrigir a abrir a ferramenta de novo do zero.
    const resumo = violations.map(
      (v) => `\n  [${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
    )
    expect(violations.map((v) => v.id), `Violações em ${rota}:${resumo.join('')}`).toEqual([])
  })
}

test('a calculadora continua acessível com o resultado na tela', async ({ page }) => {
  // A varredura acima pega a página em repouso. O resultado, a memória de
  // cálculo e a tabela só existem depois do preenchimento — e é justamente
  // onde há mais marcação.
  await page.goto('/calculadora/salario-liquido')
  await page.getByLabel('Salário bruto mensal').fill('5000,00')
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()

  await page.getByRole('button', { name: 'Ver como este valor foi calculado' }).click()

  const { violations } = await new AxeBuilder({ page }).withTags(NIVEIS).analyze()
  const resumo = violations.map((v) => `\n  [${v.impact}] ${v.id}: ${v.help}`)
  expect(violations.map((v) => v.id), `Violações com resultado:${resumo.join('')}`).toEqual([])
})

// ---------------------------------------------------------------------------
// Teclado
// ---------------------------------------------------------------------------

test('o primeiro alvo de tabulação é o atalho para o conteúdo', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')
  await page.keyboard.press('Tab')

  const focado = page.locator(':focus')
  await expect(focado).toHaveText('Pular para o conteúdo')

  await focado.press('Enter')
  await expect(page).toHaveURL(/#conteudo$/)
})

test('o fluxo completo da calculadora funciona só com teclado', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')

  // Chega ao campo tabulando, sem clique nenhum.
  const campo = page.getByLabel('Salário bruto mensal')
  for (let i = 0; i < 40 && !(await campo.evaluate((e) => e === document.activeElement)); i += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(campo).toBeFocused()

  await page.keyboard.type('4500,00')
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()

  // E chega à memória de cálculo, que é a razão de ser do produto.
  const memoria = page.getByRole('button', { name: 'Ver como este valor foi calculado' })
  for (let i = 0; i < 30 && !(await memoria.evaluate((e) => e === document.activeElement)); i += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(memoria).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Como chegamos a este valor' })).toBeVisible()
})

test('não há armadilha de foco: a tabulação atravessa a página inteira', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')
  await page.getByLabel('Salário bruto mensal').fill('3000,00')

  // Cada focável recebe um número. Identificar pelo texto não serve: o rodapé
  // repete os títulos dos guias, e dois elementos DIFERENTES com o mesmo texto
  // pareciam ser o mesmo elemento retendo o foco.
  await page.evaluate(() => {
    const seletor = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    document.querySelectorAll(seletor).forEach((el, i) => el.setAttribute('data-foco', String(i)))
  })

  const visitados = new Set<string>()
  let anterior = ''
  let repetiuSeguidas = 0

  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab')
    const atual = await page.evaluate(() => {
      const e = document.activeElement
      if (!e || e === document.body) return 'BODY'
      return e.getAttribute('data-foco') ?? `SEM-MARCA:${e.tagName}`
    })

    // Armadilha é o MESMO elemento retendo o foco tabulação após tabulação.
    repetiuSeguidas = atual === anterior && atual !== 'BODY' ? repetiuSeguidas + 1 : 0
    expect(repetiuSeguidas, `foco preso no elemento ${atual}`).toBeLessThan(2)
    anterior = atual
    visitados.add(atual)
  }

  // Percorreu a página toda sem ficar retido no meio.
  expect(visitados.size).toBeGreaterThan(10)
})

test('todo elemento focável mostra onde o foco está', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')

  for (let i = 0; i < 15; i += 1) {
    await page.keyboard.press('Tab')
    const temIndicador = await page.evaluate(() => {
      const e = document.activeElement
      if (!e || e === document.body) return true
      const s = getComputedStyle(e)
      // Contorno, sombra ou borda — qualquer um serve; nenhum, não.
      return (
        (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) ||
        s.boxShadow !== 'none' ||
        s.borderStyle !== 'none'
      )
    })
    expect(temIndicador, 'elemento focável sem indicador visível de foco').toBe(true)
  }
})

// ---------------------------------------------------------------------------
// Leitor de tela
// ---------------------------------------------------------------------------

test('o resultado é anunciado sem interromper quem digita', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')

  const regiao = page.locator('main [aria-live]')
  await expect(regiao).toHaveCount(1)
  // `polite`, nunca `assertive`: `assertive` corta a fala em curso, e a fala
  // em curso costuma ser a leitura do próprio campo que a pessoa preenche.
  await expect(regiao).toHaveAttribute('aria-live', 'polite')

  const campo = page.getByLabel('Salário bruto mensal')
  await campo.fill('5000,00')
  await expect(regiao.getByText('Salário líquido estimado')).toBeVisible()

  // Nenhuma região dinâmica NOSSA pode ser `assertive`. O anunciador de rota
  // do próprio Next é `assertive` de propósito e corretamente — anunciar a
  // troca de página é o caso em que interromper é o comportamento certo.
  const nossas = await page
    .locator('[aria-live]:not(next-route-announcer):not(next-route-announcer *)')
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-live')))
  expect(nossas.length).toBeGreaterThan(0)
  expect(nossas.every((v) => v === 'polite')).toBe(true)

  // O foco não é roubado pela atualização do resultado.
  await expect(campo).toBeFocused()
})

test('o campo com erro está associado à mensagem e marcado como inválido', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')

  const campo = page.getByLabel('Número de dependentes')
  await campo.fill('99')

  await expect(campo).toHaveAttribute('aria-invalid', 'true')

  const descrito = await campo.getAttribute('aria-describedby')
  expect(descrito, 'campo inválido sem mensagem associada').toBeTruthy()
  await expect(page.locator(`#${descrito?.split(' ').at(-1)}`)).toBeVisible()
})

test('campo obrigatório é anunciado como tal, e o asterisco não é lido', async ({ page }) => {
  await page.goto('/calculadora/salario-liquido')

  const campo = page.getByLabel('Salário bruto mensal')
  await expect(campo).toHaveAttribute('aria-required', 'true')

  // O asterisco é decoração visual. Sem `aria-hidden`, o leitor anuncia
  // "asterisco" no meio do rótulo.
  await expect(page.locator('label [aria-hidden="true"]').first()).toBeVisible()
})

test('cada página tem exatamente um h1 e a hierarquia não pula nível', async ({ page }) => {
  for (const rota of ROTAS) {
    await page.goto(rota)

    await expect(page.locator('h1'), `${rota} sem h1 único`).toHaveCount(1)

    const niveis = await page.locator('h1, h2, h3, h4').evaluateAll((els) =>
      els.map((e) => Number(e.tagName.slice(1))),
    )
    for (let i = 1; i < niveis.length; i += 1) {
      const anterior = niveis[i - 1] ?? 1
      const atual = niveis[i] ?? 1
      expect(atual - anterior, `${rota}: salto de h${anterior} para h${atual}`).toBeLessThanOrEqual(1)
    }
  }
})

test('o alvo de toque atende ao mínimo em telas pequenas', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'só faz sentido no perfil móvel')

  await page.goto('/calculadora/salario-liquido')
  const alvos = page.locator('a, button, select, input')

  for (let i = 0; i < (await alvos.count()); i += 1) {
    const alvo = alvos.nth(i)
    if (!(await alvo.isVisible())) continue
    const caixa = await alvo.boundingBox()
    if (!caixa) continue
    // 24 px é o mínimo de WCAG 2.2 (2.5.8). `10-ux-ui-spec` §5 pede 44 para
    // alvo principal; aqui verifica-se o piso, que é critério normativo.
    expect(
      Math.min(caixa.width, caixa.height),
      `alvo pequeno demais: ${await alvo.innerText().catch(() => '')}`,
    ).toBeGreaterThanOrEqual(24)
  }
})
