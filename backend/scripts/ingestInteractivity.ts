// backend/scripts/ingestInteractivity.ts
import { ingestTemplatesToRAG } from "../src/library/ragIngest";

(async () => {
  try {
    await ingestTemplatesToRAG();
    console.log("✅ Interactivity templates successfully ingested into RAG memory.");
  } catch (err) {
    console.error("❌ Failed to ingest interactivity templates:", err);
    process.exit(1);
  }
})();