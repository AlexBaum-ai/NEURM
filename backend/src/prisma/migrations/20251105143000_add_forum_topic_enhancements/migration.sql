-- AlterEnum: Add new topic types
ALTER TYPE "TopicType" ADD VALUE 'tutorial';
ALTER TYPE "TopicType" ADD VALUE 'announcement';
ALTER TYPE "TopicType" ADD VALUE 'paper';

-- AlterTable: Add new fields to topics table
ALTER TABLE "topics" ADD COLUMN "is_draft" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "topics" ADD COLUMN "is_flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "topics" ADD COLUMN "poll_id" TEXT;

-- CreateTable: topic_attachments
CREATE TABLE "topic_attachments" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: spam_keywords
CREATE TABLE "spam_keywords" (
    "id" TEXT NOT NULL,
    "keyword" VARCHAR(100) NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "spam_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topics_is_draft_idx" ON "topics"("is_draft");
CREATE INDEX "topics_is_flagged_idx" ON "topics"("is_flagged");
CREATE INDEX "topics_type_idx" ON "topics"("type");
CREATE INDEX "topics_poll_id_idx" ON "topics"("poll_id");

-- CreateIndex
CREATE INDEX "topic_attachments_topic_id_idx" ON "topic_attachments"("topic_id");
CREATE INDEX "topic_attachments_topic_id_display_order_idx" ON "topic_attachments"("topic_id", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "spam_keywords_keyword_key" ON "spam_keywords"("keyword");
CREATE INDEX "spam_keywords_keyword_idx" ON "spam_keywords"("keyword");
CREATE INDEX "spam_keywords_is_active_idx" ON "spam_keywords"("is_active");

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_poll_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_attachments" ADD CONSTRAINT "topic_attachments_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
