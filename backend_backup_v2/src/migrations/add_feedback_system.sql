-- Phase 4: Human Feedback Loop + Continuous Learning
-- Add feedback capture and learning system tables

-- Feedback events table - captures every human edit
CREATE TABLE IF NOT EXISTS feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyboard_id UUID NOT NULL,
  scene_index INTEGER NOT NULL,
  field_name VARCHAR(100) NOT NULL, -- 'narrationScript', 'onScreenText', 'knowledgeCheck', etc.
  field_path VARCHAR(200), -- JSON path for nested fields like 'onScreenText.title'
  original_value TEXT,
  edited_value TEXT,
  edit_type VARCHAR(50) NOT NULL, -- 'text_change', 'structure_change', 'addition', 'deletion'
  edit_reason VARCHAR(200), -- Human-provided reason for the edit
  archetype VARCHAR(50), -- 'compliance_policy', 'software_tutorial', etc.
  pattern_type VARCHAR(50), -- 'dilemma', 'click_to_reveal', 'assessment', etc.
  company_id VARCHAR(100), -- Company identifier for learning
  user_id VARCHAR(100), -- User who made the edit
  quality_impact VARCHAR(20), -- 'positive', 'negative', 'neutral'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality overrides table - human quality score overrides
CREATE TABLE IF NOT EXISTS quality_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyboard_id UUID NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- 'lo_coverage', 'interactivity_density', etc.
  ai_score DECIMAL(5,2) NOT NULL, -- What the AI scored
  human_score DECIMAL(5,2) NOT NULL, -- What the human scored
  override_reason TEXT, -- Why the human disagreed
  user_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning patterns table - tracks which patterns are being improved
CREATE TABLE IF NOT EXISTS learning_patterns_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(50) NOT NULL,
  archetype VARCHAR(50) NOT NULL,
  company_id VARCHAR(100),
  total_uses INTEGER DEFAULT 0,
  total_edits INTEGER DEFAULT 0,
  avg_edit_frequency DECIMAL(5,2) DEFAULT 0, -- edits per use
  avg_quality_score DECIMAL(5,2) DEFAULT 0,
  common_edit_types JSONB, -- Most frequent types of edits
  last_improved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt refinements table - tracks adaptive prompt improvements
CREATE TABLE IF NOT EXISTS prompt_refinements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(50) NOT NULL,
  archetype VARCHAR(50) NOT NULL,
  original_prompt TEXT NOT NULL,
  refined_prompt TEXT NOT NULL,
  refinement_reason TEXT NOT NULL,
  feedback_count INTEGER DEFAULT 0, -- Number of feedback events that led to this refinement
  quality_improvement DECIMAL(5,2), -- Measured improvement in quality scores
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company learning profiles - tracks what each company prefers
CREATE TABLE IF NOT EXISTS company_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(100) NOT NULL UNIQUE,
  preferred_tone VARCHAR(100),
  preferred_character_names JSONB, -- Array of preferred character names
  common_edit_patterns JSONB, -- Most frequent types of edits for this company
  quality_preferences JSONB, -- What this company values most
  total_feedback_events INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_events_storyboard ON feedback_events(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_pattern ON feedback_events(pattern_type, archetype);
CREATE INDEX IF NOT EXISTS idx_feedback_events_company ON feedback_events(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_field ON feedback_events(field_name);
CREATE INDEX IF NOT EXISTS idx_quality_overrides_storyboard ON quality_overrides(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_metrics_pattern ON learning_patterns_metrics(pattern_type, archetype);
CREATE INDEX IF NOT EXISTS idx_prompt_refinements_pattern ON prompt_refinements(pattern_type, archetype, is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
CREATE TRIGGER update_learning_patterns_metrics_updated_at 
    BEFORE UPDATE ON learning_patterns_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_learning_profiles_updated_at 
    BEFORE UPDATE ON company_learning_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial learning patterns metrics
INSERT INTO learning_patterns_metrics (pattern_type, archetype, total_uses, total_edits, avg_edit_frequency, avg_quality_score) VALUES
('dilemma', 'compliance_policy', 0, 0, 0, 0),
('dilemma', 'scenario_based', 0, 0, 0, 0),
('click_to_reveal', 'concept_explainer', 0, 0, 0, 0),
('tabbed_explainer', 'compliance_policy', 0, 0, 0, 0),
('assessment', 'compliance_policy', 0, 0, 0, 0),
('assessment', 'scenario_based', 0, 0, 0, 0),
('timeline', 'concept_explainer', 0, 0, 0, 0),
('menu', 'software_tutorial', 0, 0, 0, 0);












