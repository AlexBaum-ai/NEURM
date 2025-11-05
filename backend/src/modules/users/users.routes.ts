import { Router } from 'express';
import UserController from './users.controller';
import SessionsController from './sessions.controller';
import EducationController from './education.controller';
import SkillsController from './skills.controller';
import WorkExperienceController from './workExperience.controller';
import PortfolioProjectController from './portfolio.controller';
import bookmarkRoutes from './bookmarks.routes';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import {
  profileUpdateLimiter,
  apiLimiter,
  accountSettingsLimiter,
} from '@/middleware/rateLimiter.middleware';
import { uploadRateLimiter } from '@/middleware/uploadRateLimiter.middleware';
import { asyncHandler } from '@/utils/asyncHandler';
import { avatarUpload, coverUpload } from '@/config/upload';

/**
 * User routes
 * All routes are prefixed with /api/v1/users
 */
const router = Router();
const userController = new UserController();
const sessionsController = new SessionsController();
const educationController = new EducationController();
const skillsController = new SkillsController();
const workExperienceController = new WorkExperienceController();
const portfolioController = new PortfolioProjectController();

// Mount bookmark routes under /me
router.use('/me', bookmarkRoutes);

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current authenticated user's profile
 * @access  Private (requires authentication)
 */
router.get(
  '/me',
  authenticate,
  apiLimiter,
  asyncHandler(userController.getCurrentUser)
);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user's profile
 * @access  Private (requires authentication)
 * @rate    10 requests per hour
 */
router.patch(
  '/me',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(userController.updateCurrentUser)
);

/**
 * FILE UPLOAD ROUTES
 */

/**
 * @route   POST /api/v1/users/me/avatar
 * @desc    Upload avatar image
 * @access  Private (requires authentication)
 * @rate    5 uploads per hour
 */
router.post(
  '/me/avatar',
  authenticate,
  uploadRateLimiter,
  avatarUpload.single('avatar'),
  asyncHandler(userController.uploadAvatar)
);

/**
 * @route   POST /api/v1/users/me/cover
 * @desc    Upload cover image
 * @access  Private (requires authentication)
 * @rate    5 uploads per hour
 */
router.post(
  '/me/cover',
  authenticate,
  uploadRateLimiter,
  coverUpload.single('cover'),
  asyncHandler(userController.uploadCover)
);

/**
 * PRIVACY SETTINGS ROUTES
 */

/**
 * @route   GET /api/v1/users/me/privacy
 * @desc    Get current user's privacy settings
 * @access  Private (requires authentication)
 */
router.get(
  '/me/privacy',
  authenticate,
  apiLimiter,
  asyncHandler(userController.getPrivacySettings)
);

/**
 * @route   PATCH /api/v1/users/me/privacy
 * @desc    Update current user's privacy settings
 * @access  Private (requires authentication)
 * @rate    10 requests per hour
 */
router.patch(
  '/me/privacy',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(userController.updatePrivacySettings)
);

/**
 * SESSION MANAGEMENT ROUTES
 */

/**
 * @route   GET /api/v1/users/me/sessions
 * @desc    Get all active sessions for the current user
 * @access  Private (requires authentication)
 */
router.get(
  '/me/sessions',
  authenticate,
  apiLimiter,
  asyncHandler(sessionsController.getUserSessions)
);

/**
 * @route   DELETE /api/v1/users/me/sessions/:id
 * @desc    Revoke a specific session
 * @access  Private (requires authentication)
 */
router.delete(
  '/me/sessions/:id',
  authenticate,
  apiLimiter,
  asyncHandler(sessionsController.revokeSession)
);

/**
 * @route   POST /api/v1/users/me/sessions/revoke-all
 * @desc    Revoke all sessions except the current one
 * @access  Private (requires authentication)
 */
router.post(
  '/me/sessions/revoke-all',
  authenticate,
  apiLimiter,
  asyncHandler(sessionsController.revokeAllSessions)
);

/**
 * EDUCATION MANAGEMENT ROUTES
 */

/**
 * @route   GET /api/v1/users/me/education
 * @desc    Get all education entries for the current user
 * @access  Private (requires authentication)
 */
router.get(
  '/me/education',
  authenticate,
  apiLimiter,
  asyncHandler(educationController.getEducationList)
);

/**
 * @route   POST /api/v1/users/me/education
 * @desc    Create a new education entry
 * @access  Private (requires authentication)
 */
router.post(
  '/me/education',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(educationController.createEducation)
);

/**
 * @route   PUT /api/v1/users/me/education/:id
 * @desc    Update an education entry
 * @access  Private (requires authentication)
 */
router.put(
  '/me/education/:id',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(educationController.updateEducation)
);

/**
 * @route   DELETE /api/v1/users/me/education/:id
 * @desc    Delete an education entry
 * @access  Private (requires authentication)
 */
router.delete(
  '/me/education/:id',
  authenticate,
  apiLimiter,
  asyncHandler(educationController.deleteEducation)
);

/**
 * SKILLS MANAGEMENT ROUTES
 */

/**
 * @route   GET /api/v1/users/me/skills/autocomplete
 * @desc    Get popular skills for autocomplete (must be before /:id route)
 * @access  Private (requires authentication)
 */
router.get(
  '/me/skills/autocomplete',
  authenticate,
  apiLimiter,
  asyncHandler(skillsController.autocompleteSkills)
);

/**
 * @route   GET /api/v1/users/me/skills
 * @desc    Get all skills for the current user
 * @access  Private (requires authentication)
 */
