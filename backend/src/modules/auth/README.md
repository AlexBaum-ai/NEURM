# Authentication Module

Complete email/password authentication implementation for the NEURM backend.

## Structure

```
/backend/src/modules/auth/
├── auth.service.ts         # Business logic (670+ lines)
├── auth.controller.ts      # HTTP request handlers (350+ lines)
├── auth.routes.ts          # Route definitions
├── validation/
│   └── auth.validation.ts  # Zod validation schemas
├── index.ts                # Module exports
└── README.md              # This file
```

## Features Implemented

### Core Authentication
- ✅ User registration with email/password
- ✅ User login with JWT tokens
- ✅ User logout with session invalidation
- ✅ Token refresh mechanism
- ✅ Get current user (me endpoint)

### Email Verification
- ✅ Send email verification on registration
- ✅ Verify email with token
- ✅ Resend verification email

### Password Reset
- ✅ Request password reset email
- ✅ Reset password with token
- ✅ Automatic session invalidation on reset

### Security Features
- ✅ Bcrypt password hashing (12 rounds)
- ✅ JWT access tokens (15 min expiry)
- ✅ JWT refresh tokens (30 day expiry)
- ✅ Session tracking (IP, user agent)
- ✅ Account status checks (active, suspended, banned, deleted)
- ✅ Email enumeration protection
- ✅ Token expiry validation
- ✅ Sentry error tracking

## API Endpoints

All endpoints are registered at `/api/v1/auth` (NO CSRF protection).

### Public Endpoints (No Authentication Required)

#### POST /register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "johndoe",
  "termsAccepted": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email to verify your account.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST /login
Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user",
      "emailVerified": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### POST /refresh
Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### POST /verify-email
Verify email address.

**Request Body:**
```json
{
  "token": "64-character-hex-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### POST /resend-verification
Resend verification email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

#### POST /forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent."
}
```

#### POST /reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "64-character-hex-token",
  "newPassword": "NewSecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password."
}
```

### Protected Endpoints (Require Authentication)

#### POST /logout
Logout and invalidate session.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user",
      "emailVerified": true,
      "accountType": "individual",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "lastLoginAt": "2025-01-06T00:00:00.000Z",
      "twoFactorEnabled": false,
      "profile": {
        "displayName": "John Doe",
        "headline": "AI Engineer",
        "avatarUrl": "https://...",
        "location": "Amsterdam, NL"
      }
    }
  }
}
```

## Validation Rules

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### Username Requirements
- 3-50 characters
- Must start with letter or number
- Only letters, numbers, underscores, and hyphens allowed
- Pattern: `^[a-zA-Z0-9][a-zA-Z0-9_-]*$`

### Email Requirements
- Valid email format
- Automatically lowercased and trimmed

## Database Models Used

### User
```prisma
model User {
  id               String      @id @default(uuid())
  email            String      @unique
  emailVerified    Boolean     @default(false)
  passwordHash     String?
  username         String      @unique
  role             UserRole    @default(user)
  status           UserStatus  @default(active)
  // ... more fields
}
```

### Session
```prisma
model Session {
  id           String   @id @default(uuid())
  userId       String
  token        String   @unique
  refreshToken String?  @unique
  ipAddress    String?
  userAgent    String?
  expiresAt    DateTime
  lastActiveAt DateTime @default(now())
}
```

### PendingEmailChange
```prisma
model PendingEmailChange {
  id                String   @id @default(uuid())
  userId            String
  newEmail          String
  verificationToken String   @unique
  expiresAt         DateTime
}
```

## Email Templates

### Verification Email
- Subject: "Verify your Neurmatic account"
- Contains verification link with 24-hour expiry
- Styled HTML template

### Password Reset Email
- Subject: "Reset your Neurmatic password"
- Contains reset link with 1-hour expiry
- Styled HTML template

## Error Handling

All errors are properly handled and logged to Sentry:
- `BadRequestError` (400): Validation errors, invalid input
- `UnauthorizedError` (401): Invalid credentials, expired tokens
- `ForbiddenError` (403): Insufficient permissions
- `NotFoundError` (404): User not found
- `ConflictError` (409): Email/username already exists

## Security Best Practices

✅ **Password Security**
- Bcrypt hashing with 12 rounds
- No plaintext password storage
- Password validation on input

✅ **Token Security**
- JWT with short expiry (15 min access, 30 day refresh)
- Secure random token generation (crypto.randomBytes)
- Session tracking and invalidation

✅ **Email Enumeration Protection**
- Password reset doesn't reveal if email exists
- Resend verification doesn't reveal if email exists
- Consistent response messages

✅ **Session Management**
- IP address and user agent tracking
- Session expiry validation
- Automatic cleanup on password reset

✅ **Input Validation**
- Zod schemas for all inputs
- Email sanitization (lowercase, trim)
- Username pattern validation

✅ **Error Tracking**
- Sentry integration for all errors
- Proper context tagging
- User-friendly error messages

## Testing

To test the authentication endpoints:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "username": "testuser",
    "termsAccepted": true
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'

# Get current user
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Integration Notes

### Frontend Integration
The frontend auth UI at `/frontend/src/features/auth` already exists and calls these endpoints. Ensure:
- API URL is configured: `VITE_API_URL=http://localhost:3000/api/v1`
- Access token is stored securely (httpOnly cookie or localStorage)
- Refresh token flow is implemented
- Error handling displays user-friendly messages

### Middleware Integration
The auth middleware at `/backend/src/middleware/auth.middleware.ts` works seamlessly with this module:
- `authenticate` - Requires valid JWT token
- `optionalAuth` - Attaches user if token provided
- `requireRole` - Checks user role
- `requireAdmin` - Admin-only routes

### Environment Variables Required
```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
JWT_REFRESH_SECRET=optional-separate-refresh-secret
BCRYPT_ROUNDS=12
FRONTEND_URL=http://localhost:5173
FROM_EMAIL=noreply@neurmatic.com
```

## Future Enhancements (Not Implemented Yet)

- OAuth providers (Google, LinkedIn, GitHub)
- Two-factor authentication (2FA)
- Email change workflow
- Account deletion
- Login history
- Device management
- Rate limiting per user
- Suspicious activity detection

## Files Modified

1. ✅ Created `/backend/src/modules/auth/auth.service.ts`
2. ✅ Created `/backend/src/modules/auth/auth.controller.ts`
3. ✅ Created `/backend/src/modules/auth/auth.routes.ts`
4. ✅ Created `/backend/src/modules/auth/validation/auth.validation.ts`
5. ✅ Created `/backend/src/modules/auth/index.ts`
6. ✅ Updated `/backend/src/app.ts` to register auth routes

## Troubleshooting

### Email Not Sending
- Check `SENDGRID_API_KEY` or AWS SES credentials
- In development, check console for Ethereal preview URLs
- Verify `FROM_EMAIL` is configured

### Token Errors
- Ensure `JWT_SECRET` is at least 32 characters
- Check token expiry configuration
- Verify database sessions are being created

### Database Errors
- Run `npx prisma migrate dev` to ensure schema is up-to-date
- Check `DATABASE_URL` connection string
- Verify Prisma client is generated: `npx prisma generate`

## Support

For questions or issues:
1. Check the logs: `npm run dev` shows detailed error messages
2. Check Sentry dashboard for production errors
3. Review Prisma schema: `/backend/src/prisma/schema.prisma`
4. Review middleware: `/backend/src/middleware/auth.middleware.ts`

---

**Module Status:** ✅ Complete
**Last Updated:** November 2025
**Dependencies:** Prisma, JWT, bcrypt, nodemailer, Sentry
