# Neurmatic - Database Schema

**Version**: 2.0
**Database**: PostgreSQL 15+
**ORM**: Prisma

---

## Schema Overview

The database is organized into logical domains:

1. **Users & Authentication** - User accounts, sessions, profiles
2. **News Module** - Articles, categories, bookmarks, media
3. **Forum Module** - Topics, replies, voting, reputation
4. **Jobs Module** - Job postings, applications, companies
5. **LLM Guide** - Models, use cases, glossary
6. **Platform** - Notifications, follows, messages, analytics

---

## Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    Users    │────────│   Profiles  │         │  Companies  │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │                        │
      │                       │                        │
      ├───────────────────────┼────────────────────────┤
      │                       │                        │
      ▼                       ▼                        ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Articles  │         │Forum Topics │         │     Jobs    │
└─────────────┘         └─────────────┘         └─────────────┘
      │                       │                        │
      ▼                       ▼                        ▼
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Bookmarks  │         │   Replies   │         │Applications │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## 1. Users & Authentication

### users
Primary user account table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| password_hash | VARCHAR(255) | NULL | Hashed password (null for OAuth-only) |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Unique username |
| role | ENUM | NOT NULL, DEFAULT 'user' | user, premium, company, moderator, admin |
| account_type | ENUM | NOT NULL | individual, company |
| status | ENUM | NOT NULL, DEFAULT 'active' | active, suspended, banned, deleted |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| last_login_at | TIMESTAMP | NULL | Last successful login |
| login_count | INTEGER | DEFAULT 0 | Total number of logins |
| timezone | VARCHAR(50) | DEFAULT 'UTC' | User timezone |
| locale | VARCHAR(10) | DEFAULT 'en' | Preferred language (en, nl) |
| two_factor_enabled | BOOLEAN | DEFAULT false | 2FA enabled status |
| two_factor_secret | VARCHAR(255) | NULL | TOTP secret (encrypted) |

**Indexes**:
- `idx_users_email` on email
- `idx_users_username` on username
- `idx_users_role` on role
- `idx_users_status` on status
- `idx_users_created_at` on created_at DESC

**Constraints**:
- Email format validation
- Username: alphanumeric + underscore, 3-50 chars
- Role: CHECK role IN ('visitor', 'user', 'premium', 'company', 'moderator', 'admin')
- Status: CHECK status IN ('active', 'suspended', 'banned', 'deleted')

---

### oauth_providers
OAuth account connections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| provider | ENUM | NOT NULL | google, linkedin, github |
| provider_user_id | VARCHAR(255) | NOT NULL | OAuth provider's user ID |
| access_token | TEXT | NULL | Encrypted access token |
| refresh_token | TEXT | NULL | Encrypted refresh token |
| token_expires_at | TIMESTAMP | NULL | Token expiration |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Connection timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last token refresh |

**Indexes**:
- `idx_oauth_user_id` on user_id
- `idx_oauth_provider_user` on (provider, provider_user_id) UNIQUE

**Constraints**:
- UNIQUE (provider, provider_user_id)
- Provider: CHECK provider IN ('google', 'linkedin', 'github')

---

### sessions
User session management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Session identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| token | VARCHAR(255) | UNIQUE, NOT NULL | Session token (hashed) |
| refresh_token | VARCHAR(255) | UNIQUE, NULL | Refresh token (hashed) |
| ip_address | INET | NULL | IP address |
| user_agent | TEXT | NULL | Browser/device info |
| expires_at | TIMESTAMP | NOT NULL | Session expiration |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Session creation |
| last_active_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last activity timestamp |

**Indexes**:
- `idx_sessions_user_id` on user_id
- `idx_sessions_token` on token
- `idx_sessions_expires_at` on expires_at

**TTL**: Auto-delete expired sessions (expires_at < NOW())

---

### profiles
Extended user profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, FK → users.id | One-to-one with users |
| display_name | VARCHAR(100) | NULL | Public display name |
| headline | VARCHAR(200) | NULL | Professional headline |
| bio | TEXT | NULL | About/elevator pitch |
| avatar_url | VARCHAR(500) | NULL | Profile picture URL |
| cover_image_url | VARCHAR(500) | NULL | Header/cover image |
| location | VARCHAR(100) | NULL | City, Country |
| website | VARCHAR(255) | NULL | Personal website |
| github_url | VARCHAR(255) | NULL | GitHub profile |
| linkedin_url | VARCHAR(255) | NULL | LinkedIn profile |
| twitter_url | VARCHAR(255) | NULL | Twitter/X profile |
| huggingface_url | VARCHAR(255) | NULL | HuggingFace profile |
| pronouns | VARCHAR(50) | NULL | Preferred pronouns |
| availability_status | ENUM | DEFAULT 'not_looking' | not_looking, open, actively_looking |
| years_experience | INTEGER | NULL | Years of LLM experience |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Profile creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_profiles_availability` on availability_status

---

### profile_privacy_settings
Granular privacy controls per profile section.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| section | VARCHAR(50) | NOT NULL | Section name (e.g., 'work_experience') |
| visibility | ENUM | NOT NULL, DEFAULT 'public' | public, community, recruiters, private |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last change |

**Indexes**:
- `idx_privacy_user_section` on (user_id, section) UNIQUE

**Sections**: bio, work_experience, education, portfolio, skills, salary_expectations, contact_info

---

### user_skills
User skills with proficiency levels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| skill_name | VARCHAR(100) | NOT NULL | Skill name |
| skill_type | ENUM | NOT NULL | prompt_engineering, fine_tuning, rag, deployment, etc. |
| proficiency | INTEGER | CHECK 1-5 | Skill level (1-5 stars) |
| endorsement_count | INTEGER | DEFAULT 0 | Number of endorsements |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Added timestamp |

**Indexes**:
- `idx_user_skills_user_id` on user_id
- `idx_user_skills_type` on skill_type

**Constraints**:
- UNIQUE (user_id, skill_name)
- proficiency: CHECK proficiency BETWEEN 1 AND 5

---

### user_models
LLMs the user has experience with.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| model_id | UUID | FK → llm_models.id, NOT NULL | LLM reference |
| proficiency | INTEGER | CHECK 1-5 | Experience level (1-5 stars) |
| use_cases | TEXT[] | NULL | Array of use case types |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Added timestamp |

**Indexes**:
- `idx_user_models_user_id` on user_id
- `idx_user_models_model_id` on model_id

**Constraints**:
- UNIQUE (user_id, model_id)

---

### work_experiences
User work history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| title | VARCHAR(200) | NOT NULL | Job title |
| company | VARCHAR(200) | NOT NULL | Company name |
| location | VARCHAR(100) | NULL | Work location |
| employment_type | ENUM | NULL | full_time, part_time, freelance, internship |
| start_date | DATE | NOT NULL | Start date |
| end_date | DATE | NULL | End date (NULL = current) |
| description | TEXT | NULL | Role description |
| tech_stack | JSONB | NULL | Technologies used |
| display_order | INTEGER | DEFAULT 0 | Sorting order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Entry creation |

**Indexes**:
- `idx_work_exp_user_id` on user_id
- `idx_work_exp_order` on (user_id, display_order)

---

### educations
User education history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| institution | VARCHAR(200) | NOT NULL | School/university name |
| degree | VARCHAR(200) | NULL | Degree type |
| field_of_study | VARCHAR(200) | NULL | Major/field |
| start_date | DATE | NULL | Start date |
| end_date | DATE | NULL | Graduation date |
| description | TEXT | NULL | Additional details |
| display_order | INTEGER | DEFAULT 0 | Sorting order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Entry creation |

**Indexes**:
- `idx_educations_user_id` on user_id

---

### portfolio_projects
User portfolio items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Associated user |
| title | VARCHAR(200) | NOT NULL | Project title |
| description | TEXT | NULL | Project description |
| tech_stack | JSONB | NULL | Technologies used |
| project_url | VARCHAR(500) | NULL | Live project URL |
| github_url | VARCHAR(500) | NULL | GitHub repository |
| demo_url | VARCHAR(500) | NULL | Demo video/site |
| thumbnail_url | VARCHAR(500) | NULL | Project thumbnail |
| screenshots | TEXT[] | NULL | Array of screenshot URLs |
| is_featured | BOOLEAN | DEFAULT false | Featured on profile (max 5) |
| display_order | INTEGER | DEFAULT 0 | Sorting order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Project added |

**Indexes**:
- `idx_portfolio_user_id` on user_id
- `idx_portfolio_featured` on (user_id, is_featured) WHERE is_featured = true

**Constraints**:
- Max 5 featured projects per user (enforced at application level)

---

## 2. News Module

### news_categories
Hierarchical news categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Category name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly name |
| description | TEXT | NULL | Category description |
| icon | VARCHAR(50) | NULL | Icon identifier |
| parent_id | UUID | FK → news_categories.id, NULL | Parent category (3 levels max) |
| level | INTEGER | NOT NULL, DEFAULT 1 | Hierarchy level (1-3) |
| display_order | INTEGER | DEFAULT 0 | Sorting order |
| is_active | BOOLEAN | DEFAULT true | Active status |
| article_count | INTEGER | DEFAULT 0 | Cached count (updated via trigger) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Category creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_news_categories_slug` on slug
- `idx_news_categories_parent` on parent_id
- `idx_news_categories_active` on is_active WHERE is_active = true
- `idx_news_categories_order` on (parent_id, display_order)

