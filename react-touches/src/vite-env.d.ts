/// <reference types="vite/client" />

// Types for import.meta.env. Add a line here for every VITE_ variable in .env.example.
interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
