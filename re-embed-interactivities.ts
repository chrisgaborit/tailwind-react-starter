// --- [THIS IS THE NEW, CORRECT CODE TO PASTE] ---

// To run this: ts-node re-embed-interactivities.ts
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// This is the modern way to get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Now, we point it to the correct .env file
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });

// The rest of the imports
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const EMBEDDING_MODEL = 'text-embedding-3-small'; // Use your preferred embedding model

// --- CLIENTS ---
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// The name of your table in Supabase
const TABLE_NAME = 'rag_items'; // 🚨 VERIFY THIS IS YOUR TABLE NAME!

// The columns we will use
const ID_COLUMN = 'id'; // The primary key column
const CONTENT_COLUMN = 'content'; // The main content column
const SUMMARY_COLUMN = 'summary'; // The new summary column
const EMBEDDING_COLUMN = 'embedding'; // The vector column

async function main() {
  console.log('🚀 Starting re-embedding process...');

  // 1. Fetch all items that need embedding
  console.log(`Fetching items from '${TABLE_NAME}'...`);
  const { data: items, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select(`${ID_COLUMN}, ${CONTENT_COLUMN}, ${SUMMARY_COLUMN}`);

  if (fetchError) {
    console.error('❌ Failed to fetch items from Supabase:', fetchError);
    return;
  }

  if (!items || items.length === 0) {
    console.warn('⚠️ No items found in the table. Nothing to embed.');
    return;
  }

  console.log(`✅ Found ${items.length} items to process.`);

  // 2. Loop through each item, create a new embedding, and update the row
  for (const item of items) {
    const id = item[ID_COLUMN];
    const content = item[CONTENT_COLUMN] || '';
    const summary = item[SUMMARY_COLUMN] || '';

    // Combine the content and summary for a richer embedding
    const textToEmbed = `Interactivity Content: ${content}\n\nInstructional Purpose: ${summary}`;

    console.log(`\n- Processing item ID: ${id}`);
    console.log(`  - Generating embedding for text: "${textToEmbed.substring(0, 80)}..."`);

    try {
      // 3. Generate embedding with OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: textToEmbed,
      });
      const newEmbedding = embeddingResponse.data[0].embedding;

      // 4. Update the item in Supabase with the new embedding
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update({ [EMBEDDING_COLUMN]: newEmbedding })
        .eq(ID_COLUMN, id);

      if (updateError) {
        console.error(`  ❌ Failed to update item ${id}:`, updateError.message);
      } else {
        console.log(`  ✅ Successfully updated embedding for item ${id}.`);
      }
    } catch (e: any) {
      console.error(`  ❌ An error occurred while processing item ${id}:`, e.message);
    }
  }

  console.log('\n✨ Re-embedding process finished!');
}

main();