# QA Test Plan: Sprint 1 User Management Features

## Document Information
**Version**: 1.0
**Date**: November 5, 2025
**Test Lead**: Claude Code (QA Software Tester)
**Sprint**: Sprint 1
**Status**: Ready to Execute (pending blocker resolution)

---

## Table of Contents
1. [Test Strategy](#test-strategy)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Data Preparation](#test-data-preparation)
4. [Manual Test Cases](#manual-test-cases)
5. [Automated Test Cases (Playwright)](#automated-test-cases-playwright)
6. [API Test Cases (curl/Postman)](#api-test-cases-curlpostman)
7. [Performance Test Cases](#performance-test-cases)
8. [Security Test Cases](#security-test-cases)
9. [Accessibility Test Cases](#accessibility-test-cases)
10. [Test Execution Schedule](#test-execution-schedule)

---

## Test Strategy

### Testing Levels
1. **Unit Testing**: Developer responsibility (80%+ coverage required)
2. **Integration Testing**: API endpoint testing with real database
3. **E2E Testing**: Automated user journeys with Playwright
4. **Manual Testing**: Exploratory testing, edge cases, UX validation
5. **Performance Testing**: Load testing, response time validation
6. **Security Testing**: OWASP Top 10 vulnerability checks
7. **Accessibility Testing**: WCAG 2.1 AA compliance

### Test Prioritization (MoSCoW)
- **MUST**: Authentication, profile viewing/editing, data security
- **SHOULD**: Privacy controls, session management, responsive design
- **COULD**: Advanced features, edge case handling
- **WON'T**: Features not in Sprint 1 scope

### Entry Criteria (Prerequisites for Testing)
- ✅ Backend server running (`/home/neurmatic/nEURM/backend`)
- ✅ Frontend dev server running (port 5173)
- ✅ PostgreSQL database initialized and migrated
- ✅ Redis cache running
- ✅ SPRINT-0-007 completed (JWT authentication)
- ✅ SPRINT-1-014 completed (Login/registration UI)
- ✅ SPRINT-1-015 completed (Email verification UI)
- ✅ Test database populated with seed data

### Exit Criteria (Definition of Done)
- ✅ All critical test cases passed
- ✅ All high-priority bugs fixed and verified
- ✅ 80%+ test coverage achieved
- ✅ No critical or high-severity bugs open
- ✅ Performance benchmarks met (< 2s page load, < 200ms API)
- ✅ Accessibility audit passed (WCAG 2.1 AA)
- ✅ Security vulnerabilities addressed (no critical/high)
- ✅ Test report generated and reviewed

---

## Test Environment Setup

### Backend Environment

**Start Backend Server:**
```bash
cd /home/neurmatic/nEURM/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

**Verify Backend:**
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"...","environment":"development"}
```

**Environment Variables:**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://neurmatic:password@localhost:5435/neurmatic_dev
REDIS_URL=redis://localhost:6382
JWT_SECRET=test_jwt_secret_for_qa_only
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
FRONTEND_URL=http://vps-1a707765.vps.ovh.net:5173
```

---

### Frontend Environment

**Start Frontend Dev Server:**
```bash
cd /home/neurmatic/nEURM/frontend
npm install
npm run dev
```

**Verify Frontend:**
```bash
curl -I http://localhost:5173
# Expected: 200 OK
```

**Environment Variables (.env.development):**
```env
VITE_API_URL=http://vps-1a707765.vps.ovh.net:3000/api/v1
VITE_WS_URL=ws://vps-1a707765.vps.ovh.net:3000
```

---

### Database Setup

**Reset Test Database:**
```bash
cd /home/neurmatic/nEURM/backend
npx prisma migrate reset --force
npx prisma db seed
```

**Verify Database:**
```bash
docker exec -it neurmatic-postgres psql -U neurmatic -d neurmatic_dev -c "SELECT COUNT(*) FROM users;"
# Expected: 10 (seed users)
```

---

## Test Data Preparation

### Seed Users

Create the following test users in the database:

| Username | Email | Password | Status | Email Verified | Role |
|----------|-------|----------|--------|----------------|------|
| testuser1 | test1@neurmatic.com | Test123! | active | true | user |
| testuser2 | test2@neurmatic.com | Test123! | active | true | user |
| testuser3 | test3@neurmatic.com | Test123! | active | false | user |
| recruiter1 | recruiter@company.com | Test123! | active | true | recruiter |
| admin1 | admin@neurmatic.com | Admin123! | active | true | admin |
| deleted1 | deleted@neurmatic.com | Test123! | deleted | true | user |

### Seed Data Script

```typescript
// backend/src/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Test123!', 10);

  // Create test users
  const testUser1 = await prisma.user.create({
    data: {
      email: 'test1@neurmatic.com',
      username: 'testuser1',
      password: hashedPassword,
      emailVerified: true,
      status: 'active',
      role: 'user',
      profile: {
        create: {
          displayName: 'Test User One',
          headline: 'AI Engineer & LLM Enthusiast',
          bio: 'Passionate about building AI applications.',
          location: 'Amsterdam, Netherlands',
          website: 'https://testuser1.dev',
          socialLinks: {
            twitter: 'testuser1',
            linkedin: 'testuser1',
            github: 'testuser1',
          },
        },
      },
      privacySettings: {
        create: {
          bio: 'public',
          workExperience: 'public',
          education: 'public',
          portfolio: 'public',
          skills: 'public',
          salary: 'recruiters',
          contact: 'community',
        },
      },
    },
  });

  // Create skills for testUser1
  await prisma.userSkill.createMany({
    data: [
      { userId: testUser1.id, skillName: 'Prompt Engineering', category: 'LLM Skills', proficiency: 5 },
      { userId: testUser1.id, skillName: 'Fine-tuning', category: 'LLM Skills', proficiency: 4 },
      { userId: testUser1.id, skillName: 'RAG', category: 'LLM Skills', proficiency: 4 },
      { userId: testUser1.id, skillName: 'Python', category: 'Programming', proficiency: 5 },
      { userId: testUser1.id, skillName: 'React', category: 'Frontend', proficiency: 4 },
    ],
  });

  // Create work experience
  await prisma.workExperience.create({
    data: {
      userId: testUser1.id,
      title: 'Senior AI Engineer',
      company: 'TechCorp',
      location: 'Amsterdam, NL',
      employmentType: 'full_time',
      startDate: new Date('2022-01-01'),
      endDate: null, // Current position
      description: 'Leading AI team developing LLM applications.',
      techStack: ['Python', 'PyTorch', 'React', 'Node.js'],
      displayOrder: 0,
    },
  });

  // Create education
  await prisma.education.create({
    data: {
      userId: testUser1.id,
      institution: 'University of Amsterdam',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: new Date('2014-09-01'),
      endDate: new Date('2018-06-30'),
      description: 'Focus on AI and machine learning.',
      displayOrder: 0,
    },
  });

  // Create portfolio project
  await prisma.portfolioProject.create({
    data: {
      userId: testUser1.id,
      title: 'AI Chat Application',
      description: 'Real-time chat with GPT-4 integration.',
      techStack: ['React', 'Node.js', 'OpenAI API'],
      projectUrl: 'https://mychat.app',
      githubUrl: 'https://github.com/testuser1/chat-app',
      demoUrl: 'https://demo.mychat.app',
      isFeatured: true,
      displayOrder: 0,
    },
  });

  // Repeat for other test users...

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Manual Test Cases

### Registration Flow Test Cases

#### TC-REG-001: Successful Email Registration
**Priority**: Critical
**Preconditions**: None

**Steps**:
1. Navigate to http://vps-1a707765.vps.ovh.net:5173
2. Click "Sign Up" or "Register" button
3. Fill registration form:
   - Email: `newuser@example.com`
   - Username: `newuser123`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
   - Accept Terms: ✓
4. Click "Create Account"

**Expected Results**:
- Registration form validates all fields
- API call: `POST /api/v1/auth/register`
- User created in database with `emailVerified: false`
- Verification email sent
- User redirected to "Check Your Email" page
- Success message displayed

**Validation**:
```sql
SELECT email, username, email_verified, status FROM users WHERE email = 'newuser@example.com';
-- Expected: email_verified = false, status = 'active'
```

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-REG-002: Registration with Invalid Email
**Priority**: High

**Steps**:
1. Open registration form
2. Enter invalid email: `notanemail`
3. Fill other fields correctly
4. Submit form

**Expected Results**:
- ❌ Client-side validation error: "Please enter a valid email address"
- Form submission prevented
- Focus moved to email field
- Error message displayed in red below field

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-REG-003: Registration with Weak Password
**Priority**: High

**Steps**:
1. Open registration form
2. Enter weak password: `123`
3. Submit form

**Expected Results**:
- ❌ Validation error: "Password must be at least 8 characters, include uppercase, lowercase, number, and special character"
- Password strength indicator shows "Weak" (red)
- Helpful hints displayed

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-REG-004: Registration with Duplicate Email
**Priority**: Critical

**Steps**:
1. Register user with email `test1@neurmatic.com` (already exists)
2. Fill other fields correctly
3. Submit form

**Expected Results**:
- ❌ API returns 409 Conflict
- Error message: "This email is already registered"
- Link to login page displayed

**Pass/Fail**: ______
**Notes**: _______________________

---

### Login Flow Test Cases

#### TC-LOGIN-001: Successful Login
**Priority**: Critical
**Preconditions**: User `test1@neurmatic.com` exists and is email-verified

**Steps**:
1. Navigate to login page
2. Enter email: `test1@neurmatic.com`
3. Enter password: `Test123!`
4. Click "Log In"

**Expected Results**:
- ✅ API call: `POST /api/v1/auth/login`
- ✅ JWT access token received
- ✅ Refresh token set in HTTPOnly cookie
- ✅ User data stored in auth context
- ✅ Redirect to dashboard or intended page
- ✅ Success toast: "Welcome back, Test User One!"

**Validation**:
```bash
# Check browser localStorage for access token
# Check browser cookies for refresh token (HTTPOnly)
# Check auth state in Redux DevTools
```

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-LOGIN-002: Login with Invalid Password
**Priority**: Critical

**Steps**:
1. Enter email: `test1@neurmatic.com`
2. Enter password: `WrongPassword123!`
3. Click "Log In"

**Expected Results**:
- ❌ API returns 401 Unauthorized
- ❌ Error message: "Invalid email or password"
- ✅ Password field cleared
- ✅ Focus returned to password field
- ⚠️ After 5 failed attempts: rate limiting applied

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-LOGIN-003: Login with Unverified Email
**Priority**: High
**Preconditions**: User `test3@neurmatic.com` exists but `emailVerified = false`

**Steps**:
1. Enter email: `test3@neurmatic.com`
2. Enter correct password
3. Click "Log In"

**Expected Results**:
- ❌ API returns 403 Forbidden
- ❌ Error message: "Please verify your email address before logging in"
- ✅ "Resend verification email" button displayed
- ❌ No session created

**Pass/Fail**: ______
**Notes**: _______________________

---

### Profile Viewing Test Cases

#### TC-PROF-001: View Own Profile
**Priority**: Critical
**Preconditions**: Logged in as `testuser1`

**Steps**:
1. Navigate to `/profile/testuser1`
2. Observe all sections

**Expected Results**:
- ✅ Profile header with avatar, cover, display name, headline
- ✅ Stats: reputation, badges, contributions, followers
- ✅ Edit Profile button visible (owner only)
- ✅ About section with bio
- ✅ Skills section with proficiency stars
- ✅ Work Experience timeline
- ✅ Education timeline
- ✅ Portfolio projects grid
- ✅ All sections visible (regardless of privacy settings)
- ✅ No privacy indicators (owner sees all)

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-PROF-002: View Public Profile (Logged Out)
**Priority**: Critical
**Preconditions**: Logged out

**Steps**:
1. Navigate to `/profile/testuser1`
2. Observe visible sections

**Expected Results**:
- ✅ Only public sections visible
- ❌ Private sections show lock icon and message: "This section is private"
- ❌ Edit Profile button NOT visible
- ✅ Public contact info visible
- ❌ Private contact info hidden

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-PROF-003: Profile Not Found (404)
**Priority**: Medium

**Steps**:
1. Navigate to `/profile/nonexistentuser999`

**Expected Results**:
- ❌ 404 error page displayed
- ✅ Message: "User not found"
- ✅ Link to return home
- ✅ No console errors

**Pass/Fail**: ______
**Notes**: _______________________

---

### Profile Editing Test Cases

#### TC-EDIT-001: Edit Basic Info
**Priority**: Critical
**Preconditions**: Logged in as `testuser1`

**Steps**:
1. Navigate to own profile
2. Click "Edit Profile"
3. Switch to "Basic Info" tab
4. Update fields:
   - Display Name: `Updated Name`
   - Headline: `Updated Headline`
   - Bio: `Updated bio text...`
   - Location: `Berlin, Germany`
   - Website: `https://updated.dev`
5. Click "Save Changes"

**Expected Results**:
- ✅ API call: `PATCH /api/v1/users/me`
- ✅ Success toast: "Profile updated successfully"
- ✅ Modal closes
- ✅ Changes immediately visible on profile page
- ✅ Database updated

**Validation**:
```sql
SELECT display_name, headline, location FROM user_profiles WHERE user_id = (SELECT id FROM users WHERE username = 'testuser1');
-- Expected: display_name = 'Updated Name', etc.
```

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-EDIT-002: Add New Skill
**Priority**: High
**Preconditions**: Logged in as `testuser1`

**Steps**:
1. Edit Profile > Skills tab
2. Click "Add Skill"
3. Enter skill name: `LangChain`
4. Select category: `LLM Skills`
5. Set proficiency: 4 stars (slider)
6. Click "Save"

**Expected Results**:
- ✅ API call: `POST /api/v1/users/me/skills`
- ✅ Skill added to database
- ✅ Skill appears in list immediately
- ✅ Success toast
- ✅ Form resets for adding another

**Validation**:
```sql
SELECT skill_name, proficiency FROM user_skills WHERE user_id = (SELECT id FROM users WHERE username = 'testuser1') AND skill_name = 'LangChain';
-- Expected: proficiency = 4
```

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-EDIT-003: Delete Skill with Confirmation
**Priority**: Medium
**Preconditions**: User has at least one skill

**Steps**:
1. Edit Profile > Skills tab
2. Click delete icon on skill
3. Confirm deletion in dialog

**Expected Results**:
- ✅ Confirmation dialog: "Are you sure you want to delete this skill?"
- ✅ API call: `DELETE /api/v1/users/me/skills/:id`
- ✅ Skill removed from database
- ✅ Skill removed from UI
- ✅ Success toast

**Pass/Fail**: ______
**Notes**: _______________________

---

### Avatar Upload Test Cases

#### TC-AVATAR-001: Upload Avatar with Crop
**Priority**: Critical
**Preconditions**: Logged in

**Steps**:
1. Navigate to profile
2. Hover over avatar
3. Click "Change Avatar"
4. Select 3MB PNG image
5. Crop image (1:1 aspect ratio)
6. Adjust zoom and position
7. Click "Upload"

**Expected Results**:
- ✅ File picker opens
- ✅ Image preview displayed
- ✅ Crop modal with 1:1 ratio
- ✅ Zoom/pan controls work
- ✅ Upload progress bar shown
- ✅ API call: `POST /api/v1/users/me/avatar`
- ✅ Image uploaded to S3/CloudFlare R2
- ✅ Multiple sizes generated: 32, 64, 128, 256px
- ✅ Converted to WebP
- ✅ Old avatar deleted
- ✅ Avatar updated immediately
- ✅ Success toast

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-AVATAR-002: Avatar File Size Validation
**Priority**: High

**Steps**:
1. Attempt to upload 8MB image (exceeds 5MB limit)

**Expected Results**:
- ❌ Error: "Avatar must be less than 5MB"
- ❌ Upload prevented
- ✅ Clear error message

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-AVATAR-003: Avatar Format Validation
**Priority**: High

**Steps**:
1. Attempt to upload GIF file

**Expected Results**:
- ❌ Error: "Only JPEG, PNG, and WebP formats allowed"
- ❌ Upload prevented

**Pass/Fail**: ______
**Notes**: _______________________

---

### Privacy Settings Test Cases

#### TC-PRIV-001: Update Privacy Settings
**Priority**: Critical
**Preconditions**: Logged in as `testuser1`

**Steps**:
1. Navigate to Settings > Privacy
2. Change Bio visibility: Public → Private
3. Change Work Experience: Public → Recruiters Only
4. Click "Save Changes"

**Expected Results**:
- ✅ API call: `PATCH /api/v1/users/me/privacy`
- ✅ Success toast
- ✅ Changes saved to database

**Validation**:
```sql
SELECT bio, work_experience FROM profile_privacy_settings WHERE user_id = (SELECT id FROM users WHERE username = 'testuser1');
-- Expected: bio = 'private', work_experience = 'recruiters'
```

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-PRIV-002: Verify Privacy Enforcement
**Priority**: Critical
**Preconditions**: User set Work Experience to "Private"

**Steps**:
1. Set Work Experience to Private
2. Logout
3. View public profile

**Expected Results**:
- ❌ Work Experience section NOT visible
- ✅ Lock icon displayed
- ✅ Message: "This section is private"

**Pass/Fail**: ______
**Notes**: _______________________

---

### Session Management Test Cases

#### TC-SESS-001: View Active Sessions
**Priority**: Medium
**Preconditions**: Logged in from multiple devices

**Steps**:
1. Login from Desktop Chrome
2. Login from Mobile Safari
3. Navigate to Settings > Security > Sessions

**Expected Results**:
- ✅ API call: `GET /api/v1/users/me/sessions`
- ✅ All sessions listed:
  - Current session marked "This device"
  - Device type (Desktop, Mobile)
  - Browser (Chrome, Safari)
  - IP address
  - Last active timestamp
- ✅ Session count displayed

**Pass/Fail**: ______
**Notes**: _______________________

---

#### TC-SESS-002: Revoke Specific Session
**Priority**: Medium
**Preconditions**: Multiple active sessions

**Steps**:
1. View active sessions
2. Click "Revoke" on non-current session
3. Confirm action

**Expected Results**:
- ✅ Confirmation dialog
- ✅ API call: `DELETE /api/v1/users/me/sessions/:id`
- ✅ Session deleted
- ✅ Session removed from list
- ✅ Success toast

**Pass/Fail**: ______
**Notes**: _______________________

---

## Automated Test Cases (Playwright)

### E2E Test Script: User Registration and Profile Setup

```typescript
// tests/e2e/user-registration-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration and Profile Setup', () => {
  test('should register new user, verify email, and complete profile', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.goto('http://vps-1a707765.vps.ovh.net:5173');
    await page.click('text=Sign Up');

    // Step 2: Fill registration form
    await page.fill('input[name="email"]', 'playwright@test.com');
    await page.fill('input[name="username"]', 'playwrightuser');
    await page.fill('input[name="password"]', 'SecureTest123!');
    await page.fill('input[name="confirmPassword"]', 'SecureTest123!');
    await page.check('input[name="acceptTerms"]');

    // Step 3: Submit registration
    await page.click('button[type="submit"]');

    // Step 4: Verify redirect to email verification page
    await expect(page).toHaveURL(/verify-email/);
    await expect(page.locator('text=Check Your Email')).toBeVisible();

    // Step 5: Simulate email verification (extract token from database)
    // Note: In real scenario, we'd extract token from email or database
    const verificationToken = 'mock_token_123'; // Replace with actual token extraction

    // Step 6: Navigate to verification URL
    await page.goto(`http://vps-1a707765.vps.ovh.net:5173/verify?token=${verificationToken}`);

    // Step 7: Verify successful verification
    await expect(page.locator('text=Email Verified Successfully')).toBeVisible();

    // Step 8: Auto-login should occur
    await expect(page).toHaveURL(/dashboard|profile/);

    // Step 9: Navigate to profile edit
    await page.click('text=Edit Profile');

    // Step 10: Fill basic info
    await page.fill('input[name="displayName"]', 'Playwright Test User');
    await page.fill('input[name="headline"]', 'Automated Test Engineer');

    // Step 11: Add a skill
    await page.click('text=Skills');
    await page.click('text=Add Skill');
    await page.fill('input[name="skillName"]', 'Test Automation');
    await page.selectOption('select[name="category"]', 'Programming');
    await page.click('button:has-text("Save")');

    // Step 12: Verify skill added
    await expect(page.locator('text=Test Automation')).toBeVisible();

    // Step 13: Save profile
    await page.click('button:has-text("Save Changes")');

    // Step 14: Verify success toast
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
  });
});
```

---

### E2E Test Script: Login and Logout

```typescript
// tests/e2e/auth-login-logout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login and logout successfully', async ({ page }) => {
    // Login
    await page.goto('http://vps-1a707765.vps.ovh.net:5173/login');
    await page.fill('input[name="email"]', 'test1@neurmatic.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // Verify login success
    await expect(page).toHaveURL(/dashboard|profile/);
    await expect(page.locator('text=Test User One')).toBeVisible();

    // Logout
    await page.click('[aria-label="User menu"]');
    await page.click('text=Logout');

    // Verify logout
    await expect(page).toHaveURL(/login|home/);
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://vps-1a707765.vps.ovh.net:5173/login');
    await page.fill('input[name="email"]', 'test1@neurmatic.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});
```

---

## API Test Cases (curl/Postman)

### API Test: User Registration

```bash
# Test successful registration
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "username": "apitest123",
    "password": "SecureTest123!"
  }'

# Expected Response (201 Created):
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "userId": "uuid-here",
    "email": "apitest@example.com",
    "username": "apitest123"
  }
}
```

---

### API Test: User Login

```bash
# Test successful login
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@neurmatic.com",
    "password": "Test123!"
  }'

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "uuid",
      "email": "test1@neurmatic.com",
      "username": "testuser1",
      "role": "user"
    }
  }
}
```

---

### API Test: Get Current User Profile

```bash
# Get access token from login response
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test get current user
curl -X GET http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Expected Response (200 OK):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "test1@neurmatic.com",
    "username": "testuser1",
    "profile": {
      "displayName": "Test User One",
      "headline": "AI Engineer & LLM Enthusiast",
      "bio": "Passionate about building AI applications.",
      "location": "Amsterdam, Netherlands",
      "website": "https://testuser1.dev",
      "socialLinks": {
        "twitter": "testuser1",
        "linkedin": "testuser1",
        "github": "testuser1"
      },
      "avatarUrl": null,
      "coverImageUrl": null
    },
    "stats": {
      "reputation": 500,
      "badges": 12,
      "contributions": 156,
      "followers": 89
    }
  }
}
```

---

### API Test: Update User Profile

```bash
# Test profile update
curl -X PATCH http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Updated Name",
    "headline": "Updated Headline",
    "bio": "Updated bio text",
    "location": "Berlin, Germany"
  }'

