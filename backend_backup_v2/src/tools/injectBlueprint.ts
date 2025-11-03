// backend/src/tools/injectBlueprint.ts
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { embedText } from "../services/openaiService"; // or wherever your embedding logic is

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const blueprintPath = path.join(__dirname, "../library/blueprints/bhBlueprint.json");
const outputJsonlPath = path.join(__dirname, "../library/blueprints/brandonhall_blueprint_chunks.jsonl");

async function injectBlueprintChunks() {
  const raw = fs.readFileSync(blueprintPath, "utf-8");
  const blueprint = JSON.parse(raw);

  const { pages, promptPreamble } = blueprint;

  const chunks = await Promise.all(
    pages.map(async (page: any, index: number) => {
      const chunkText = `Page ${page.pageNumber}: ${page.title}\nInstructions: ${page.instructions || page.contentInstructions?.level_3 || ""}`;
      const { embedding } = await embedText(chunkText); // Your own embedding function

      return {
        id: `bh-pg-${page.pageNumber}`,
        blueprint: "brandonhall",
        page: page.pageNumber,
        title: page.title,
        content: chunkText,
        embedding,
        created_at: new Date().toISOString(),
      };
    })
  );

  // ✅ Save as JSONL for inspection or bulk upload
  const jsonl = chunks.map((chunk) => JSON.stringify(chunk)).join("\n");
  fs.writeFileSync(outputJsonlPath, jsonl);
  console.log(`✅ Saved blueprint chunks to ${outputJsonlPath}`);
}

injectBlueprintChunks();