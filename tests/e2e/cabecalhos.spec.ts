import { expect, test } from '@playwright/test'

/**
 * Cabeçalhos de segurança — `07-security` §5.
 *
 * **Por que este arquivo existe.** Até aqui, o único cabeçalho com verificação
 * era o `Referrer-Policy`, e por via indireta: `referersComCaminho`, em
 * `tests/leak/vazamento.spec.ts`, reprova quando o valor errado deixa a query
 * viajar. Os demais não tinham nada — mudá-los, ou perdê-los numa
 * reconfiguração do `next.config.ts`, não reprovava em lugar nenhum.
 *
 * `Strict-Transport-Security` é o caso extremo dessa categoria: sua ausência é
 * invisível em teste funcional, porque o site continua respondendo igual. Só
 * aparece no dia em que alguém é interceptado numa rede hostil.
 *
 * A asserção é de valor exato, não de presença. `max-age` reduzido a zero, ou
 * `includeSubDomains` perdido numa edição, deixa o cabeçalho presente e a
 * proteção ausente — que é o formato preferido de regressão silenciosa.
 *
 * O `webServer` desta configuração sobe a saída autônoma de produção, então o
 * que se mede aqui é o que o servidor de verdade envia — não o que o
 * `next.config.ts` declara.
 *
 * **Prova de mutação, 31/07/2026.** Removida a linha do
 * `Strict-Transport-Security` em `next.config.ts`, três dos quatro testes deste
 * arquivo reprovam. O quarto — o de `preload` — continua passando, e está
 * correto: cabeçalho ausente não anuncia `preload`. Ele guarda uma diretiva,
 * não a presença do cabeçalho.
 */

const ESPERADOS: Readonly<Record<string, string>> = {
  // 1 ano, com subdomínios. Sem `preload`: ver a justificativa em
  // `next.config.ts` — é porta de mão única e exige `www` servido.
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  // NÃO "simplificar" para `strict-origin-when-cross-origin`: aquele valor
  // preserva a URL completa em requisição de mesma origem, e aqui todas são.
  // O salário digitado ia parar no registro de acesso (T-107).
  'referrer-policy': 'strict-origin',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
}

/**
 * A política de conteúdo é verificada por DIRETIVA, e não por igualdade de texto.
 *
 * A lista de origens vai crescer quando o anúncio entrar (`07-security` §5), e
 * um `toBe` do valor inteiro reprovaria a cada acréscimo legítimo — o formato
 * de teste que se aprende a atualizar sem ler. O que não pode mudar é o que
 * está aqui: o padrão fechado, as três portas de saída de dado e a ausência de
 * curinga.
 *
 * **`connect-src` é a linha que protege o dado digitado.** `RF-006` põe salário
 * e saldo de FGTS na query; sem esta diretiva, qualquer script que execute na
 * página consegue mandá-los para fora.
 */
const DIRETIVAS_EXIGIDAS = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  'connect-src ',
]

// Uma rota estática, uma dinâmica e uma de API: os cabeçalhos são declarados
// para `/:caminho*`, e um dia alguém restringe esse padrão sem perceber que
// deixou a rota de calculadora — a única que recebe dado do usuário — de fora.
const ROTAS = ['/', '/calculadora/salario-liquido', '/api/health']

for (const rota of ROTAS) {
  test(`cabeçalhos de segurança em ${rota}`, async ({ request }) => {
    const resposta = await request.get(rota)
    expect(resposta.ok(), `${rota} não respondeu com sucesso`).toBe(true)

    const cabecalhos = resposta.headers()
    for (const [nome, valor] of Object.entries(ESPERADOS)) {
      expect(cabecalhos[nome], `${rota} · ${nome}`).toBe(valor)
    }

    // `Permissions-Policy` é lista, e a ordem dentro dela não é contrato.
    // Verificamos que cada permissão sensível está negada.
    const permissoes = cabecalhos['permissions-policy'] ?? ''
    for (const recurso of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
      expect(permissoes, `${rota} · Permissions-Policy sem ${recurso}`).toContain(`${recurso}=()`)
    }

    const politica = cabecalhos['content-security-policy'] ?? ''
    for (const diretiva of DIRETIVAS_EXIGIDAS) {
      expect(politica, `${rota} · CSP sem "${diretiva}"`).toContain(diretiva)
    }

    /**
     * Curinga na política anula a proteção contra AM-02, que `07-security` §5
     * descreve como a ameaça mais provável do sistema — e `CLAUDE.md` o lista
     * entre os "nunca faça".
     *
     * É o atalho que alguém vai considerar no dia em que a rede de anúncio
     * pedir uma lista de origens comprida. Este caso é o que impede.
     */
    expect(
      politica,
      `${rota} · a política de conteúdo usa curinga. Liste o host exato: ` +
        `curinga anula a proteção contra AM-02 (07-security §5).`,
    ).not.toMatch(/(^|[\s;])\*|\*\./)
  })
}

