-- CreateTable
CREATE TABLE "model_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "model_id" UUID NOT NULL,
    "version" VARCHAR(100) NOT NULL,
    "released_at" TIMESTAMPTZ(3) NOT NULL,
    "changelog" TEXT,
    "is_latest" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(50),
    "features" JSONB,
    "improvements" JSONB,
    "deprecated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "model_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "model_versions_model_id_idx" ON "model_versions"("model_id");

-- CreateIndex
CREATE INDEX "model_versions_released_at_idx" ON "model_versions"("released_at" DESC);

-- CreateIndex
CREATE INDEX "model_versions_is_latest_idx" ON "model_versions"("is_latest");

-- CreateIndex
CREATE UNIQUE INDEX "model_versions_model_id_version_key" ON "model_versions"("model_id", "version");

-- AddForeignKey
ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "llm_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
