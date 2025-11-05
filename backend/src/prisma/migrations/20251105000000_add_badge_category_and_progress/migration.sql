-- CreateEnum for BadgeCategory
CREATE TYPE "BadgeCategory" AS ENUM ('skill', 'activity', 'special');

-- AlterTable: Add category to badges
ALTER TABLE "badges" ADD COLUMN "category" "BadgeCategory" NOT NULL DEFAULT 'activity';

-- AlterTable: Add progress to user_badges
ALTER TABLE "user_badges" ADD COLUMN "progress" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: Add index on category
CREATE INDEX "badges_category_idx" ON "badges"("category");
