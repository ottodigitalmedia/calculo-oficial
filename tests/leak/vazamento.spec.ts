import { expect, test, type Request } from '@playwright/test'

/**
 * TC-040 a TC-043 — não vazamento de dado (`12-test-plan` §7, controle C-07 de
 * `07-security` §4.2).
 *
 * **O teste mais importante depois dos casos-ouro.** É o único mecanismo que
 * transforma a promessa central do produto — `RN-030`, nada do que você digita
 * sai do navegador — em verificação executável. Sem ele, a promessa é texto na
 * página de privacidade.
 *
 * A linha de base nasce ANTES do primeiro script de terceiro (`11-roadmap`,
 * nota de F-5): hoje o site não carrega nenhum, e é justamente por isso que o
 * teste é confiável agora. Quando o anúncio entrar, qualquer vazamento terá
 * culpado identificável, porque este arquivo já provava a ausência dele.
 */

// ---------------------------------------------------------------------------
// Marcadores
// ---------------------------------------------------------------------------

/**
 * Valores marcadores, escolhidos para serem improváveis por acaso.
 *
 * Não são valores redondos: `538271` como salário em centavos é R$ 5.382,71,
 * um número que não aparece em tabela legal nenhuma nem em texto de página. Se
 * essa sequência aparecer em qualquer requisição, ela veio do formulário.
 *
 * `12-test-plan` §7 restringe o escopo: marcadores vão **apenas** nos campos de
 * calculadora, nunca no campo de busca do catálogo. Semear a busca reprovaria
 * `busca_sem_resultado`, que é comportamento especificado por `RN-031.1` — e um
 * teste bloqueador que reprova comportamento correto é um teste que alguém
 * acaba marcando como pendente.
 */
const MARCADORES = {
  salario: '538271',
  dependentes: '7',
  pensao: '419637',
  outros: '286354',
  capital: '731958',
  aporte: '164729',
  taxa: '873',
  meses: '97',
} as const

/** Como cada marcador aparece depois de formatado no campo. */
const DIGITADOS = ['5382,71', '4196,37', '2863,54', '7319,58', '1647,29']

/** Toda forma em que um marcador pode viajar: cru, formatado e codificado. */
function formasDe(valor: string): readonly string[] {
  const emReais = (Number(valor) / 100).toFixed(2)
  return [
    valor,
    emReais,
    emReais.replace('.', ','),
    encodeURIComponent(emReais.replace('.', ',')),
    // Base64 é o disfarce mais banal de um payload de telemetria.
    Buffer.from(valor).toString('base64'),
  ]
}

const TODAS_AS_FORMAS = [
  ...Object.values(MARCADORES).flatMap(formasDe),
  ...DIGITADOS,
].filter((f) => f.length >= 3)

// ---------------------------------------------------------------------------
// Captura
// ---------------------------------------------------------------------------

interface Saida {
  readonly url: string
  readonly metodo: string
  readonly corpo: string
  readonly cabecalhos: string
  readonly tipo: string
}

/**
 * Registra toda requisição que sai do navegador.
 *
 * Inclui a própria origem: `RN-030` não diz "não envia a terceiro", diz **não
 * sai do navegador**. Uma requisição ao nosso próprio servidor carregando o
 * salário violaria a promessa do mesmo jeito — e seria mais fácil de deixar
 * passar, porque "é o nosso servidor" soa inofensivo.
 */
function capturar(page: import('@playwright/test').Page): Saida[] {
  const saidas: Saida[] = []
  const registrar = (r: Request) => {
    saidas.push({
      url: r.url(),
      metodo: r.method(),
      corpo: r.postData() ?? '',
      cabecalhos: JSON.stringify(r.headers()),
      tipo: r.resourceType(),
    })
  }
  page.on('request', registrar)
  return saidas
}

/**
 * A navegação de topo para um permalink é o ÚNICO caso em que a query sai do
 * navegador por especificação: quem abre um link compartilhado precisa que o
 * servidor entregue aquela página. `RF-006` cria isso deliberadamente, e a
 * página de privacidade descreve exatamente esse comportamento.
 *
 * Digitar no formulário NÃO produz requisição — o estado vai para a URL por
 * `replaceState`. Então qualquer OUTRA requisição carregando marcador é
 * vazamento de verdade.
 */