router.get(
  '/me/skills',
  authenticate,
  apiLimiter,
  asyncHandler(skillsController.getUserSkills)
);

/**
 * @route   POST /api/v1/users/me/skills
 * @desc    Create a new skill for the current user
 * @access  Private (requires authentication)
 */
router.post(
  '/me/skills',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(skillsController.createSkill)
);

/**
 * @route   PATCH /api/v1/users/me/skills/:id
 * @desc    Update skill proficiency
 * @access  Private (requires authentication)
 */
router.patch(
  '/me/skills/:id',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(skillsController.updateSkill)
);

/**
 * @route   DELETE /api/v1/users/me/skills/:id
 * @desc    Delete a skill
 * @access  Private (requires authentication)
 */
router.delete(
  '/me/skills/:id',
  authenticate,
  apiLimiter,
  asyncHandler(skillsController.deleteSkill)
);

/**
 * ACCOUNT SETTINGS ROUTES
 */

/**
 * @route   PATCH /api/v1/users/me/email
 * @desc    Request email change (sends verification email)
 * @access  Private (requires authentication)
 * @rate    3 requests per hour
 */
router.patch(
  '/me/email',
  authenticate,
  accountSettingsLimiter,
  asyncHandler(userController.requestEmailChange)
);

/**
 * @route   PATCH /api/v1/users/me/password
 * @desc    Change user password
 * @access  Private (requires authentication)
 * @rate    3 requests per hour
 */
router.patch(
  '/me/password',
  authenticate,
  accountSettingsLimiter,
  asyncHandler(userController.changePassword)
);

/**
 * @route   DELETE /api/v1/users/me
 * @desc    Delete user account (soft delete with 30-day grace period)
 * @access  Private (requires authentication)
 * @rate    3 requests per hour
 */
router.delete(
  '/me',
  authenticate,
  accountSettingsLimiter,
  asyncHandler(userController.deleteAccount)
);

/**
 * @route   GET /api/v1/users/me/data-export
 * @desc    Export all user data for GDPR compliance
 * @access  Private (requires authentication)
 */
router.get(
  '/me/data-export',
  authenticate,
  apiLimiter,
  asyncHandler(userController.exportUserData)
);

/**
 * WORK EXPERIENCE MANAGEMENT ROUTES
 */

/**
 * @route   GET /api/v1/users/me/work-experience
 * @desc    Get all work experience entries for the current user
 * @access  Private (requires authentication)
 */
router.get(
  '/me/work-experience',
  authenticate,
  apiLimiter,
  asyncHandler(workExperienceController.getWorkExperiences)
);

/**
 * @route   POST /api/v1/users/me/work-experience
 * @desc    Create a new work experience entry
 * @access  Private (requires authentication)
 */
router.post(
  '/me/work-experience',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(workExperienceController.createWorkExperience)
);

/**
 * @route   PUT /api/v1/users/me/work-experience/:id
 * @desc    Update a work experience entry
 * @access  Private (requires authentication)
 */
router.put(
  '/me/work-experience/:id',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(workExperienceController.updateWorkExperience)
);

/**
 * @route   DELETE /api/v1/users/me/work-experience/:id
 * @desc    Delete a work experience entry
 * @access  Private (requires authentication)
 */
router.delete(
  '/me/work-experience/:id',
  authenticate,
  apiLimiter,
  asyncHandler(workExperienceController.deleteWorkExperience)
);

/**
 * PORTFOLIO PROJECTS MANAGEMENT ROUTES
 */

/**
 * @route   GET /api/v1/users/me/portfolio/stats
 * @desc    Get portfolio statistics (must be before /:id route)
 * @access  Private (requires authentication)
 */
router.get(
  '/me/portfolio/stats',
  authenticate,
  apiLimiter,
  asyncHandler(portfolioController.getPortfolioStats)
);

/**
 * @route   GET /api/v1/users/me/portfolio
 * @desc    Get all portfolio projects for the current user
 * @access  Private (requires authentication)
 */
router.get(
  '/me/portfolio',
  authenticate,
  apiLimiter,
  asyncHandler(portfolioController.getPortfolioProjects)
);

/**
 * @route   POST /api/v1/users/me/portfolio
 * @desc    Create a new portfolio project
 * @access  Private (requires authentication)
 */
router.post(
  '/me/portfolio',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(portfolioController.createPortfolioProject)
);

/**
 * @route   GET /api/v1/users/me/portfolio/:id
 * @desc    Get a specific portfolio project
 * @access  Private (requires authentication)
 */
router.get(
  '/me/portfolio/:id',
  authenticate,
  apiLimiter,
  asyncHandler(portfolioController.getPortfolioProject)
);

/**
 * @route   PUT /api/v1/users/me/portfolio/:id
 * @desc    Update a portfolio project
 * @access  Private (requires authentication)
 */
router.put(
  '/me/portfolio/:id',
  authenticate,
  profileUpdateLimiter,
  asyncHandler(portfolioController.updatePortfolioProject)
);

/**
 * @route   DELETE /api/v1/users/me/portfolio/:id
 * @desc    Delete a portfolio project
 * @access  Private (requires authentication)
 */
router.delete(
  '/me/portfolio/:id',
  authenticate,
  apiLimiter,
  asyncHandler(portfolioController.deletePortfolioProject)
);

/**
 * @route   GET /api/v1/users/:username
 * @desc    Get public user profile by username
 * @access  Public (optional authentication for privacy settings)
 */
router.get(
  '/:username',
  optionalAuth,
  apiLimiter,
  asyncHandler(userController.getUserByUsername)
);

export default router;
