import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ✅ Environment variables expected: VITE\_SUPABASE\_URL and VITE\_SUPABASE\_ANON
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
console.error(
'❌ Supabase URL or Anon Key missing. Check your .env files: VITE\_SUPABASE\_URL and VITE\_SUPABASE\_ANON.'
);
throw new Error('Supabase client cannot be initialized without URL and Anon key.');
}

try {
supabase = createClient(supabaseUrl, supabaseAnonKey, {
auth: {
persistSession: true,
autoRefreshToken: true,
},
});
console.log('✅ Supabase client initialized');
} catch (error) {
console.error('Error initializing Supabase client in supabaseClient.ts:', error);
throw error;
}

export default supabase;
