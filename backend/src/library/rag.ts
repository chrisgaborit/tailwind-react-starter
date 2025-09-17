import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Fetches interactivity templates from Supabase RAG memory that best match a user query.
 * @param query Instructional need (text)
 * @param topK Number of matches to return (default = 3)
 */
export async function fetchMatchingInteractivities(query: string, topK = 3): Promise<string[]> {
  const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  });

  const embeddingJson = await embeddingResponse.json();
  const queryEmbedding = embeddingJson.data?.[0]?.embedding;

  if (!queryEmbedding) {
    throw new Error("No embedding returned for query.");
  }

  const { data: matchData, error: matchError } = await supabase.rpc("match_rag_items_by_count", {
    match_count: topK,
    match_threshold: 0.78,
    namespace: "interactivity",
    query_embedding: queryEmbedding,
  });

  if (matchError) {
    throw new Error("RAG match failed: " + JSON.stringify(matchError, null, 2));
  }

  return matchData?.map((m: any) => m.content) || [];
}