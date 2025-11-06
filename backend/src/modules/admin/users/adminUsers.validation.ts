import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';

/**
 * Admin User Management Validation Schemas
 * Used for validating admin user management API requests
 */

// User list query parameters (GET /api/admin/users)
export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  registrationDateFrom: z.coerce.date().optional(),
  registrationDateTo: z.coerce.date().optional(),
  sortBy: z.enum(['created_at', 'last_login_at', 'username', 'email']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// User ID parameter validation
export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

// Update user data schema (PUT /api/admin/users/:id)
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Must be a valid email address')
    .max(255, 'Email must be at most 255 characters')
    .optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  emailVerified: z.boolean().optional(),
  status: z.nativeEnum(UserStatus).optional(),
  timezone: z.string().max(50).optional(),
  locale: z.string().max(10).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

// Change user role schema (PUT /api/admin/users/:id/role)
export const changeUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters'),
});

// Manually verify email schema (POST /api/admin/users/:id/verify)
export const verifyUserEmailSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be at most 500 characters')
    .optional(),
});

// Suspend user schema (POST /api/admin/users/:id/suspend)
export const suspendUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must be at most 1000 characters'),
  durationDays: z
    .number()
    .int()
    .min(1, 'Suspension duration must be at least 1 day')
    .max(365, 'Suspension duration must be at most 365 days')
    .optional(),
  permanent: z.boolean().default(false),
});

// Ban user schema (POST /api/admin/users/:id/ban)
export const banUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must be at most 1000 characters'),
  permanent: z.boolean().default(true),
});

// Delete user schema (DELETE /api/admin/users/:id)
export const deleteUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason must be at most 1000 characters'),
  hardDelete: z.boolean().default(false),
});

// Activity query parameters (GET /api/admin/users/:id/activity)
export const getUserActivityQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['all', 'login', 'content', 'interaction']).default('all'),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

// Reports query parameters (GET /api/admin/users/:id/reports)
export const getUserReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'reviewing', 'resolved_violation', 'resolved_no_action', 'dismissed']).optional(),
});

// Bulk operations schema
export const bulkOperationSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required').max(100, 'Maximum 100 users at once'),
  action: z.enum(['export', 'change_status', 'delete']),
  status: z.nativeEnum(UserStatus).optional(),
  reason: z.string().min(10).max(1000).optional(),
});

// Type exports for TypeScript
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
export type VerifyUserEmailInput = z.infer<typeof verifyUserEmailSchema>;
export type SuspendUserInput = z.infer<typeof suspendUserSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type GetUserActivityQuery = z.infer<typeof getUserActivityQuerySchema>;
export type GetUserReportsQuery = z.infer<typeof getUserReportsQuerySchema>;
export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;
