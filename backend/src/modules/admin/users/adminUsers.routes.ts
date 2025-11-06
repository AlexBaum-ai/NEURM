import { Router } from 'express';
import AdminUsersController from './adminUsers.controller';
import { authenticate, requireAdmin } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';

/**
 * Admin Users Routes
 * All routes require admin authentication
 */
const router = Router();
const controller = new AdminUsersController();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated list of users with filters and search
 * @access  Admin
 * @query   page, limit, search, role, status, registrationDateFrom, registrationDateTo, sortBy, sortOrder
 */
router.get('/', asyncHandler(controller.getUsers));

/**
 * @route   POST /api/admin/users/bulk
 * @desc    Perform bulk operations on users (export, change status, delete)
 * @access  Admin
 * @body    { userIds: string[], action: 'export' | 'change_status' | 'delete', status?, reason? }
 */
router.post('/bulk', asyncHandler(controller.bulkOperation));

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get full user profile including private data
 * @access  Admin
 * @param   id - User UUID
 */
router.get('/:id', asyncHandler(controller.getUserById));

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user data (email, username, status, etc.)
 * @access  Admin
 * @param   id - User UUID
 * @body    { email?, username?, emailVerified?, status?, timezone?, locale? }
 */
router.put('/:id', asyncHandler(controller.updateUser));

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Change user role
 * @access  Admin
 * @param   id - User UUID
 * @body    { role: UserRole, reason: string }
 */
router.put('/:id/role', asyncHandler(controller.changeUserRole));

/**
 * @route   POST /api/admin/users/:id/verify
 * @desc    Manually verify user email
 * @access  Admin
 * @param   id - User UUID
 * @body    { reason?: string }
 */
router.post('/:id/verify', asyncHandler(controller.verifyUserEmail));

/**
 * @route   POST /api/admin/users/:id/suspend
 * @desc    Suspend user account with reason and duration
 * @access  Admin
 * @param   id - User UUID
 * @body    { reason: string, durationDays?: number, permanent?: boolean }
 */
router.post('/:id/suspend', asyncHandler(controller.suspendUser));

/**
 * @route   POST /api/admin/users/:id/ban
 * @desc    Ban user account permanently
 * @access  Admin
 * @param   id - User UUID
 * @body    { reason: string, permanent?: boolean }
 */
router.post('/:id/ban', asyncHandler(controller.banUser));

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user account (soft delete by default)
 * @access  Admin
 * @param   id - User UUID
 * @body    { reason: string, hardDelete?: boolean }
 */
router.delete('/:id', asyncHandler(controller.deleteUser));

/**
 * @route   GET /api/admin/users/:id/activity
 * @desc    Get user activity history
 * @access  Admin
 * @param   id - User UUID
 * @query   page, limit, type (all | login | content | interaction), dateFrom, dateTo
 */
router.get('/:id/activity', asyncHandler(controller.getUserActivity));

/**
 * @route   GET /api/admin/users/:id/reports
 * @desc    Get reports against user
 * @access  Admin
 * @param   id - User UUID
 * @query   page, limit, status (pending | reviewing | resolved_violation | resolved_no_action | dismissed)
 */
router.get('/:id/reports', asyncHandler(controller.getUserReports));

export default router;
