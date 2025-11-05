-- Enable pg_trgm extension for text similarity and trigram-based search
-- This extension is required for the related articles algorithm
-- which uses similarity() function for content matching

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Optionally create GIN index on article title and summary for faster similarity searches
-- This index improves performance of similarity() queries
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_articles_summary_trgm ON articles USING gin (summary gin_trgm_ops);

-- Add comment to explain the extension
COMMENT ON EXTENSION pg_trgm IS 'Text similarity measurement and index searching based on trigrams';
