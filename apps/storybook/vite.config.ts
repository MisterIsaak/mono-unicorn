import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  define: { __VUE_OPTIONS_API__: 'false' },
  plugins: [vue()],
})
