# Migration Guide: Admin Audit Log

## Overview

This migration adds the `admin_audit_log` table to track all administrative actions on the platform.

## Migration Steps

### 1. Create Migration

```bash
cd backend
npx prisma migrate dev --name add_admin_audit_log
```

This will:
- Create the `admin_audit_log` table
- Add the relation to the `users` table
- Create all necessary indexes

### 2. Verify Migration

Check the generated SQL:
```bash
cat src/prisma/migrations/YYYYMMDDHHMMSS_add_admin_audit_log/migration.sql
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

This regenerates the Prisma Client with the new `AdminAuditLog` model.

### 4. Run Tests

```bash
npm test -- src/modules/admin/users/__tests__/
```

### 5. Verify TypeScript Compilation

```bash
npm run type-check
```

## Database Schema Changes

### New Table: admin_audit_log

```sql
CREATE TABLE "admin_audit_log" (
  "id" TEXT NOT NULL,
  "admin_id" TEXT NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "target_type" VARCHAR(50) NOT NULL,
  "target_id" TEXT NOT NULL,
  "changes" JSONB,
  "reason" TEXT,
  "ip_address" VARCHAR(45),
  "user_agent" VARCHAR(500),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_log_admin_id_idx" ON "admin_audit_log"("admin_id");
CREATE INDEX "admin_audit_log_target_type_target_id_idx" ON "admin_audit_log"("target_type", "target_id");
CREATE INDEX "admin_audit_log_action_idx" ON "admin_audit_log"("action");
CREATE INDEX "admin_audit_log_created_at_idx" ON "admin_audit_log"("created_at" DESC);

ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Rollback

If you need to rollback:

```bash
# Rollback the migration
npx prisma migrate resolve --rolled-back YYYYMMDDHHMMSS_add_admin_audit_log

# Or manually drop the table
psql $DATABASE_URL -c "DROP TABLE IF EXISTS admin_audit_log CASCADE;"
```

## Testing the Integration

### 1. Start the Server

```bash
npm run dev
```

### 2. Test Endpoints

Create an admin user if you don't have one:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@example.com';
```

Get an admin JWT token (login with admin account), then test:

```bash
# List users
curl -X GET http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Get user details
curl -X GET http://localhost:3000/api/v1/admin/users/{USER_ID} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update user
curl -X PUT http://localhost:3000/api/v1/admin/users/{USER_ID} \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emailVerified": true}'

# Check audit log
psql $DATABASE_URL -c "SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 5;"
```

## Common Issues

### Issue 1: Prisma Client Not Generated
**Solution**: Run `npx prisma generate` again

### Issue 2: TypeScript Errors
**Solution**: Restart your IDE/editor to reload TypeScript definitions

### Issue 3: Migration Already Applied
**Solution**: Use `npx prisma migrate resolve --applied <migration-name>`

### Issue 4: Database Connection Issues
**Solution**: Check DATABASE_URL in .env file

## Verification Checklist

- [ ] Migration applied successfully
- [ ] Prisma Client generated
- [ ] TypeScript compiles without errors
- [ ] Tests pass
- [ ] Server starts without errors
- [ ] Admin endpoints accessible (with admin auth)
- [ ] Non-admin users cannot access admin endpoints
- [ ] Audit logs are created for admin actions
- [ ] Indexes are present on admin_audit_log table

## Production Deployment

When deploying to production:

1. **Backup Database**:
   ```bash
   pg_dump $DATABASE_URL > backup_before_admin_audit.sql
   ```

2. **Run Migration**:
   ```bash
   npx prisma migrate deploy
   ```

3. **Verify**:
   ```bash
   psql $DATABASE_URL -c "\d admin_audit_log"
   ```

4. **Monitor**:
   - Check Sentry for any errors
   - Monitor API response times
   - Verify audit logs are being created

## Support

If you encounter issues:
1. Check the logs: `tail -f logs/app.log`
2. Check Sentry dashboard
3. Verify database connection
4. Check admin authentication middleware

---

**Migration Created**: November 6, 2025
**Sprint**: SPRINT-12-003
