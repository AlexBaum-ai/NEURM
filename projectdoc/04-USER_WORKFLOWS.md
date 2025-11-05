# Neurmatic - User Workflows

**Version**: 2.0

---

## Table of Contents

1. [User Registration & Onboarding](#1-user-registration--onboarding)
2. [News Module Workflows](#2-news-module-workflows)
3. [Forum Module Workflows](#3-forum-module-workflows)
4. [Jobs Module Workflows](#4-jobs-module-workflows)
5. [Cross-Platform Workflows](#5-cross-platform-workflows)

---

## 1. User Registration & Onboarding

### 1.1 New User Registration (Email/Password)

```
[Landing Page]
     │
     ├─→ User clicks "Sign Up"
     │
     ▼
[Registration Form]
     │
     ├─→ Enter email, password, username
     ├─→ Select account type (Individual/Company)
     ├─→ Accept terms & privacy policy
     ├─→ Complete CAPTCHA (if needed)
     │
     ▼
[Submit Registration]
     │
     ├─→ Backend: Validate input
     ├─→ Backend: Hash password
     ├─→ Backend: Create user record
     ├─→ Backend: Queue verification email
     │
     ▼
[Registration Success Page]
     │
     ├─→ Message: "Check your email to verify"
     │
     ▼
[Email Inbox]
     │
     ├─→ User receives verification email
     ├─→ Clicks verification link
     │
     ▼
[Email Verified]
     │
     ├─→ Redirect to onboarding
     │
     ▼
[Onboarding Flow]
     │
     ├─→ Step 1: Profile Type Confirmation
     │   └─→ Individual or Company?
     │
     ├─→ Step 2: Role Selection
     │   └─→ Developer, Researcher, Product Manager, etc.
     │
     ├─→ Step 3: Experience Level
     │   └─→ Beginner, Intermediate, Advanced
     │
     ├─→ Step 4: Areas of Interest
     │   └─→ Select 3-5 topics (Prompt Engineering, RAG, Fine-tuning, etc.)
     │
     ├─→ Step 5: Models You Work With
     │   └─→ Select LLMs (GPT-4, Claude, Llama, etc.)
     │
     ├─→ Step 6: Goals
     │   └─→ Learn, Find a job, Network, Stay updated, etc.
     │
     ├─→ Step 7: Notification Preferences
     │   └─→ Email frequency, types of notifications
     │
     ├─→ Step 8: Follow Suggestions
     │   └─→ Suggested users, tags, categories to follow
     │
     ▼
[Dashboard]
     │
     └─→ Personalized feed based on interests
     └─→ Welcome message with quick start guide
```

**Success Metrics**:
- Registration completion rate: >70%
- Email verification rate: >60%
- Onboarding completion rate: >80%

---

### 1.2 OAuth Registration (Google/LinkedIn/GitHub)

```
[Landing Page]
     │
     ├─→ User clicks "Sign up with Google"
     │
     ▼
[OAuth Provider]
     │
     ├─→ User authenticates with provider
     ├─→ User grants permissions
     │
     ▼
[OAuth Callback]
     │
     ├─→ Backend: Receive OAuth code
     ├─→ Backend: Exchange for access token
     ├─→ Backend: Fetch user profile from provider
     ├─→ Backend: Create user record
     ├─→ Backend: Link OAuth account
     │
     ▼
[Email Auto-Verified]
     │
     ├─→ Skip email verification step
     │
     ▼
[Onboarding Flow]
     │
     └─→ Continue with steps 1-8 (same as above)
```

---

### 1.3 User Login

```
[Login Page]
     │
     ├─→ Enter email & password (OR OAuth)
     │
     ▼
[Authentication]
     │
     ├─→ Backend: Validate credentials
     ├─→ Backend: Check 2FA status
     │
     ├─→ If 2FA enabled:
     │   ├─→ [2FA Challenge]
     │   ├─→ Enter 6-digit code
     │   └─→ Verify code
     │
     ▼
[Authentication Success]
     │
     ├─→ Backend: Generate JWT access token
     ├─→ Backend: Generate refresh token
     ├─→ Backend: Create session record
     ├─→ Frontend: Store tokens
     │
     ▼
[Redirect to Dashboard]
     │
     └─→ Load personalized dashboard
```

**Error Handling**:
- Invalid credentials → Show error, increment failed attempt counter
- Too many failed attempts → Show CAPTCHA, temporary lockout (15 min)
- Email not verified → Prompt to resend verification email

---

### 1.4 Password Reset

```
[Forgot Password Link]
     │
     ├─→ User enters email address
     │
     ▼
[Backend Processing]
     │
     ├─→ Lookup user by email
     ├─→ Generate reset token (1-hour expiry)
     ├─→ Queue password reset email
     │
     ▼
[Email Sent Confirmation]
     │
     ├─→ Message: "Check your email"
     │
     ▼
[Email Inbox]
     │
     ├─→ User receives reset email
     ├─→ Clicks reset link
     │
     ▼
[Reset Password Form]
     │
     ├─→ Enter new password (meets requirements)
     ├─→ Confirm password
     │
     ▼
[Backend Processing]
     │
     ├─→ Validate token (not expired)
     ├─→ Hash new password
     ├─→ Update user record
     ├─→ Invalidate all existing sessions
     │
     ▼
[Password Reset Success]
     │
     └─→ Redirect to login with success message
```

---

## 2. News Module Workflows

### 2.1 Browse & Read Articles

```
[Homepage]
     │
     ├─→ View personalized article feed
     │   ├─→ Tabs: For You | Latest | Trending
     │   └─→ Filters: Category, Tag, Difficulty, Date
     │
     ├─→ User clicks article card
     │
     ▼
[Article Detail Page]
     │
     ├─→ View article content
     ├─→ Track reading progress (scroll depth)
     ├─→ Increment view count
     │
     ├─→ User Actions:
     │   ├─→ Bookmark article
     │   ├─→ Share on social media
     │   ├─→ Adjust font size
     │   ├─→ Toggle dark mode
     │   ├─→ Click related articles
     │   └─→ Follow article tags
     │
     ▼
[Engagement Tracking]
     │
     ├─→ Record time on page
     ├─→ Track completion (80% scroll depth)
     ├─→ Update recommendation algorithm
     │
     ▼
[Related Content]
     │
     ├─→ Show 3+ related articles
     ├─→ Show related forum discussions
     └─→ Show related jobs (if model-specific article)
```

---

### 2.2 Bookmark & Organize Articles

```
[Article Page]
     │
     ├─→ User clicks bookmark icon
     │
     ▼
[Bookmark Modal]
     │
     ├─→ Select collection:
     │   ├─→ "Read Later" (default)
     │   ├─→ Existing custom collection
     │   └─→ Create new collection
     │
     ├─→ Optional: Add notes
     │
     ▼
[Save Bookmark]
     │
     ├─→ Backend: Create bookmark record
     ├─→ Backend: Increment article bookmark count
     ├─→ Frontend: Show success toast
     │
     ▼
[User Profile → Bookmarks]
     │
     ├─→ View all bookmarks
     ├─→ Filter by collection
     ├─→ Search bookmarks
     ├─→ Export bookmarks (CSV/JSON)
     │
     ├─→ Manage Collections:
     │   ├─→ Create new collection
     │   ├─→ Rename collection
     │   ├─→ Make collection public/private
     │   ├─→ Share collection link
     │   └─→ Delete collection
     │
     └─→ Remove bookmarks
```

---

### 2.3 Search Articles

```
[Search Box]
     │
     ├─→ User types query
     │
     ▼
[Autocomplete Suggestions]
     │
     ├─→ Show top 5 suggestions
     ├─→ Highlight matching text
     │
     ├─→ User selects suggestion OR presses Enter
     │
     ▼
[Search Results Page]
     │
     ├─→ Display articles matching query
     │
     ├─→ Filters (left sidebar):
     │   ├─→ Category
     │   ├─→ Tags
     │   ├─→ Date range
     │   ├─→ Difficulty level
     │   ├─→ Has code blocks
     │   └─→ LLM model mentioned
     │
     ├─→ Sort options:
     │   ├─→ Relevance (default)
     │   ├─→ Date (newest first)
     │   ├─→ Popularity (views, bookmarks)
     │   └─→ Reading time
     │
     ├─→ User Actions:
     │   ├─→ Save this search
     │   └─→ Enable search alerts
     │
     ▼
[Saved Search]
     │
     ├─→ Name the search
     ├─→ Choose notification frequency:
     │   ├─→ Real-time
     │   ├─→ Daily digest
     │   └─→ Weekly digest
     │
     ▼
[Receive Search Alerts]
     │
     └─→ Get notified when new articles match criteria
```

---

### 2.4 Follow Tags & Categories

```
[Article Page / Tag Page]
     │
     ├─→ User clicks "Follow" on tag/category
     │
     ▼
[Backend Processing]
     │
     ├─→ Create follow record
     ├─→ Update user's following list
     │
     ▼
[Following Feed]
     │
     ├─→ New articles with followed tags appear in feed
     ├─→ Notifications for trending articles in followed categories
     │
     ▼
[Notification]
     │
     ├─→ In-app: "3 new articles in #RAG"
     ├─→ Email: Weekly digest of followed topics
     │
     ▼
[User Profile → Following]
     │
     └─→ Manage followed tags, categories, users, companies
```

---

## 3. Forum Module Workflows

### 3.1 Ask a Question

```
[Forum Homepage]
     │
     ├─→ User clicks "Ask Question" button
     │
     ▼
[Topic Creation Form]
     │
     ├─→ Select topic type: "Question"
     ├─→ Enter title (10-255 chars)
     ├─→ Select category
     ├─→ Write question body (markdown editor)
     │   ├─→ Rich text formatting
     │   ├─→ Code blocks with syntax highlighting
     │   ├─→ Upload images (max 5, 5MB each)
     │   └─→ Preview mode
     │
     ├─→ Add tags (max 5, autocomplete)
     ├─→ Optional: Attach files
     │
     ├─→ Click "Post Question"
     │
     ▼
[Backend Processing]
     │
     ├─→ Validate input (title length, spam detection)
     ├─→ Check rate limit (10 topics/hour)
     ├─→ Create topic record
     ├─→ Add reputation points (+5)
     ├─→ Index in search engine
     ├─→ Notify followers of category/tags
     │
     ▼
[Topic Published]
     │
     ├─→ Redirect to topic page
     ├─→ Show success message
     │
     ▼
[Community Engagement]
     │
     ├─→ Other users view the question
     ├─→ Users upvote/downvote question
     ├─→ Users post replies (answers)
     │
     ▼
[Question Author Actions]
     │
     ├─→ View replies
     ├─→ Upvote helpful replies
     ├─→ Mark a reply as "Accepted Answer"
     │   └─→ Answer author gets +25 reputation
     │
     ├─→ Edit question (within 15 min, or anytime if no replies)
     ├─→ Close question (mark as duplicate, off-topic, etc.)
     │
     ▼
[Question Resolved]
     │
     ├─→ Show "Solved" badge
     ├─→ Accepted answer pinned to top
     └─→ Question appears in "Answered Questions" filter
```

---

### 3.2 Reply to Topic (Threaded Discussion)

```
[Topic Detail Page]
     │
     ├─→ Read topic content
     ├─→ Scroll to replies section
     │
     ├─→ User clicks "Reply" button
     │
     ▼
[Reply Editor]
     │
     ├─→ Write reply (markdown editor)
     ├─→ Optional: Quote parent post
     ├─→ Optional: @mention users
     ├─→ Preview reply
     │
     ├─→ Click "Post Reply"
     │
     ▼
[Backend Processing]
     │
     ├─→ Validate content (min 10 chars)
     ├─→ Check thread depth (max 3 levels)
     ├─→ Create reply record
     ├─→ Add reputation points (+2)
     ├─→ Notify topic author
     ├─→ Notify @mentioned users
     │
     ▼
[Reply Posted]
     │
     ├─→ Reply appears in thread
     ├─→ Update topic's last_activity_at
     │
     ▼
[Nested Replies]
     │
     ├─→ Other users can reply to this reply
     │   └─→ Max depth: 3 levels
     │
     ├─→ Reply author can:
     │   ├─→ Edit reply (within 15 min)
     │   ├─→ Delete reply (if no child replies)
     │   └─→ View edit history (moderators can see)
     │
     ▼
[Community Engagement]
     │
     ├─→ Users upvote helpful reply (+10 rep to author)
     ├─→ Users downvote unhelpful reply (-5 rep to author)
     │   └─→ Requires 50+ reputation to downvote
     │
     ├─→ If score reaches -5:
     │   └─→ Reply auto-hidden (can be expanded)
     │
     ▼
[Accepted Answer Flow]
     │
     └─→ If question type:
         └─→ Topic author can mark as accepted answer
             ├─→ +25 reputation to answer author
             ├─→ Badge: "Accepted Answer" flair
             └─→ Pinned to top of replies
```

---

### 3.3 Voting System

```
[Topic/Reply Page]
     │
     ├─→ User sees upvote/downvote arrows
     │
     ├─→ User clicks upvote
     │
     ▼
[Vote Validation]
     │
     ├─→ Check: User is authenticated
     ├─→ Check: User is not author
     ├─→ Check: User hasn't exceeded daily vote limit (50/day)
     │
     ▼
[Record Vote]
     │
     ├─→ Create/update vote record
     ├─→ Update content score (upvotes - downvotes)
     ├─→ Update author's reputation
     │   ├─→ Upvote: +10 rep
     │   └─→ Downvote: -5 rep
     │
     ├─→ If user changes vote:
     │   └─→ Reverse previous vote effect
     │
     ▼
[UI Update]
     │
     ├─→ Highlight active vote button
     ├─→ Update score display
     ├─→ Animate score change
     │
     ▼
[Auto-Moderation]
     │
     └─→ If score < -5:
         └─→ Auto-hide content
             └─→ Show "This post was hidden due to low score" message
```

---

### 3.4 Earn Reputation & Badges

```
[User Actions] → [Reputation Events]
     │
     ├─→ Create topic: +5 points
     ├─→ Post reply: +2 points
     ├─→ Receive upvote: +10 points
     ├─→ Receive downvote: -5 points
     ├─→ Accepted answer: +25 points
     ├─→ Best answer of week: +100 points
     │
     ▼
[Reputation Calculation]
     │
     ├─→ Aggregate all reputation events
     ├─→ Calculate total points
     │
     ├─→ Determine level:
     │   ├─→ 0-99: Novice
     │   ├─→ 100-499: Contributor
     │   ├─→ 500-999: Expert
     │   ├─→ 1000-2499: Master
     │   └─→ 2500+: Legend
     │
     ├─→ Calculate global rank
     │
     ▼
[Badge System]
     │
     ├─→ Check badge criteria:
     │   ├─→ Skill Badges: "Prompt Master" (50+ upvotes on prompt eng.)
     │   ├─→ Activity Badges: "Streak Master" (7-day login streak)
     │   └─→ Special Badges: "Beta Tester", "Speaker", etc.
     │
     ├─→ Award qualifying badges
     │
     ▼
[Notification]
     │
     ├─→ "Congratulations! You've earned 'Prompt Master' badge"
     ├─→ Show badge on user profile
     │
     ▼
[Leaderboards]
     │
     ├─→ Weekly top contributors
     ├─→ Monthly hall of fame
     └─→ All-time legends
```

---

### 3.5 Moderation Workflow

```
[User Reports Content]
     │
     ├─→ Click "Report" button on post
     │
     ▼
[Report Modal]
     │
     ├─→ Select reason:
     │   ├─→ Spam
     │   ├─→ Harassment
     │   ├─→ Off-topic
     │   ├─→ Misinformation
     │   ├─→ Copyright violation
     │   └─→ Other
     │
     ├─→ Optional: Add description
     │
     ├─→ Submit report
     │
     ▼
[Backend Processing]
     │
     ├─→ Create moderation report
     ├─→ Increment report count on content
     │
     ├─→ If 5+ reports:
     │   └─→ Auto-hide content pending review
     │
     ├─→ Notify moderators (via moderation queue)
     │
     ▼
[Moderator Review]
     │
     ├─→ Moderator views report in queue
     ├─→ Moderator reviews content
     │
     ├─→ Moderator Actions:
     │   ├─→ Approve (dismiss report)
     │   ├─→ Edit content
     │   ├─→ Delete content
     │   ├─→ Move to different category
     │   ├─→ Lock thread
     │   ├─→ Warn user
     │   └─→ Suspend/ban user
     │
     ▼
[Resolution]
     │
     ├─→ Update report status: "Resolved"
     ├─→ Add resolution notes
     ├─→ Log moderation action
     ├─→ Notify reporter of outcome
     │
     ▼
[Reporter Notification]
     │
     └─→ "Your report has been reviewed. Action taken: [action]"
```

---

### 3.6 Prompt Library

```
[Forum → Prompt Library]
     │
     ├─→ Browse community prompts
     │
     ├─→ Filters:
     │   ├─→ Use case (Marketing, Code Gen, etc.)
     │   ├─→ LLM compatibility
     │   ├─→ Effectiveness rating
     │   └─→ Most upvoted
     │
     ├─→ User clicks prompt card
     │
     ▼
[Prompt Detail Page]
     │
     ├─→ View prompt text
     ├─→ See template variables
     ├─→ View example outputs
     ├─→ Check effectiveness rating (1-5 stars)
     │
     ├─→ User Actions:
     │   ├─→ Copy prompt to clipboard
     │   ├─→ Fork prompt (create variation)
     │   ├─→ Upvote/downvote
     │   ├─→ Rate effectiveness
     │   └─→ Comment on prompt
     │
     ▼
[Fork Prompt]
     │
     ├─→ User clicks "Fork"
     │
     ▼
[Edit Forked Prompt]
     │
     ├─→ Modify prompt text
     ├─→ Update variables
     ├─→ Add improvements
     ├─→ Change use case (optional)
     │
     ├─→ Save forked prompt
     │
     ▼
[Published Fork]
     │
     ├─→ Linked to original prompt
     ├─→ Original fork count incremented
     └─→ Available in Prompt Library
```

---

## 4. Jobs Module Workflows

### 4.1 Job Seeker: Browse & Apply

```
[Jobs Homepage]
     │
     ├─→ View job listings
     │
     ├─→ Filters (sidebar):
     │   ├─→ Location type (Remote/Hybrid/On-site)
     │   ├─→ Experience level
     │   ├─→ Employment type
     │   ├─→ Salary range
     │   ├─→ LLMs used (GPT-4, Claude, etc.)
     │   ├─→ Frameworks (LangChain, etc.)
     │   ├─→ Has visa sponsorship
     │   └─→ Salary transparency
     │
     ├─→ Sort by:
     │   ├─→ Best match (if logged in)
     │   ├─→ Newest
     │   └─→ Highest salary
     │
     ├─→ User clicks job card
     │
     ▼
[Job Detail Page]
     │
     ├─→ View job description
     ├─→ See company profile
     ├─→ Check required skills (with proficiency levels)
     ├─→ View match score (if logged in)
     │   └─→ "Why this match?" explanation
     │
     ├─→ User Actions:
     │   ├─→ Save job for later
     │   ├─→ Share job
     │   └─→ Follow company
     │
     ├─→ User clicks "Easy Apply"
     │
     ▼
[Easy Apply Modal]
     │
     ├─→ Auto-filled with profile data:
     │   ├─→ Name, email
     │   ├─→ Resume (from profile)
     │   ├─→ Portfolio
     │   └─→ Skills
     │
     ├─→ Optional fields:
     │   ├─→ Cover letter
     │   └─→ Screening questions
     │
     ├─→ Review application
     │
     ├─→ Click "Submit Application"
     │
     ▼
[Backend Processing]
     │
     ├─→ Validate profile completeness
     ├─→ Check: Not already applied
     ├─→ Create application record
     ├─→ Calculate match score
     ├─→ Notify company (email + in-app)
     ├─→ Add to application tracking
     │
     ▼
[Application Submitted]
     │
     ├─→ Confirmation message
     ├─→ Redirect to Applications Dashboard
     │
     ▼
[Track Application]
     │
     ├─→ Status: "Submitted"
     │
     ├─→ Status updates:
     │   ├─→ Viewed (company viewed profile)
     │   ├─→ Screening scheduled
     │   ├─→ Interview
     │   ├─→ Offer
     │   ├─→ Rejected
     │   └─→ Withdrawn (by candidate)
     │
     ├─→ Receive notifications for status changes
     │
     ▼
[Application Dashboard]
     │
     ├─→ View all applications
     ├─→ Filter by status
     ├─→ See timeline per application
     └─→ Track interview schedules
```

---

### 4.2 Job Seeker: Build Profile

```
[Profile Settings]
     │
     ├─→ Basic Info:
     │   ├─→ Upload avatar
     │   ├─→ Display name
     │   ├─→ Headline (professional title)
     │   ├─→ Bio (elevator pitch)
     │   └─→ Location
     │
     ├─→ LLM Experience:
     │   ├─→ Add models worked with
     │   │   └─→ Proficiency (1-5 stars)
     │   │
     │   ├─→ Add skills
     │   │   ├─→ Skill name
     │   │   ├─→ Skill type (Prompt Eng, RAG, etc.)
     │   │   └─→ Proficiency (1-5 stars)
     │   │
     │   └─→ Programming languages
     │
     ├─→ Work Experience:
     │   ├─→ Add past roles
     │   │   ├─→ Title, company, dates
     │   │   ├─→ Description
     │   │   └─→ Tech stack used
     │   │
     │   └─→ Reorder experiences (drag & drop)
     │
     ├─→ Education:
     │   ├─→ Add degrees, certifications
     │   └─→ Online courses
     │
     ├─→ Portfolio:
     │   ├─→ Add projects (max 5 featured)
     │   │   ├─→ Title, description
     │   │   ├─→ Tech stack
     │   │   ├─→ Project URL, GitHub
     │   │   └─→ Screenshots
     │   │
     │   └─→ Mark as featured (shows prominently)
     │
     ├─→ Job Preferences:
     │   ├─→ Roles interested in
     │   ├─→ Location & remote preference
     │   ├─→ Salary expectations (EUR, USD)
     │   ├─→ Availability (Not looking / Open / Actively looking)
     │   └─→ Company size preference
     │
     ├─→ Privacy Settings:
     │   ├─→ Per section visibility:
     │   │   ├─→ Public
     │   │   ├─→ Community (logged-in users)
     │   │   ├─→ Recruiters only
     │   │   └─→ Private
     │   │
     │   ├─→ Allow recruiter searches
     │   ├─→ Show salary expectations
     │   └─→ Allow messages from
     │
     └─→ Save profile
```

---

### 4.3 Company: Post a Job

```
[Company Dashboard]
     │
     ├─→ User (company role) clicks "Post Job"
     │
     ▼
[Job Creation Form]
     │
     ├─→ Basic Info:
     │   ├─→ Job title
     │   ├─→ Description (WYSIWYG editor)
     │   ├─→ Requirements
     │   ├─→ Responsibilities
     │   ├─→ Benefits
     │
     ├─→ Job Details:
     │   ├─→ Experience level (Junior/Mid/Senior/Lead)
     │   ├─→ Employment type (FT/PT/Freelance/Internship)
     │   ├─→ Location type (Remote/Hybrid/On-site)
     │   ├─→ Location (city/country)
     │   ├─→ Positions available
     │   ├─→ Application deadline
     │
     ├─→ Compensation:
     │   ├─→ Salary range (min/max)
     │   ├─→ Currency (EUR/USD)
     │   ├─→ Public or private salary
     │   └─→ Equity, benefits
     │
     ├─→ LLM-Specific:
     │   ├─→ Primary LLMs used (multi-select)
     │   ├─→ Frameworks (LangChain, LlamaIndex, etc.)
     │   ├─→ Vector databases
     │   ├─→ Infrastructure (AWS, GCP, Azure)
     │   ├─→ Programming languages
     │   ├─→ Use case type
     │   └─→ Model strategy (Commercial API/Open-source/Hybrid)
     │
     ├─→ Required Skills:
     │   ├─→ Add skills with levels (1-5 stars)
     │   ├─→ Mark as required or nice-to-have
     │   └─→ Suggested skills based on role
     │
     ├─→ Screening Questions (optional):
     │   ├─→ Add custom questions
     │   └─→ Mark as required
     │
     ├─→ Save as Draft OR Publish
     │
     ▼
[Job Published]
     │
     ├─→ Backend: Calculate candidate matches
     ├─→ Backend: Notify high-match candidates (>80%)
     ├─→ Frontend: Show job in listings
     │
     ▼
[Manage Job]
     │
     ├─→ View job analytics:
     │   ├─→ Views
     │   ├─→ Applications
     │   ├─→ Conversion rate
     │   └─→ Avg match score
     │
     ├─→ Edit job details
     ├─→ Close job
     └─→ Mark as filled
```

---

### 4.4 Company: Review Applications (ATS)

```
[Company Dashboard → Jobs]
     │
     ├─→ Select job posting
     │
     ▼
[Job Detail → Applications Tab]
     │
     ├─→ View applications list
     │
     ├─→ Filters:
     │   ├─→ Status (Submitted/Viewed/Interview/etc.)
     │   ├─→ Match score (>80%, 60-80%, <60%)
     │   └─→ Date applied
     │
     ├─→ Sort by:
     │   ├─→ Match score (highest first)
     │   ├─→ Date applied (newest first)
     │   └─→ Rating (internal)
     │
     ├─→ Click on application
     │
     ▼
[Application Detail Page]
     │
     ├─→ Candidate Profile (ATS view):
     │   ├─→ Basic info (name, email, location)
     │   ├─→ Headline, bio
     │   ├─→ Skills with proficiency
     │   ├─→ Work experience
     │   ├─→ Education
     │   ├─→ Portfolio projects
     │   ├─→ Community stats (reputation, badges)
     │
     ├─→ Application Details:
     │   ├─→ Cover letter
     │   ├─→ Resume (download)
     │   ├─→ Screening answers
     │   ├─→ Match score & reasons
     │
     ├─→ Recruiter Actions:
     │   ├─→ Change status:
     │   │   ├─→ Viewed
     │   │   ├─→ Screening
     │   │   ├─→ Interview
     │   │   ├─→ Offer
     │   │   ├─→ Rejected
     │   │
     │   ├─→ Add internal notes
     │   ├─→ Rate candidate (1-5 stars)
     │   ├─→ Share with team (add comments)
     │   ├─→ Send message to candidate
     │   └─→ Schedule interview
     │
     ▼
[Status Update]
     │
     ├─→ Backend: Update application status
     ├─→ Backend: Notify candidate (email + in-app)
     ├─→ Backend: Log status change in timeline
     │
     ▼
[Candidate Notification]
     │
     └─→ "Your application for [Job Title] at [Company] has been updated to: Interview"
```

---

### 4.5 Job Matching Algorithm

```
[Job Posted]
     │
     ├─→ Backend: Extract job requirements
     │   ├─→ Required skills + levels
     │   ├─→ LLMs used
     │   ├─→ Experience level
     │   ├─→ Location & remote preference
     │   ├─→ Salary range
     │
     ▼
[Candidate Pool]
     │
     ├─→ Query candidates with:
     │   ├─→ Availability status: "Open" or "Actively looking"
     │   ├─→ Basic filters match (location, remote, experience)
     │
     ▼
[Match Calculation (per candidate)]
     │
     ├─→ Skills Match (40% weight):
     │   └─→ Compare required skills vs candidate skills
     │       └─→ Score: overlap × proficiency alignment
     │
     ├─→ Tech Stack Match (20%):
     │   └─→ LLMs, frameworks, languages overlap
     │
     ├─→ Experience Match (15%):
     │   └─→ Years of experience vs seniority level
     │
     ├─→ Location Match (10%):
     │   └─→ Remote preference alignment
     │
     ├─→ Salary Match (10%):
     │   └─→ Candidate expectations vs job offer
     │
     ├─→ Cultural Fit (5%):
     │   └─→ Company size, industry interest
     │
     ▼
[Match Score] (0-100%)
     │
     ├─→ If score >= 60%:
     │   ├─→ Store match record
     │   ├─→ Show job in candidate's "Matches" tab
     │   │
     │   └─→ If score >= 80%:
     │       └─→ Send notification: "New high-match job!"
     │
     └─→ If score < 60%:
         └─→ Don't show job in matches (can still find via search)
```

---

## 5. Cross-Platform Workflows

### 5.1 Unified Dashboard

```
[User Logs In]
     │
     ▼
[Personalized Dashboard]
     │
     ├─→ Tabs:
     │   ├─→ For You (AI-recommended content)
     │   ├─→ News
     │   ├─→ Forum
     │   └─→ Jobs
     │
     ├─→ Widgets (configurable):
     │   ├─→ Top Stories Today
     │   ├─→ Trending Discussions
     │   ├─→ Job Matches
     │   ├─→ Your Stats (reputation, badges)
     │   ├─→ Following Activity
     │   ├─→ Trending Tags
     │   └─→ Events Calendar
     │
     ├─→ Quick Actions:
     │   ├─→ New Forum Post
     │   ├─→ Search Jobs
     │   ├─→ Browse Articles
     │   └─→ View Notifications
     │
     └─→ Drag & drop to customize layout
```

---

### 5.2 Universal Search

```
[Search Box] (available globally)
     │
     ├─→ User types "RAG implementation"
     │
     ▼
[Autocomplete]
     │
     ├─→ Suggest queries, tags, users
     │
     ├─→ User presses Enter
     │
     ▼
[Universal Search Results]
     │
     ├─→ Tabbed results:
     │   ├─→ All (default)
     │   ├─→ News Articles
     │   ├─→ Forum Topics
     │   ├─→ Jobs
     │   ├─→ Users
     │   └─→ Companies
     │
     ├─→ Each tab shows:
     │   ├─→ Top results (paginated)
     │   ├─→ Relevant filters
     │   └─→ Sort options
     │
     ├─→ User Actions:
     │   ├─→ Save this search
     │   ├─→ Set up alerts
     │   └─→ Refine filters
     │
     ▼
[Search History]
     │
     └─→ Last 10 searches saved for quick access
```

---

### 5.3 Notification System

```
[User Actions] → [Notification Triggers]
     │
     ├─→ News:
     │   ├─→ New article in followed category
     │   ├─→ Trending article in interest area
     │   └─→ Weekly digest
     │
     ├─→ Forum:
     │   ├─→ Reply on your topic
     │   ├─→ @mention
     │   ├─→ Upvote on your post
     │   ├─→ Accepted answer
     │   ├─→ New topic with followed tag
     │   └─→ Badge earned
     │
     ├─→ Jobs:
     │   ├─→ New job match (>80%)
     │   ├─→ Application status update
     │   ├─→ Company viewed your profile
     │   ├─→ Saved job expiring soon
     │   └─→ New job from followed company
     │
     ├─→ Social:
     │   ├─→ New follower
     │   ├─→ Private message
     │   └─→ Reputation milestone
     │
     ▼
[Notification Preferences]
     │
     ├─→ Per notification type:
     │   ├─→ In-app: Always ON
     │   ├─→ Email: Configurable
     │   │   ├─→ Real-time
     │   │   ├─→ Hourly digest
     │   │   ├─→ Daily digest
     │   │   ├─→ Weekly digest
     │   │   └─→ OFF
     │   │
     │   └─→ Push: Configurable (mobile PWA)
     │
     ├─→ Do-Not-Disturb:
     │   └─→ Schedule quiet hours (e.g., 22:00-08:00)
     │
     └─→ Vacation Mode:
         └─→ Pause all notifications
```

---

### 5.4 Following System (Cross-Module)

```
[User Follows]
     │
     ├─→ Users (forum contributors, etc.)
     ├─→ Companies (job posters)
     ├─→ Tags (news & forum)
     ├─→ Categories (news & forum)
     └─→ LLM Models
     │
     ▼
[Following Feed]
     │
     ├─→ Aggregated activity from followed entities:
     │   ├─→ User posted new topic
     │   ├─→ Company posted new job
     │   ├─→ New article with followed tag
     │   ├─→ Trending topic in followed category
     │   └─→ Model news update
     │
     ├─→ Chronological timeline
     ├─→ Filter by type (all, news, forum, jobs)
     │
     ▼
[Notifications]
     │
     └─→ Receive alerts based on notification preferences
```

---

### 5.5 AI Recommendation Engine

```
[Data Collection]
     │
     ├─→ Explicit Signals:
     │   ├─→ Follows (tags, users, companies)
     │   ├─→ Bookmarks (articles)
     │   ├─→ Upvotes (forum posts)
     │   ├─→ Job applications
     │   └─→ Saved searches
     │
     ├─→ Implicit Signals:
     │   ├─→ Article views & time-on-page
     │   ├─→ Scroll depth (completion rate)
     │   ├─→ Search queries
     │   ├─→ Clicks on recommendations
     │   └─→ Topic views
     │
     ├─→ Profile Data:
     │   ├─→ Skills & proficiency
     │   ├─→ Experience level
     │   ├─→ Areas of interest
     │   └─→ Models worked with
     │
     ├─→ Contextual Data:
     │   ├─→ Trending topics
     │   ├─→ Time of day
     │   └─→ Day of week
     │
     ▼
[Recommendation Algorithm]
     │
     ├─→ Collaborative Filtering:
     │   └─→ "Users like you also liked..."
     │
     ├─→ Content-Based Filtering:
     │   └─→ "Similar to what you've engaged with"
     │
     ├─→ Hybrid Scoring:
     │   └─→ Combine collaborative + content-based
     │
     ├─→ Diversity Boost:
     │   └─→ Avoid filter bubble, introduce new topics
     │
     ├─→ Recency Boost:
     │   └─→ Prioritize recent content
     │
     ▼
[Personalized Feed]
     │
     ├─→ Dashboard "For You" tab
     ├─→ Article recommendations
     ├─→ Suggested forum topics
     ├─→ Job matches
     └─→ User/company suggestions
     │
     ▼
[Feedback Loop]
     │
     ├─→ User actions on recommendations:
     │   ├─→ Click (positive signal)
     │   ├─→ Bookmark (strong positive)
     │   ├─→ Upvote (strong positive)
     │   ├─→ Skip/hide (negative signal)
     │   └─→ "Not interested" feedback
     │
     └─→ Continuously improve algorithm
```

---

## Summary

These workflows demonstrate:

1. **User-Centric Design**: Each flow prioritizes user needs and reduces friction
2. **Cross-Module Integration**: Seamless connections between News, Forum, and Jobs
3. **Intelligent Automation**: AI-driven matching, recommendations, and notifications
4. **Community Engagement**: Reputation, badges, and social features drive participation
5. **Transparency**: Clear status tracking, match explanations, and privacy controls

---

## Related Documentation

- [Database Schema](./02-DATABASE_SCHEMA.md) - Data structures supporting these workflows
- [API Endpoints](./03-API_ENDPOINTS.md) - API calls implementing these workflows
- [Technical Decisions](./06-TECHNICAL_DECISIONS.md) - Why these workflows were designed this way
- [Development Phases](./07-DEVELOPMENT_PHASES.md) - Implementation order of workflows
