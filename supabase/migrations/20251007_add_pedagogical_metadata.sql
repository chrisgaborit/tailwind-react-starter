-- Migration: Add Pedagogical Intelligence Layer Metadata
-- Date: 2025-01-07
-- Description: Adds pedagogical metadata to storyboard_chunks and creates pedagogical_memory table

-- Add pedagogical metadata columns to existing storyboard_chunks table
ALTER TABLE storyboard_chunks 
ADD COLUMN IF NOT EXISTS pedagogical_metadata JSONB,
ADD COLUMN IF NOT EXISTS engagement_score FLOAT DEFAULT 0.0;

-- Create pedagogical_memory table for storing learning patterns
CREATE TABLE IF NOT EXISTS pedagogical_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern TEXT NOT NULL,
    works_when TEXT NOT NULL,
    avoid_when TEXT,
    evidence JSONB,
    terminology_bias JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_storyboard_chunks_engagement_score 
ON storyboard_chunks (engagement_score DESC);

CREATE INDEX IF NOT EXISTS idx_storyboard_chunks_pedagogical_metadata 
ON storyboard_chunks USING gin(pedagogical_metadata);

CREATE INDEX IF NOT EXISTS idx_pedagogical_memory_pattern 
ON pedagogical_memory (pattern);

CREATE INDEX IF NOT EXISTS idx_pedagogical_memory_works_when 
ON pedagogical_memory (works_when);

CREATE INDEX IF NOT EXISTS idx_pedagogical_memory_created_at 
ON pedagogical_memory (created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN storyboard_chunks.pedagogical_metadata IS 'Stores pedagogical intelligence metadata including learning patterns, terminology usage, and quality metrics';
COMMENT ON COLUMN storyboard_chunks.engagement_score IS 'Numerical score (0.0-1.0) indicating engagement quality of the content chunk';
COMMENT ON TABLE pedagogical_memory IS 'Stores learned pedagogical patterns and their effectiveness conditions';
COMMENT ON COLUMN pedagogical_memory.pattern IS 'Description of the pedagogical pattern or technique';
COMMENT ON COLUMN pedagogical_memory.works_when IS 'Conditions under which this pattern is effective';
COMMENT ON COLUMN pedagogical_memory.avoid_when IS 'Conditions under which this pattern should be avoided';
COMMENT ON COLUMN pedagogical_memory.evidence IS 'JSON evidence supporting the pattern effectiveness';
COMMENT ON COLUMN pedagogical_memory.terminology_bias IS 'JSON mapping of terminology preferences and biases learned from client content';













