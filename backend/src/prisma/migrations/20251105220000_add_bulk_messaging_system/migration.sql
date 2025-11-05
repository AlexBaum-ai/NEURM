-- Migration: Add Bulk Messaging System for Recruiters
-- This migration adds tables for message templates, bulk messages, and company blocks

-- ============================================================================
-- MESSAGE TEMPLATES
-- ============================================================================

-- Table: message_templates
-- Stores reusable message templates for companies
CREATE TABLE IF NOT EXISTS "message_templates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "subject" VARCHAR(255),
  "body" TEXT NOT NULL,
  "is_default" BOOLEAN DEFAULT false,
  "usage_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_message_templates_company" FOREIGN KEY ("company_id")
    REFERENCES "companies"("id") ON DELETE CASCADE
);

-- Indexes for message_templates
CREATE INDEX "idx_message_templates_company_id" ON "message_templates"("company_id");
CREATE INDEX "idx_message_templates_usage_count" ON "message_templates"("usage_count" DESC);

-- ============================================================================
-- BULK MESSAGES
-- ============================================================================

-- Table: bulk_messages
-- Tracks bulk message sends with status and metrics
CREATE TABLE IF NOT EXISTS "bulk_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" UUID NOT NULL,
  "template_id" UUID,
  "subject" VARCHAR(255),
  "sent_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  "recipient_count" INTEGER NOT NULL DEFAULT 0,
  "delivered_count" INTEGER DEFAULT 0,
  "read_count" INTEGER DEFAULT 0,
  "replied_count" INTEGER DEFAULT 0,
  "failed_count" INTEGER DEFAULT 0,
  "status" VARCHAR(20) DEFAULT 'sent',
  "recipient_ids" UUID[] DEFAULT '{}',
  "created_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_bulk_messages_company" FOREIGN KEY ("company_id")
    REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_bulk_messages_template" FOREIGN KEY ("template_id")
    REFERENCES "message_templates"("id") ON DELETE SET NULL
);

-- Indexes for bulk_messages
CREATE INDEX "idx_bulk_messages_company_id" ON "bulk_messages"("company_id");
CREATE INDEX "idx_bulk_messages_sent_at" ON "bulk_messages"("sent_at" DESC);
CREATE INDEX "idx_bulk_messages_status" ON "bulk_messages"("status");

-- ============================================================================
-- COMPANY BLOCKS
-- ============================================================================

-- Table: company_blocks
-- Allows candidates to block companies from messaging them
CREATE TABLE IF NOT EXISTS "company_blocks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "candidate_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_company_blocks_candidate" FOREIGN KEY ("candidate_id")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_company_blocks_company" FOREIGN KEY ("company_id")
    REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_candidate_company_block" UNIQUE ("candidate_id", "company_id")
);

-- Indexes for company_blocks
CREATE INDEX "idx_company_blocks_candidate_id" ON "company_blocks"("candidate_id");
CREATE INDEX "idx_company_blocks_company_id" ON "company_blocks"("company_id");

-- ============================================================================
-- BULK MESSAGE RECIPIENTS
-- ============================================================================

-- Table: bulk_message_recipients
-- Tracks individual recipients for each bulk message
CREATE TABLE IF NOT EXISTS "bulk_message_recipients" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "bulk_message_id" UUID NOT NULL,
  "recipient_id" UUID NOT NULL,
  "conversation_message_id" UUID,
  "personalized_content" TEXT,
  "status" VARCHAR(20) DEFAULT 'sent',
  "delivered_at" TIMESTAMPTZ(3),
  "read_at" TIMESTAMPTZ(3),
  "replied_at" TIMESTAMPTZ(3),
  "failed_reason" TEXT,
  "created_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_bulk_message_recipients_bulk_message" FOREIGN KEY ("bulk_message_id")
    REFERENCES "bulk_messages"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_bulk_message_recipients_recipient" FOREIGN KEY ("recipient_id")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_bulk_message_recipients_conversation_message" FOREIGN KEY ("conversation_message_id")
    REFERENCES "conversation_messages"("id") ON DELETE SET NULL,
  CONSTRAINT "unique_bulk_message_recipient" UNIQUE ("bulk_message_id", "recipient_id")
);

-- Indexes for bulk_message_recipients
CREATE INDEX "idx_bulk_message_recipients_bulk_message_id" ON "bulk_message_recipients"("bulk_message_id");
CREATE INDEX "idx_bulk_message_recipients_recipient_id" ON "bulk_message_recipients"("recipient_id");
CREATE INDEX "idx_bulk_message_recipients_status" ON "bulk_message_recipients"("status");
CREATE INDEX "idx_bulk_message_recipients_read_at" ON "bulk_message_recipients"("read_at");

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update message_templates.updated_at
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_templates_updated_at
  BEFORE UPDATE ON "message_templates"
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Trigger: Update bulk_messages.updated_at
CREATE OR REPLACE FUNCTION update_bulk_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bulk_messages_updated_at
  BEFORE UPDATE ON "bulk_messages"
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_messages_updated_at();

-- Trigger: Update bulk_message_recipients.updated_at
CREATE OR REPLACE FUNCTION update_bulk_message_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bulk_message_recipients_updated_at
  BEFORE UPDATE ON "bulk_message_recipients"
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_message_recipients_updated_at();

-- Trigger: Increment template usage count when bulk message is sent
CREATE OR REPLACE FUNCTION increment_template_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NOT NULL THEN
    UPDATE "message_templates"
    SET usage_count = usage_count + 1
    WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_template_usage_count
  AFTER INSERT ON "bulk_messages"
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_usage_count();