**Constraints**:
- level: CHECK level BETWEEN 1 AND 3
- Slug format: lowercase, alphanumeric + hyphens

---

### news_tags
Article tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Tag name |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | URL-friendly name |
| description | TEXT | NULL | Tag description |
| usage_count | INTEGER | DEFAULT 0 | Number of articles using tag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Tag creation |

**Indexes**:
- `idx_news_tags_slug` on slug
- `idx_news_tags_usage` on usage_count DESC

---

### articles
News articles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Article title |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly title |
| summary | TEXT | NOT NULL | Short summary/excerpt |
| content | TEXT | NOT NULL | Article body (HTML/Markdown) |
| content_format | ENUM | DEFAULT 'markdown' | markdown, html |
| featured_image_url | VARCHAR(500) | NULL | Main article image |
| author_id | UUID | FK → users.id, NULL | Article author |
| author_name | VARCHAR(100) | NULL | Override author display name |
| source_url | VARCHAR(500) | NULL | Original source URL |
| category_id | UUID | FK → news_categories.id, NOT NULL | Primary category |
| status | ENUM | NOT NULL, DEFAULT 'draft' | draft, review, scheduled, published, archived |
| scheduled_at | TIMESTAMP | NULL | Scheduled publish time |
| published_at | TIMESTAMP | NULL | Actual publish time |
| difficulty_level | ENUM | NULL | beginner, intermediate, advanced |
| reading_time_minutes | INTEGER | NULL | Estimated reading time |
| view_count | INTEGER | DEFAULT 0 | Total views |
| bookmark_count | INTEGER | DEFAULT 0 | Total bookmarks |
| share_count | INTEGER | DEFAULT 0 | Total shares |
| meta_title | VARCHAR(255) | NULL | SEO meta title |
| meta_description | VARCHAR(500) | NULL | SEO meta description |
| is_featured | BOOLEAN | DEFAULT false | Featured on homepage |
| is_trending | BOOLEAN | DEFAULT false | Trending badge |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Article creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |
| created_by_id | UUID | FK → users.id, NOT NULL | User who created |
| updated_by_id | UUID | FK → users.id, NULL | Last editor |

**Indexes**:
- `idx_articles_slug` on slug
- `idx_articles_status` on status
- `idx_articles_published` on published_at DESC WHERE status = 'published'
- `idx_articles_category` on category_id
- `idx_articles_author` on author_id
- `idx_articles_featured` on is_featured WHERE is_featured = true
- `idx_articles_trending` on is_trending WHERE is_trending = true
- `idx_articles_search` USING GIN (to_tsvector('english', title || ' ' || summary || ' ' || content))

**Constraints**:
- Status: CHECK status IN ('draft', 'review', 'scheduled', 'published', 'archived')
- Published articles must have published_at NOT NULL

---

### article_tags
Many-to-many relationship between articles and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| article_id | UUID | FK → articles.id, NOT NULL | Article reference |
| tag_id | UUID | FK → news_tags.id, NOT NULL | Tag reference |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Association timestamp |

**Indexes**:
- `idx_article_tags_article` on article_id
- `idx_article_tags_tag` on tag_id
- PRIMARY KEY (article_id, tag_id)

---

### article_revisions
Article version history (last 20 versions).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| article_id | UUID | FK → articles.id, NOT NULL | Article reference |
| revision_number | INTEGER | NOT NULL | Sequential version number |
| title | VARCHAR(255) | NOT NULL | Title at this revision |
| content | TEXT | NOT NULL | Content at this revision |
| summary | TEXT | NULL | Summary at this revision |
| changed_by_id | UUID | FK → users.id, NOT NULL | User who made changes |
| change_summary | TEXT | NULL | What changed |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Revision timestamp |

**Indexes**:
- `idx_article_revisions_article` on article_id
- `idx_article_revisions_created` on created_at DESC

**Constraints**:
- UNIQUE (article_id, revision_number)
- Keep only last 20 revisions per article (enforced via trigger/application)

---

