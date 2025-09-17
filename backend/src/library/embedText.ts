// ✅ Absolute path to .env
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),  // Adjusted relative to embedText.ts location
});

import OpenAI from "openai";

// ✅ This now works because .env is loaded above
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Calls OpenAI's embedding endpoint to get a 3072D vector for RAG.
 * Uses the latest embedding model "text-embedding-3-small".
 * @param inputText Text to embed
 * @returns Promise<number[]> Embedding vector
 */
export async function embedText(inputText: string): Promise<number[]> {
  if (!inputText || inputText.trim().length < 5) {
    throw new Error("❌ Text too short to embed");
  }

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: inputText,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (err: any) {
    console.error("💥 Error generating embedding:", err.message || err);
    throw new Error("Failed to embed text");
  }
}