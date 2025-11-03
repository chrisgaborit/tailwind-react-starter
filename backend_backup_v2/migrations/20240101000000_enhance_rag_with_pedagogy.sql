-- Enhance RAG with Pedagogical Intelligence Layer
-- Migration: Add pedagogical metadata to existing storyboard_chunks table

-- Add pedagogical metadata to existing storyboard_chunks table
ALTER TABLE storyboard_chunks ADD COLUMN IF NOT EXISTS pedagogical_metadata JSONB;
ALTER TABLE storyboard_chunks ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE storyboard_chunks ADD COLUMN IF NOT EXISTS repetition_patterns TEXT[];

-- New table for pedagogical patterns (successful learning experiences)
CREATE TABLE IF NOT EXISTS pedagogical_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  audience_type TEXT NOT NULL,
  strategy TEXT NOT NULL,
  learning_objectives TEXT[],
  success_score DECIMAL(3,2) DEFAULT 1.0,
  pattern_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table for pedagogical failures (patterns to avoid)
CREATE TABLE IF NOT EXISTS pedagogical_failures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  failure_type TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  storyboard_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for pedagogical search
CREATE INDEX IF NOT EXISTS idx_pedagogical_patterns_content_audience 
ON pedagogical_patterns (content_type, audience_type);

CREATE INDEX IF NOT EXISTS idx_pedagogical_patterns_success 
ON pedagogical_patterns (success_score DESC);

CREATE INDEX IF NOT EXISTS idx_pedagogical_metadata 
ON storyboard_chunks USING gin(pedagogical_metadata);

CREATE INDEX IF NOT EXISTS idx_pedagogical_failures_type 
ON pedagogical_failures (failure_type);

-- Add updated_at trigger for pedagogical_patterns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pedagogical_patterns_updated_at 
BEFORE UPDATE ON pedagogical_patterns 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO pedagogical_patterns (content_type, audience_type, strategy, learning_objectives, success_score, pattern_data) VALUES
('leadership', 'management', 'case-based', ARRAY['Apply leadership principles', 'Manage team dynamics'], 0.95, '{"strategy": "case-based", "learningObjectiveFlow": []}'),
('technical', 'beginner', 'scaffolded-progressive', ARRAY['Understand basic concepts', 'Apply in practice'], 0.88, '{"strategy": "scaffolded-progressive", "learningObjectiveFlow": []}'),
('compliance', 'general', 'principle-driven', ARRAY['Follow procedures', 'Identify risks'], 0.92, '{"strategy": "principle-driven", "learningObjectiveFlow": []}');

INSERT INTO pedagogical_failures (failure_type, description, recommendation) VALUES
('repetition', 'Multiple choice questions in a row', 'Vary assessment types'),
('misalignment', 'Teaching doesn''t match practice', 'Ensure teaching→practice alignment'),
('terminology-drift', 'Not using client terminology', 'Enforce client terminology usage'),
('complexity-gap', 'No progressive complexity', 'Build complexity gradually');

