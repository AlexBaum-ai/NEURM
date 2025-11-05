-- Add full-text search support for articles
-- This migration creates a tsvector column and GIN index for efficient full-text search

-- Add tsvector column for full-text search
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION articles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS articles_search_vector_trigger ON "articles";
CREATE TRIGGER articles_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, summary, content
  ON "articles"
  FOR EACH ROW
  EXECUTE FUNCTION articles_search_vector_update();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "articles_search_vector_idx" ON "articles" USING GIN (search_vector);

-- Update existing rows to populate search_vector
UPDATE "articles" SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'C');

-- Add index for article status and published date (for efficient filtering)
CREATE INDEX IF NOT EXISTS "articles_status_published_at_idx" ON "articles" (status, published_at DESC);

-- Add index for featured and trending articles
CREATE INDEX IF NOT EXISTS "articles_featured_published_at_idx" ON "articles" (is_featured, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS "articles_trending_published_at_idx" ON "articles" (is_trending, published_at DESC) WHERE status = 'published';
