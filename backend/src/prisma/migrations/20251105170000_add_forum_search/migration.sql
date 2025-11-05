-- Add full-text search support for forum topics and replies
-- This migration creates tsvector columns, GIN indexes, and search-related tables

-- ===========================================================================
-- PART 1: Add tsvector columns for full-text search
-- ===========================================================================

-- Add search_vector column to topics table
ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Add search_vector column to replies table
ALTER TABLE "replies" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- ===========================================================================
-- PART 2: Create functions to update search vectors
-- ===========================================================================

-- Function to update topic search vector
CREATE OR REPLACE FUNCTION topics_search_vector_update() RETURNS trigger AS $$
BEGIN
  -- Weight: A = highest (title), B = medium (content)
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Function to update reply search vector
CREATE OR REPLACE FUNCTION replies_search_vector_update() RETURNS trigger AS $$
BEGIN
  -- Weight: B = medium (content)
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- PART 3: Create triggers to automatically update search vectors
-- ===========================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS topics_search_vector_trigger ON "topics";
DROP TRIGGER IF EXISTS replies_search_vector_trigger ON "replies";

-- Create trigger for topics
CREATE TRIGGER topics_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, content
  ON "topics"
  FOR EACH ROW
  EXECUTE FUNCTION topics_search_vector_update();

-- Create trigger for replies
CREATE TRIGGER replies_search_vector_trigger
  BEFORE INSERT OR UPDATE OF content
  ON "replies"
  FOR EACH ROW
  EXECUTE FUNCTION replies_search_vector_update();

-- ===========================================================================
-- PART 4: Create GIN indexes for fast full-text search
-- ===========================================================================

-- Create GIN index for topics search
CREATE INDEX IF NOT EXISTS "topics_search_vector_idx" ON "topics" USING GIN (search_vector);

-- Create GIN index for replies search
CREATE INDEX IF NOT EXISTS "replies_search_vector_idx" ON "replies" USING GIN (search_vector);

-- Create trigram indexes for autocomplete on topics
CREATE INDEX IF NOT EXISTS "topics_title_trgm_idx" ON "topics" USING gin (title gin_trgm_ops);

-- ===========================================================================
-- PART 5: Create composite indexes for search filtering and sorting
-- ===========================================================================

-- Index for filtering by category and sorting by relevance/date
CREATE INDEX IF NOT EXISTS "topics_category_created_idx" ON "topics" (category_id, created_at DESC);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS "topics_type_created_idx" ON "topics" (type, created_at DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS "topics_status_created_idx" ON "topics" (status, created_at DESC);

-- Index for sorting by popularity (vote_score)
CREATE INDEX IF NOT EXISTS "topics_vote_score_idx" ON "topics" (vote_score DESC, created_at DESC);

-- Index for sorting by upvotes
CREATE INDEX IF NOT EXISTS "topics_upvote_count_idx" ON "topics" (upvote_count DESC, created_at DESC);

-- Index for replies by topic (for reply search)
CREATE INDEX IF NOT EXISTS "replies_topic_created_idx" ON "replies" (topic_id, created_at ASC) WHERE is_deleted = false;

-- ===========================================================================
-- PART 6: Create SavedSearch table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "saved_searches" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "query" VARCHAR(500) NOT NULL,
  "filters" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_saved_searches_user"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes for saved searches
CREATE INDEX IF NOT EXISTS "saved_searches_user_id_idx" ON "saved_searches" ("user_id");
CREATE INDEX IF NOT EXISTS "saved_searches_created_at_idx" ON "saved_searches" ("created_at" DESC);

-- ===========================================================================
-- PART 7: Create SearchHistory table
-- ===========================================================================

CREATE TABLE IF NOT EXISTS "search_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "query" VARCHAR(500) NOT NULL,
  "filters" JSONB DEFAULT '{}',
  "result_count" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_search_history_user"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes for search history
CREATE INDEX IF NOT EXISTS "search_history_user_id_idx" ON "search_history" ("user_id");
CREATE INDEX IF NOT EXISTS "search_history_created_at_idx" ON "search_history" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "search_history_user_created_idx" ON "search_history" ("user_id", "created_at" DESC);

-- ===========================================================================
-- PART 8: Populate existing data with search vectors
-- ===========================================================================

-- Update existing topics to populate search_vector
UPDATE "topics" SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
WHERE search_vector IS NULL;

-- Update existing replies to populate search_vector
UPDATE "replies" SET search_vector =
  setweight(to_tsvector('english', coalesce(content, '')), 'B')
WHERE search_vector IS NULL;

-- ===========================================================================
-- PART 9: Add comments for documentation
-- ===========================================================================

COMMENT ON TABLE "saved_searches" IS 'Stores user-saved search queries for quick access';
COMMENT ON TABLE "search_history" IS 'Tracks user search history (last 10 per user)';
COMMENT ON COLUMN "topics"."search_vector" IS 'Full-text search vector for topic title and content';
COMMENT ON COLUMN "replies"."search_vector" IS 'Full-text search vector for reply content';
