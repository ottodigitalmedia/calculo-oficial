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
