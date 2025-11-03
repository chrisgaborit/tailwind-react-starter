// backend/src/tools/ingestBlueprintChunks.ts
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const jsonlPath = path.join(__dirname, "../library/blueprints/brandonhall_blueprint_chunks.jsonl");

async function ingestChunks() {
  const data = fs.readFileSync(jsonlPath, "utf-8");
  const lines = data.trim().split("\n");

  for (const line of lines) {
    const record = JSON.parse(line);

    const { error } = await supabase
      .from("blueprint_chunks")
      .insert(record);

    if (error) {
      console.error("❌ Error inserting record:", error);
    } else {
      console.log(`✅ Inserted chunk ${record.id}`);
    }
  }

  console.log("🎉 All chunks inserted!");
}

ingestChunks();