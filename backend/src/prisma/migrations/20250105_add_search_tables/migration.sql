-- Migration: Add universal search tables
-- Created: 2025-01-05
-- Description: Add search_queries, saved_searches, and search_history tables for universal search functionality

-- Search queries tracking table (for analytics and popular searches)
CREATE TABLE IF NOT EXISTS "search_queries" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID,
  "query" VARCHAR(500) NOT NULL,
  "content_types" TEXT[], -- Filter for content types: articles, forum_topics, forum_replies, jobs, users, companies
  "results_count" INTEGER NOT NULL DEFAULT 0,
  "clicked_result_id" UUID, -- ID of the result that was clicked
  "clicked_result_type" VARCHAR(50), -- Type of clicked result
  "sort_by" VARCHAR(50), -- relevance, date, popularity
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_search_queries_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

-- Saved searches table
CREATE TABLE IF NOT EXISTS "saved_searches" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL, -- User-defined name for the saved search
  "query" VARCHAR(500) NOT NULL,
  "content_types" TEXT[],
  "sort_by" VARCHAR(50),
  "notification_enabled" BOOLEAN DEFAULT FALSE, -- Notify when new results match
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_saved_searches_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_user_saved_search_name" UNIQUE ("user_id", "name")
);

-- Search history table (last 10 searches per user)
CREATE TABLE IF NOT EXISTS "search_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "query" VARCHAR(500) NOT NULL,
  "content_types" TEXT[],
  "sort_by" VARCHAR(50),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "fk_search_history_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_search_queries_user_id" ON "search_queries"("user_id");
CREATE INDEX IF NOT EXISTS "idx_search_queries_query" ON "search_queries"("query");
CREATE INDEX IF NOT EXISTS "idx_search_queries_created_at" ON "search_queries"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_search_queries_user_created" ON "search_queries"("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_saved_searches_user_id" ON "saved_searches"("user_id");
CREATE INDEX IF NOT EXISTS "idx_saved_searches_created_at" ON "saved_searches"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_search_history_user_id" ON "search_history"("user_id");
CREATE INDEX IF NOT EXISTS "idx_search_history_user_created" ON "search_history"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_search_history_created_at" ON "search_history"("created_at" DESC);

-- Full-text search indexes for improved search performance
-- Articles
CREATE INDEX IF NOT EXISTS "idx_articles_fulltext" ON "articles" USING GIN (to_tsvector('english', title || ' ' || summary || ' ' || content));

-- Forum topics
CREATE INDEX IF NOT EXISTS "idx_topics_fulltext" ON "topics" USING GIN (to_tsvector('english', title || ' ' || content));

-- Forum replies
CREATE INDEX IF NOT EXISTS "idx_replies_fulltext" ON "replies" USING GIN (to_tsvector('english', content));

-- Jobs
CREATE INDEX IF NOT EXISTS "idx_jobs_fulltext" ON "jobs" USING GIN (to_tsvector('english', title || ' ' || description || ' ' || requirements));

-- Companies
CREATE INDEX IF NOT EXISTS "idx_companies_fulltext" ON "companies" USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Users (username and profile display name)
CREATE INDEX IF NOT EXISTS "idx_users_username_search" ON "users" USING GIN (to_tsvector('english', username));

-- Trigram indexes for autocomplete (requires pg_trgm extension)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "idx_articles_title_trgm" ON "articles" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_topics_title_trgm" ON "topics" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_jobs_title_trgm" ON "jobs" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_companies_name_trgm" ON "companies" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "idx_users_username_trgm" ON "users" USING GIN (username gin_trgm_ops);
