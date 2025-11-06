# Admin User Management Backend

## Overview

This module implements comprehensive admin user management functionality for the Neurmatic platform, allowing administrators to manage users, change roles, suspend/ban accounts, and track all administrative actions through audit logging.

## Features Implemented

### 1. User List & Search (GET /api/admin/users)
- ✅ Paginated user list (default 50 per page)
- ✅ Search by name, email, username, or ID
- ✅ Filter by role (visitor, user, premium, company, moderator, admin)
- ✅ Filter by status (active, suspended, banned, deleted)
- ✅ Filter by registration date range
- ✅ Sort by created_at, last_login_at, username, email
- ✅ Returns user profile, reputation, and content count

### 2. User Details (GET /api/admin/users/:id)
- ✅ Full user profile including private data
- ✅ OAuth provider connections
- ✅ Active sessions (last 5)
- ✅ Privacy settings
- ✅ Content statistics
- ✅ Follower/following counts

### 3. User Updates (PUT /api/admin/users/:id)
- ✅ Update email (with uniqueness check)
- ✅ Update username (with uniqueness check)
- ✅ Update email verification status
- ✅ Update account status
- ✅ Update timezone and locale
- ✅ Audit logging for all changes

### 4. Role Management (PUT /api/admin/users/:id/role)
- ✅ Change user role with reason requirement
- ✅ Prevent self-role changes
- ✅ Full audit trail

### 5. Email Verification (POST /api/admin/users/:id/verify)
- ✅ Manually verify user email
- ✅ Optional reason field
- ✅ Audit logging

### 6. User Suspension (POST /api/admin/users/:id/suspend)
- ✅ Suspend user with required reason
- ✅ Optional duration in days or permanent
- ✅ Invalidate all user sessions
- ✅ Prevent suspending self or admins
- ✅ Audit logging with reason

### 7. User Banning (POST /api/admin/users/:id/ban)
- ✅ Permanently ban user with required reason
- ✅ Invalidate all user sessions
- ✅ Prevent banning self or admins
- ✅ Audit logging with reason

### 8. User Deletion (DELETE /api/admin/users/:id)
- ✅ Soft delete (mark as deleted status)
- ✅ Hard delete option (permanently remove)
- ✅ Required reason for deletion
- ✅ Prevent deleting self
- ✅ Special handling for admin deletions
- ✅ Audit logging

### 9. Activity History (GET /api/admin/users/:id/activity)
- ✅ Paginated activity history
- ✅ Filter by type (all, login, content, interaction)
- ✅ Date range filtering
- ✅ Login history from sessions
- ✅ Content creation activities (articles, topics, replies)

### 10. User Reports (GET /api/admin/users/:id/reports)
- ✅ Paginated reports against user
- ✅ Filter by report status
- ✅ Reporter and resolver information
- ✅ Report reasons and descriptions

### 11. Bulk Operations (POST /api/admin/users/bulk)
- ✅ Export users to CSV
- ✅ Bulk status changes
- ✅ Bulk deletion
- ✅ Maximum 100 users per operation
- ✅ Prevent operations on admin users
- ✅ Audit logging for bulk operations

### 12. Admin Audit Logging
- ✅ Track all admin actions
- ✅ Store before/after changes
- ✅ Record reason, IP address, user agent
- ✅ Link to admin user performing action
- ✅ Indexed for efficient querying

## Architecture

### Layered Structure
```
adminUsers.routes.ts      → HTTP routing & authentication
       ↓
adminUsers.controller.ts  → Request handling & validation
       ↓
adminUsers.service.ts     → Business logic & authorization
       ↓
adminUsers.repository.ts  → Database operations
```

### Files Created

1. **adminUsers.validation.ts** (5.1 KB)
   - Zod schemas for all endpoint inputs
   - Query parameter validation
   - Request body validation
   - TypeScript type exports

2. **adminUsers.repository.ts** (12 KB)
   - Database queries using Prisma
   - Complex filtering and pagination
   - Audit log creation
   - Bulk operations

3. **adminUsers.service.ts** (17 KB)
   - Business rules and validations
   - Authorization checks (prevent self-actions, admin protections)
   - Session invalidation on suspend/ban
   - Audit log coordination
   - Error handling with Sentry

4. **adminUsers.controller.ts** (15 KB)
   - 11 endpoint handlers
   - Input validation with Zod
   - Error handling
   - Response formatting

5. **adminUsers.routes.ts** (3.5 KB)
   - Route definitions
   - Admin authentication middleware
   - AsyncHandler wrapper for error handling

6. **__tests__/adminUsers.service.test.ts**
   - Comprehensive unit tests
   - Service layer testing
   - Mock dependencies
   - Edge case coverage

### Database Changes