/**
 * `www` redireciona para o ápice — `13-deployment` §7, "escolher um e manter".
 *
 * O `Host` é forjado porque o servidor de teste responde em `localhost`: a
 * condição do redirecionamento casa contra o cabeçalho, não contra o endereço
 * de rede. É o que torna a regra verificável sem depender de produção.
 *
 * Sem este teste, a regra some numa edição do `next.config.ts` e ninguém nota —
 * `www` volta a servir o mesmo conteúdo do ápice, o buscador passa a escolher
 * sozinho qual indexar, e o efeito aparece semanas depois como queda de
 * posição sem causa aparente.
 */
test('www redireciona para o ápice, preservando o caminho', async ({ request }) => {
  const resposta = await request.get('/calculadora/inss', {
    headers: { host: 'www.calculoficial.com.br' },
    maxRedirects: 0,
  })

  expect(resposta.status(), 'www deveria redirecionar, não servir').toBe(308)
  expect(resposta.headers()['location']).toBe('https://calculoficial.com.br/calculadora/inss')
})

test('o ápice NÃO redireciona — seria laço infinito', async ({ request }) => {
  const resposta = await request.get('/calculadora/inss', {
    headers: { host: 'calculoficial.com.br' },
    maxRedirects: 0,
  })

  expect(resposta.status(), 'o ápice é o destino; redirecionar aqui derruba o site').toBe(200)
})

/**
 * `preload` é a diretiva que não se desfaz: entrar na lista de pré-carga leva
 * meses para reverter, e a reversão depende do navegador, não de nós.
 *
 * O pré-requisito de infraestrutura foi satisfeito em 31/07/2026 — `www` passou
 * a ser servido em HTTPS. O que **não** foi satisfeito é a decisão: o ganho de
 * `preload` é estreito, vale apenas para a PRIMEIRA visita de quem nunca esteve
 * no site, e para todos os demais o cabeçalho já basta. Trocar um ganho estreito
 * por um compromisso irreversível é decisão, não configuração.
 *
 * Este teste reprova no dia em que alguém a acrescentar sem tomá-la — mesmo
 * padrão da linha de base de `vazamento.spec.ts`.
 */
test('HSTS não anuncia preload sem decisão registrada', async ({ request }) => {
  const resposta = await request.get('/')
  const hsts = resposta.headers()['strict-transport-security'] ?? ''
  expect(
    hsts,
    'Antes de ativar `preload`: confirme que TODO subdomínio de calculoficial.com.br ' +
      'responde em TLS, hoje e no futuro, e registre a decisão em 07-security §5. ' +
      'A saída da lista de pré-carga leva meses e depende do navegador, não de nós.',
  ).not.toContain('preload')
})

// ---------------------------------------------------------------------------
// EP-016 · a versão só sai com credencial
// ---------------------------------------------------------------------------

/**
 * A DECISÃO DE `EP-016` NÃO FOI REVISTA, E ESTES CASOS SÃO O QUE A SUSTENTA.
 *
 * A rota passou a devolver a revisão em 07/08/2026, depois de o pipeline
 * aprovar dois deploys que não aconteceram — a verificação lia "ok" do
 * contêiner ANTIGO, que responde igual ao novo, em 1,8 segundo.
 *
 * O texto de `EP-016` continua valendo literalmente: *"não devolve versão,
 * ambiente nem configuração"* **para quem não apresenta credencial**. Sem estes
 * casos, a próxima pessoa a mexer na rota pode simplificar o `if` e publicar a
 * versão para a internet inteira sem que nada reclame.
 */
test('EP-016 · a resposta pública não revela versão nem configuração', async ({ request }) => {
  const resposta = await request.get('/api/health')
  expect(resposta.ok()).toBe(true)

  const corpo = await resposta.text()
  expect(JSON.parse(corpo)).toEqual({ status: 'ok' })

  // Explícito além do toEqual: o que não pode vazar, nomeado.
  for (const proibido of ['rev', 'version', 'commit', 'env', 'NODE_ENV']) {
    expect(corpo, `a resposta pública contém "${proibido}"`).not.toContain(proibido)
  }
})

/**
 * E credencial ERRADA precisa ser tratada como credencial ausente.
 *
 * Um `if` que aceitasse qualquer cabeçalho presente — em vez de conferir o
 * valor — passaria no caso acima e entregaria a versão a quem mandasse
 * `x-health-token: qualquer-coisa`. É o modo de falha mais provável de uma
 * comparação escrita com pressa.
 */