function ehNavegacaoDePermalink(saida: Saida): boolean {
  return saida.tipo === 'document' && saida.metodo === 'GET'
}

/**
 * Nenhum `Referer` pode carregar caminho ou query.
 *
 * Regressão de um vazamento real encontrado aqui no T-107: com o
 * `strict-origin-when-cross-origin` que `07-security` §5 pedia, a URL completa
 * ia no `Referer` de TODA requisição de mesma origem. Bastava digitar o
 * salário — `replaceState` o punha na query — para ele chegar ao registro de
 * acesso do servidor. Corrigido com `strict-origin` em `next.config.ts`.
 */
function referersComCaminho(saidas: readonly Saida[]): readonly string[] {
  const achados: string[] = []
  for (const saida of saidas) {
    const referer = (JSON.parse(saida.cabecalhos) as Record<string, string>)['referer']
    if (referer === undefined) continue
    // Aceita apenas "https://origem" ou "https://origem/".
    if (!/^https?:\/\/[^/]+\/?$/.test(referer)) {
      achados.push(`${saida.url} enviou Referer "${referer}"`)
    }
  }
  return achados
}

function procurarVazamento(saidas: readonly Saida[]): readonly string[] {
  const achados: string[] = []
  for (const saida of saidas) {
    if (ehNavegacaoDePermalink(saida)) continue

    const alvo = `${saida.url}\n${saida.corpo}\n${saida.cabecalhos}`
    for (const forma of TODAS_AS_FORMAS) {
      if (alvo.includes(forma)) {
        achados.push(`${saida.metodo} ${saida.url} contém "${forma}"`)
      }
    }
  }
  return achados
}

/** Requisições para fora da origem do site. */
function paraTerceiros(saidas: readonly Saida[], origem: string): readonly Saida[] {
  return saidas.filter((s) => !s.url.startsWith(origem) && !s.url.startsWith('data:'))
}

// ---------------------------------------------------------------------------
// TC-040 · marcadores em todas as calculadoras
// ---------------------------------------------------------------------------

test('TC-040 · nenhum valor digitado sai do navegador', async ({ page, baseURL }) => {
  const saidas = capturar(page)

  // --- salário líquido ---
  await page.goto('/calculadora/salario-liquido')
  await page.getByLabel('Salário bruto mensal').fill(MARCADORES.salario)
  await page.getByLabel('Número de dependentes').fill(MARCADORES.dependentes)
  await page.getByLabel(/Pensão alimentícia/).fill(MARCADORES.pensao)
  await page.getByLabel(/Outros descontos/).fill(MARCADORES.outros)
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()
  await page.getByRole('button', { name: 'Ver como este valor foi calculado' }).click()
  await expect(page.getByRole('heading', { name: 'Como chegamos a este valor' })).toBeVisible()

  // --- INSS ---
  await page.goto('/calculadora/inss')
  await page.getByLabel(/Salário/).first().fill(MARCADORES.salario)
  await expect(page.locator('main [aria-live]')).toContainText('R$')

  // --- IRRF ---
  await page.goto('/calculadora/irrf')
  const camposIrrf = page.locator('main form input')
  for (let i = 0; i < (await camposIrrf.count()); i += 1) {
    const campo = camposIrrf.nth(i)
    if (await campo.isVisible()) await campo.fill(MARCADORES.salario)
  }

  // --- juros compostos ---
  await page.goto('/calculadora/juros-compostos')
  const camposJuros = page.locator('main form input')
  const valoresJuros = [MARCADORES.capital, MARCADORES.aporte, MARCADORES.taxa, MARCADORES.meses]
  for (let i = 0; i < (await camposJuros.count()); i += 1) {
    const campo = camposJuros.nth(i)
    if (await campo.isVisible()) await campo.fill(valoresJuros[i] ?? MARCADORES.capital)
  }

  await page.waitForLoadState('networkidle')

  const vazamentos = procurarVazamento(saidas)
  expect(vazamentos, `Valor digitado saiu do navegador:\n${vazamentos.join('\n')}`).toEqual([])

  const referers = referersComCaminho(saidas)
  expect(
    referers,
    `Referer levou caminho ou query, e a query contém salário (RN-030):\n${referers.join('\n')}`,
  ).toEqual([])

  // Prova de que houve o que capturar: um teste que não viu requisição nenhuma
  // por engano — servidor fora do ar, seletor errado — passaria vazio.
  expect(saidas.length, 'nenhuma requisição capturada; o teste não verificou nada').toBeGreaterThan(3)

  const externas = paraTerceiros(saidas, baseURL ?? '')
  expect(
    externas.map((s) => s.url),
    'o site não carrega script de terceiro; qualquer requisição externa é regressão',
  ).toEqual([])
})

