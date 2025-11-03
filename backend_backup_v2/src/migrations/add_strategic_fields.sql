-- Add strategic fields to storyboards table
-- These fields support the new business-focused UI structure

ALTER TABLE storyboards 
ADD COLUMN IF NOT EXISTS strategic_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_impact_metric VARCHAR(50),
ADD COLUMN IF NOT EXISTS target_improvement DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS timeframe_days INTEGER,
ADD COLUMN IF NOT EXISTS success_definition TEXT,
ADD COLUMN IF NOT EXISTS innovation_strategies JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS measurement_approaches JSONB DEFAULT '[]';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_storyboards_strategic_category ON storyboards(strategic_category);
CREATE INDEX IF NOT EXISTS idx_storyboards_business_impact_metric ON storyboards(business_impact_metric);

-- Add constraints
ALTER TABLE storyboards 
ADD CONSTRAINT chk_target_improvement CHECK (target_improvement >= 0 AND target_improvement <= 1000),
ADD CONSTRAINT chk_timeframe_days CHECK (timeframe_days IN (30, 60, 90, 180));

-- Add comments for documentation
COMMENT ON COLUMN storyboards.strategic_category IS 'Strategic category for the learning initiative';
COMMENT ON COLUMN storyboards.business_impact_metric IS 'Primary business metric this initiative targets';
COMMENT ON COLUMN storyboards.target_improvement IS 'Target improvement percentage';
COMMENT ON COLUMN storyboards.timeframe_days IS 'Expected timeframe for results in days';
COMMENT ON COLUMN storyboards.success_definition IS 'Definition of success for this initiative';
COMMENT ON COLUMN storyboards.innovation_strategies IS 'Array of innovation strategies to be used';
COMMENT ON COLUMN storyboards.measurement_approaches IS 'Array of measurement approaches to be used';