# Expected Response (200 OK):
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "displayName": "Updated Name",
    "headline": "Updated Headline",
    "bio": "Updated bio text",
    "location": "Berlin, Germany"
  }
}
```

---

### API Test: Add Skill

```bash
# Test add skill
curl -X POST http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me/skills \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "skillName": "LangChain",
    "category": "LLM Skills",
    "proficiency": 4
  }'

# Expected Response (201 Created):
{
  "success": true,
  "message": "Skill added successfully",
  "data": {
    "id": "uuid",
    "skillName": "LangChain",
    "category": "LLM Skills",
    "proficiency": 4,
    "endorsementCount": 0
  }
}
```

---

### API Test: Rate Limiting

```bash
# Test rate limiting (make 11 requests in 1 hour)
for i in {1..11}; do
  curl -X PATCH http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"displayName": "Test '$i'"}' \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done

# Expected: First 10 succeed (200), 11th fails (429 Too Many Requests)
{
  "success": false,
  "message": "Too many requests. Try again in 52 minutes.",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 3120
  }
}
```

---

## Performance Test Cases

### Load Test: Profile Page

```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 http://vps-1a707765.vps.ovh.net:3000/api/v1/users/testuser1

# Expected Results:
# - Requests per second: > 50
# - Time per request (mean): < 200ms
# - 95th percentile: < 300ms
# - 99th percentile: < 500ms
# - Failed requests: 0
```

---

### Load Test: Login Endpoint

```bash
# Using wrk
wrk -t4 -c100 -d30s --latency \
  -s login-script.lua \
  http://vps-1a707765.vps.ovh.net:3000/api/v1/auth/login