### llm_models
LLM model reference data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Model name (e.g., "GPT-4 Turbo") |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly name |
| provider | VARCHAR(100) | NOT NULL | OpenAI, Anthropic, Meta, etc. |
| category | ENUM | NOT NULL | commercial, open_source, specialized |
| description | TEXT | NULL | Model description |
| context_window | INTEGER | NULL | Context window size (tokens) |
| model_size | VARCHAR(50) | NULL | Parameter count (e.g., "175B") |
| modalities | TEXT[] | NULL | [text, image, audio, video] |
| release_date | DATE | NULL | Initial release date |
| latest_version | VARCHAR(50) | NULL | Current version |
| status | VARCHAR(50) | NULL | active, deprecated, beta |
| pricing_input | DECIMAL(10,6) | NULL | Price per 1M input tokens |
| pricing_output | DECIMAL(10,6) | NULL | Price per 1M output tokens |
| official_url | VARCHAR(500) | NULL | Official documentation |
| api_docs_url | VARCHAR(500) | NULL | API documentation |
| logo_url | VARCHAR(500) | NULL | Model logo |
| best_for | TEXT[] | NULL | Use case strengths |
| not_ideal_for | TEXT[] | NULL | Use case limitations |
| benchmarks | JSONB | NULL | Performance benchmarks |
| article_count | INTEGER | DEFAULT 0 | Related articles count |
| job_count | INTEGER | DEFAULT 0 | Related jobs count |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Entry creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_llm_models_slug` on slug
- `idx_llm_models_provider` on provider
- `idx_llm_models_category` on category
- `idx_llm_models_status` on status

---

### article_models
Many-to-many relationship between articles and LLM models mentioned.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| article_id | UUID | FK → articles.id, NOT NULL | Article reference |
| model_id | UUID | FK → llm_models.id, NOT NULL | Model reference |
| is_primary | BOOLEAN | DEFAULT false | Primary model discussed |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Association timestamp |

**Indexes**:
- `idx_article_models_article` on article_id
- `idx_article_models_model` on model_id
- PRIMARY KEY (article_id, model_id)

---

### bookmarks
User bookmarks for articles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | User who bookmarked |
| article_id | UUID | FK → articles.id, NOT NULL | Bookmarked article |
| collection_id | UUID | FK → bookmark_collections.id, NULL | Collection (folder) |
| notes | TEXT | NULL | User's private notes |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Bookmark timestamp |

**Indexes**:
- `idx_bookmarks_user` on user_id
- `idx_bookmarks_article` on article_id
- `idx_bookmarks_collection` on collection_id
- UNIQUE (user_id, article_id)

**Constraints**:
- Max 500 bookmarks per user (enforced at application level)

---

### bookmark_collections
User-defined bookmark folders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Collection owner |
| name | VARCHAR(100) | NOT NULL | Collection name |
| description | TEXT | NULL | Collection description |
| is_public | BOOLEAN | DEFAULT false | Public visibility |
| is_default | BOOLEAN | DEFAULT false | "Read Later" default |
| bookmark_count | INTEGER | DEFAULT 0 | Cached count |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Collection creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_bookmark_collections_user` on user_id
- `idx_bookmark_collections_public` on is_public WHERE is_public = true

**Constraints**:
- UNIQUE (user_id, name)
- Only one default collection per user (enforced via unique partial index)

---

### media_library
Centralized media storage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| file_path | VARCHAR(500) | NOT NULL | Storage path/URL |
| file_size | INTEGER | NOT NULL | File size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| width | INTEGER | NULL | Image width (pixels) |
| height | INTEGER | NULL | Image height (pixels) |
| thumbnail_url | VARCHAR(500) | NULL | Thumbnail URL |
| alt_text | TEXT | NULL | Accessibility alt text |
| folder | VARCHAR(255) | NULL | Organizational folder |
| tags | TEXT[] | NULL | Search tags |
| uploaded_by_id | UUID | FK → users.id, NOT NULL | Uploader |
| usage_count | INTEGER | DEFAULT 0 | Referenced count |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Upload timestamp |

**Indexes**:
- `idx_media_library_folder` on folder
- `idx_media_library_uploader` on uploaded_by_id
- `idx_media_library_created` on created_at DESC
- `idx_media_library_tags` USING GIN (tags)

---

## 3. Forum Module

