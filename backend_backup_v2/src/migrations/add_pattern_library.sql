-- Phase 2: Pattern Library Migration
-- Add pattern library tables to support reusable scene structures

-- Learning patterns table
CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type VARCHAR(50) NOT NULL, -- 'dilemma', 'click_to_reveal', 'tabbed_explainer', 'timeline', 'assessment'
  pattern_name VARCHAR(100) NOT NULL,
  description TEXT,
  structure JSONB NOT NULL, -- The pattern structure/template
  examples JSONB, -- Array of example implementations
  archetype_tags TEXT[], -- Which archetypes this pattern works with
  complexity_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  interaction_density VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pattern usage tracking
CREATE TABLE IF NOT EXISTS pattern_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES learning_patterns(id) ON DELETE CASCADE,
  storyboard_id UUID, -- Reference to storyboard that used this pattern
  scene_index INTEGER, -- Which scene in the storyboard
  success_rating INTEGER CHECK (success_rating >= 1 AND success_rating <= 5), -- 1-5 rating
  feedback TEXT, -- Human feedback on pattern usage
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality metrics table
CREATE TABLE IF NOT EXISTS quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyboard_id UUID NOT NULL,
  metric_type VARCHAR(50) NOT NULL, -- 'lo_coverage', 'interactivity_density', 'character_consistency', 'narrative_flow'
  metric_value DECIMAL(5,2) NOT NULL, -- 0.00 to 100.00
  target_value DECIMAL(5,2) NOT NULL,
  passed BOOLEAN NOT NULL,
  details JSONB, -- Additional details about the metric
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_archetype ON learning_patterns USING GIN(archetype_tags);
CREATE INDEX IF NOT EXISTS idx_pattern_usage_storyboard ON pattern_usage(storyboard_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_storyboard ON quality_metrics(storyboard_id);

-- Insert initial pattern library
INSERT INTO learning_patterns (pattern_type, pattern_name, description, structure, examples, archetype_tags, complexity_level, interaction_density) VALUES
-- Dilemma patterns
('dilemma', 'ethical_dilemma', 'Character faces ethical decision with clear consequences', 
 '{"setup": "Character introduction and context", "conflict": "Ethical dilemma presented", "choices": ["Option A", "Option B", "Option C"], "consequences": "Outcome of each choice", "learning_point": "Key takeaway"}',
 '[{"title": "Gift Policy Dilemma", "character": "Mark", "role": "Procurement Officer", "scenario": "Supplier offers expensive gift", "choices": ["Accept", "Decline", "Report"], "consequences": ["Policy violation", "Professional relationship maintained", "Compliance demonstrated"]}]',
 ARRAY['compliance_policy', 'scenario_based'], 'intermediate', 'high'),

('dilemma', 'process_dilemma', 'Character must choose between competing processes or priorities',
 '{"setup": "Process context and constraints", "conflict": "Competing priorities or processes", "options": ["Process A", "Process B", "Hybrid approach"], "evaluation": "Criteria for decision", "outcome": "Process chosen and reasoning"}',
 '[{"title": "Urgent vs. Compliant", "character": "Alex", "role": "Team Member", "scenario": "Urgent request vs. proper approval process", "options": ["Fast track", "Full process", "Escalate"], "evaluation": "Risk vs. speed"}]',
 ARRAY['software_tutorial', 'scenario_based'], 'intermediate', 'medium'),

-- Interactive patterns
('click_to_reveal', 'concept_explainer', 'Progressive disclosure of complex concepts',
 '{"title": "Concept title", "sections": [{"header": "Section 1", "content": "Explanation", "icon": "icon_name"}], "summary": "Key points", "interaction": "Click to reveal each section"}',
 '[{"title": "Anti-Bribery Principles", "sections": [{"header": "Zero Tolerance", "content": "No exceptions policy", "icon": "shield"}, {"header": "Gift Limits", "content": "Monetary thresholds", "icon": "gift"}]}]',
 ARRAY['compliance_policy', 'concept_explainer'], 'beginner', 'medium'),

('tabbed_explainer', 'policy_breakdown', 'Organized information in tabbed interface',
 '{"tabs": [{"label": "Tab 1", "content": "Information", "icon": "icon1"}], "navigation": "Tab switching behavior", "summary": "Cross-tab insights"}',
 '[{"tabs": [{"label": "Definition", "content": "What is bribery", "icon": "book"}, {"label": "Examples", "content": "Real scenarios", "icon": "lightbulb"}, {"label": "Consequences", "content": "Legal and career impact", "icon": "warning"}]}]',
 ARRAY['compliance_policy', 'concept_explainer'], 'intermediate', 'medium'),

-- Assessment patterns
('assessment', 'scenario_quiz', 'Multiple choice based on realistic scenarios',
 '{"stem": "Scenario description", "question": "What should the character do?", "options": [{"text": "Option A", "correct": true, "feedback": "Explanation"}, {"text": "Option B", "correct": false, "feedback": "Why this is wrong"}], "rationale": "Learning explanation"}',
 '[{"stem": "Mark receives expensive gift from supplier", "question": "What should Mark do?", "options": [{"text": "Accept and thank them", "correct": false, "feedback": "Violates gift policy"}, {"text": "Decline politely", "correct": true, "feedback": "Maintains professional boundaries"}]}]',
 ARRAY['compliance_policy', 'scenario_based'], 'intermediate', 'high'),

('assessment', 'process_check', 'Step-by-step process validation',
 '{"scenario": "Process context", "steps": ["Step 1", "Step 2", "Step 3"], "question": "Which step comes next?", "options": ["Correct next step", "Wrong step 1", "Wrong step 2"], "explanation": "Process rationale"}',
 '[{"scenario": "Reporting compliance incident", "steps": ["Document incident", "Notify supervisor", "File formal report"], "question": "What should happen next?", "options": ["Follow up with compliance team", "Wait for response", "Close the case"]}]',
 ARRAY['software_tutorial', 'concept_explainer'], 'beginner', 'medium'),

-- Timeline patterns
('timeline', 'historical_context', 'Interactive timeline of relevant events',
 '{"title": "Timeline title", "events": [{"date": "2020", "title": "Event title", "description": "Event details", "significance": "Why it matters"}], "interaction": "Click events for details", "insights": "Key takeaways"}',
 '[{"title": "Anti-Bribery Legislation", "events": [{"date": "1977", "title": "FCPA", "description": "Foreign Corrupt Practices Act", "significance": "First major anti-bribery law"}, {"date": "2010", "title": "UK Bribery Act", "description": "Stricter UK legislation", "significance": "Global compliance requirements"}]}]',
 ARRAY['compliance_policy', 'concept_explainer'], 'intermediate', 'low'),

-- Menu/Pathway patterns
('menu', 'learning_paths', 'Multiple learning pathways for different roles/levels',
 '{"title": "Choose your path", "paths": [{"label": "Path 1", "description": "For beginners", "duration": "15 min", "icon": "icon1"}, {"label": "Path 2", "description": "For experienced", "duration": "30 min", "icon": "icon2"}], "selection": "Path selection behavior"}',
 '[{"title": "Compliance Training Paths", "paths": [{"label": "New Employee", "description": "Basic policies and procedures", "duration": "20 min", "icon": "user"}, {"label": "Manager", "description": "Advanced scenarios and leadership", "duration": "45 min", "icon": "crown"}]}]',
 ARRAY['compliance_policy', 'scenario_based'], 'intermediate', 'low');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to learning_patterns
CREATE TRIGGER update_learning_patterns_updated_at 
    BEFORE UPDATE ON learning_patterns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();












