import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Error initializing Supabase client in supabaseClient.ts:", error);
  }
} else {
  console.warn(
    'Supabase URL or Anon Key is not defined in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). ' +
    'Supabase client will not be initialized. Features requiring Supabase will not work.'
  );
}

export default supabase;
