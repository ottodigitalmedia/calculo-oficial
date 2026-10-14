import { expect, test } from '@playwright/test'

/**
 * A SONDA DO CONTÊINER REAL — sob demanda, com `GTM_REAL=1`.
 *
 * ## Por que ela existe
 *
 * TC-042 prova o que este repositório envia. Não prova o que o **painel** do
 * Google Tag Manager faz, porque o contêiner é configurado fora daqui. Esta
 * sonda fecha esse buraco do único jeito possível: carregando o contêiner de
 * produção, deixando a etiqueta do GA4 disparar de verdade e lendo a requisição
 * que chega ao Google.
 *
 * ## O que ela mediu em 07/08/2026, e por que o resultado importa
 *
 * A etiqueta foi publicada como um `__googtag` pelado — só o identificador de
 * medição, **sem sobrescrita de parâmetro nenhuma**:
 *
 *     "tags":[{"function":"__googtag","vtp_tagId":"G-RHT3C92DPT","tag_id":3}]
 *
 * Nessa configuração o GA4 usa `document.location`, que neste site carrega
 * salário na query. A sonda foi escrita justamente para ver se a defesa do
 * código aguentava sozinha — e aguentou. A requisição saiu com:
 *
 *     dl=http%3A%2F%2F…%2Fcalculadora%2Fsalario-liquido      (sem query)
 *     dr=                                                    (vazio)
 *     gcs=G100  npa=1  pscdl=denied                          (consentimento)
 *
 * > **`gcs=G100` era o estado de então, e mudou em 14/08/2026.** O mantenedor
 * > liberou o consentimento por omissão, e a sonda passa a ver `gcs=G111`. As
 * > duas primeiras linhas — que são o que ela existe para vigiar — **não
 * > mudam**: a sanitização é independente do consentimento. Se `dl` voltar a
 * > trazer query, a defesa caiu, e é isso que se lê aqui.
 *
 * O `gtag('set', {page_location, page_referrer})` de `Medicao.tsx` entra na
 * fila antes de o contêiner subir, e o gtag.js o aplica a todo evento seguinte.
 * **Isso é mecanismo, não configuração** — e é o que torna a garantia
 * independente de alguém lembrar de configurar o painel.
 *
 * ## Por que fica fora do caminho bloqueante
 *
 * Ela depende da rede e do Google estar de pé, e manda uma visita sintética
 * para a propriedade do GA4. Um teste que bloqueia deploy não pode ter nenhuma
 * das duas propriedades. Rode-a à mão depois de mexer no contêiner:
 *
 *     GTM_REAL=1 npx playwright test --config=playwright.leak.config.ts
 */

const LIGADA = process.env.GTM_REAL !== undefined

/** Os mesmos marcadores de `vazamento.spec.ts` — improváveis por acaso. */
const SALARIO = '538271'
const PENSAO = '419637'

test('o contêiner publicado não exporta valor de formulário', async ({ page }) => {
  test.skip(!LIGADA, 'sonda sob demanda: defina GTM_REAL=1 para rodar')

  const aoGoogle: string[] = []
  page.on('request', (r) => {
    if (!/google-analytics|analytics\.google|googletagmanager/.test(r.url())) return
    aoGoogle.push(r.url())
    const corpo = r.postData()
    if (corpo) aoGoogle.push(corpo)
  })

  await page.goto(`/calculadora/salario-liquido?salarioBruto=${SALARIO}&pensao=${PENSAO}`)
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()
  // A coleta do GA4 sai depois da etiqueta subir; sem esta folga o teste
  // passaria por não ter havido requisição, que é passar sem verificar.
  await page.waitForTimeout(6_000)

  const coleta = aoGoogle.filter((s) => s.includes('/g/collect'))
  expect(
    coleta.length,
    'o GA4 não coletou nada: a sonda não verificou o painel. Confira se a ' +
      'etiqueta está publicada e se GTM_REAL aponta para o contêiner certo.',
  ).toBeGreaterThan(0)

  for (const marcador of [SALARIO, PENSAO]) {
    expect(
      aoGoogle.some((s) => s.includes(marcador)),
      `O CONTÊINER EXPORTOU "${marcador}" AO GOOGLE. A etiqueta do GA4 está ` +
        'lendo a URL da página em vez dos parâmetros que Medicao.tsx impõe. ' +
        'Ver 06-api-spec R-5.',
    ).toBe(false)
  }

  // E a prova positiva: a rota foi reportada, sem a query.
  expect(coleta.join(' ')).toContain(encodeURIComponent('/calculadora/salario-liquido'))
})

/**
 * O caminho que vazou — medido em produção em 14/10/2026 (§7.100).
 *
 * A sonda acima só abria um link e esperava, e passava. O vazamento estava no
 * que ela não fazia: **digitar** (cada tecla dispara `replaceState`, e a medição
 * otimizada do GA4 transforma isso em `page_view` com `dl` lido de `location`),
 * **enviar o formulário** (`form_start` leva `form_destination`) e **navegar**
 * (o `page_view` seguinte leva o endereço anterior em `dr`). Esta sonda faz as
 * três coisas, de um link antigo com query e de uma página limpa.
 */
for (const inicio of ['limpa', 'link antigo com query'] as const) {
  test(`digitar, enviar e navegar não exporta valor — página ${inicio}`, async ({ page }) => {
    test.skip(!LIGADA, 'sonda sob demanda: defina GTM_REAL=1 para rodar')

    const aoGoogle: string[] = []
    page.on('request', (r) => {
      if (!/google-analytics|analytics\.google|googletagmanager/.test(r.url())) return
      aoGoogle.push(decodeURIComponent(r.url()))
      const corpo = r.postData()
      if (corpo) aoGoogle.push(decodeURIComponent(corpo))
    })

    await page.goto(
      inicio === 'limpa'
        ? '/calculadora/salario-liquido'
        : `/calculadora/salario-liquido?pensao=${PENSAO}`,
    )
    await page.waitForTimeout(3_000)
    await page.getByLabel('Salário bruto mensal').fill(SALARIO)
    await page.getByLabel('Salário bruto mensal').press('Enter')
    await expect(page.getByText('Salário líquido estimado')).toBeVisible()
    await page.mouse.wheel(0, 4_000)
    await page.waitForTimeout(3_000)
    await page.getByRole('link', { name: /INSS mensal/ }).first().click()
    await page.waitForTimeout(6_000)

    expect(aoGoogle.some((s) => s.includes('/g/collect')), 'o GA4 não coletou nada').toBe(true)
    for (const marcador of [SALARIO, PENSAO]) {
      expect(
        aoGoogle.filter((s) => s.includes(marcador)),
        `O GA4 RECEBEU "${marcador}". Ver §7.100.`,
      ).toEqual([])
    }
  })
}
