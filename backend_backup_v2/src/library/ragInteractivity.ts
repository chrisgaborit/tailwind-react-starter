import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { getRAGConfig, buildRAGQuery } from '../utils/ragConfig';

dotenv.config({ path: "./backend/.env" });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize RAG configuration
const ragConfig = getRAGConfig();
console.log(`📚 Using RAG table: ${ragConfig.targetTable}`);

/**
 * Fetches interactivity templates from Supabase RAG memory that best match a user prompt.
 * @param query The user prompt (instructional need)
 * @param limit Max number of templates to return (default 5)
 */
export async function fetchMatchingInteractivities(query: string, limit = 5): Promise<string[]> {
  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  });

  const embeddingJson = await embeddingResponse.json();
  const queryEmbedding = embeddingJson.data?.[0]?.embedding;

  if (!queryEmbedding) {
    console.warn("❌ No embedding returned for interactivity RAG query.");
    return [];
  }

  const { data: matchData, error: matchError } = await supabase.rpc("match_rag_items_by_count", {
    match_count: limit,
    match_threshold: 0.78,
    namespace: "interactivity",
    query_embedding: queryEmbedding,
  });

  if (matchError) {
    console.error("❌ RAG Interactivity fetch error:", matchError);
    return [];
  }

  return matchData?.map((m: any) => m.content) || [];
}