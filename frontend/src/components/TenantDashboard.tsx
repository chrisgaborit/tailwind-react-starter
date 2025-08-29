
import React, { useEffect, useState, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error("Error initializing Supabase client in TenantDashboard:", e);
  }
} else {
  console.warn("Supabase URL or Anon Key not provided in TenantDashboard. Auth will not function.");
}


interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

const TenantDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newTenantName, setNewTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    if (!supabase) { 
      setError("Supabase client not initialized. Cannot fetch tenants."); 
      return; 
    }
    setLoading(true);
    const { data, error: fetchError } = await supabase.from('tenants').select('*');
    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      setTenants(data as Tenant[]);
    }
    setLoading(false);
  }, []); 

  useEffect(() => {
    if (supabase) {
        fetchTenants();
    }
  }, [fetchTenants]); 

  const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabase) { 
      setError("Supabase client not initialized. Cannot create tenant."); 
      return; 
    }
    if (!newTenantName.trim()) {
      setError("Tenant name cannot be empty.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: insertError } = await supabase.from('tenants').insert([{ name: newTenantName }]);
    if (insertError) {
      setError(insertError.message);
    } else {
      setNewTenantName('');
      fetchTenants(); 
    }
    setLoading(false);
  };

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700 p-4">
        <p>Supabase client is not configured. Tenant Dashboard cannot be displayed.</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-700 p-8 text-white font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center">Tenant Management</h1>
      
      <form onSubmit={handleCreateTenant} className="mb-10 flex justify-center gap-4">
        <input
          type="text"
          placeholder="Enter new tenant name"
          value={newTenantName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTenantName((e.target as HTMLInputElement).value)}
          className="px-4 py-3 rounded-lg border-2 border-transparent focus:border-white focus:ring-white bg-white/20 placeholder-white/70 text-white w-full max-w-md"
          required
        />
        <button
          type="submit"
          disabled={loading || !supabase}
          className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Tenant'}
        </button>
      </form>

      {error && <div className="text-red-300 text-center mb-6 bg-black/30 p-3 rounded-md">{error}</div>}
      
      <div className="bg-white rounded-lg p-8 shadow-lg max-w-3xl mx-auto text-black">
        <h2 className="text-2xl font-semibold mb-6">Existing Tenants</h2>
        {loading && tenants.length === 0 && <p>Loading tenants...</p>}
        {!loading && tenants.length === 0 && !error && <p>No tenants found.</p>}
        {tenants.length > 0 && (
          <ul className="space-y-4">
            {tenants.map((tenant: Tenant) => (
              <li key={tenant.id} className="flex justify-between items-center border-b pb-2">
                <span>{tenant.name}</span>
                <span className="text-gray-500 text-sm">{new Date(tenant.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard;
