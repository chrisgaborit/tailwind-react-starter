-- Migration: Create Clean Pedagogical RAG Table
-- Date: 2025-01-07 12:00:00
-- Description: Creates a curated, high-quality storyboard chunks table with pedagogical intelligence

-- 1️⃣ Rename existing table for safety
ALTER TABLE storyboard_chunks RENAME TO storyboard_chunks_old;

-- 2️⃣ Create new curated table with pedagogical intelligence
CREATE TABLE storyboard_chunks_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storyboard_id UUID,
    scene_no INT,
    content TEXT,
    metadata JSONB,
    embedding VECTOR(1536),
    pedagogical_metadata JSONB,
    engagement_score FLOAT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3️⃣ Add optimized indexes for performance
-- Vector similarity search index
CREATE INDEX idx_storyboard_chunks_v2_embedding
    ON storyboard_chunks_v2 USING ivfflat (embedding vector_l2_ops);

-- Engagement score index for quality filtering
CREATE INDEX idx_storyboard_chunks_v2_engagement_score
    ON storyboard_chunks_v2 (engagement_score);

-- Pedagogical metadata GIN index for complex queries
CREATE INDEX idx_storyboard_chunks_v2_pedagogical_metadata
    ON storyboard_chunks_v2 USING gin (pedagogical_metadata);

-- Storyboard relationship index
CREATE INDEX idx_storyboard_chunks_v2_storyboard_id
    ON storyboard_chunks_v2 (storyboard_id);

-- Scene ordering index
CREATE INDEX idx_storyboard_chunks_v2_scene_no
    ON storyboard_chunks_v2 (storyboard_id, scene_no);

-- Archive status index
CREATE INDEX idx_storyboard_chunks_v2_is_archived
    ON storyboard_chunks_v2 (is_archived);

-- Timestamp indexes for temporal queries
CREATE INDEX idx_storyboard_chunks_v2_created_at
    ON storyboard_chunks_v2 (created_at);

CREATE INDEX idx_storyboard_chunks_v2_updated_at
    ON storyboard_chunks_v2 (updated_at);

-- 4️⃣ Add comprehensive documentation
COMMENT ON TABLE storyboard_chunks_v2 IS
    'Curated, high-quality storyboard content with pedagogical intelligence.';

COMMENT ON COLUMN storyboard_chunks_v2.id IS
    'Unique identifier for the content chunk.';

COMMENT ON COLUMN storyboard_chunks_v2.storyboard_id IS
    'Reference to the parent storyboard.';

COMMENT ON COLUMN storyboard_chunks_v2.scene_no IS
    'Scene number within the storyboard for ordering.';

COMMENT ON COLUMN storyboard_chunks_v2.content IS
    'The actual text content of the chunk.';

COMMENT ON COLUMN storyboard_chunks_v2.metadata IS
    'Additional metadata about the chunk (title, type, etc.).';

COMMENT ON COLUMN storyboard_chunks_v2.embedding IS
    'Vector embedding for semantic search (1536 dimensions).';

COMMENT ON COLUMN storyboard_chunks_v2.pedagogical_metadata IS
    'JSON storing teaching clarity, learner engagement, and scenario alignment.';

COMMENT ON COLUMN storyboard_chunks_v2.engagement_score IS
    'Pedagogical quality score (0–1).';

COMMENT ON COLUMN storyboard_chunks_v2.is_archived IS
    'True if chunk is archived due to low quality.';

COMMENT ON COLUMN storyboard_chunks_v2.created_at IS
    'Timestamp when the chunk was first created.';

COMMENT ON COLUMN storyboard_chunks_v2.updated_at IS
    'Timestamp when the chunk was last updated.';

-- 5️⃣ Add updated_at trigger for automatic timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_storyboard_chunks_v2_updated_at
    BEFORE UPDATE ON storyboard_chunks_v2
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6️⃣ Optional: Seed instruction (commented out for safety)
-- Uncomment and modify the WHERE clause as needed for your quality criteria
-- INSERT INTO storyboard_chunks_v2 (
--     storyboard_id, scene_no, content, metadata, embedding, 
--     pedagogical_metadata, engagement_score, is_archived
-- )
-- SELECT 
--     storyboard_id, scene_no, content, metadata, embedding,
--     pedagogical_metadata, engagement_score, false
-- FROM storyboard_chunks_old 
-- WHERE engagement_score > 0.7 OR engagement_score IS NULL;

-- 7️⃣ Add constraints for data integrity
ALTER TABLE storyboard_chunks_v2 
ADD CONSTRAINT chk_engagement_score 
CHECK (engagement_score >= 0.0 AND engagement_score <= 1.0);

ALTER TABLE storyboard_chunks_v2 
ADD CONSTRAINT chk_scene_no_positive 
CHECK (scene_no > 0);

-- 8️⃣ Add RLS (Row Level Security) policies if needed
-- Uncomment and modify based on your security requirements
-- ALTER TABLE storyboard_chunks_v2 ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow read access to storyboard_chunks_v2" ON storyboard_chunks_v2
--     FOR SELECT USING (true);
-- 
-- CREATE POLICY "Allow insert access to storyboard_chunks_v2" ON storyboard_chunks_v2
--     FOR INSERT WITH CHECK (true);
-- 
-- CREATE POLICY "Allow update access to storyboard_chunks_v2" ON storyboard_chunks_v2
--     FOR UPDATE USING (true);

-- Migration complete: Clean pedagogical RAG table ready for curator













