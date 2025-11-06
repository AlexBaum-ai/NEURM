-- Migration: Add Platform Metrics Table
-- Description: Creates the platform_metrics table for storing daily aggregated metrics
-- Date: 2025-11-06

CREATE TABLE IF NOT EXISTS "platform_metrics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_users" INTEGER NOT NULL DEFAULT 0,
    "new_users" INTEGER NOT NULL DEFAULT 0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "weekly_active" INTEGER NOT NULL DEFAULT 0,
    "monthly_active" INTEGER NOT NULL DEFAULT 0,
    "total_articles" INTEGER NOT NULL DEFAULT 0,
    "new_articles" INTEGER NOT NULL DEFAULT 0,
    "total_topics" INTEGER NOT NULL DEFAULT 0,
    "new_topics" INTEGER NOT NULL DEFAULT 0,
    "total_replies" INTEGER NOT NULL DEFAULT 0,
    "new_replies" INTEGER NOT NULL DEFAULT 0,
    "total_jobs" INTEGER NOT NULL DEFAULT 0,
    "active_jobs" INTEGER NOT NULL DEFAULT 0,
    "new_jobs" INTEGER NOT NULL DEFAULT 0,
    "applications" INTEGER NOT NULL DEFAULT 0,
    "page_views" INTEGER NOT NULL DEFAULT 0,
    "unique_visitors" INTEGER NOT NULL DEFAULT 0,
    "avg_session_time" DOUBLE PRECISION,
    "bounce_rate" DOUBLE PRECISION,
    "mrr" DOUBLE PRECISION DEFAULT 0,
    "arpu" DOUBLE PRECISION DEFAULT 0,
    "churn" DOUBLE PRECISION DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "avg_api_latency" DOUBLE PRECISION,
    "spam_reports" INTEGER NOT NULL DEFAULT 0,
    "abuse_reports" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

-- Create unique index on date
CREATE UNIQUE INDEX "platform_metrics_date_key" ON "platform_metrics"("date");

-- Create indexes for performance
CREATE INDEX "platform_metrics_date_idx" ON "platform_metrics"("date" DESC);
CREATE INDEX "platform_metrics_created_at_idx" ON "platform_metrics"("created_at" DESC);

-- Add comment
COMMENT ON TABLE "platform_metrics" IS 'Stores daily aggregated platform metrics for admin dashboard';
