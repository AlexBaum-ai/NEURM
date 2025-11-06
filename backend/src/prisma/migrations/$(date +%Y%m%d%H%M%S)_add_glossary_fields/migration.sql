-- AlterTable: Add new fields to glossary_terms table
ALTER TABLE "glossary_terms"
ADD COLUMN IF NOT EXISTS "slug" VARCHAR(150),
ADD COLUMN IF NOT EXISTS "examples" TEXT,
ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0;

-- Populate slug field for existing records (if any)
UPDATE "glossary_terms"
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("term", '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE "slug" IS NULL;

-- Make slug required and unique after population
ALTER TABLE "glossary_terms"
ALTER COLUMN "slug" SET NOT NULL,
ADD CONSTRAINT "glossary_terms_slug_key" UNIQUE ("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "glossary_terms_slug_idx" ON "glossary_terms"("slug");
CREATE INDEX IF NOT EXISTS "glossary_terms_view_count_idx" ON "glossary_terms"("view_count" DESC);
