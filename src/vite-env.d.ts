interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_GMAPS_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}