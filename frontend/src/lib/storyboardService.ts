// frontend/src/lib/storyboardService.ts
// Utilities for saving and retrieving *detailed* storyboards in Supabase.
// Uses the logged-in user's context so Row‑Level Security (RLS) applies.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { StoryboardModule } from '@/types';

/* =============================================================================
   Supabase client (browser / frontend)
   ============================================================================= */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Optional: warn during local dev if env is missing.
  // eslint-disable-next-line no-console
  console.warn('Supabase env missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =============================================================================
   Helpers
   ============================================================================= */

async function requireUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('Not signed in');
  return data.user;
}

async function getOrgIdForCurrentUser(): Promise<string> {
  const user = await requireUser();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  if (!data?.org_id) throw new Error('No org_id found for current user');
  return data.org_id as string;
}

/* =============================================================================
   Create
   ============================================================================= */

/**
 * Save the *detailed* storyboard JSON that the on‑screen editor shows.
 * RLS guarantees the row is only visible to users in the same organisation.
 */
export async function saveDetailedStoryboard(
  title: string,
  storyboard: StoryboardModule,
  options: { projectId?: string; model?: string } = {}
): Promise<string> {
  const user = await requireUser();
  const orgId = await getOrgIdForCurrentUser();

  const { data, error } = await supabase
    .from('storyboards')
    .insert({
      org_id: orgId,
      project_id: options.projectId ?? null,
      created_by: user.email ?? null,     // legacy display field (optional)
      created_by_uuid: user.id,           // FK -> auth.users.id (important)
      title,
      model: options.model ?? 'gpt-4o',
      is_detailed: true,
      json: storyboard,                   // the exact JSON shown on screen
    })
    .select('id')
    .single();

  if (error) throw error;
  return data!.id as string;
}

/* =============================================================================
   Read
   ============================================================================= */

export type StoryboardListItem = {
  id: string;
  title: string;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  created_by_uuid: string | null;
  pdf_url: string | null;
  is_detailed: boolean;
  version?: number | null;
};

export async function listMyStoryboards(params: {
  projectId?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<StoryboardListItem[]> {
  await requireUser(); // ensures RLS context
  const orgId = await getOrgIdForCurrentUser();

  let q = supabase
    .from('storyboards')
    .select('id,title,project_id,created_at,updated_at,created_by,created_by_uuid,pdf_url,is_detailed,version')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });

  if (params.projectId) q = q.eq('project_id', params.projectId);
  if (params.search?.trim()) q = q.ilike('title', `%${params.search.trim()}%`);
  if (Number.isFinite(params.limit)) q = q.limit(params.limit!);
  if (Number.isFinite(params.offset)) q = q.range(params.offset!, (params.offset! + (params.limit ?? 20)) - 1);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as StoryboardListItem[];
}

/** Get just the JSON payload (for rendering). */
export async function getStoryboardById(id: string): Promise<StoryboardModule | null> {
  await requireUser();
  const orgId = await getOrgIdForCurrentUser();

  const { data, error } = await supabase
    .from('storyboards')
    .select('json')
    .eq('org_id', orgId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return (data?.json ?? null) as StoryboardModule | null;
}

/** Get the whole row (useful for title, pdf_url, etc.). */
export type StoryboardRow = {
  id: string;
  title: string;
  json: StoryboardModule;
  pdf_url: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  version?: number | null;
};

export async function getStoryboardRow(id: string): Promise<StoryboardRow> {
  await requireUser();
  const orgId = await getOrgIdForCurrentUser();

  const { data, error } = await supabase
    .from('storyboards')
    .select('id,title,json,pdf_url,project_id,created_at,updated_at,version')
    .eq('org_id', orgId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as StoryboardRow;
}

/* =============================================================================
   Update
   ============================================================================= */

export async function updateStoryboardJson(id: string, storyboard: StoryboardModule): Promise<void> {
  await requireUser();
  const orgId = await getOrgIdForCurrentUser();

  const { error } = await supabase
    .from('storyboards')
    .update({ json: storyboard })
    .eq('org_id', orgId)
    .eq('id', id);

  if (error) throw error;
}

export async function renameStoryboard(id: string, newTitle: string): Promise<void> {
  await requireUser();
  const orgId = await getOrgIdForCurrentUser();

  const { error } = await supabase
    .from('storyboards')
    .update({ title: newTitle })
    .eq('org_id', orgId)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Store the generated PDF URL on the storyboard row so you can
 * show "Download PDF" next time without regenerating.
 */
export async function setStoryboardPdfUrl(id: string, pdfUrl: string): Promise<void> {
  await requireUser();
  const orgId = await getOrgIdForCurrentUser();

  const { error } = await supabase
    .from('storyboards')
    .update({ pdf_url: pdfUrl })
    .eq('org_id', orgId)
    .eq('id', id);

  if (error) throw error;
}

/** Call the server route that renders + uploads the PDF, then returns the signed URL. */
export async function generatePdfForStoryboard(id: string): Promise<string> {
  const res = await fetch(`/api/storyboards/${id}/pdf`, { method: 'POST' });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'PDF generation failed');
  return json.pdf_url as string;
}

/* =============================================================================
   Delete
   ============================================================================= */

export async function deleteStoryboard(id: string): Promise<void> {
  await requireUser();
  const orgId = await getOrgIdForCurrentUser();

  const { error } = await supabase
    .from('storyboards')
    .delete()
    .eq('org_id', orgId)
    .eq('id', id);

  if (error) throw error;
}