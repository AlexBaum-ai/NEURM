-- Create job_analytics table for precomputed analytics data
-- This table stores daily aggregated metrics for jobs to improve analytics query performance

CREATE TABLE IF NOT EXISTS "job_analytics" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "job_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "total_views" INTEGER NOT NULL DEFAULT 0,
  "total_applications" INTEGER NOT NULL DEFAULT 0,
  "conversion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "avg_match_score" DECIMAL(5,2),
  "applicant_quality_score" DECIMAL(5,2),
  "time_to_hire_days" INTEGER,
  "top_traffic_sources" JSONB DEFAULT '[]',
  "funnel_data" JSONB DEFAULT '{}',
  "demographics_data" JSONB DEFAULT '{}',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "job_analytics_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraint for job_id and date (one record per job per day)
CREATE UNIQUE INDEX "job_analytics_job_id_date_key" ON "job_analytics"("job_id", "date");

-- Create indexes for efficient querying
CREATE INDEX "job_analytics_job_id_idx" ON "job_analytics"("job_id");
CREATE INDEX "job_analytics_date_idx" ON "job_analytics"("date" DESC);
CREATE INDEX "job_analytics_job_id_date_idx" ON "job_analytics"("job_id", "date" DESC);

-- Add indexes to jobs table for analytics queries
CREATE INDEX IF NOT EXISTS "jobs_company_id_created_at_idx" ON "jobs"("company_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "jobs_company_id_status_idx" ON "jobs"("company_id", "status");

-- Add indexes to job_applications table for analytics queries
CREATE INDEX IF NOT EXISTS "job_applications_job_id_created_at_idx" ON "job_applications"("job_id", "applied_at" DESC);
CREATE INDEX IF NOT EXISTS "job_applications_job_id_status_idx" ON "job_applications"("job_id", "status");

-- Add indexes to job_matches table for analytics queries
CREATE INDEX IF NOT EXISTS "job_matches_job_id_match_score_idx" ON "job_matches"("job_id", "match_score" DESC);