test('EP-016 · credencial errada não revela versão', async ({ request }) => {
  const resposta = await request.get('/api/health', {
    headers: { 'x-health-token': 'palpite-errado' },
  })
  expect(resposta.ok()).toBe(true)
  expect(JSON.parse(await resposta.text())).toEqual({ status: 'ok' })
})

/**
 * O que impede um intermediário de servir a resposta autenticada a quem não
 * apresentou credencial.
 *
 * A primeira versão deste caso cobrava `Vary: x-health-token`. **Medido: não
 * funciona** — o Next sobrescreve o cabeçalho com os valores de roteamento
 * dele, e o teste reprovava por uma promessa que a plataforma não deixa
 * cumprir. Quem de fato protege é o `no-store`, que proíbe qualquer cache de
 * guardar a resposta — e é isso que se cobra aqui.
 */
test('EP-016 · a resposta proíbe ser armazenada em cache', async ({ request }) => {
  const controle = (await request.get('/api/health')).headers()['cache-control'] ?? ''
  expect(controle).toContain('no-store')
})

// ---------------------------------------------------------------------------
// EP-017 · o formulário de contato não carrega dado de cálculo
// ---------------------------------------------------------------------------

/**
 * O RISCO QUE ESTE CASO VIGIA É ESPECÍFICO DESTE SITE.
 *
 * `RF-006` põe o estado do formulário na query, então o endereço de quem está
 * numa calculadora carrega salário, pensão e saldo de FGTS. Anexar "a página de
 * onde a pessoa veio" a um relato de erro é o reflexo natural de quem quer
 * ajudar a depurar — e mandaria o holerite dela por e-mail sem que ela pedisse.
 *
 * O formulário não tem campo de URL e não lê o referenciador. Estes casos são o
 * que impede alguém de acrescentar "só para facilitar".
 */
test('EP-017 · o formulário não tem campo de URL nem envia a origem', async ({ page }) => {
  const enviadas: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/api/contato')) enviadas.push(r.postData() ?? '')
  })

  // Chega na página de contato VINDO de uma calculadora preenchida: é o caminho
  // em que a URL de origem carregaria o salário.
  await page.goto('/calculadora/salario-liquido?salarioBruto=538271&pensao=419637')
  await page.goto('/contato')

  await page.getByLabel('Assunto').selectOption('erro-de-calculo')
  await page
    .getByLabel('Mensagem')
    .fill('O décimo terceiro proporcional está saindo com um avo a mais do que eu esperava.')

  // A armadilha de tempo exige três segundos entre montar e enviar.
  await page.waitForTimeout(3_500)
  await page.getByRole('button', { name: 'Enviar mensagem' }).click()
  await page.waitForTimeout(1_500)

  expect(enviadas.length, 'o formulário não chegou a enviar nada').toBeGreaterThan(0)

  for (const corpo of enviadas) {
    for (const proibido of ['538271', '419637', 'salarioBruto', 'http://', 'https://']) {
      expect(corpo, `o envio contém "${proibido}"`).not.toContain(proibido)
    }
  }
})

/**
 * O campo-armadilha precisa estar fora do caminho de quem navega por teclado.
 *
 * Escondê-lo só com CSS o deixaria focável e anunciado por leitor de tela, o que
 * transformaria a proteção contra robô num obstáculo para pessoa — e o teste de
 * acessibilidade da página passaria mesmo assim, porque campo com rótulo é
 * válido.
 */
test('EP-017 · o campo-armadilha não alcança pessoa nenhuma', async ({ page }) => {
  await page.goto('/contato')
  const armadilha = page.locator('#site-contato')

  // Fora da ordem de tabulação: quem navega por teclado não passa por ele.
  await expect(armadilha).toHaveAttribute('tabindex', '-1')

  // Fora do leitor de tela: o contêiner é `aria-hidden`.
  await expect(armadilha.locator('xpath=ancestor::*[@aria-hidden="true"]')).toHaveCount(1)

  /**
   * E fora da tela.
   *
   * A primeira versão usava `toBeHidden()`, e estava errada: para o Playwright,
   * "escondido" é `display:none`, `visibility:hidden` ou caixa vazia — elemento
   * posicionado fora da área visível continua **visível** por essa definição. A
   * asserção reprovava sem que houvesse defeito.
   *
   * O que se cobra agora é a propriedade real: o campo fica à esquerda da
   * origem, longe de qualquer viewport.
   */
  const caixa = await armadilha.boundingBox()
  expect(caixa, 'o campo-armadilha sumiu do documento').not.toBeNull()
  expect(caixa!.x, 'o campo-armadilha está dentro da tela').toBeLessThan(0)
})
