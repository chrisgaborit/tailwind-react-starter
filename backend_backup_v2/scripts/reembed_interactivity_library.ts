// ✅ FIXED ORDER — Load env vars first
import * as dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" }); // ✅ Explicit path

import { createClient } from "@supabase/supabase-js";
import { embedText } from "../src/library/embedText";
import { INTERACTIVITY_LIBRARY } from "../src/library/interactivityLibrary";

// --- START: VALIDATION OF ENVIRONMENT VARIABLES ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("--- Verifying Supabase credentials ---");
console.log("Script is running from directory:", process.cwd());
console.log("Attempting to load .env from:", "./backend/.env");
console.log("Loaded SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : undefined);
console.log("Is SUPABASE_SERVICE_ROLE_KEY set:", !!supabaseServiceKey);
console.log("--------------------------------------\n");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "ERROR: Supabase credentials are not set.\n" +
    "1. Make sure you have a file named '.env' inside the 'backend' folder.\n" +
    "2. Make sure that file contains SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n"
  );
}
// --- END: VALIDATION ---

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const entries = Object.entries(INTERACTIVITY_LIBRARY);
  console.log(`📦 Preparing ${entries.length} interactivity templates for embedding...\n`);

  for (const [key, fn] of entries) {
    try {
      const example = fn();
      const title = key.replace(/([a-z])([A-Z])/g, "$1 $2");
      const summary = `${example.purpose} — ${example.behaviour}`;
      const content = JSON.stringify(example, null, 2);

      console.log(`[${key}] 1. Generating embedding for "${title}"...`);
      const embedding = await embedText(`${title}\n${summary}\n${content}`);

      if (!embedding) {
        throw new Error("embedText function returned a null or undefined value.");
      }
      console.log(`[${key}] 2. Embedding generated successfully (size: ${embedding.length}).`);

      console.log(`[${key}] 3. Upserting data into Supabase...`);
      const { error } = await supabase.from("rag_items").upsert({
        id: `interactivity-${key}`,
        namespace: "interactivity",
        title,
        content,
        summary,
        embedding,
        tags: ["interactivity", example.type],
      });

      if (error) {
        console.log(`[${key}] 4. Supabase returned an error. Details:`, error);
        throw new Error(`Supabase error: ${JSON.stringify(error, null, 2)}`);
      }

      console.log(`✅ Successfully embedded: ${title}\n`);

    } catch (err: unknown) {
      console.error(`--- START: Debugging Failure for '${key}' ---`);
      if (err instanceof Error) {
        console.error('❌ ERROR:', err.message);
        console.error(err.stack);
      } else {
        console.error('Caught a non-standard error type:', err);
      }
      console.error(`--- END: Debugging Failure for '${key}' ---\n`);
    }
  }

  console.log("🏁 Done embedding interactivity templates.");
}

run();