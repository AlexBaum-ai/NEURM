-- Performance Optimization Indexes Migration
-- Adds indexes based on common query patterns and performance analysis
-- Run this after analyzing query patterns in production

-- ============================================================================
-- ARTICLES: Frequently queried fields
-- ============================================================================

-- Composite index for article listing with filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_status_published_views
ON articles(status, published_at DESC, view_count DESC)
WHERE status = 'published';

-- Index for article search by category and tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_category_published
ON articles(category_id, published_at DESC)
WHERE status = 'published';

-- Index for trending articles (views + likes in recent period)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_trending
ON articles(status, updated_at DESC, view_count DESC)
WHERE status = 'published' AND updated_at > NOW() - INTERVAL '7 days';

-- Full-text search index for articles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_search_vector
ON articles USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')));

-- ============================================================================
-- FORUM TOPICS: High-traffic queries
-- ============================================================================

-- Composite index for topic listing with filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_topics_category_status_pinned
ON forum_topics(category_id, status, is_pinned DESC, last_activity_at DESC)
WHERE status = 'open';

-- Index for user's topics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_topics_author_created
ON forum_topics(author_id, created_at DESC);

-- Index for popular topics (by views and replies)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_topics_popular
ON forum_topics(status, view_count DESC, reply_count DESC)
WHERE status = 'open';

-- Full-text search for topics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_topics_search_vector
ON forum_topics USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- ============================================================================
-- FORUM REPLIES: Performance-critical
-- ============================================================================

-- Index for topic replies with voting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_topic_score
ON forum_replies(topic_id, upvote_count DESC, created_at ASC)
WHERE is_deleted = false;

-- Index for user's replies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_author_created
ON forum_replies(author_id, created_at DESC)
WHERE is_deleted = false;

-- ============================================================================
-- JOBS: Search and filtering
-- ============================================================================

-- Composite index for job listing with filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status_type_location
ON jobs(status, job_type, work_location, created_at DESC)
WHERE status = 'active';

-- Index for company jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_company_status
ON jobs(company_id, status, created_at DESC);

-- Index for job matching by experience level
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_experience_salary
ON jobs(experience_level, status, salary_min, salary_max)
WHERE status = 'active';

-- Full-text search for jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_search_vector
ON jobs USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(requirements, '')));

-- ============================================================================
-- USERS: Authentication and profile queries
-- ============================================================================

-- Index for email lookup (already exists, but ensure it's there)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for username lookup (already exists)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index for active users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status_login
ON users(status, last_login_at DESC)
WHERE status = 'active';

-- Index for user role filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_created
ON users(role, created_at DESC);

-- ============================================================================
-- NOTIFICATIONS: High-volume table
-- ============================================================================

-- Composite index for user notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read_created
ON notifications(user_id, is_read, created_at DESC);

-- Index for unread notifications count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
ON notifications(user_id, created_at DESC)
WHERE is_read = false;

-- Index for notification cleanup (old read notifications)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_cleanup
ON notifications(created_at)
WHERE is_read = true;

-- ============================================================================
-- BOOKMARKS: User content saves
-- ============================================================================

-- Composite index for user bookmarks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_user_article
ON bookmarks(user_id, article_id, created_at DESC);

-- Index for article bookmark count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookmarks_article_count
ON bookmarks(article_id)
WHERE article_id IS NOT NULL;

-- ============================================================================
-- VOTES: High-frequency updates
-- ============================================================================

-- Index for topic votes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_topic_votes_topic_user
ON topic_votes(topic_id, user_id, vote_type);

-- Index for reply votes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reply_votes_reply_user
ON reply_votes(reply_id, user_id, vote_type);

-- ============================================================================
-- ANALYTICS: Time-series queries
-- ============================================================================

-- Index for analytics event queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_type_timestamp
ON analytics_events(event_type, timestamp DESC);

-- Index for user analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_timestamp
ON analytics_events(user_id, timestamp DESC)
WHERE user_id IS NOT NULL;

-- Index for article views analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_views_article_date
ON article_views(article_id, viewed_at DESC);

-- ============================================================================
-- SESSIONS: Authentication performance
-- ============================================================================

-- Index for active sessions cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expires_at
ON sessions(expires_at)
WHERE expires_at > NOW();

-- Index for user session lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_valid
ON sessions(user_id, expires_at DESC)
WHERE expires_at > NOW();

-- ============================================================================
-- MESSAGES: Private messaging
-- ============================================================================

-- Index for user conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_participants
ON conversations(user1_id, user2_id, last_message_at DESC);

-- Index for conversation messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_messages_conversation
ON conversation_messages(conversation_id, created_at ASC);

-- Index for unread messages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_messages_unread
ON conversation_messages(recipient_id, is_read, created_at DESC)
WHERE is_read = false;

-- ============================================================================
-- FOLLOWS: Social features
-- ============================================================================

-- Index for followers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_followee_created
ON follows(followee_id, created_at DESC);

-- Index for following
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_created
ON follows(follower_id, created_at DESC);

-- Unique constraint for follow relationship
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_unique
ON follows(follower_id, followee_id);

-- ============================================================================
-- JOB APPLICATIONS: Recruitment tracking
-- ============================================================================

-- Index for job applications by job
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_status
ON job_applications(job_id, status, created_at DESC);

-- Index for user applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_user_status
ON job_applications(user_id, status, created_at DESC);

-- Index for pending applications review
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_pending
ON job_applications(status, created_at ASC)
WHERE status IN ('submitted', 'viewed');

-- ============================================================================
-- TAGS: Content categorization
-- ============================================================================

-- Index for tag usage count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_tags_tag
ON article_tags(tag_id);

-- Index for article tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_tags_article
ON article_tags(article_id);

-- ============================================================================
-- REPUTATION: Gamification
-- ============================================================================

-- Index for leaderboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_category_period
ON leaderboard(category, period, rank ASC);

-- Index for user reputation history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reputation_history_user
ON reputation_history(user_id, created_at DESC);

-- ============================================================================
-- SAVED JOBS: User preferences
-- ============================================================================

-- Index for user saved jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_user_created
ON saved_jobs(user_id, created_at DESC);

-- Index for popular saved jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_saved_jobs_job_count
ON saved_jobs(job_id);

-- ============================================================================
-- ANALYZE: Update statistics for query planner
-- ============================================================================

ANALYZE articles;
ANALYZE forum_topics;
ANALYZE forum_replies;
ANALYZE jobs;
ANALYZE users;
ANALYZE notifications;
ANALYZE bookmarks;
ANALYZE topic_votes;
ANALYZE reply_votes;
ANALYZE analytics_events;
ANALYZE sessions;
ANALYZE follows;
ANALYZE job_applications;

-- Note: CONCURRENTLY option allows index creation without locking the table
-- This is safe for production use but takes longer
-- Remove CONCURRENTLY for faster creation in development
