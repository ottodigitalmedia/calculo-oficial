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
 * A linha de base nasceu ANTES do primeiro script de terceiro (`11-roadmap`,
 * nota de F-5), e **o primeiro entrou em 07/08/2026**: o contêiner de medição,
 * por decisão do mantenedor. Foi exatamente para este dia que ela existia — o
 * que este arquivo provava antes é o que torna possível, agora, atribuir
 * qualquer vazamento a um culpado identificável.
 *
 * A proteção trocou de forma, e não de força:
 *
 *   antes  → nenhum terceiro, nunca
 *   agora  → **exatamente os declarados**, e nada saindo com marcador
 *
 * **Esta suíte é a única que roda com o contêiner ligado** — ver
 * `playwright.leak.config.ts`. A e2e segue sem ele, medindo o produto e não a
 * integração.
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
  // O campo de taxa tem teto de 10.000 — 100% —, então este marcador não pode
  // ter seis dígitos como os monetários. Quatro é o que cabe, e a nota em
  // `procurarVazamento` explica por que quatro ainda basta.
  taxa: '9137',
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

/**
 * A URL de um recurso estático versionado NÃO pode carregar dado do formulário.
 *
 * Ela é gerada no build, a partir do hash do conteúdo, antes de existir usuário.
 * Escaneá-la produz falso positivo quando o hash contém, por acaso, a sequência
 * de um marcador — e foi o que aconteceu em 07/08/2026: o pacote passou a se
 * chamar `page-1c4c292e36873c43.js`, e o marcador de taxa era `873`.
 *
 * **Um teste de vazamento que grita sem motivo é um teste que alguém desliga**,
 * e este arquivo se declara o mais importante depois dos casos-ouro. Marcador
 * curto não colide com hash hexadecimal por azar, e sim por probabilidade: três
 * dígitos decimais têm cerca de uma chance em mil por posição, e cada nome de
 * arquivo traz dezenas de posições. Passar por dezenas de builds sem falhar era
 * sorte, não garantia.
 *
 * O recorte é só da URL. **Corpo e cabeçalhos continuam escaneados** — se
 * alguém enviasse o salário no corpo de uma requisição a um recurso estático,
 * isto pegaria. E o `Referer` de TODA requisição continua verificado à parte,
 * em `referersComCaminho`, que é onde o vazamento real do T-107 apareceu.
 */
function ehRecursoDeBuild(saida: Saida): boolean {
  return new URL(saida.url).pathname.startsWith('/_next/static/')
}

function procurarVazamento(saidas: readonly Saida[]): readonly string[] {
  const achados: string[] = []
  for (const saida of saidas) {
    if (ehNavegacaoDePermalink(saida)) continue

    const alvo = ehRecursoDeBuild(saida)
      ? `${saida.corpo}\n${saida.cabecalhos}`
      : `${saida.url}\n${saida.corpo}\n${saida.cabecalhos}`

    for (const forma of TODAS_AS_FORMAS) {
      if (alvo.includes(forma)) {
        achados.push(`${saida.metodo} ${saida.url} contém "${forma}"`)
      }
    }
  }
  return achados
}

/**
 * Os únicos destinos externos que este site pode tocar. **Lista exaustiva.**
 *
 * Era vazia até 07/08/2026. O contêiner de medição entrou por decisão do
 * mantenedor, e a proteção trocou de forma em vez de sumir: antes "nenhum
 * terceiro", agora "estes e mais nenhum". Acrescentar um item aqui é declarar
 * um destino novo, e deve vir com o motivo.
 */
const TERCEIROS_DECLARADOS = [
  'https://www.googletagmanager.com/',
  // Só aparece com contêiner REAL — a etiqueta do GA4 coleta aqui. Na execução
  // de rotina, com o identificador de mentira, nada bate nele.
  'https://www.google-analytics.com/',
  'https://region1.google-analytics.com/',
]

