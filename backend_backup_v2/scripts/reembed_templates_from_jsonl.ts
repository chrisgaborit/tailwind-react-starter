// backend/scripts/reembed_templates_from_jsonl.ts

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

import { createClient } from "@supabase/supabase-js";
import { embedText } from "../src/library/embedText";

// Load and validate environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("--- Verifying Supabase credentials ---");
console.log("Running from:", process.cwd());
console.log("Loaded SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.slice(0, 30)}...` : "MISSING");
console.log("Is SUPABASE_SERVICE_ROLE_KEY set:", !!supabaseServiceKey);
console.log("--------------------------------------\n");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials in .env file.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Load templates from .jsonl file
const filePath = path.join(__dirname, "../../assets/interactivity_templates_rag.jsonl");
if (!fs.existsSync(filePath)) {
  throw new Error(`❌ File not found: ${filePath}`);
}

const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
console.log(`📥 Loaded ${lines.length} templates from JSONL.`);

async function run() {
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const { id, title, content, summary, tags = [] } = entry;

      console.log(`\n🔍 Processing: ${id}`);
      const embedding = await embedText(`${title}\n${summary}\n${content}`);
      if (!embedding) throw new Error("❌ Embedding failed.");

      const { error } = await supabase.from("rag_items").upsert({
        id,
        namespace: "interactivity",
        title,
        summary,
        content,
        tags,
        embedding,
      });

      if (error) throw new Error(`❌ Supabase upsert error: ${JSON.stringify(error, null, 2)}`);

      console.log(`✅ Embedded and stored: ${title}`);
    } catch (err) {
      console.error("❌ Error processing line:", err);
    }
  }

  console.log("\n🏁 Done embedding all JSONL templates.");
}

run();