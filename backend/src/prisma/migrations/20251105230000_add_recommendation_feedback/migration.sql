-- Create recommendation_feedback table for tracking user feedback on recommendations
-- This table stores user feedback to improve recommendation quality over time

CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "item_type" TEXT NOT NULL, -- 'article', 'forum_topic', 'job', 'user'
  "item_id" TEXT NOT NULL,
  "feedback" TEXT NOT NULL, -- 'like', 'dislike', 'dismiss', 'not_interested'
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "recommendation_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint (one feedback per user per item)
CREATE UNIQUE INDEX "recommendation_feedback_user_id_item_type_item_id_key" ON "recommendation_feedback"("user_id", "item_type", "item_id");

-- Create indexes for efficient querying
CREATE INDEX "recommendation_feedback_user_id_idx" ON "recommendation_feedback"("user_id");
CREATE INDEX "recommendation_feedback_item_type_item_id_idx" ON "recommendation_feedback"("item_type", "item_id");
CREATE INDEX "recommendation_feedback_created_at_idx" ON "recommendation_feedback"("created_at" DESC);

-- Add indexes to improve collaborative filtering queries
CREATE INDEX IF NOT EXISTS "article_bookmarks_user_id_created_at_idx" ON "article_bookmarks"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "forum_votes_user_id_created_at_idx" ON "forum_votes"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "follows_follower_id_created_at_idx" ON "follows"("follower_id", "created_at" DESC);
