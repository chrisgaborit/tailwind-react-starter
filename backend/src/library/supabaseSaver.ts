// @ts-nocheck

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function saveStoryboardToSupabase(
  storyboard: any,
  meta?: { source?: "text" | "files"; aiModel?: string | null; org?: string | null }
) {
  if (!supabase) return;
  const row = {
    module_name: storyboard?.moduleName || "Untitled Module",
    content: storyboard,
    organisation: meta?.org || null,
    ai_model: meta?.aiModel || null,
    source: meta?.source || null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("storyboards").insert(row).select("id");
  if (error) {
    console.error("💥 Failed to save storyboard to Supabase:", error);
  } else {
    console.log("💾 Saved storyboard id:", data?.[0]?.id);
  }
}

module.exports = {
  saveStoryboardToSupabase,
};