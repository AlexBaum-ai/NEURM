-- Migration: Add Use Cases Enums and Expand Use Case Model
-- Date: 2025-11-06

-- Create enums
CREATE TYPE "UseCaseStatus" AS ENUM ('pending', 'approved', 'published', 'rejected');
CREATE TYPE "UseCaseCategory" AS ENUM ('customer_support', 'code_generation', 'data_analysis', 'content_creation', 'research', 'automation', 'translation', 'summarization', 'classification', 'extraction', 'other');
CREATE TYPE "UseCaseIndustry" AS ENUM ('saas', 'healthcare', 'finance', 'ecommerce', 'education', 'marketing', 'legal', 'hr', 'consulting', 'manufacturing', 'media', 'other');
CREATE TYPE "UseCaseImplementationType" AS ENUM ('rag', 'fine_tuning', 'agent', 'prompt_engineering', 'embeddings', 'function_calling', 'multimodal', 'other');
CREATE TYPE "CompanySize" AS ENUM ('startup', 'small', 'medium', 'large', 'enterprise');

-- Drop existing use_cases table if exists
DROP TABLE IF EXISTS "use_cases" CASCADE;

-- Create comprehensive use_cases table
CREATE TABLE "use_cases" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT NOT NULL,
    "content_json" JSONB NOT NULL,
    "tech_stack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" "UseCaseCategory" NOT NULL,
    "industry" "UseCaseIndustry" NOT NULL,
    "implementation_type" "UseCaseImplementationType" NOT NULL,
    "company_size" "CompanySize",
    "status" "UseCaseStatus" NOT NULL DEFAULT 'pending',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "has_code" BOOLEAN NOT NULL DEFAULT false,
    "has_roi_data" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "author_id" TEXT NOT NULL,
    "company_id" TEXT,
    "model_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "published_at" TIMESTAMPTZ(3),
    "rejected_at" TIMESTAMPTZ(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "use_cases_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX "use_cases_slug_key" ON "use_cases"("slug");

-- Create indexes for filtering and sorting
CREATE INDEX "use_cases_status_idx" ON "use_cases"("status");
CREATE INDEX "use_cases_category_idx" ON "use_cases"("category");
CREATE INDEX "use_cases_industry_idx" ON "use_cases"("industry");
CREATE INDEX "use_cases_implementation_type_idx" ON "use_cases"("implementation_type");
CREATE INDEX "use_cases_author_id_idx" ON "use_cases"("author_id");
CREATE INDEX "use_cases_company_id_idx" ON "use_cases"("company_id");
CREATE INDEX "use_cases_featured_idx" ON "use_cases"("featured");
CREATE INDEX "use_cases_published_at_idx" ON "use_cases"("published_at" DESC);
CREATE INDEX "use_cases_view_count_idx" ON "use_cases"("view_count" DESC);

-- Add foreign key constraints
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "use_cases" ADD CONSTRAINT "use_cases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comments
COMMENT ON TABLE "use_cases" IS 'Real-world LLM use case submissions from the community';
COMMENT ON COLUMN "use_cases"."content_json" IS 'JSON structure containing problem, solution, architecture, implementation, results, metrics, challenges, learnings, tips, and resources';
COMMENT ON COLUMN "use_cases"."tech_stack" IS 'Array of technologies used in the implementation';
COMMENT ON COLUMN "use_cases"."status" IS 'Workflow status: pending (submitted), approved (reviewed), published (public), rejected';
COMMENT ON COLUMN "use_cases"."featured" IS 'Featured use cases are highlighted on the homepage';
COMMENT ON COLUMN "use_cases"."has_code" IS 'Indicates if the use case includes code snippets';
COMMENT ON COLUMN "use_cases"."has_roi_data" IS 'Indicates if the use case includes ROI metrics';
COMMENT ON COLUMN "use_cases"."model_ids" IS 'Array of related LLM model IDs';
