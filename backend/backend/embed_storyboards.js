require('dotenv').config();

const express = require('express');
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Embeds storyboards without an embedding (one-off, or for batch use)
 */
async function embedStoryboards() {
  const { data: storyboards, error } = await supabase
    .from('storyboards')
    .select('id, content')
    .is('embedding', null);

  if (error) throw error;

  for (const sb of storyboards) {
    let inputText = "";
    try {
      const obj = JSON.parse(sb.content);
      inputText = [
        obj.title || "",
        obj.summary || "",
        obj.learningOutcomes || "",
        obj.description || "",
      ].join("\n");
    } catch {
      inputText = sb.content;
    }
    inputText = String(inputText || "").substring(0, 3000);

    if (!inputText.trim()) {
      console.log(`❌ No valid inputText for storyboard: ${sb.id}`);
      continue;
    }

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: inputText,
    });
    const embedding = response.data[0].embedding;

    await supabase
      .from('storyboards')
      .update({ embedding })
      .eq('id', sb.id);

    console.log(`✅ Embedded storyboard: ${sb.id}`);
  }
}

// Uncomment this to run the embedding batch when needed
// embedStoryboards()
//   .then(() => console.log('🎉 All storyboards embedded!'))
//   .catch(console.error);

/**
 * Vector search endpoint: POST /vector-search
 * Body: { "query": "your search string", "top_k": 3 }
 */
app.post('/vector-search', async (req, res) => {
  try {
    const { query, top_k = 3 } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query in body." });

    // Get embedding for the query string
    const embeddingResp = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: query,
    });
    const queryEmbedding = embeddingResp.data[0].embedding;

    // Call Supabase function for vector match
    const { data, error } = await supabase.rpc('match_storyboards', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // You can tune this
      match_count: top_k,
    });

    if (error) throw error;

    res.json({ matches: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || err.toString() });
  }
});

// Run the server if file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
