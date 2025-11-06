-- CreateEnum for followable types
CREATE TYPE "FollowableType" AS ENUM ('user', 'company', 'tag', 'category', 'model');

-- CreateTable for polymorphic follows
CREATE TABLE "polymorphic_follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "followable_type" "FollowableType" NOT NULL,
    "followable_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "polymorphic_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "polymorphic_follows_follower_id_idx" ON "polymorphic_follows"("follower_id");

-- CreateIndex
CREATE INDEX "polymorphic_follows_followable_type_followable_id_idx" ON "polymorphic_follows"("followable_type", "followable_id");

-- CreateIndex (unique constraint to prevent duplicate follows)
CREATE UNIQUE INDEX "polymorphic_follows_follower_id_followable_type_followable_idx" ON "polymorphic_follows"("follower_id", "followable_type", "followable_id");

-- CreateIndex for feed queries
CREATE INDEX "polymorphic_follows_created_at_idx" ON "polymorphic_follows"("created_at" DESC);

-- AddForeignKey (follower must be a user)
ALTER TABLE "polymorphic_follows" ADD CONSTRAINT "polymorphic_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add follower_count columns to relevant tables
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "follower_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "follower_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "news_categories" ADD COLUMN IF NOT EXISTS "follower_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "news_tags" ADD COLUMN IF NOT EXISTS "follower_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "forum_tags" ADD COLUMN IF NOT EXISTS "follower_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "llm_models" ADD COLUMN IF NOT EXISTS "follower_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "forum_categories" ADD COLUMN IF NOT EXISTS "follower_count" INTEGER NOT NULL DEFAULT 0;

-- Add following_count to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "following_count" INTEGER NOT NULL DEFAULT 0;

-- Create function to update follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment follower count on followable entity
        CASE NEW.followable_type
            WHEN 'user' THEN
                UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.followable_id;
            WHEN 'company' THEN
                UPDATE companies SET follower_count = follower_count + 1 WHERE id = NEW.followable_id;
            WHEN 'tag' THEN
                UPDATE news_tags SET follower_count = follower_count + 1 WHERE id = NEW.followable_id;
                UPDATE forum_tags SET follower_count = follower_count + 1 WHERE id = NEW.followable_id;
            WHEN 'category' THEN
                UPDATE news_categories SET follower_count = follower_count + 1 WHERE id = NEW.followable_id;
                UPDATE forum_categories SET follower_count = follower_count + 1 WHERE id = NEW.followable_id;
            WHEN 'model' THEN
                UPDATE llm_models SET follower_count = follower_count + 1 WHERE id = NEW.followable_id;
        END CASE;
        -- Increment following count on follower
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement follower count on followable entity
        CASE OLD.followable_type
            WHEN 'user' THEN
                UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.followable_id;
            WHEN 'company' THEN
                UPDATE companies SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.followable_id;
            WHEN 'tag' THEN
                UPDATE news_tags SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.followable_id;
                UPDATE forum_tags SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.followable_id;
            WHEN 'category' THEN
                UPDATE news_categories SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.followable_id;
                UPDATE forum_categories SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.followable_id;
            WHEN 'model' THEN
                UPDATE llm_models SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.followable_id;
        END CASE;
        -- Decrement following count on follower
        UPDATE users SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for follow counts
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON polymorphic_follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();
