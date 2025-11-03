import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function saveStoryboardToSupabase(
  storyboard: any,
  meta?: { source?: "text" | "files"; aiModel?: string | null; org?: string | null }
) {
  if (!supabase) return;
  
  // Extract strategic fields from storyboard metadata
  const metadata = storyboard?.metadata || {};
  const businessImpact = metadata?.businessImpact || {};
  
  const row = {
    module_name: storyboard?.moduleName || "Untitled Module",
    content: storyboard,
    organisation: meta?.org || null,
    ai_model: meta?.aiModel || null,
    source: meta?.source || null,
    created_at: new Date().toISOString(),
    // NEW STRATEGIC FIELDS
    strategic_category: metadata?.strategicCategory || null,
    business_impact_metric: businessImpact?.metric || null,
    target_improvement: businessImpact?.targetImprovement || null,
    timeframe_days: businessImpact?.timeframe || null,
    success_definition: businessImpact?.successDefinition || null,
    innovation_strategies: metadata?.innovationStrategies || [],
    measurement_approaches: metadata?.measurementApproaches || [],
  };
  
  const { data, error } = await supabase.from("storyboards").insert(row).select("id");
  if (error) {
    console.error("💥 Failed to save storyboard to Supabase:", error);
  } else {
    console.log("💾 Saved storyboard id:", data?.[0]?.id);
  }
}
