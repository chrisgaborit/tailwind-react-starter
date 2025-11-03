// ✅ backend/scripts/ingest_interactivity_templates_from_jsonl.ts

import * as dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" }); // Ensure .env loads from correct location

import * as fs from "fs";
import * as path from "path";
import readline from "readline";
import { createClient } from "@supabase/supabase-js";
import { embedText } from "../src/library/embedText";

// ✅ Resolve path to JSONL file correctly
const filePath = path.resolve(__dirname, "../data/interactivity_templates_rag.jsonl");

// ✅ Validate Supabase environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("--- Verifying Supabase credentials ---");
console.log("Loaded SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : undefined);
console.log("Is SUPABASE_SERVICE_ROLE_KEY set:", !!supabaseServiceKey);
console.log("--------------------------------------\n");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("❌ Supabase credentials are missing in .env file.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ✅ Ingest each template from JSONL
async function ingestTemplates() {
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ File not found at path: ${filePath}`);
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  console.log(`📥 Reading templates from: ${filePath}\n`);

  for await (const line of rl) {
    if (!line.trim()) continue;

    try {
      const template = JSON.parse(line);
      const { id, title, content, summary, tags = ["interactivity"] } = template;

      console.log(`🔍 Processing: ${title}`);

      const embedding = await embedText(`${title}\n${summary}\n${content}`);
      if (!embedding) throw new Error("❌ Failed to generate embedding.");

      const { error } = await supabase.from("rag_items").upsert({
        id,
        namespace: "interactivity",
        title,
        content,
        summary,
        embedding,
        tags,
      });

      if (error) {
        throw new Error(`❌ Supabase upsert error: ${JSON.stringify(error, null, 2)}`);
      }

      console.log(`✅ Successfully embedded: ${title}\n`);
    } catch (err: any) {
      console.error("💥 Error processing template:");
      console.error(err.message || err);
    }
  }

  console.log("🏁 Done ingesting interactivity templates.\n");
}

ingestTemplates();