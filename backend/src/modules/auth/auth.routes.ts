import { Router } from 'express';
import AuthController from './auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './validation/auth.validation';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user account
 * @access  Public (no auth, no CSRF)
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  asyncHandler(AuthController.register.bind(AuthController))
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public (no auth, no CSRF)
 */
router.post(
  '/login',
  validateRequest(loginSchema),
  asyncHandler(AuthController.login.bind(AuthController))
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private (requires authentication)
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(AuthController.logout.bind(AuthController))
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (no auth, no CSRF - uses refresh token)
 */
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  asyncHandler(AuthController.refresh.bind(AuthController))
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private (requires authentication)
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(AuthController.getMe.bind(AuthController))
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address with token
 * @access  Public (no auth - token in body)
 */
router.post(
  '/verify-email',
  validateRequest(verifyEmailSchema),
  asyncHandler(AuthController.verifyEmail.bind(AuthController))
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public (no auth)
 */
router.post(
  '/resend-verification',
  validateRequest(resendVerificationSchema),
  asyncHandler(AuthController.resendVerification.bind(AuthController))
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public (no auth, no CSRF)
 */
router.post(
  '/forgot-password',
  validateRequest(forgotPasswordSchema),
  asyncHandler(AuthController.forgotPassword.bind(AuthController))
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public (no auth - token in body)
 */
router.post(
  '/reset-password',
  validateRequest(resetPasswordSchema),
  asyncHandler(AuthController.resetPassword.bind(AuthController))
);

export default router;