### forum_categories
Forum category structure.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Category name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly name |
| description | TEXT | NULL | Category description |
| icon | VARCHAR(50) | NULL | Icon identifier |
| parent_id | UUID | FK → forum_categories.id, NULL | Parent category (2 levels max) |
| level | INTEGER | NOT NULL, DEFAULT 1 | Hierarchy level (1-2) |
| display_order | INTEGER | DEFAULT 0 | Sorting order |
| guidelines | TEXT | NULL | Posting guidelines |
| is_active | BOOLEAN | DEFAULT true | Active status |
| topic_count | INTEGER | DEFAULT 0 | Total topics (cached) |
| post_count | INTEGER | DEFAULT 0 | Total posts (cached) |
| last_activity_at | TIMESTAMP | NULL | Latest post timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Category creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_forum_categories_slug` on slug
- `idx_forum_categories_parent` on parent_id
- `idx_forum_categories_active` on is_active WHERE is_active = true
- `idx_forum_categories_order` on (parent_id, display_order)

**Constraints**:
- level: CHECK level BETWEEN 1 AND 2

---

### forum_tags
Forum topic tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(50) | UNIQUE, NOT NULL | Tag name |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | URL-friendly name |
| description | TEXT | NULL | Tag description |
| color | VARCHAR(7) | NULL | Hex color code |
| usage_count | INTEGER | DEFAULT 0 | Topics using tag |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Tag creation |

**Indexes**:
- `idx_forum_tags_slug` on slug
- `idx_forum_tags_usage` on usage_count DESC

---

### topics
Forum topics/threads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Topic title |
| slug | VARCHAR(255) | NOT NULL | URL-friendly title |
| content | TEXT | NOT NULL | Topic body (markdown) |
| topic_type | ENUM | NOT NULL, DEFAULT 'discussion' | question, discussion, showcase, tutorial, announcement, paper |
| category_id | UUID | FK → forum_categories.id, NOT NULL | Forum category |
| author_id | UUID | FK → users.id, NOT NULL | Topic creator |
| status | ENUM | NOT NULL, DEFAULT 'open' | open, closed, locked, deleted |
| is_pinned | BOOLEAN | DEFAULT false | Pinned to top |
| is_solved | BOOLEAN | DEFAULT false | Has accepted answer |
| accepted_answer_id | UUID | FK → replies.id, NULL | Accepted answer |
| view_count | INTEGER | DEFAULT 0 | Total views |
| reply_count | INTEGER | DEFAULT 0 | Total replies (cached) |
| upvote_count | INTEGER | DEFAULT 0 | Total upvotes (cached) |
| downvote_count | INTEGER | DEFAULT 0 | Total downvotes (cached) |
| score | INTEGER | DEFAULT 0 | upvote_count - downvote_count |
| last_activity_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Latest reply time |
| last_reply_by_id | UUID | FK → users.id, NULL | Latest replier |
| arxiv_url | VARCHAR(500) | NULL | arXiv paper link (for paper type) |
| attachments | TEXT[] | NULL | Array of attachment URLs |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Topic creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last edit |
| edited_at | TIMESTAMP | NULL | Last edit timestamp |
| edited_by_id | UUID | FK → users.id, NULL | Last editor |

**Indexes**:
- `idx_topics_slug` on (category_id, slug) UNIQUE
- `idx_topics_category` on category_id
- `idx_topics_author` on author_id
- `idx_topics_status` on status
- `idx_topics_type` on topic_type
- `idx_topics_pinned` on is_pinned WHERE is_pinned = true
- `idx_topics_last_activity` on last_activity_at DESC
- `idx_topics_score` on score DESC
- `idx_topics_search` USING GIN (to_tsvector('english', title || ' ' || content))

**Constraints**:
- Topic type: CHECK topic_type IN ('question', 'discussion', 'showcase', 'tutorial', 'announcement', 'paper')
- Status: CHECK status IN ('open', 'closed', 'locked', 'deleted')

---

### topic_tags
Many-to-many relationship between topics and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| topic_id | UUID | FK → topics.id, NOT NULL | Topic reference |
| tag_id | UUID | FK → forum_tags.id, NOT NULL | Tag reference |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Association timestamp |

**Indexes**:
- `idx_topic_tags_topic` on topic_id
- `idx_topic_tags_tag` on tag_id
- PRIMARY KEY (topic_id, tag_id)

**Constraints**:
- Max 5 tags per topic (enforced at application level)

---

### replies
Forum topic replies (threaded, max 3 levels).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| topic_id | UUID | FK → topics.id, NOT NULL | Parent topic |
| parent_reply_id | UUID | FK → replies.id, NULL | Parent reply (for threading) |
| author_id | UUID | FK → users.id, NOT NULL | Reply author |
| content | TEXT | NOT NULL | Reply body (markdown) |
| depth_level | INTEGER | NOT NULL, DEFAULT 1 | Thread depth (1-3) |
| upvote_count | INTEGER | DEFAULT 0 | Total upvotes (cached) |
| downvote_count | INTEGER | DEFAULT 0 | Total downvotes (cached) |
| score | INTEGER | DEFAULT 0 | upvote_count - downvote_count |
| is_accepted_answer | BOOLEAN | DEFAULT false | Marked as solution |
| is_hidden | BOOLEAN | DEFAULT false | Hidden (score < -5 or moderated) |
| attachments | TEXT[] | NULL | Array of attachment URLs |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Reply creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |
| edited_at | TIMESTAMP | NULL | Last edit timestamp |
| edited_by_id | UUID | FK → users.id, NULL | Last editor (or moderator) |

**Indexes**:
- `idx_replies_topic` on topic_id
- `idx_replies_parent` on parent_reply_id
- `idx_replies_author` on author_id
- `idx_replies_created` on created_at ASC
- `idx_replies_score` on score DESC
- `idx_replies_accepted` on is_accepted_answer WHERE is_accepted_answer = true

**Constraints**:
- depth_level: CHECK depth_level BETWEEN 1 AND 3
- Enforce depth limit via trigger or application logic

---

### votes
Voting system for topics and replies.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Voter |
| voteable_type | ENUM | NOT NULL | topic, reply |
| voteable_id | UUID | NOT NULL | Topic or Reply ID |
| vote_type | ENUM | NOT NULL | upvote, downvote |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Vote timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Vote change timestamp |

**Indexes**:
- `idx_votes_user` on user_id
- `idx_votes_voteable` on (voteable_type, voteable_id)
- UNIQUE (user_id, voteable_type, voteable_id)

**Constraints**:
- Vote type: CHECK vote_type IN ('upvote', 'downvote')
- Voteable type: CHECK voteable_type IN ('topic', 'reply')
- User can't vote on own content (enforced at application level)

---

### reputation_events
Reputation change tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | User receiving reputation |
| event_type | VARCHAR(50) | NOT NULL | topic_created, reply_posted, upvote_received, etc. |
| points | INTEGER | NOT NULL | Points awarded (can be negative) |
| related_type | VARCHAR(50) | NULL | topic, reply |
| related_id | UUID | NULL | Related entity ID |
| description | TEXT | NULL | Event description |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Event timestamp |

**Indexes**:
- `idx_reputation_user` on user_id
- `idx_reputation_created` on created_at DESC
- `idx_reputation_type` on event_type

**Event Types & Points**:
- topic_created: +5
- reply_posted: +2
- upvote_received: +10
- downvote_received: -5
- accepted_answer: +25
- best_answer_week: +100

---

### user_reputation
Aggregated user reputation (calculated from reputation_events).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, FK → users.id | One-to-one with users |
| total_points | INTEGER | DEFAULT 0 | Total reputation points |
| level | VARCHAR(50) | NOT NULL, DEFAULT 'novice' | Reputation level |
| rank | INTEGER | NULL | Global rank position |
| topics_created | INTEGER | DEFAULT 0 | Total topics created |
| replies_posted | INTEGER | DEFAULT 0 | Total replies posted |
| upvotes_received | INTEGER | DEFAULT 0 | Total upvotes received |
| accepted_answers | INTEGER | DEFAULT 0 | Total accepted answers |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last calculation |

**Indexes**:
- `idx_user_reputation_points` on total_points DESC
- `idx_user_reputation_level` on level

**Reputation Levels**:
- Novice: 0-99
- Contributor: 100-499
- Expert: 500-999
- Master: 1000-2499
- Legend: 2500+

---

### badges
Badge definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(100) | NOT NULL | Badge name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly name |
| description | TEXT | NULL | Badge description |
| badge_type | ENUM | NOT NULL | skill, activity, special |
| icon_url | VARCHAR(500) | NULL | Badge icon |
| criteria | JSONB | NULL | Achievement criteria |
| awarded_count | INTEGER | DEFAULT 0 | Times awarded |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Badge creation |

**Indexes**:
- `idx_badges_slug` on slug
- `idx_badges_type` on badge_type

---

### user_badges
User badge awards.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Badge recipient |
| badge_id | UUID | FK → badges.id, NOT NULL | Badge awarded |
| awarded_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Award timestamp |

**Indexes**:
- `idx_user_badges_user` on user_id
- `idx_user_badges_badge` on badge_id
- UNIQUE (user_id, badge_id)

---

### prompt_library
Community prompt collection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Prompt title |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly title |
| description | TEXT | NULL | Prompt description |
| prompt_text | TEXT | NOT NULL | The actual prompt |
| use_case | VARCHAR(100) | NULL | Use case category |
| llm_models | TEXT[] | NULL | Recommended models |
| variables | JSONB | NULL | Template variables |
| author_id | UUID | FK → users.id, NOT NULL | Prompt creator |
| forked_from_id | UUID | FK → prompt_library.id, NULL | Original prompt (if fork) |
| fork_count | INTEGER | DEFAULT 0 | Times forked |
| upvote_count | INTEGER | DEFAULT 0 | Total upvotes |
| downvote_count | INTEGER | DEFAULT 0 | Total downvotes |
| score | INTEGER | DEFAULT 0 | upvote_count - downvote_count |
| effectiveness_rating | DECIMAL(3,2) | NULL | Average effectiveness (1-5) |
| usage_count | INTEGER | DEFAULT 0 | Times used/copied |
| is_featured | BOOLEAN | DEFAULT false | Featured prompt |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Prompt creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_prompt_library_slug` on slug
- `idx_prompt_library_author` on author_id
- `idx_prompt_library_score` on score DESC
- `idx_prompt_library_use_case` on use_case

