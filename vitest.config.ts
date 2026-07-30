import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const raiz = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(raiz, 'src') },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'tests/leak/**', 'node_modules/**'],

    coverage: {
      provider: 'v8',
      // O alvo de cobertura é o motor. Cobrir componentes não protege o
      // número (RNF-011, 12-test-plan §1).
      //
      // A extensão é obrigatória no padrão: `src/lib/engine/**` sozinho
      // arrasta o README.md do diretório, que o provedor tenta analisar como
      // JavaScript e falha — ruidosamente, e sem que a suíte fique vermelha.
      include: ['src/lib/engine/**/*.{ts,tsx}', 'src/lib/params/**/*.{ts,tsx}'],
      // `data/` é tabela legal transcrita: sem ramificação a cobrir, e incluí-la
      // diluiria o percentual que protege o código que decide. A correção dos
      // valores ali é auditoria humana, não cobertura (`12-test-plan` §11).
      exclude: ['src/lib/params/data/**'],
      reporter: ['text', 'lcov'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
})
