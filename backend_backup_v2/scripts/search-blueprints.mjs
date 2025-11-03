import "dotenv/config";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// --- config
const OPENAI_EMBED = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- cli args
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/search-blueprints.mjs \"your query\" [topK]");
  process.exit(1);
}
const query = args[0];
const topK  = Number(args[1] || 5);

async function embed(text) {
  const e = await openai.embeddings.create({ model: OPENAI_EMBED, input: text });
  return e.data[0].embedding;
}

function pickTitleFromContent(content) {
  try {
    if (typeof content === "string") content = JSON.parse(content);
    if (content?.moduleName) return content.moduleName;
    const firstTitle = content?.scenes?.[0]?.pageTitle;
    return firstTitle || "Untitled";
  } catch {
    return "Untitled";
  }
}

async function main() {
  console.log("🔎 Query:", query);
  const vec = await embed(query);

  // Uses your SQL function created earlier
  const { data, error } = await supabase.rpc("rag_match_storyboards", {
    query_embedding: vec,
    match_count: topK,
  });

  if (error) {
    console.error("RPC error:", error);
    process.exit(1);
  }

  // Pretty print a compact view
  const rows = (data || []).map((r) => ({
    id: r.id,
    similarity: Number(r.similarity)?.toFixed(3),
    title: r.title && r.title !== "Untitled" ? r.title : pickTitleFromContent(r.content),
  }));

  if (!rows.length) {
    console.log("No matches found.");
    return;
  }

  console.table(rows);

  // Also dump a short blueprint hint from the best match
  const best = data[0];
  try {
    let content = best.content;
    if (typeof content === "string") content = JSON.parse(content);
    const s0 = content?.scenes?.[0];
    console.log("\nTop match details:");
    console.log("- Module:", pickTitleFromContent(content));
    console.log("- First scene title:", s0?.pageTitle || "—");
    console.log("- First scene interaction:", s0?.interactionType || s0?.interaction?.type || "—");
  } catch {
    /* ignore */
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});