// backend/src/tools/ingestFromJsonl.ts
import dotenv from "dotenv";
dotenv.config(); // 👈 Load variables from .env
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const filename = process.argv[2];
if (!filename) {
  console.error("❌ Please provide a path to the .jsonl file");
  process.exit(1);
}

async function ingestChunksFromFile(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter(Boolean);

  for (const line of lines) {
    const chunk = JSON.parse(line);

    const { error } = await supabase.from("rag_chunks").insert(chunk);
    if (error) {
      console.error(`❌ Failed to insert chunk ${chunk.id}:`, error.message);
    } else {
      console.log(`✅ Inserted chunk ${chunk.id}`);
    }
  }

  console.log("🎉 Ingestion complete.");
}

const fullPath = path.resolve(filename);
ingestChunksFromFile(fullPath);