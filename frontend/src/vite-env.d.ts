cat > src/vite-env.d.ts <<'TS'
/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
TS