---

### polls
Topic-associated polls.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| topic_id | UUID | FK → topics.id, NOT NULL | Associated topic |
| question | VARCHAR(255) | NOT NULL | Poll question |
| poll_type | ENUM | NOT NULL, DEFAULT 'single' | single, multiple |
| is_anonymous | BOOLEAN | DEFAULT true | Anonymous voting |
| deadline | TIMESTAMP | NULL | Poll close date |
| total_votes | INTEGER | DEFAULT 0 | Total votes cast |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Poll creation |

**Indexes**:
- `idx_polls_topic` on topic_id UNIQUE
- `idx_polls_deadline` on deadline

---

### poll_options
Poll answer choices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| poll_id | UUID | FK → polls.id, NOT NULL | Parent poll |
| option_text | VARCHAR(200) | NOT NULL | Answer option |
| vote_count | INTEGER | DEFAULT 0 | Votes for this option |
| display_order | INTEGER | DEFAULT 0 | Sorting order |

**Indexes**:
- `idx_poll_options_poll` on poll_id
- `idx_poll_options_order` on (poll_id, display_order)

---

### poll_votes
User poll votes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| poll_id | UUID | FK → polls.id, NOT NULL | Poll voted on |
| option_id | UUID | FK → poll_options.id, NOT NULL | Selected option |
| user_id | UUID | FK → users.id, NOT NULL | Voter (if not anonymous) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Vote timestamp |

**Indexes**:
- `idx_poll_votes_poll_user` on (poll_id, user_id)
- `idx_poll_votes_option` on option_id

**Constraints**:
- For single-choice polls: UNIQUE (poll_id, user_id)
- For multiple-choice: Enforced at application level

---

### direct_messages
Private messaging between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| sender_id | UUID | FK → users.id, NOT NULL | Message sender |
| recipient_id | UUID | FK → users.id, NOT NULL | Message recipient |
| subject | VARCHAR(255) | NULL | Message subject |
| content | TEXT | NOT NULL | Message body |
| is_read | BOOLEAN | DEFAULT false | Read status |
| read_at | TIMESTAMP | NULL | Read timestamp |
| attachments | TEXT[] | NULL | File attachments |
| parent_message_id | UUID | FK → direct_messages.id, NULL | Reply to message |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Message sent |

**Indexes**:
- `idx_messages_sender` on sender_id
- `idx_messages_recipient` on recipient_id
- `idx_messages_unread` on (recipient_id, is_read) WHERE is_read = false
- `idx_messages_created` on created_at DESC

---

## 4. Jobs Module

### companies
Company accounts and profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, UNIQUE, NOT NULL | Associated user account |
| company_name | VARCHAR(200) | NOT NULL | Official company name |
| slug | VARCHAR(200) | UNIQUE, NOT NULL | URL-friendly name |
| logo_url | VARCHAR(500) | NULL | Company logo |
| header_image_url | VARCHAR(500) | NULL | Cover/header image |
| tagline | VARCHAR(200) | NULL | Short company tagline |
| description | TEXT | NULL | About the company |
| mission_statement | TEXT | NULL | Mission/vision statement |
| industry | VARCHAR(100) | NULL | Industry sector |
| company_size | ENUM | NULL | 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+ |
| founded_year | INTEGER | NULL | Year founded |
| headquarters | VARCHAR(100) | NULL | HQ location |
| locations | TEXT[] | NULL | Office locations |
| website_url | VARCHAR(255) | NULL | Company website |
| linkedin_url | VARCHAR(255) | NULL | LinkedIn page |
| twitter_url | VARCHAR(255) | NULL | Twitter/X handle |
| github_url | VARCHAR(255) | NULL | GitHub organization |
| tech_stack | JSONB | NULL | Technologies used |
| benefits | TEXT[] | NULL | Benefits/perks list |
| culture_images | TEXT[] | NULL | Team/office photos |
| culture_video_url | VARCHAR(500) | NULL | Culture video |
| is_verified | BOOLEAN | DEFAULT false | Verified account (blue check) |
| follower_count | INTEGER | DEFAULT 0 | Followers count |
| active_jobs_count | INTEGER | DEFAULT 0 | Active job postings |
| subscription_tier | ENUM | DEFAULT 'free' | free, basic, premium, enterprise |
| subscription_expires_at | TIMESTAMP | NULL | Subscription end date |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Company creation |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_companies_slug` on slug
- `idx_companies_user_id` on user_id
- `idx_companies_verified` on is_verified WHERE is_verified = true
- `idx_companies_size` on company_size

**Constraints**:
- Company size: CHECK company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
- Subscription tier: CHECK subscription_tier IN ('free', 'basic', 'premium', 'enterprise')

---

### jobs
Job postings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| company_id | UUID | FK → companies.id, NOT NULL | Posting company |
| title | VARCHAR(255) | NOT NULL | Job title |
| slug | VARCHAR(255) | NOT NULL | URL-friendly title |
| description | TEXT | NOT NULL | Full job description |
| requirements | TEXT | NOT NULL | Job requirements |
| responsibilities | TEXT | NULL | Key responsibilities |
| benefits | TEXT | NULL | What we offer |
| experience_level | ENUM | NOT NULL | junior, mid, senior, lead, principal |
| employment_type | ENUM | NOT NULL | full_time, part_time, freelance, internship |
| location_type | ENUM | NOT NULL | remote, hybrid, on_site |
| location | VARCHAR(100) | NULL | Physical location |
| country_code | VARCHAR(2) | NULL | ISO country code |
| time_zone | VARCHAR(50) | NULL | Required timezone |
| salary_min | INTEGER | NULL | Minimum salary (annual) |
| salary_max | INTEGER | NULL | Maximum salary (annual) |
| salary_currency | VARCHAR(3) | DEFAULT 'EUR' | Currency code (EUR, USD) |
| salary_is_public | BOOLEAN | DEFAULT true | Show salary publicly |
| positions_available | INTEGER | DEFAULT 1 | Number of openings |
| application_deadline | DATE | NULL | Application close date |
| status | ENUM | NOT NULL, DEFAULT 'draft' | draft, active, closed, filled |
| is_featured | BOOLEAN | DEFAULT false | Featured placement (paid) |
| has_visa_sponsorship | BOOLEAN | DEFAULT false | Visa sponsorship available |
| primary_llms | TEXT[] | NULL | Main LLMs used |
| frameworks | TEXT[] | NULL | LLM frameworks (LangChain, etc.) |
| vector_databases | TEXT[] | NULL | Vector DBs used |
| infrastructure | TEXT[] | NULL | Cloud platforms |
| programming_languages | TEXT[] | NULL | Languages required |
| use_case_type | VARCHAR(100) | NULL | Primary use case |
| model_strategy | ENUM | NULL | commercial_api, open_source, hybrid |
| screening_questions | JSONB | NULL | Custom questions |
| application_count | INTEGER | DEFAULT 0 | Total applications |
| view_count | INTEGER | DEFAULT 0 | Total views |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Job posting created |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |
| published_at | TIMESTAMP | NULL | First published |
| closed_at | TIMESTAMP | NULL | Closed timestamp |

**Indexes**:
- `idx_jobs_slug` on (company_id, slug) UNIQUE
- `idx_jobs_company` on company_id
- `idx_jobs_status` on status
- `idx_jobs_active` on published_at DESC WHERE status = 'active'
- `idx_jobs_location_type` on location_type
- `idx_jobs_experience` on experience_level
- `idx_jobs_employment` on employment_type
- `idx_jobs_featured` on is_featured WHERE is_featured = true
- `idx_jobs_salary` on salary_min, salary_max
- `idx_jobs_search` USING GIN (to_tsvector('english', title || ' ' || description))

**Constraints**:
- Status: CHECK status IN ('draft', 'active', 'closed', 'filled')
- Experience level: CHECK experience_level IN ('junior', 'mid', 'senior', 'lead', 'principal')
- Employment type: CHECK employment_type IN ('full_time', 'part_time', 'freelance', 'internship')
- Location type: CHECK location_type IN ('remote', 'hybrid', 'on_site')
- Model strategy: CHECK model_strategy IN ('commercial_api', 'open_source', 'hybrid')

---

### job_skills
Required skills per job with importance/level.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| job_id | UUID | FK → jobs.id, NOT NULL | Associated job |
| skill_name | VARCHAR(100) | NOT NULL | Skill name |
| skill_type | VARCHAR(50) | NOT NULL | prompt_engineering, fine_tuning, rag, etc. |
| required_level | INTEGER | CHECK 1-5 | Required proficiency (1-5) |
| is_required | BOOLEAN | DEFAULT true | Required vs nice-to-have |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Skill added |

**Indexes**:
- `idx_job_skills_job` on job_id
- `idx_job_skills_type` on skill_type

**Constraints**:
- UNIQUE (job_id, skill_name)
- required_level: CHECK required_level BETWEEN 1 AND 5

---

### job_models
LLMs associated with a job.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| job_id | UUID | FK → jobs.id, NOT NULL | Associated job |
| model_id | UUID | FK → llm_models.id, NOT NULL | LLM used |
| is_primary | BOOLEAN | DEFAULT false | Primary model |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Association timestamp |

**Indexes**:
- `idx_job_models_job` on job_id
- `idx_job_models_model` on model_id
- PRIMARY KEY (job_id, model_id)

---

### applications
Job applications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| job_id | UUID | FK → jobs.id, NOT NULL | Applied job |
| user_id | UUID | FK → users.id, NOT NULL | Applicant |
| cover_letter | TEXT | NULL | Cover letter text |
| resume_url | VARCHAR(500) | NULL | Resume/CV file |
| screening_answers | JSONB | NULL | Answers to screening questions |
| status | ENUM | NOT NULL, DEFAULT 'submitted' | submitted, viewed, screening, interview, offer, rejected, withdrawn |
| status_updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last status change |
| match_score | INTEGER | NULL | Calculated match percentage (0-100) |
| match_reasons | TEXT[] | NULL | Top reasons for match |
| recruiter_notes | TEXT | NULL | Internal notes (company-only) |
| rating | INTEGER | NULL | Recruiter rating (1-5) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Application submitted |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_applications_job` on job_id
- `idx_applications_user` on user_id
- `idx_applications_status` on status
- `idx_applications_created` on created_at DESC
- UNIQUE (job_id, user_id)

