/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;     // "/api" in dev, full URL in prod
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON?: string;
  // add other VITE_* you actually use
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}