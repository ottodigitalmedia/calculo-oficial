import { defineConfig, devices } from '@playwright/test'

// Porta dedicada, não a 3000. Com `reuseExistingServer` ativo localmente, a
// porta padrão faz o Playwright se ligar a qualquer aplicação que já esteja
// no ar — e uma suíte que passa testando outro produto é pior que uma suíte
// vermelha. Vale em dobro para playwright.leak.config.ts.
const PORTA = process.env.PLAYWRIGHT_PORT ?? '3100'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORTA}`

/**
 * Ponta a ponta — TC-037 a TC-039 (12-test-plan §6).
 *
 * Os três fluxos são executados em um navegador desktop e um mobile, porque
 * a maioria das sessões nasce no celular (10-ux-ui-spec, princípio 5).
 * As especificações entram em T-033.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  webServer: {
    command: `npm run build && npx next start -p ${PORTA}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