**Constraints**:
- Status: CHECK status IN ('submitted', 'viewed', 'screening', 'interview', 'offer', 'rejected', 'withdrawn')
- Rating: CHECK rating BETWEEN 1 AND 5

---

### job_matches
Pre-calculated job-candidate matches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| job_id | UUID | FK → jobs.id, NOT NULL | Job posting |
| user_id | UUID | FK → users.id, NOT NULL | Candidate |
| match_score | INTEGER | NOT NULL | Overall match (0-100) |
| skill_match | INTEGER | NULL | Skills overlap score (0-100) |
| tech_stack_match | INTEGER | NULL | Tech stack score (0-100) |
| experience_match | INTEGER | NULL | Experience level score (0-100) |
| location_match | INTEGER | NULL | Location preference score (0-100) |
| salary_match | INTEGER | NULL | Salary alignment score (0-100) |
| match_reasons | TEXT[] | NULL | Top 3 match reasons |
| calculated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last calculation |

**Indexes**:
- `idx_job_matches_job` on job_id
- `idx_job_matches_user` on user_id
- `idx_job_matches_score` on match_score DESC
- UNIQUE (job_id, user_id)

**Constraints**:
- Only store matches >= 60% (configurable threshold)
- Recalculate when job or user profile changes

---

### saved_jobs
User saved/favorited jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | User who saved |
| job_id | UUID | FK → jobs.id, NOT NULL | Saved job |
| notes | TEXT | NULL | Private notes |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Saved timestamp |

**Indexes**:
- `idx_saved_jobs_user` on user_id
- `idx_saved_jobs_job` on job_id
- UNIQUE (user_id, job_id)

---

