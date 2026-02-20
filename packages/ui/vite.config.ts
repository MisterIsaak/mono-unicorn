import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const resolve = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'esnext',
    lib: {
      entry: {
        index: resolve('src/index.ts'),
        'components/index': resolve('src/components/index.ts'),
        'composables/index': resolve('src/composables/index.ts'),
      },
      formats: ['es'],
    },
    rolldownOptions: {
      external: ['vue'],
      output: {
        entryFileNames: '[name].mjs',
        chunkFileNames: (chunkInfo) => {
          const ids = chunkInfo.moduleIds
          if (ids.some((id) => /[\\/]components[\\/]/.test(id))) {
            return 'components/[name].mjs'
          }
          if (ids.some((id) => /[\\/]composables[\\/]/.test(id))) {
            return 'composables/[name].mjs'
          }
          return '[name].mjs'
        },
      },
    },
  },
})
