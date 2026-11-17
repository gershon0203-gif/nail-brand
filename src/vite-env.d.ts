/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_FUNCTIONS_URL?: string;
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_STORE_NAME?: string;
  readonly VITE_STORE_TAGLINE?: string;
  readonly VITE_STORE_EMAIL?: string;
  readonly VITE_STORE_PHONE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
