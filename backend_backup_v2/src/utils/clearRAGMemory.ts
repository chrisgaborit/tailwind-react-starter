// backend/src/utils/clearRAGMemory.ts
const { supabaseServer } = require("../services/supabase");

(async () => {
  console.log("🧹 Clearing RAG memory from storyboard_chunks_v2...");
  
  // First, get all record IDs to see how many we're deleting
  const { data: allRecords, error: fetchError } = await supabaseServer
    .from("storyboard_chunks_v2")
    .select("id");
  
  if (fetchError) {
    console.error("❌ Failed to fetch RAG records:", fetchError);
    process.exit(1);
  }
  
  const recordCount = allRecords?.length || 0;
  console.log(`📊 Found ${recordCount} records to delete...`);
  
  if (recordCount === 0) {
    console.log("✅ RAG memory is already empty!");
    process.exit(0);
  }
  
  // Delete all records by using a condition that matches all (created_at is not null)
  const { error } = await supabaseServer
    .from("storyboard_chunks_v2")
    .delete()
    .not("id", "is", null); // This matches all records
  
  if (error) {
    console.error("❌ Failed to clear RAG memory:", error);
    console.error("\n💡 Hint: Check your .env file for valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  } else {
    console.log("✅ Successfully cleared RAG memory");
    console.log(`🧹 Cleared all ${recordCount} records from RAG memory successfully`);
    process.exit(0);
  }
})();