# login-script.lua:
wrk.method = "POST"
wrk.body   = '{"email":"test1@neurmatic.com","password":"Test123!"}'
wrk.headers["Content-Type"] = "application/json"

# Expected Results:
# - Requests/sec: > 100
# - Latency (avg): < 100ms
# - Latency (99th): < 500ms
```

---

## Security Test Cases

### Security Test: XSS Prevention

```bash
# Test XSS in bio field
curl -X PATCH http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "<script>alert(\"XSS\")</script>"
  }'

# Then GET profile and verify script is sanitized
curl -X GET http://vps-1a707765.vps.ovh.net:3000/api/v1/users/testuser1

# Expected: Script tag should be escaped or removed
{
  "bio": "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
}
```

---

### Security Test: SQL Injection

```bash
# Test SQL injection in username search
curl -X GET "http://vps-1a707765.vps.ovh.net:3000/api/v1/users/admin'; DROP TABLE users; --"

# Expected Response (404 or safe error, NOT database error):
{
  "success": false,
  "message": "User not found"
}
```

---

### Security Test: Unauthorized Access

```bash
# Test accessing protected endpoint without token
curl -X GET http://vps-1a707765.vps.ovh.net:3000/api/v1/users/me

# Expected Response (401 Unauthorized):
{
  "success": false,
  "message": "Authentication required",
  "error": {
    "code": "UNAUTHORIZED"
  }
}
```

---

### Security Test: Edit Other User's Profile

```bash
# Login as User A, get their access token
# Try to update User B's profile using User A's token