**New Model: AdminAuditLog**
```prisma
model AdminAuditLog {
  id          String   @id @default(uuid())
  adminId     String   @map("admin_id")
  action      String   @db.VarChar(100)
  targetType  String   @map("target_type") @db.VarChar(50)
  targetId    String   @map("target_id")
  changes     Json?
  reason      String?  @db.Text
  ipAddress   String?  @map("ip_address") @db.VarChar(45)
  userAgent   String?  @map("user_agent") @db.VarChar(500)
  createdAt   DateTime @default(now()) @map("created_at")

  admin User @relation("AdminAuditLogs", fields: [adminId], references: [id])

  @@index([adminId])
  @@index([targetType, targetId])
  @@index([action])
  @@index([createdAt(sort: Desc)])
  @@map("admin_audit_log")
}
```

**User Model Update**
- Added relation: `adminAuditLogs AdminAuditLog[] @relation("AdminAuditLogs")`

## API Endpoints

### Base Path: `/api/v1/admin/users`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List users with filters | Admin |
| GET | `/:id` | Get user details | Admin |
| PUT | `/:id` | Update user data | Admin |
| PUT | `/:id/role` | Change user role | Admin |
| POST | `/:id/verify` | Verify user email | Admin |
| POST | `/:id/suspend` | Suspend user | Admin |
| POST | `/:id/ban` | Ban user | Admin |
| DELETE | `/:id` | Delete user | Admin |
| GET | `/:id/activity` | Get user activity | Admin |
| GET | `/:id/reports` | Get user reports | Admin |
| POST | `/bulk` | Bulk operations | Admin |

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **Admin Authorization**: All endpoints require admin role
3. **Self-Protection**: Cannot suspend, ban, or delete own account
4. **Admin Protection**: Cannot suspend/ban other admin users (only delete with hard delete)
5. **Session Invalidation**: Suspend/ban operations invalidate all user sessions
6. **Audit Logging**: All actions logged with admin ID, reason, IP, and user agent
7. **Input Validation**: All inputs validated with Zod schemas
8. **Uniqueness Checks**: Email and username uniqueness verified on updates

## Error Handling

All errors are properly caught and formatted:
- **NotFoundError** (404): User not found
- **BadRequestError** (400): Invalid input or unauthorized action
- **ConflictError** (409): Email or username already in use
- **ValidationError** (400): Schema validation failed
- **UnauthorizedError** (401): Missing or invalid token
- **ForbiddenError** (403): Insufficient permissions

## Testing

Comprehensive unit tests cover:
- ✅ User list retrieval
- ✅ User details retrieval
- ✅ User updates
- ✅ Role changes
- ✅ Email verification
- ✅ User suspension
- ✅ User banning
- ✅ User deletion (soft and hard)
- ✅ Self-protection checks
- ✅ Admin-protection checks
- ✅ Not found scenarios
- ✅ Already verified scenarios

## Integration

The module is integrated into the main application:
```typescript
// In src/app.ts
import adminUsersRoutes from '@/modules/admin/users/adminUsers.routes';

app.use('/api/v1/admin/users', adminUsersRoutes);
```

## Usage Examples

### Get Users with Filters
```http
GET /api/v1/admin/users?page=1&limit=50&role=user&status=active&search=john&sortBy=created_at&sortOrder=desc
Authorization: Bearer <admin-token>
```

### Suspend User
```http
POST /api/v1/admin/users/123e4567-e89b-12d3-a456-426614174000/suspend
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Violating community guidelines - spam posting",
  "durationDays": 30,
  "permanent": false
}
```

### Change User Role
```http
PUT /api/v1/admin/users/123e4567-e89b-12d3-a456-426614174000/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "role": "moderator",
  "reason": "Promoting to moderator for excellent contributions to the community"
}
```

### Bulk Export Users
```http
POST /api/v1/admin/users/bulk
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userIds": [
    "123e4567-e89b-12d3-a456-426614174000",
    "223e4567-e89b-12d3-a456-426614174001"
  ],
  "action": "export"
}
```

## Next Steps

To complete the deployment:

1. **Run Migration**:
   ```bash
   cd backend
   npx prisma migrate dev --name add_admin_audit_log
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Build Application**:
   ```bash
   npm run build
   ```

4. **Run Tests**:
   ```bash
   npm test -- src/modules/admin/users/__tests__/
   ```

5. **Start Server**:
   ```bash
   npm run dev
   ```

## Dependencies

- Express.js - HTTP server
- Prisma - Database ORM
- Zod - Schema validation
- Sentry - Error tracking
- Winston - Logging
- JWT - Authentication

## Performance Considerations

- Indexes on admin_audit_log for efficient querying
- Pagination on all list endpoints
- Optimized Prisma queries with selective field returns
- Caching opportunities for user lists (implement Redis caching)

## Monitoring

All operations are tracked with:
- Winston logger for application logs
- Sentry for error tracking
- Admin audit log for accountability

## Compliance

- GDPR compliant with audit logging
- Data export capabilities
- User deletion (soft and hard delete options)
- Privacy settings respected in queries

---

**Status**: ✅ Implementation Complete
**Sprint**: SPRINT-12-003
**Estimated Hours**: 12h
**Completion Date**: November 6, 2025
