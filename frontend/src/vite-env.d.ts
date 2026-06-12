/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute backend API base for split hosting (e.g. Render). Unset → same-origin '/api/v1'. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
