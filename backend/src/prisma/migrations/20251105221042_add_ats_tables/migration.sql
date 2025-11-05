-- CreateTable for ATS features
-- Application notes for team collaboration
CREATE TABLE "application_notes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "application_notes_pkey" PRIMARY KEY ("id")
);

-- Application ratings for candidate assessment
CREATE TABLE "application_ratings" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "application_ratings_pkey" PRIMARY KEY ("id")
);

-- Application shares for team collaboration
CREATE TABLE "application_shares" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "shared_by" TEXT NOT NULL,
    "shared_with" TEXT NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_shares_pkey" PRIMARY KEY ("id")
);

-- Add indexes for application_notes
CREATE INDEX "application_notes_application_id_idx" ON "application_notes"("application_id");
CREATE INDEX "application_notes_user_id_idx" ON "application_notes"("user_id");
CREATE INDEX "application_notes_created_at_idx" ON "application_notes"("created_at" DESC);

-- Add indexes for application_ratings
CREATE INDEX "application_ratings_application_id_idx" ON "application_ratings"("application_id");
CREATE INDEX "application_ratings_user_id_idx" ON "application_ratings"("user_id");
CREATE UNIQUE INDEX "application_ratings_application_id_user_id_key" ON "application_ratings"("application_id", "user_id");

-- Add indexes for application_shares
CREATE INDEX "application_shares_application_id_idx" ON "application_shares"("application_id");
CREATE INDEX "application_shares_shared_by_idx" ON "application_shares"("shared_by");
CREATE INDEX "application_shares_shared_with_idx" ON "application_shares"("shared_with");
CREATE UNIQUE INDEX "application_shares_application_id_shared_with_key" ON "application_shares"("application_id", "shared_with");

-- Add foreign keys for application_notes
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign keys for application_ratings
ALTER TABLE "application_ratings" ADD CONSTRAINT "application_ratings_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_ratings" ADD CONSTRAINT "application_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign keys for application_shares
ALTER TABLE "application_shares" ADD CONSTRAINT "application_shares_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_shares" ADD CONSTRAINT "application_shares_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_shares" ADD CONSTRAINT "application_shares_shared_with_fkey" FOREIGN KEY ("shared_with") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add rating validation check (1-5 stars)
ALTER TABLE "application_ratings" ADD CONSTRAINT "application_ratings_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);
