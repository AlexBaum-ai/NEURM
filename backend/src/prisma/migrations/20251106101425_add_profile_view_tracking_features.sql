-- Add anonymous field to profile_views table
ALTER TABLE profile_views ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT false NOT NULL;

-- Add unique constraint for deduplication (one view per viewer per 24h)
-- First, we need to create a unique index on viewer_id, profile_id, and DATE(viewed_at)
-- PostgreSQL doesn't support function-based unique constraints directly in ALTER TABLE,
-- so we create a unique index instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_views_dedup 
ON profile_views (viewer_id, profile_id, DATE(viewed_at));

-- Add comment to explain the deduplication logic
COMMENT ON INDEX idx_profile_views_dedup IS 'Ensures one profile view per viewer per day (24h deduplication)';
