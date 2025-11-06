-- CreateTable skill_endorsements
CREATE TABLE "skill_endorsements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (unique constraint to ensure one endorsement per user per skill)
CREATE UNIQUE INDEX "skill_endorsements_user_id_profile_id_skill_id_key" ON "skill_endorsements"("user_id", "profile_id", "skill_id");

-- CreateIndex
CREATE INDEX "skill_endorsements_user_id_idx" ON "skill_endorsements"("user_id");

-- CreateIndex
CREATE INDEX "skill_endorsements_profile_id_idx" ON "skill_endorsements"("profile_id");

-- CreateIndex
CREATE INDEX "skill_endorsements_skill_id_idx" ON "skill_endorsements"("skill_id");

-- AddForeignKey
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_endorsements" ADD CONSTRAINT "skill_endorsements_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "user_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
