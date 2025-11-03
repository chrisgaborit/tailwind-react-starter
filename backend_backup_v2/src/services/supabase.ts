// backend/src/services/supabase.ts
// Server-side Supabase client (uses service role for Storage + DB writes under RLS bypass)

const { createClient } = require('@supabase/supabase-js');
import type { User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

exports.supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/** Verify the caller using an access token (Authorization: Bearer <jwt>) */
export async function verifyUser(jwt?: string): Promise<User> {
  if (!jwt) throw new Error('Missing Authorization token');
  const { data, error } = await supabaseServer.auth.getUser(jwt);
  if (error || !data.user) throw new Error('Unauthorized');
  return data.user;
}

/** Look up the caller’s org_id via public.user_profiles */
export async function getOrgIdForUser(userId: string): Promise<string> {
  const { data, error } = await supabaseServer
    .from('user_profiles')
    .select('org_id')
    .eq('id', userId)
    .single();
  if (error) throw error;
  if (!data?.org_id) throw new Error('No org_id found for user');
  return data.org_id as string;
}

/**
 * Upload a file to Supabase Storage and return its public URL.
 * Assumes the bucket is public (as per your setup).
 */
export async function uploadPublicFile(params: {
  bucket: string;
  path: string;                             // e.g. `${orgId}/${storyboardId}.pdf`
  data: Buffer | ArrayBuffer | Uint8Array;
  contentType?: string;                     // default 'application/octet-stream'
  upsert?: boolean;                         // default true
}): Promise<string> {
  const { bucket, path, data, contentType = 'application/octet-stream', upsert = true } = params;

  const { error: upErr } = await supabaseServer
    .storage
    .from(bucket)
    .upload(path, data, { contentType, upsert });

  if (upErr) throw upErr;

  const { data: pub } = supabaseServer.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}