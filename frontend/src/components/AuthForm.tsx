
import React, { useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("Error initializing Supabase client in AuthForm:", e);
  }
} else {
  console.warn("Supabase URL or Anon Key not provided in AuthForm. Auth will not function.");
}

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!supabase) { 
      setError("Supabase client not initialized. Cannot sign up."); 
      return; 
    }
    setLoading(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) setError(signUpError.message);
    else window.alert("Check your email for confirmation link"); // Use window.alert for clarity
    setLoading(false);
  };

  const handleSignIn = async () => {
    if (!supabase) { 
      setError("Supabase client not initialized. Cannot sign in."); 
      return; 
    }
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    else window.alert("Logged in successfully!"); // Use window.alert
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">AI SaaS Login</h1>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700">Email</label>
          <input
            className="w-full border rounded-xl px-4 py-3 text-gray-700"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail((e.target as HTMLInputElement).value)}
            placeholder="you@example.com"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium text-gray-700">Password</label>
          <input
            className="w-full border rounded-xl px-4 py-3 text-gray-700"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword((e.target as HTMLInputElement).value)}
            placeholder="********"
          />
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        
        <div className="flex justify-between gap-4">
          <button
            className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            onClick={handleSignIn}
            disabled={loading || !supabase}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <button
            className="w-1/2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            onClick={handleSignUp}
            disabled={loading || !supabase}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
