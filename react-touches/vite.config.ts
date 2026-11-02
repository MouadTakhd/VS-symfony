import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env, .env.local, .env.[mode], .env.[mode].local, in that order of priority (last wins).
  const env = loadEnv(mode, root, 'VITE_')

  // Fail at startup instead of shipping a bundle that calls "undefined/patients".
  if (!env.VITE_API_URL) {
    throw new Error('VITE_API_URL is not set. Copy .env.example to .env and fill it in.')
  }

  return {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  }
})
