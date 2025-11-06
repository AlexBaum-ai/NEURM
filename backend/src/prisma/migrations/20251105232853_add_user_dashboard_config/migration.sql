-- CreateTable
CREATE TABLE "user_dashboard_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "widget_config" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_dashboard_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_dashboard_configs_user_id_key" ON "user_dashboard_configs"("user_id");

-- CreateIndex
CREATE INDEX "user_dashboard_configs_user_id_idx" ON "user_dashboard_configs"("user_id");

-- AddForeignKey
ALTER TABLE "user_dashboard_configs" ADD CONSTRAINT "user_dashboard_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