/** Requisições para destino externo que não está na lista declarada. */
function foraDaLista(saidas: readonly Saida[], origem: string): readonly Saida[] {
  return saidas.filter(
    (s) =>
      !s.url.startsWith(origem) &&
      !s.url.startsWith('data:') &&
      !TERCEIROS_DECLARADOS.some((permitido) => s.url.startsWith(permitido)),
  )
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

  /**
   * E prova de que o recorte de recurso de build não engoliu a varredura.
   *
   * `procurarVazamento` deixa de escanear a URL dos pacotes versionados. Se um
   * dia esse recorte passasse a casar com tudo — uma mudança de caminho, um
   * `startsWith` frouxo —, o teste continuaria verde sem olhar URL nenhuma. É a
   * mesma lição de §7.67: silêncio precisa significar "está certo", e não "não
   * foi olhado".
   */
  const comUrlEscaneada = saidas.filter(
    (s) => !ehNavegacaoDePermalink(s) && !ehRecursoDeBuild(s),
  )
  expect(
    comUrlEscaneada.length,
    'nenhuma URL foi escaneada: o recorte de recurso de build está largo demais',
  ).toBeGreaterThan(0)

  /**
   * A asserção mudou em 07/08/2026, junto com a entrada do contêiner.
   *
   * Ela dizia "qualquer requisição externa é regressão", o que era verdade
   * enquanto o site não tinha terceiro nenhum. Agora tem exatamente um, e o que
   * ela cobra é a **lista fechada** — qualquer destino fora dela reprova, que é
   * a mesma proteção com um item declarado dentro.
   *
   * O que NÃO foi afrouxado é a varredura de marcadores acima: ela continua
   * valendo para toda requisição, inclusive as do contêiner.
   */
  const inesperadas = foraDaLista(saidas, baseURL ?? '')
  expect(
    inesperadas.map((s) => s.url),
    'requisição a destino externo não declarado — ver TERCEIROS_DECLARADOS',
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
// TC-042 · o contêiner de medição entrou, e a promessa continua de pé
// ---------------------------------------------------------------------------

/**
 * A LINHA DE BASE DE ZERO TERCEIROS ACABOU EM 07/08/2026, POR DECISÃO DO
 * MANTENEDOR — E ESTE É O TESTE QUE ELA EXIGIA NO MESMO COMMIT.
 *
 * O teste anterior dizia, na própria mensagem de falha: *"se foi análise de uso
 * ou anúncio, escreva TC-042 e TC-043 no mesmo commit e substitua este teste."*
 * É o que está aqui. Ele não foi afrouxado: trocou de forma.
 *
 *   antes  → nenhum terceiro, nunca
 *   agora  → **exatamente um** terceiro declarado, e nada saindo com marcador
 *
 * A parte que importa de `RN-030` não mudou de exigência. Mudou de dificuldade:
 * antes bastava não haver requisição externa; agora há uma, e ela precisa ser
 * provada limpa.
 *
 * **O risco concreto que estes casos vigiam.** `RF-006` escreve o estado do
 * formulário na query, então `location.search` contém salário, pensão e saldo de
 * FGTS. Um GA4 padrão envia `page_location` com a URL inteira — ligá-lo sem
 * cuidado exportaria tudo isso. `components/Medicao.tsx` sanitiza no código, e
 * estes casos são o que impede a sanitização de ser desfeita em silêncio.
 *
 * **O limite, dito aqui também.** O contêiner carrega etiquetas configuradas
 * FORA deste repositório. Estes casos alcançam o que este código envia e o que o
 * contêiner enviar durante a execução — não o que alguém configurar amanhã no
 * painel. Nenhum teste daqui alcança aquilo, e fingir o contrário seria pior que
 * não ter teste.
 */

test('TC-042 · a lista de terceiros é exatamente a declarada', async ({ page, baseURL }) => {
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

  const inesperadas = foraDaLista(saidas, baseURL ?? '')
  expect(
    inesperadas.map((s) => `${s.metodo} ${s.url}`),
    'Apareceu terceiro fora da lista declarada. Se foi anúncio, escreva TC-043 ' +
      '(12-test-plan §7) NO MESMO COMMIT. Se foi etiqueta nova do contêiner, ' +
      'ela precisa entrar em TERCEIROS_DECLARADOS com o motivo.',
  ).toEqual([])

  // E o contêiner precisa ter carregado de verdade: um teste que passasse por
  // ele não ter subido não teria verificado nada — a lição de §7.67.
  const doContainer = saidas.filter((s) => s.url.includes('googletagmanager.com'))
  expect(
    doContainer.length,
    'o contêiner não carregou; este teste não verificou a medição. Confira ' +
      'NEXT_PUBLIC_GTM_ID em playwright.leak.config.ts',
  ).toBeGreaterThan(0)
})

test('TC-042 · nada que o contêiner envia carrega valor de formulário', async ({ page }) => {
  const saidas = capturar(page)

  // Semeia a query com os marcadores, que é o cenário perigoso: é assim que o
  // salário chega a `location.search` num permalink compartilhado.
  await page.goto(
    `/calculadora/salario-liquido?salarioBruto=${MARCADORES.salario}` +
      `&pensao=${MARCADORES.pensao}&outrosDescontos=${MARCADORES.outros}`,
  )
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()
  await page.waitForLoadState('networkidle')

  const vazamentos = procurarVazamento(saidas)
  expect(
    vazamentos,
    `Valor de formulário saiu com a medição ligada:\n${vazamentos.join('\n')}`,
  ).toEqual([])
})

test('TC-042 · o dataLayer reporta a rota sem query, e o referenciador sem caminho', async ({
  page,
}) => {
  await page.goto(
    `/calculadora/salario-liquido?salarioBruto=${MARCADORES.salario}&pensao=${MARCADORES.pensao}`,
  )
  await expect(page.getByText('Salário líquido estimado')).toBeVisible()

  const camada = (await page.evaluate(() => {
    const janela = window as unknown as { dataLayer?: unknown[] }
    return JSON.stringify(janela.dataLayer ?? [])
  })) as string

  // Prova de que houve o que inspecionar.
  expect(camada, 'dataLayer vazio: a medição não montou nada para verificar').toContain(
    'pagina_vista',
  )

  // C-04 · o identificador de página é a rota, sem query.
  expect(camada).toContain('/calculadora/salario-liquido')
  for (const forma of TODAS_AS_FORMAS) {
    expect(camada, `o dataLayer contém "${forma}"`).not.toContain(forma)
  }

  // Consent Mode v2 declarado por omissão. Até 14/08/2026 esta linha exigia
  // `denied`, e o que ela protegia era o cookie — não o vazamento. O mantenedor
  // liberou a medição naquele dia (`Medicao.tsx` diz por quê e sob que base), e
  // manter a asserção antiga só faria a suíte reprovar uma decisão registrada.
  //
  // O que substitui não é uma asserção mais fraca, é a asserção CERTA para este
  // arquivo: `url_passthrough` desligado é o que impede o próprio Google de
  // recolar parâmetro na URL — e é `RF-006` que põe o salário lá. Este guarda
  // vale nos dois estados de consentimento; o anterior não valia em nenhum.
  expect(camada, 'o consentimento precisa ser declarado, nunca omitido').toContain('consent')

  // Estrutural, e não por texto: `gtag()` empurra o objeto `arguments`, que
  // serializa como {"0":"set","1":"url_passthrough","2":false}. Procurar a
  // string `"url_passthrough",true` nunca casaria com nada — passaria sempre,
  // que é o defeito de verificador descrito em §7.5.
  const passagemDeUrl = await page.evaluate(() => {
    const janela = window as unknown as { dataLayer?: Record<string, unknown>[] }
    const entrada = (janela.dataLayer ?? []).find(
      (item) => item?.['0'] === 'set' && item?.['1'] === 'url_passthrough',
    )
    return entrada === undefined ? 'ausente' : entrada['2']
  })
  expect(
    passagemDeUrl,
    'url_passthrough precisa estar explicitamente desligado: ligado, o Google ' +
      'recola parâmetro na URL — e RF-006 põe o salário exatamente lá',
  ).toBe(false)
})