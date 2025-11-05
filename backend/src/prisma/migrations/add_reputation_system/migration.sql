-- CreateEnum for reputation levels
CREATE TYPE "ReputationLevel" AS ENUM ('newcomer', 'contributor', 'expert', 'master', 'legend');

-- CreateTable: user_reputation
CREATE TABLE "user_reputation" (
    "user_id" TEXT NOT NULL,
    "total_reputation" INTEGER NOT NULL DEFAULT 0,
    "level" "ReputationLevel" NOT NULL DEFAULT 'newcomer',
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_reputation_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "user_reputation_total_reputation_idx" ON "user_reputation"("total_reputation" DESC);
CREATE INDEX "user_reputation_level_idx" ON "user_reputation"("level");

-- AddForeignKey
ALTER TABLE "user_reputation" ADD CONSTRAINT "user_reputation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
