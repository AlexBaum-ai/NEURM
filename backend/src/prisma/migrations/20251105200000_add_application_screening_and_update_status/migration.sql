-- AlterEnum: Update ApplicationStatus enum values
-- Create new enum type with updated values
CREATE TYPE "ApplicationStatus_new" AS ENUM ('submitted', 'viewed', 'screening', 'interview', 'offer', 'rejected', 'withdrawn');

-- Add new columns to job_applications
ALTER TABLE "job_applications" ADD COLUMN "screening_answers" JSONB;
ALTER TABLE "job_applications" ADD COLUMN "source" VARCHAR(50);

-- Migrate existing data to new status values
-- pending -> submitted
-- reviewed -> viewed
-- shortlisted -> screening
-- interviewed -> interview
-- offered -> offer
-- accepted -> offer
-- rejected -> rejected
-- withdrawn -> withdrawn

-- Update the status column to use new enum (with data migration)
ALTER TABLE "job_applications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "job_applications" ALTER COLUMN "status" TYPE "ApplicationStatus_new"
  USING (
    CASE "status"::text
      WHEN 'pending' THEN 'submitted'::text
      WHEN 'reviewed' THEN 'viewed'::text
      WHEN 'shortlisted' THEN 'screening'::text
      WHEN 'interviewed' THEN 'interview'::text
      WHEN 'offered' THEN 'offer'::text
      WHEN 'accepted' THEN 'offer'::text
      WHEN 'rejected' THEN 'rejected'::text
      WHEN 'withdrawn' THEN 'withdrawn'::text
      ELSE 'submitted'::text
    END::"ApplicationStatus_new"
  );

-- Drop the old enum type
DROP TYPE "ApplicationStatus";

-- Rename the new enum type to the original name
ALTER TYPE "ApplicationStatus_new" RENAME TO "ApplicationStatus";

-- Set new default value
ALTER TABLE "job_applications" ALTER COLUMN "status" SET DEFAULT 'submitted';

-- Add index for source column
CREATE INDEX "job_applications_source_idx" ON "job_applications"("source");
