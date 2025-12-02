/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HOST?: string
  readonly VITE_WORKFLOW_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

