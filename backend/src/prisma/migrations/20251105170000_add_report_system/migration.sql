-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('spam', 'harassment', 'off_topic', 'misinformation', 'copyright');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'reviewing', 'resolved_violation', 'resolved_no_action', 'dismissed');

-- AlterTable
ALTER TABLE "topics" ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "replies" ADD COLUMN "is_hidden" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporter_id" TEXT NOT NULL,
    "reportable_type" VARCHAR(50) NOT NULL,
    "reportable_id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMPTZ(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporter_id_reportable_type_reportable_id_key" ON "reports"("reporter_id", "reportable_type", "reportable_id");

-- CreateIndex
CREATE INDEX "reports_reporter_id_idx" ON "reports"("reporter_id");

-- CreateIndex
CREATE INDEX "reports_reportable_type_reportable_id_idx" ON "reports"("reportable_type", "reportable_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateFunction: Auto-hide content after 5 reports
CREATE OR REPLACE FUNCTION auto_hide_reported_content()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
    content_type TEXT;
    content_id TEXT;
BEGIN
    content_type := NEW.reportable_type;
    content_id := NEW.reportable_id;

    -- Count unique reports for this content
    SELECT COUNT(DISTINCT reporter_id) INTO report_count
    FROM reports
    WHERE reportable_type = content_type
      AND reportable_id = content_id
      AND status = 'pending';

    -- Auto-hide if 5 or more unique users reported
    IF report_count >= 5 THEN
        IF content_type = 'Topic' THEN
            UPDATE topics SET is_hidden = true WHERE id = content_id::uuid;
        ELSIF content_type = 'Reply' THEN
            UPDATE replies SET is_hidden = true WHERE id = content_id::uuid;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE TRIGGER trigger_auto_hide_content
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION auto_hide_reported_content();
