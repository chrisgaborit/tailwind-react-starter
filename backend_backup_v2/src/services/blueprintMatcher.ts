// backend/src/services/blueprintMatcher.ts
import { createClient } from "@supabase/supabase-js";
import type { StoryboardFormData } from "../types";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function injectBlueprintIfMatch(formData: StoryboardFormData) {
  const duration = parseInt(formData.durationMins?.toString() || "0");
  const level = formData.level;

  const isBHMatch =
    (level === "Level 2" || level === "Level 3") &&
    duration >= 20 &&
    duration <= 25;

  if (!isBHMatch) return null;

  const { data, error } = await supabase
    .from("blueprint_chunks")
    .select("page, title, content")
    .eq("blueprint", "brandonhall")
    .order("page", { ascending: true });

  if (error || !data || data.length === 0) {
    console.error("❌ Failed to load Brandon Hall blueprint:", error);
    return null;
  }

  const promptPages = data.map(
    (chunk) => `### Page ${chunk.page}: ${chunk.title}\n${chunk.content}`
  );

  const blueprintInjection = `\n\n---\n🧩 USING BRANDON HALL BLUEPRINT:\n${promptPages.join("\n\n")}`;

  return blueprintInjection;
}