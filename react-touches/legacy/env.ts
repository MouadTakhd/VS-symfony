import { z } from 'zod'

// The one place the app reads import.meta.env. Everything else imports `env` from here.
const EnvSchema = z.object({
  VITE_API_URL: z.url()

})

const parsed = EnvSchema.safeParse(import.meta.env)

if (!parsed.success) {
  throw new Error(
    'Invalid environment variables — check your .env file (see .env.example):\n' +
      z.prettifyError(parsed.error),
  )
}

export const env = {
  /** Backend base URL without a trailing slash, e.g. "http://localhost:3001" */
  API_URL: parsed.data.VITE_API_URL.replace(/\/+$/, ''),
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
} as const
