-- Add trigger to automatically update article bookmark_count
-- This ensures bookmark_count stays in sync even if manual operations occur

-- Function to increment bookmark count
CREATE OR REPLACE FUNCTION increment_article_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles
  SET bookmark_count = bookmark_count + 1
  WHERE id = NEW.article_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement bookmark count
CREATE OR REPLACE FUNCTION decrement_article_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE articles
  SET bookmark_count = GREATEST(0, bookmark_count - 1)
  WHERE id = OLD.article_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on bookmark insert
CREATE TRIGGER trigger_increment_bookmark_count
AFTER INSERT ON bookmarks
FOR EACH ROW
EXECUTE FUNCTION increment_article_bookmark_count();

-- Trigger on bookmark delete
CREATE TRIGGER trigger_decrement_bookmark_count
AFTER DELETE ON bookmarks
FOR EACH ROW
EXECUTE FUNCTION decrement_article_bookmark_count();

-- Add index on article_id for faster trigger updates (if not exists)
CREATE INDEX IF NOT EXISTS idx_bookmarks_article_id ON bookmarks(article_id);

-- Comment on triggers
COMMENT ON TRIGGER trigger_increment_bookmark_count ON bookmarks IS 'Automatically increment article bookmark_count when bookmark is created';
COMMENT ON TRIGGER trigger_decrement_bookmark_count ON bookmarks IS 'Automatically decrement article bookmark_count when bookmark is deleted';
