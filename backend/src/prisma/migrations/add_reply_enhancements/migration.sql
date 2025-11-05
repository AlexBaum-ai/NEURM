-- Migration: Add Reply Enhancements
-- Description: Adds reply system enhancements for threaded replies, quotes, mentions, and edit history
-- SPRINT-4-006: Implement threaded replies backend
-- Date: 2025-11-05

-- ============================================================================
-- STEP 1: Add new columns to replies table
-- ============================================================================

-- Add quoted_reply_id for quote functionality
ALTER TABLE "replies"
ADD COLUMN "quoted_reply_id" TEXT;

-- Add mentions array for @mention functionality
ALTER TABLE "replies"
ADD COLUMN "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add soft delete columns
ALTER TABLE "replies"
ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "deleted_at" TIMESTAMPTZ(3);

-- Add edited_at timestamp for tracking edits
ALTER TABLE "replies"
ADD COLUMN "edited_at" TIMESTAMPTZ(3);

-- ============================================================================
-- STEP 2: Create reply_edit_history table
-- ============================================================================

CREATE TABLE "reply_edit_history" (
    "id" TEXT NOT NULL,
    "reply_id" TEXT NOT NULL,
    "previous_content" TEXT NOT NULL,
    "edited_by" TEXT NOT NULL,
    "edit_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reply_edit_history_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- STEP 3: Add foreign key constraints
-- ============================================================================

-- Foreign key for quoted reply (self-referencing)
ALTER TABLE "replies"
ADD CONSTRAINT "replies_quoted_reply_id_fkey"
FOREIGN KEY ("quoted_reply_id")
REFERENCES "replies"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Foreign key for edit history
ALTER TABLE "reply_edit_history"
ADD CONSTRAINT "reply_edit_history_reply_id_fkey"
FOREIGN KEY ("reply_id")
REFERENCES "replies"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================

-- Index for quoted_reply_id lookups
CREATE INDEX "replies_quoted_reply_id_idx" ON "replies"("quoted_reply_id");

-- Index for soft delete filtering
CREATE INDEX "replies_is_deleted_idx" ON "replies"("is_deleted");

-- Composite index for topic replies filtering
CREATE INDEX "replies_topic_id_is_deleted_idx" ON "replies"("topic_id", "is_deleted");

-- Index for edit history lookups
CREATE INDEX "reply_edit_history_reply_id_idx" ON "reply_edit_history"("reply_id");

-- Index for edit history sorting
CREATE INDEX "reply_edit_history_created_at_idx" ON "reply_edit_history"("created_at" DESC);

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN "replies"."quoted_reply_id" IS 'Reference to quoted reply for quote functionality';
COMMENT ON COLUMN "replies"."mentions" IS 'Array of @mentioned usernames';
COMMENT ON COLUMN "replies"."is_deleted" IS 'Soft delete flag';
COMMENT ON COLUMN "replies"."deleted_at" IS 'Timestamp of soft deletion';
COMMENT ON COLUMN "replies"."edited_at" IS 'Timestamp of last edit';

COMMENT ON TABLE "reply_edit_history" IS 'Tracks edit history for replies (visible to moderators)';
COMMENT ON COLUMN "reply_edit_history"."previous_content" IS 'Content before the edit';
COMMENT ON COLUMN "reply_edit_history"."edited_by" IS 'User ID who made the edit';
COMMENT ON COLUMN "reply_edit_history"."edit_reason" IS 'Optional reason for the edit';

-- ============================================================================
-- Migration completed successfully
-- ============================================================================
