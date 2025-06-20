import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    const { data, error } = await supabase.from('tenants').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching tenants:', error);
      setError('Failed to load tenants.');
    } else {
      setTenants(data);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('tenants').insert([{ name: newTenantName }]);
      if (error) {
        console.error('Insert error:', error);
        setError('Failed to create tenant.');
      } else {
        setNewTenantName('');
        fetchTenants();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-700 p-8 text-white font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center">Tenant Management</h1>

      <form onSubmit={handleCreateTenant} className="mb-10 flex justify-center gap-4">
        <input
          type="text"
          value={newTenantName}
          onChange={(e) => setNewTenantName(e.target.value)}
          placeholder="Enter new tenant name"
          className="px-4 py-3 rounded-lg text-black w-80 focus:outline-none"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-lg hover:bg-blue-100 transition"
        >
          {loading ? 'Creating...' : 'Create Tenant'}
        </button>
      </form>

      {error && <div className="text-red-300 text-center mb-6">{error}</div>}

      <div className="bg-white rounded-lg p-8 shadow-lg max-w-3xl mx-auto text-black">
        <h2 className="text-2xl font-semibold mb-6">Existing Tenants</h2>
        {tenants.length === 0 ? (
          <p>No tenants found.</p>
        ) : (
          <ul className="space-y-4">
            {tenants.map((tenant) => (
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
