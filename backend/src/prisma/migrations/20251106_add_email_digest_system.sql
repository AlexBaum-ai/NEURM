-- Migration: Add Email Digest System
-- Date: 2025-11-06
-- Task: SPRINT-13-004

-- Add new enums for digest system
CREATE TYPE "DigestType" AS ENUM ('daily', 'weekly');
CREATE TYPE "EmailTrackingEventType" AS ENUM ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed');

-- Create digest_preferences table
CREATE TABLE "digest_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL UNIQUE,
    "daily_enabled" BOOLEAN NOT NULL DEFAULT true,
    "daily_time" VARCHAR(5) NOT NULL DEFAULT '09:00',
    "weekly_enabled" BOOLEAN NOT NULL DEFAULT true,
    "weekly_day" INTEGER NOT NULL DEFAULT 1,
    "weekly_time" VARCHAR(5) NOT NULL DEFAULT '09:00',
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "include_news" BOOLEAN NOT NULL DEFAULT true,
    "include_forum" BOOLEAN NOT NULL DEFAULT true,
    "include_jobs" BOOLEAN NOT NULL DEFAULT true,
    "include_activity" BOOLEAN NOT NULL DEFAULT true,
    "min_content_items" INTEGER NOT NULL DEFAULT 3,
    "vacation_mode" BOOLEAN NOT NULL DEFAULT false,
    "vacation_until" TIMESTAMPTZ(3),
    "last_daily_digest" TIMESTAMPTZ(3),
    "last_weekly_digest" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "digest_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "digest_preferences_user_id_idx" ON "digest_preferences"("user_id");
CREATE INDEX "digest_preferences_daily_enabled_idx" ON "digest_preferences"("daily_enabled");
CREATE INDEX "digest_preferences_weekly_enabled_idx" ON "digest_preferences"("weekly_enabled");
CREATE INDEX "digest_preferences_vacation_mode_idx" ON "digest_preferences"("vacation_mode");

-- Create email_digests table
CREATE TABLE "email_digests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" "DigestType" NOT NULL,
    "sent_at" TIMESTAMPTZ(3) NOT NULL,
    "email_to" VARCHAR(255) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "content_summary" JSONB NOT NULL,
    "item_count" INTEGER NOT NULL,
    "tracking_token" VARCHAR(100) NOT NULL UNIQUE,
    "opened_at" TIMESTAMPTZ(3),
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "unsubscribed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_digests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "email_digests_user_id_idx" ON "email_digests"("user_id");
CREATE INDEX "email_digests_type_idx" ON "email_digests"("type");
CREATE INDEX "email_digests_sent_at_idx" ON "email_digests"("sent_at" DESC);
CREATE INDEX "email_digests_tracking_token_idx" ON "email_digests"("tracking_token");
CREATE INDEX "email_digests_user_id_type_sent_at_idx" ON "email_digests"("user_id", "type", "sent_at" DESC);

-- Create email_tracking_events table
CREATE TABLE "email_tracking_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "digest_id" TEXT,
    "event_type" "EmailTrackingEventType" NOT NULL,
    "link_url" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_tracking_events_digest_id_fkey" FOREIGN KEY ("digest_id") REFERENCES "email_digests"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "email_tracking_events_digest_id_idx" ON "email_tracking_events"("digest_id");
CREATE INDEX "email_tracking_events_event_type_idx" ON "email_tracking_events"("event_type");
CREATE INDEX "email_tracking_events_created_at_idx" ON "email_tracking_events"("created_at" DESC);

-- Add trigger to update updated_at on digest_preferences
CREATE OR REPLACE FUNCTION update_digest_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER digest_preferences_updated_at_trigger
    BEFORE UPDATE ON "digest_preferences"
    FOR EACH ROW
    EXECUTE FUNCTION update_digest_preferences_updated_at();
