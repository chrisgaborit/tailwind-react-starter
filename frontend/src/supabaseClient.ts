import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ✅ Environment variables expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON;

// Create a mock Supabase client if environment variables are missing
let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
console.warn(
'⚠️ Supabase URL or Anon Key missing. Using mock client for development. Check your .env files: VITE_SUPABASE_URL and VITE_SUPABASE_ANON.'
);

// Create a mock client that won't crash the app
supabase = {
auth: {
signIn: () => Promise.resolve({ data: null, error: null }),
signUp: () => Promise.resolve({ data: null, error: null }),
signOut: () => Promise.resolve({ error: null }),
getUser: () => Promise.resolve({ data: { user: null }, error: null }),
getSession: () => Promise.resolve({ data: { session: null }, error: null }),
} as any,
from: () => ({
select: () => Promise.resolve({ data: [], error: null }),
insert: () => Promise.resolve({ data: [], error: null }),
update: () => Promise.resolve({ data: [], error: null }),
delete: () => Promise.resolve({ data: [], error: null }),
}),
} as SupabaseClient;

console.log('✅ Mock Supabase client initialized for development');
} else {
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
}

export default supabase;