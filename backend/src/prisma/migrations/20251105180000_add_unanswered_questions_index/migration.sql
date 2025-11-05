-- CreateIndex for unanswered questions performance
-- This partial index improves query performance for finding unanswered questions
-- by indexing only questions (type='question') without accepted answers (acceptedReplyId IS NULL)

CREATE INDEX IF NOT EXISTS "idx_unanswered_questions"
ON "topics"("type", "accepted_reply_id", "is_locked", "is_draft", "status")
WHERE "type" = 'question'
  AND "accepted_reply_id" IS NULL
  AND "is_locked" = false
  AND "is_draft" = false;

-- Additional index for sorting by common fields
CREATE INDEX IF NOT EXISTS "idx_topics_created_at_desc"
ON "topics"("created_at" DESC)
WHERE "type" = 'question'
  AND "accepted_reply_id" IS NULL
  AND "is_locked" = false
  AND "is_draft" = false;

CREATE INDEX IF NOT EXISTS "idx_topics_view_count_desc"
ON "topics"("view_count" DESC)
WHERE "type" = 'question'
  AND "accepted_reply_id" IS NULL
  AND "is_locked" = false
  AND "is_draft" = false;

CREATE INDEX IF NOT EXISTS "idx_topics_vote_score_desc"
ON "topics"("vote_score" DESC)
WHERE "type" = 'question'
  AND "accepted_reply_id" IS NULL
  AND "is_locked" = false
  AND "is_draft" = false;