### saved_searches
Saved search filters with alerts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Search owner |
| name | VARCHAR(100) | NOT NULL | Search name |
| search_type | ENUM | NOT NULL | news, forum, jobs |
| filters | JSONB | NOT NULL | Search parameters |
| notification_enabled | BOOLEAN | DEFAULT false | Alert on new results |
| notification_frequency | ENUM | DEFAULT 'daily' | real_time, daily, weekly |
| last_notified_at | TIMESTAMP | NULL | Last alert sent |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Search saved |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_saved_searches_user` on user_id
- `idx_saved_searches_type` on search_type

---

## 5. LLM Guide

### use_cases
LLM use case library.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| title | VARCHAR(255) | NOT NULL | Use case title |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly title |
| one_liner | VARCHAR(200) | NULL | Brief summary |
| problem | TEXT | NULL | Problem description |
| solution | TEXT | NULL | Solution description |
| implementation | TEXT | NULL | Implementation details |
| results | TEXT | NULL | Results & metrics |
| challenges | TEXT | NULL | Challenges faced |
| key_learnings | TEXT | NULL | Key learnings |
| tips | TEXT | NULL | Tips & recommendations |
| category | VARCHAR(100) | NULL | Use case category |
| industry | VARCHAR(100) | NULL | Industry sector |
| company_size | ENUM | NULL | Company size |
| tech_stack | JSONB | NULL | Technologies used |
| implementation_type | VARCHAR(50) | NULL | rag, fine_tuning, agent, etc. |
| has_code | BOOLEAN | DEFAULT false | Includes code samples |
| has_roi_data | BOOLEAN | DEFAULT false | Includes ROI metrics |
| github_url | VARCHAR(500) | NULL | GitHub repository |
| demo_url | VARCHAR(500) | NULL | Live demo |
| blog_url | VARCHAR(500) | NULL | Blog post |
| video_url | VARCHAR(500) | NULL | Video walkthrough |
| submitted_by_id | UUID | FK → users.id, NULL | Community submitter |
| status | ENUM | NOT NULL, DEFAULT 'draft' | draft, review, published |
| is_featured | BOOLEAN | DEFAULT false | Featured use case |
| view_count | INTEGER | DEFAULT 0 | Total views |
| comment_count | INTEGER | DEFAULT 0 | Total comments |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Use case created |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |
| published_at | TIMESTAMP | NULL | Publish timestamp |

**Indexes**:
- `idx_use_cases_slug` on slug
- `idx_use_cases_status` on status
- `idx_use_cases_category` on category
- `idx_use_cases_published` on published_at DESC WHERE status = 'published'
- `idx_use_cases_featured` on is_featured WHERE is_featured = true

---

### use_case_models
LLMs mentioned in use cases.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| use_case_id | UUID | FK → use_cases.id, NOT NULL | Use case reference |
| model_id | UUID | FK → llm_models.id, NOT NULL | Model reference |
| is_primary | BOOLEAN | DEFAULT false | Primary model used |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Association timestamp |

**Indexes**:
- `idx_use_case_models_use_case` on use_case_id
- `idx_use_case_models_model` on model_id
- PRIMARY KEY (use_case_id, model_id)

---

### glossary_terms
LLM terminology glossary.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| term | VARCHAR(100) | UNIQUE, NOT NULL | Term name |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly term |
| definition | TEXT | NOT NULL | Term definition |
| examples | TEXT | NULL | Usage examples |
| category | VARCHAR(50) | NULL | models, techniques, metrics, tools |
| related_terms | TEXT[] | NULL | Related term slugs |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Term added |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_glossary_slug` on slug
- `idx_glossary_category` on category
- `idx_glossary_term` on term (for autocomplete)

---

## 6. Platform-Wide

### follows
User follows (users, companies, tags, categories, models).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| follower_id | UUID | FK → users.id, NOT NULL | User following |
| followable_type | ENUM | NOT NULL | user, company, forum_tag, news_category, llm_model |
| followable_id | UUID | NOT NULL | Entity being followed |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Follow timestamp |

**Indexes**:
- `idx_follows_follower` on follower_id
- `idx_follows_followable` on (followable_type, followable_id)
- UNIQUE (follower_id, followable_type, followable_id)

**Constraints**:
- Followable type: CHECK followable_type IN ('user', 'company', 'forum_tag', 'news_category', 'forum_category', 'llm_model')

---

### notifications
User notification system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | Notification recipient |
| notification_type | VARCHAR(50) | NOT NULL | Type of notification |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NULL | Notification body |
| link_url | VARCHAR(500) | NULL | Click destination |
| related_type | VARCHAR(50) | NULL | Related entity type |
| related_id | UUID | NULL | Related entity ID |
| is_read | BOOLEAN | DEFAULT false | Read status |
| read_at | TIMESTAMP | NULL | Read timestamp |
| delivery_method | ENUM | NOT NULL | in_app, email, push |
| sent_at | TIMESTAMP | NULL | Sent timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Notification created |

**Indexes**:
- `idx_notifications_user` on user_id
- `idx_notifications_unread` on (user_id, is_read) WHERE is_read = false
- `idx_notifications_created` on created_at DESC

**TTL**: Auto-delete read notifications older than 90 days

---

### notification_preferences
User notification settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NOT NULL | User |
| notification_type | VARCHAR(50) | NOT NULL | Notification category |
| in_app_enabled | BOOLEAN | DEFAULT true | In-app notifications |
| email_enabled | BOOLEAN | DEFAULT true | Email notifications |
| push_enabled | BOOLEAN | DEFAULT false | Push notifications |
| frequency | ENUM | DEFAULT 'real_time' | real_time, hourly, daily, weekly, off |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Preference created |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update |

**Indexes**:
- `idx_notification_prefs_user` on user_id
- UNIQUE (user_id, notification_type)

---

### moderation_reports
Content/user reports.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| reporter_id | UUID | FK → users.id, NOT NULL | User reporting |
| reported_type | ENUM | NOT NULL | topic, reply, user, job |
| reported_id | UUID | NOT NULL | Reported entity ID |
| reason | ENUM | NOT NULL | spam, harassment, off_topic, misinformation, copyright |
| description | TEXT | NULL | Additional details |
| status | ENUM | NOT NULL, DEFAULT 'pending' | pending, reviewing, resolved, dismissed |
| resolution | TEXT | NULL | Moderator resolution notes |
| resolved_by_id | UUID | FK → users.id, NULL | Moderator who resolved |
| resolved_at | TIMESTAMP | NULL | Resolution timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Report submitted |

**Indexes**:
- `idx_reports_status` on status
- `idx_reports_reported` on (reported_type, reported_id)
- `idx_reports_reporter` on reporter_id
- `idx_reports_created` on created_at DESC

**Constraints**:
- Reason: CHECK reason IN ('spam', 'harassment', 'off_topic', 'misinformation', 'copyright', 'other')
- Status: CHECK status IN ('pending', 'reviewing', 'resolved', 'dismissed')

---

### moderation_actions
Moderator action log.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| moderator_id | UUID | FK → users.id, NOT NULL | Moderator |
| action_type | VARCHAR(50) | NOT NULL | edit, delete, lock, pin, warn, ban, etc. |
| target_type | VARCHAR(50) | NOT NULL | topic, reply, user |
| target_id | UUID | NOT NULL | Affected entity |
| reason | TEXT | NULL | Action justification |
| metadata | JSONB | NULL | Additional action data |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Action timestamp |

**Indexes**:
- `idx_moderation_actions_moderator` on moderator_id
- `idx_moderation_actions_target` on (target_type, target_id)
- `idx_moderation_actions_created` on created_at DESC

---

### analytics_events
User behavior tracking for analytics and recommendations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NULL | User (null for anonymous) |
| session_id | VARCHAR(255) | NULL | Session identifier |
| event_type | VARCHAR(50) | NOT NULL | page_view, article_view, topic_view, job_view, search, etc. |
| event_data | JSONB | NULL | Event-specific data |
| entity_type | VARCHAR(50) | NULL | article, topic, job, etc. |
| entity_id | UUID | NULL | Entity identifier |
| metadata | JSONB | NULL | Additional context |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Event timestamp |

**Indexes**:
- `idx_analytics_user` on user_id
- `idx_analytics_session` on session_id
- `idx_analytics_type` on event_type
- `idx_analytics_entity` on (entity_type, entity_id)
- `idx_analytics_created` on created_at DESC

**Partitioning**: Consider partitioning by created_at (monthly) for performance

**TTL**: Aggregate and archive raw events after 90 days

---

