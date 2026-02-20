import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  define: { __VUE_OPTIONS_API__: 'false' },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- vitest 4 bundles vite 7 types; vue plugin targets vite 8
  plugins: [vue() as any],
  test: {
    environment: 'happy-dom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
})
