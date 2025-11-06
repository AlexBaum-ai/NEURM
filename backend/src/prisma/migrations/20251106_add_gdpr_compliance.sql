-- GDPR Compliance Migration
-- Created: 2025-11-06
-- Description: Add tables for GDPR compliance including consent management, data deletion requests, legal documents, and email unsubscribe

-- Create enums for GDPR
CREATE TYPE "ConsentType" AS ENUM ('necessary', 'functional', 'analytics', 'marketing');
CREATE TYPE "ConsentStatus" AS ENUM ('granted', 'denied', 'withdrawn');
CREATE TYPE "LegalDocumentType" AS ENUM ('privacy_policy', 'terms_of_service', 'cookie_policy', 'data_processing_agreement');
CREATE TYPE "DataDeletionStatus" AS ENUM ('requested', 'processing', 'completed', 'cancelled');

-- User Consents Table
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'denied',
    "granted_at" TIMESTAMPTZ(3),
    "withdrawn_at" TIMESTAMPTZ(3),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- Consent Logs Table (Audit Trail)
CREATE TABLE "consent_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "status" "ConsentStatus" NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "version" INTEGER NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- Email Unsubscribe Table
CREATE TABLE "email_unsubscribes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" VARCHAR(255) NOT NULL,
    "unsubscribe_type" VARCHAR(50) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "unsubscribed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_unsubscribes_pkey" PRIMARY KEY ("id")
);

-- Data Deletion Requests Table
CREATE TABLE "data_deletion_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "DataDeletionStatus" NOT NULL DEFAULT 'requested',
    "reason" TEXT,
    "requested_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "processed_by" TEXT,
    "notes" TEXT,
    "exported_data" TEXT,

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- Legal Documents Table
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "document_type" "LegalDocumentType" NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "effective_at" TIMESTAMPTZ(3) NOT NULL,
    "published_at" TIMESTAMPTZ(3),
    "published_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- Data Retention Policies Table
CREATE TABLE "data_retention_policies" (
    "id" TEXT NOT NULL,
    "data_type" VARCHAR(100) NOT NULL,
    "retention_days" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id")
);

-- DPO Contact Table
CREATE TABLE "dpo_contacts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "dpo_contacts_pkey" PRIMARY KEY ("id")
);

-- Create Unique Constraints
CREATE UNIQUE INDEX "user_consents_user_id_consent_type_key" ON "user_consents"("user_id", "consent_type");
CREATE UNIQUE INDEX "email_unsubscribes_token_key" ON "email_unsubscribes"("token");
CREATE UNIQUE INDEX "legal_documents_document_type_version_key" ON "legal_documents"("document_type", "version");
CREATE UNIQUE INDEX "data_retention_policies_data_type_key" ON "data_retention_policies"("data_type");

-- Create Indexes
CREATE INDEX "user_consents_user_id_idx" ON "user_consents"("user_id");
CREATE INDEX "user_consents_consent_type_idx" ON "user_consents"("consent_type");
CREATE INDEX "user_consents_status_idx" ON "user_consents"("status");
CREATE INDEX "user_consents_created_at_idx" ON "user_consents"("created_at" DESC);

CREATE INDEX "consent_logs_user_id_idx" ON "consent_logs"("user_id");
CREATE INDEX "consent_logs_consent_type_idx" ON "consent_logs"("consent_type");
CREATE INDEX "consent_logs_created_at_idx" ON "consent_logs"("created_at" DESC);

CREATE INDEX "email_unsubscribes_user_id_idx" ON "email_unsubscribes"("user_id");
CREATE INDEX "email_unsubscribes_email_idx" ON "email_unsubscribes"("email");
CREATE INDEX "email_unsubscribes_token_idx" ON "email_unsubscribes"("token");

CREATE INDEX "data_deletion_requests_user_id_idx" ON "data_deletion_requests"("user_id");
CREATE INDEX "data_deletion_requests_status_idx" ON "data_deletion_requests"("status");
CREATE INDEX "data_deletion_requests_requested_at_idx" ON "data_deletion_requests"("requested_at" DESC);

CREATE INDEX "legal_documents_document_type_idx" ON "legal_documents"("document_type");
CREATE INDEX "legal_documents_is_active_idx" ON "legal_documents"("is_active");
CREATE INDEX "legal_documents_effective_at_idx" ON "legal_documents"("effective_at");

CREATE INDEX "data_retention_policies_is_active_idx" ON "data_retention_policies"("is_active");

CREATE INDEX "dpo_contacts_is_active_idx" ON "dpo_contacts"("is_active");

-- Add Foreign Keys
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "email_unsubscribes" ADD CONSTRAINT "email_unsubscribes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