// ---------------------------------------------------------------------------
// TC-041 · erro provocado
// ---------------------------------------------------------------------------

test('TC-041 · erro provocado não transporta valor de campo nem query', async ({ page }) => {
  const saidas = capturar(page)

  // Query adulterada: valor fora do domínio, campo desconhecido e `ref` sem
  // cobertura. É o caminho mais curto para pôr o motor em estado de exceção
  // com dado do usuário na mão.
  await page.goto(
    `/calculadora/salario-liquido?salarioBruto=${MARCADORES.salario}&dependentes=999&inexistente=${MARCADORES.pensao}&ref=1998-01-01`,
  )

  const erros: string[] = []
  page.on('pageerror', (e) => erros.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') erros.push(m.text())
  })

  await page.waitForLoadState('networkidle')

  // A página não pode cair por causa de URL adulterada — é situação esperada,
  // não defeito, e derrubar puniria quem só clicou num link.
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Nenhum canal de saída pode levar o valor.
  const vazamentos = procurarVazamento(saidas)
  expect(vazamentos, `Erro transportou dado do usuário:\n${vazamentos.join('\n')}`).toEqual([])

  const referers = referersComCaminho(saidas)
  expect(referers, `Referer levou a query com o salário:\n${referers.join('\n')}`).toEqual([])

  // Nem o console: quando o registro de erro entrar, ele lê daqui.
  for (const mensagem of erros) {
    for (const forma of TODAS_AS_FORMAS) {
      expect(mensagem, `mensagem de erro contém "${forma}"`).not.toContain(forma)
    }
  }
})

// ---------------------------------------------------------------------------
// TC-042 e TC-043 · a linha de base que os antecede
// ---------------------------------------------------------------------------

/**
 * TC-042 (evento de análise) e TC-043 (marcadores com anúncio consentido) não
 * têm objeto: `ADR-008` adiou análise de uso e anúncio para depois do
 * lançamento.
 *
 * Escrever os dois agora produziria testes que passam por não haver o que
 * verificar — o mesmo defeito do `echo` que fingia ser TC-051 do T-003 ao
 * T-105. Em vez disso, o teste abaixo **falha no dia em que o objeto surgir**,
 * obrigando quem introduzir análise ou anúncio a escrever TC-042 e TC-043 no
 * mesmo commit.
 */
test('a linha de base é zero terceiros — reprova se análise ou anúncio entrar sem teste', async ({
  page,
  baseURL,
}) => {
  const saidas = capturar(page)

  for (const rota of [
    '/',
    '/guias',
    '/guia/como-o-inss-e-calculado',
    '/calculadora/salario-liquido',
  ]) {
    await page.goto(rota)
    await page.waitForLoadState('networkidle')
  }

  const externas = paraTerceiros(saidas, baseURL ?? '')
  expect(
    externas.map((s) => `${s.metodo} ${s.url}`),
    'Apareceu requisição a terceiro. Se foi análise de uso ou anúncio: escreva ' +
      'TC-042 e TC-043 (12-test-plan §7) NO MESMO COMMIT e substitua este teste. ' +
      'A exceção de RN-031.1 é exaustiva — busca_sem_resultado e nada mais.',
  ).toEqual([])

  // Sem cookie também é estado atual declarado na página de privacidade. Se
  // isso mudar, aquele texto passa a mentir.
  const cookies = await page.context().cookies()
  expect(
    cookies.map((c) => c.name),
    'A página de privacidade afirma que o site não usa cookies. Atualize-a no mesmo commit.',
  ).toEqual([])
})
