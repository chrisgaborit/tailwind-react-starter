// backend/src/utils/fetchRelevantChunks.ts

/**
 * RAG Integration for V2 Agents
 * 
 * Fetches relevant chunks from uploaded training manuals via Supabase pgvector.
 * Provides context to agents for grounded, accurate content generation.
 * 
 * Fallback: If RAG fails, agents continue without context (graceful degradation).
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const EMBED_MODEL = 'text-embedding-3-small';

// Initialize clients (use environment variables)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const openaiKey = process.env.OPENAI_API_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;
let openai: OpenAI | null = null;

// Initialize only if credentials available
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

if (openaiKey) {
  openai = new OpenAI({ 
    apiKey: openaiKey,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  });
}

export interface RAGChunk {
  id: string;
  content: string;
  metadata?: any;
  similarity: number;
  source?: string;
}

/**
 * Fetch relevant chunks from training materials
 */
export async function fetchRelevantChunks(
  query: string,
  topK: number = 5,
  filters?: {
    interactionType?: string;
    moduleTitle?: string;
  }
): Promise<RAGChunk[]> {
  // Check if RAG is available
  if (!supabase || !openai) {
    console.warn('🔍 RAG not configured - continuing without context');
    return [];
  }

  try {
    console.log(`🔍 RAG: Fetching relevant chunks for: "${query.substring(0, 50)}..."`);

    // Create embedding for query
    const embedding = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: query
    });

    const queryVector = embedding.data[0].embedding;

    // Query Supabase RPC for similar chunks
    const { data, error } = await supabase.rpc('rag_match_storyboards', {
      query_embedding: queryVector,
      match_count: topK * 2 // Fetch extra for filtering
    });

    if (error) {
      console.warn('[RAG] RPC error:', error.message);
      return [];
    }

    let chunks = (data as any[]) || [];

    // Apply filters if provided
    if (filters?.moduleTitle) {
      const titleLower = filters.moduleTitle.toLowerCase();
      chunks = chunks.filter((chunk: any) => {
        const chunkTitle = (chunk.metadata?.title || chunk.title || '').toLowerCase();
        return chunkTitle.includes(titleLower);
      });
    }

    if (filters?.interactionType) {
      chunks = chunks.filter((chunk: any) => {
        const chunkType = chunk.metadata?.interactionType || chunk.interaction_type;
        return chunkType === filters.interactionType;
      });
    }

    // Limit to topK after filtering
    chunks = chunks.slice(0, topK);

    // Format chunks
    const formattedChunks: RAGChunk[] = chunks.map((chunk: any) => ({
      id: chunk.id || String(Math.random()),
      content: extractContent(chunk),
      metadata: chunk.metadata || {},
      similarity: Number(chunk.similarity || chunk.score || 0),
      source: chunk.metadata?.title || chunk.title || 'Unknown source'
    }));

    console.log(`   ✅ Retrieved ${formattedChunks.length} relevant chunks`);
    formattedChunks.forEach((chunk, index) => {
      console.log(`      ${index + 1}. ${chunk.source} (similarity: ${(chunk.similarity * 100).toFixed(1)}%)`);
    });

    return formattedChunks;

  } catch (error) {
    console.error('❌ RAG fetch error:', error);
    return []; // Graceful fallback
  }
}

/**
 * Extract content from chunk (handles various formats)
 */
function extractContent(chunk: any): string {
  if (chunk.content) return chunk.content;
  if (chunk.narrationScript) return chunk.narrationScript;
  if (chunk.onScreenText) return chunk.onScreenText;
  
  // Try to extract from JSON
  try {
    const json = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;
    return json.content || json.narrationScript || json.onScreenText || JSON.stringify(json);
  } catch {
    return String(chunk).substring(0, 1000);
  }
}

/**
 * Build context string from RAG chunks for agent prompts
 */
export function buildRAGContext(chunks: RAGChunk[]): string {
  if (!chunks || chunks.length === 0) {
    return '';
  }

  const contextSections = chunks.map((chunk, index) => {
    return `
REFERENCE ${index + 1} (from: ${chunk.source}, relevance: ${(chunk.similarity * 100).toFixed(0)}%):
${chunk.content.substring(0, 500)}
${chunk.content.length > 500 ? '...[truncated]' : ''}
`.trim();
  });

  return `
CONTEXT FROM TRAINING MATERIALS:
${contextSections.join('\n\n---\n\n')}

Use this context to inform your responses, but adapt the language and examples to be engaging and learner-centric.
DO NOT copy verbatim - transform into narrative-driven content.
`.trim();
}

/**
 * Fetch and format context for specific learning outcome
 */
export async function fetchContextForOutcome(
  outcome: string,
  topic: string,
  topK: number = 3
): Promise<string> {
  const query = `${topic}: ${outcome}`;
  const chunks = await fetchRelevantChunks(query, topK);
  return buildRAGContext(chunks);
}

/**
 * Check if RAG is enabled and configured
 */
export function isRAGEnabled(): boolean {
  return !!(supabase && openai);
}

/**
 * Get RAG status for logging
 */
export function getRAGStatus(): {
  enabled: boolean;
  supabaseConnected: boolean;
  openaiConnected: boolean;
} {
  return {
    enabled: isRAGEnabled(),
    supabaseConnected: !!supabase,
    openaiConnected: !!openai
  };
}

export default fetchRelevantChunks;

