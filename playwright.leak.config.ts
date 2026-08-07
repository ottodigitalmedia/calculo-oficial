import { defineConfig, devices } from '@playwright/test'

// Porta própria, distinta da suíte e2e e da 3000. Um teste de vazamento que
// se liga por engano a outra aplicação passa sem ter verificado nada — e este
// é o único controle que torna RN-030 executável.
const PORTA = process.env.PLAYWRIGHT_LEAK_PORT ?? '3101'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORTA}`

/**
 * Não vazamento de dado — TC-040 a TC-043 (12-test-plan §7).
 *
 * Implementa o controle C-07 de 07-security §4.2, o único que transforma a
 * promessa central do produto em verificação executável. Roda em configuração
 * própria, e não junto do e2e, por três razões:
 *
 *  1. TC-043 precisa rodar com o anúncio carregado e consentido, o que exige
 *     ambiente diferente do e2e comum;
 *  2. é bloqueador de deploy por conta própria (§10), e um relatório separado
 *     torna óbvio qual bloqueio disparou;
 *  3. a linha de base precisa existir ANTES do primeiro script de terceiro
 *     entrar (11-roadmap, nota de F-5) — então esta suíte nasce sozinha.
 *
 * Sem paralelismo e sem repetição: a interceptação de tráfego precisa ser
 * determinística, e um teste de vazamento que passa na segunda tentativa não
 * informa nada.
 *
 * As especificações entram em T-034.
 */
export default defineConfig({
  testDir: './tests/leak',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  projects: [{ name: 'vazamento', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run build && npm run start',
    // A porta vai por ambiente porque `VAR=x cmd` não funciona no shell do
    // Windows, e o mantenedor trabalha em Windows.
    /**
     * O CONTÊINER DE MEDIÇÃO ENTRA LIGADO **AQUI**, E SÓ AQUI.
     *
     * `NEXT_PUBLIC_GTM_ID` é embutido no build, então esta é a única suíte que
     * exercita o site com o Google Tag Manager carregando de verdade. A e2e
     * segue sem ele, o que mantém aqueles testes medindo o produto e não a
     * integração.
     *
     * O identificador é de mentira de propósito: `gtm.js` responde 404, e é
     * exatamente isso que se quer. O que TC-042 precisa inspecionar é o que
     * ESTE repositório envia — a requisição do contêiner e o `dataLayer` que
     * montamos —, e não o que o Google devolveria para um contêiner real, que
     * é configuração fora daqui e muda sem commit.
     */
    env: { PORT: PORTA, NEXT_PUBLIC_GTM_ID: 'GTM-TESTE01' },
    url: BASE_URL,
    // Nunca reaproveitar servidor de fora: a linha de base precisa ser um
    // processo cuja origem esta suíte conhece.
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