curl -X PATCH http://vps-1a707765.vps.ovh.net:3000/api/v1/users/testuser2/profile \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Hacked Name"
  }'

# Expected Response (403 Forbidden):
{
  "success": false,
  "message": "You are not authorized to perform this action",
  "error": {
    "code": "FORBIDDEN"
  }
}
```

---

## Accessibility Test Cases

### A11Y Test: Keyboard Navigation

**Manual Test**:
1. Navigate to profile page
2. Press Tab repeatedly
3. Verify all interactive elements receive focus
4. Verify focus order is logical
5. Verify skip links work

**Automated Test (Playwright)**:
```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('http://vps-1a707765.vps.ovh.net:5173/profile/testuser1');

  // Press Tab and verify focus
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('href', '/');

  // Continue tabbing through interactive elements
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveText('Edit Profile');
});
```

---

### A11Y Test: Screen Reader Compatibility

**Manual Test** (using NVDA or VoiceOver):
1. Enable screen reader
2. Navigate to profile page
3. Verify all headings are announced
4. Verify images have alt text
5. Verify form labels are read
6. Verify error messages are announced

---

### A11Y Test: Color Contrast

**Automated Test** (using axe-core):
```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('should meet WCAG 2.1 AA color contrast', async ({ page }) => {
  await page.goto('http://vps-1a707765.vps.ovh.net:5173/profile/testuser1');
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: {
      html: true
    }
  });
});
```

---

## Test Execution Schedule

### Phase 1: Backend API Testing (Day 1-2)
**Duration**: 8 hours
- Setup test environment
- Seed test data
- Execute all API test cases (Postman/curl)
- Validate database state
- Test error handling and rate limiting

**Deliverable**: API Test Report

---

### Phase 2: Frontend Manual Testing (Day 3-4)
**Duration**: 12 hours
- Test authentication flows
- Test profile viewing and editing
- Test responsive design (mobile, tablet, desktop)
- Test all form validations
- Test avatar/cover upload

**Deliverable**: Manual Test Report

---

### Phase 3: E2E Automated Testing (Day 5)
**Duration**: 8 hours
- Setup Playwright tests
- Execute E2E user journeys
- Cross-browser testing (Chrome, Firefox, Safari)
- Generate test coverage report

**Deliverable**: E2E Test Report

---

### Phase 4: Quality Assurance (Day 6)
**Duration**: 4 hours
- Performance testing
- Security testing
- Accessibility audit
- Final bug verification

**Deliverable**: Comprehensive QA Report

---

## Test Report Template

After test execution, generate a report with:

1. **Executive Summary**
   - Total tests executed
   - Pass/fail ratio
   - Critical bugs found
   - Overall quality assessment

2. **Test Results by Category**
   - Authentication: X passed, Y failed
   - Profile Management: X passed, Y failed
   - Privacy Settings: X passed, Y failed
   - etc.

3. **Bug Report**
   - Bug ID, Severity, Description, Steps to reproduce
   - Categorized by severity (Critical, High, Medium, Low)

4. **Performance Metrics**
   - Page load times
   - API response times
   - Bundle sizes

5. **Accessibility Report**
   - WCAG 2.1 AA compliance status
   - Issues found and remediation

6. **Security Findings**
   - Vulnerabilities discovered
   - Recommendations

7. **Recommendations**
   - Fixes required before production
   - Improvements for future sprints

8. **Sign-off**
   - QA approval status
   - Production readiness assessment

---

## Conclusion

This comprehensive test plan covers all aspects of Sprint 1 user management features. Upon blocker resolution, follow this plan systematically to ensure production-ready quality.

**Test Lead**: Claude Code
**Plan Version**: 1.0
**Status**: Ready to Execute (pending blocker resolution)
