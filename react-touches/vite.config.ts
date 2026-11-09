import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Fully static app: no backend, no env vars. `pnpm build` → dist/ can be hosted anywhere.
// https://vite.dev/config/
export default defineConfig({
  base: './', // relative asset paths, so dist/ also works from a sub-folder
  plugins: [tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
