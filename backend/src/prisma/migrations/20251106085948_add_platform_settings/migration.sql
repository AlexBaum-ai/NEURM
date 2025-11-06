-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('string', 'number', 'boolean', 'json', 'encrypted');

-- CreateEnum
CREATE TYPE "SettingCategory" AS ENUM ('general', 'features', 'integrations', 'security', 'email', 'translation', 'summarization', 'classification', 'extraction');

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "category" "SettingCategory" NOT NULL,
    "type" "SettingType" NOT NULL,
    "description" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings_audit_log" (
    "id" TEXT NOT NULL,
    "setting_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "reason" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_settings_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_key_key" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "platform_settings_category_idx" ON "platform_settings"("category");

-- CreateIndex
CREATE INDEX "platform_settings_key_idx" ON "platform_settings"("key");

-- CreateIndex
CREATE INDEX "platform_settings_audit_log_setting_id_idx" ON "platform_settings_audit_log"("setting_id");

-- CreateIndex
CREATE INDEX "platform_settings_audit_log_admin_id_idx" ON "platform_settings_audit_log"("admin_id");

-- CreateIndex
CREATE INDEX "platform_settings_audit_log_created_at_idx" ON "platform_settings_audit_log"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "platform_settings_audit_log" ADD CONSTRAINT "platform_settings_audit_log_setting_id_fkey" FOREIGN KEY ("setting_id") REFERENCES "platform_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_settings_audit_log" ADD CONSTRAINT "platform_settings_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