### search_queries
Search query tracking for analytics and autocomplete.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users.id, NULL | Searcher (null for anonymous) |
| query | VARCHAR(255) | NOT NULL | Search query text |
| search_type | ENUM | NOT NULL | news, forum, jobs, universal |
| filters | JSONB | NULL | Applied filters |
| result_count | INTEGER | NULL | Number of results |
| clicked_result_id | UUID | NULL | Which result was clicked |
| clicked_position | INTEGER | NULL | Position of clicked result |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Search timestamp |

**Indexes**:
- `idx_search_queries_user` on user_id
- `idx_search_queries_query` on query (for autocomplete)
- `idx_search_queries_type` on search_type
- `idx_search_queries_created` on created_at DESC

---

### audit_logs
Admin action audit trail (GDPR compliance).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| admin_id | UUID | FK → users.id, NOT NULL | Admin who performed action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| target_type | VARCHAR(50) | NULL | Affected entity type |
| target_id | UUID | NULL | Affected entity ID |
| changes | JSONB | NULL | Before/after data |
| ip_address | INET | NULL | Admin IP address |
| user_agent | TEXT | NULL | Admin browser |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Action timestamp |

**Indexes**:
- `idx_audit_logs_admin` on admin_id
- `idx_audit_logs_target` on (target_type, target_id)
- `idx_audit_logs_created` on created_at DESC

**Retention**: Keep forever for compliance

---

## Database Triggers & Functions

### Auto-update timestamps
Create triggers for all tables with `updated_at` column:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... repeat for all tables
```

### Update cached counts
Create triggers to maintain denormalized counts:

```sql
-- Example: Update article_count in news_categories
CREATE OR REPLACE FUNCTION update_category_article_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE news_categories SET article_count = article_count + 1
        WHERE id = NEW.category_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE news_categories SET article_count = article_count - 1
        WHERE id = OLD.category_id;
    ELSIF TG_OP = 'UPDATE' AND NEW.category_id != OLD.category_id THEN
        UPDATE news_categories SET article_count = article_count - 1
        WHERE id = OLD.category_id;
        UPDATE news_categories SET article_count = article_count + 1
        WHERE id = NEW.category_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_category_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON articles
FOR EACH ROW EXECUTE FUNCTION update_category_article_count();
```

### Auto-hide low-score content
```sql
-- Auto-hide replies with score < -5
CREATE OR REPLACE FUNCTION auto_hide_downvoted_content()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.score < -5 THEN
        NEW.is_hidden = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_hide_replies_trigger
BEFORE UPDATE ON replies
FOR EACH ROW EXECUTE FUNCTION auto_hide_downvoted_content();
```

---

## Indexing Strategy

### Critical Indexes for Performance

1. **Foreign Keys**: Index all foreign key columns
2. **Unique Constraints**: Automatic indexes on unique columns
3. **Frequent Filters**: WHERE clauses in common queries
4. **Sort Columns**: ORDER BY columns (created_at DESC, score DESC)
5. **Full-Text Search**: GIN indexes for tsvector
6. **Partial Indexes**: WHERE clauses to reduce index size
7. **Composite Indexes**: Multi-column queries (category_id, status)
8. **JSONB Indexes**: GIN indexes on JSONB columns with frequent queries

### Full-Text Search Indexes

```sql
-- Articles
CREATE INDEX idx_articles_fts ON articles
USING GIN (to_tsvector('english', title || ' ' || summary || ' ' || content));

-- Topics
CREATE INDEX idx_topics_fts ON topics
USING GIN (to_tsvector('english', title || ' ' || content));

-- Jobs
CREATE INDEX idx_jobs_fts ON jobs
USING GIN (to_tsvector('english', title || ' ' || description));
```

---

## Data Integrity Constraints

1. **Referential Integrity**: Foreign keys with appropriate ON DELETE actions
   - CASCADE: User deletes → delete all user content
   - SET NULL: Author deletes → keep content, set author_id NULL
   - RESTRICT: Prevent deletion if references exist

2. **Check Constraints**: Validate enum values, ranges (1-5 stars)

3. **Unique Constraints**: Prevent duplicates (email, username, slugs)

4. **Not Null Constraints**: Required fields

5. **Default Values**: Sensible defaults (timestamps, counts, booleans)

---

## Performance Considerations

1. **Connection Pooling**: PgBouncer or Prisma built-in pooling
2. **Query Optimization**: Use EXPLAIN ANALYZE, avoid N+1 queries
3. **Caching**: Redis for frequently accessed data
4. **Denormalization**: Cached counts (article_count, follower_count)
5. **Partitioning**: Consider for large tables (analytics_events by month)
6. **Archiving**: Move old data to archive tables (read notifications > 90 days)
7. **Vacuuming**: Regular VACUUM and ANALYZE
8. **Read Replicas**: For read-heavy workloads (optional, post-MVP)

---

## Backup & Recovery

1. **Automated Backups**: Daily full backups, hourly incremental
2. **Point-in-Time Recovery**: WAL archiving
3. **Backup Retention**: 30 days minimum
4. **Disaster Recovery**: Cross-region backups
5. **Testing**: Regular restore testing

---

## Migration Strategy

1. **Version Control**: All schema changes in migrations
2. **Prisma Migrate**: Use Prisma's migration system
3. **Rollback Plan**: Test rollback for each migration
4. **Zero-Downtime**: Blue-green deployments for major changes
5. **Data Seeding**: Seed scripts for initial data (models, categories)

---

## Sample Prisma Schema (Excerpt)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                UUID      @id @default(uuid())
  email             String    @unique @db.VarChar(255)
  emailVerified     Boolean   @default(false) @map("email_verified")
  passwordHash      String?   @map("password_hash") @db.VarChar(255)
  username          String    @unique @db.VarChar(50)
  role              UserRole  @default(USER)
  accountType       AccountType @map("account_type")
  status            UserStatus @default(ACTIVE)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  lastLoginAt       DateTime? @map("last_login_at")

  profile           Profile?
  articles          Article[]
  topics            Topic[]
  replies           Reply[]
  // ... other relations

  @@index([email])
  @@index([username])
  @@index([role])
  @@index([status])
  @@map("users")
}

enum UserRole {
  VISITOR
  USER
  PREMIUM
  COMPANY
  MODERATOR
  ADMIN
}

enum AccountType {
  INDIVIDUAL
  COMPANY
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
  DELETED
}

// ... other models
```

---

## Next Steps

1. Set up PostgreSQL database
2. Initialize Prisma project
3. Create complete Prisma schema
4. Run initial migration
5. Seed initial data (LLM models, categories, badges)
6. Set up database backup automation
7. Configure Redis for caching
8. Set up Elasticsearch (post-MVP)

---

## Related Documentation

- [API Endpoints](./03-API_ENDPOINTS.md) - REST API using this schema
- [File Structure](./05-FILE_STRUCTURE.md) - Repository structure with Prisma
- [Technical Decisions](./06-TECHNICAL_DECISIONS.md) - Database technology choices
