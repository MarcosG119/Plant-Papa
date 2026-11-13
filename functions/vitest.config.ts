import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      // The shared schemas package is TS source; vitest resolves it directly.
      '@plant-papa/schemas': fileURLToPath(
        new URL('../schemas/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
})
