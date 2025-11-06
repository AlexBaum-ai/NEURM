-- CreateEnum for ActivityType
CREATE TYPE "ActivityType" AS ENUM (
  'posted_article',
  'created_topic',
  'replied',
  'upvoted',
  'bookmarked',
  'applied_job',
  'earned_badge',
  'followed_user'
);

-- CreateEnum for ActivityTargetType
CREATE TYPE "ActivityTargetType" AS ENUM (
  'article',
  'topic',
  'reply',
  'job',
  'badge',
  'user'
);

-- CreateTable user_activities
CREATE TABLE "user_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "target_type" "ActivityTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "privacy" "PrivacyVisibility" NOT NULL DEFAULT 'public',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_activities_user_id_created_at_idx" ON "user_activities"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_activities_activity_type_created_at_idx" ON "user_activities"("activity_type", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_activities_target_type_target_id_idx" ON "user_activities"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
