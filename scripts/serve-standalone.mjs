/**
 * Serve a saída autônoma localmente, do mesmo jeito que o contêiner serve.
 *
 * Existe porque `next start` não funciona com `output: 'standalone'` e porque
 * o Next não copia os estáticos para dentro da saída — quem monta é o
 * Dockerfile em produção e este script em desenvolvimento.
 *
 * Usado pelo `webServer` do Playwright: a suíte de ponta a ponta e a de
 * vazamento precisam exercitar o artefato que vai ao ar, não uma aproximação
 * dele. TC-053 ("funciona integralmente com terceiros bloqueados") não diz
 * nada sobre o produto se o servidor testado for outro.
 */

import { spawn } from 'node:child_process'
import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const AUTONOMA = path.join(RAIZ, '.next', 'standalone')

if (!existsSync(path.join(AUTONOMA, 'server.js'))) {
  console.error(
    'Saída autônoma ausente. Rode `npm run build` antes — e confirme que\n' +
      "`output: 'standalone'` continua em next.config.ts.",
  )
  process.exit(1)
}

// O Next deixa estes dois de fora da saída autônoma, por decisão dele.
// Sem a cópia, o servidor sobe e devolve HTML sem CSS nem imagem — falha que
// se parece com erro de estilo e é, na verdade, erro de empacotamento.
cpSync(path.join(RAIZ, '.next', 'static'), path.join(AUTONOMA, '.next', 'static'), {
  recursive: true,
})
if (existsSync(path.join(RAIZ, 'public'))) {
  cpSync(path.join(RAIZ, 'public'), path.join(AUTONOMA, 'public'), { recursive: true })
}

const porta = process.env.PORT ?? '3000'

spawn(process.execPath, ['server.js'], {
  cwd: AUTONOMA,
  stdio: 'inherit',
  env: { ...process.env, PORT: porta, HOSTNAME: process.env.HOSTNAME ?? '0.0.0.0' },
}).on('exit', (codigo) => process.exit(codigo ?? 0))
