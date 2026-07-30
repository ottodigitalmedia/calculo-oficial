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
      include: ['src/lib/engine/**'],
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
