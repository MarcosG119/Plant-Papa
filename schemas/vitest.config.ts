import { defineConfig } from 'vitest/config'

// Explicit config so vitest stops searching upward and never loads the web
// app's root vite.config.ts (whose 'vite' import is not resolvable from here).
export default defineConfig({})
