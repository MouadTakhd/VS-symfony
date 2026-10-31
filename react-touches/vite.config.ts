import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, 'VITE_')

  if (!env.VITE_API_URL) {
    throw new Error('VITE_API_URL is not set. Copy .env.example to .env and fill it in.')
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  }
})
