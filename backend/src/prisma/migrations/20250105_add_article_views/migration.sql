-- CreateTable: article_views
-- Tracks individual article views with engagement metrics
-- Supports deduplication and analytics aggregation

CREATE TABLE IF NOT EXISTS "article_views" (
  "id" TEXT NOT NULL,
  "article_id" TEXT NOT NULL,
  "user_id" TEXT,
  "ip_hash" TEXT,
  "session_id" TEXT,
  "viewed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "time_on_page" INTEGER DEFAULT 0,
  "scroll_depth" INTEGER DEFAULT 0,
  "user_agent" TEXT,
  "referrer" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "article_views_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "article_views"
  ADD CONSTRAINT "article_views_article_id_fkey"
  FOREIGN KEY ("article_id")
  REFERENCES "articles"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "article_views"
  ADD CONSTRAINT "article_views_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Create indexes for efficient queries
CREATE INDEX "article_views_article_id_idx" ON "article_views"("article_id");
CREATE INDEX "article_views_user_id_idx" ON "article_views"("user_id");
CREATE INDEX "article_views_viewed_at_idx" ON "article_views"("viewed_at" DESC);
CREATE INDEX "article_views_article_viewed_idx" ON "article_views"("article_id", "viewed_at" DESC);

-- Compound index for deduplication check (user)
CREATE INDEX "article_views_dedup_user_idx" ON "article_views"("article_id", "user_id", "viewed_at")
  WHERE "user_id" IS NOT NULL;

-- Compound index for deduplication check (IP)
CREATE INDEX "article_views_dedup_ip_idx" ON "article_views"("article_id", "ip_hash", "viewed_at")
  WHERE "ip_hash" IS NOT NULL;

-- Index for aggregation queries
CREATE INDEX "article_views_analytics_idx" ON "article_views"("article_id", "viewed_at", "time_on_page", "scroll_depth");

-- Comments for documentation
COMMENT ON TABLE "article_views" IS 'Individual article view records with engagement metrics';
COMMENT ON COLUMN "article_views"."ip_hash" IS 'SHA256 hash of IP address for privacy-preserving deduplication';
COMMENT ON COLUMN "article_views"."time_on_page" IS 'Time spent on page in seconds';
COMMENT ON COLUMN "article_views"."scroll_depth" IS 'Maximum scroll depth as percentage (0-100)';
