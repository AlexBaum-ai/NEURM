import { Router } from 'express';
import CandidateSearchController from './candidateSearch.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { apiLimiter, strictLimiter } from '@/middleware/rateLimiter.middleware';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * Candidate search routes (Premium feature for company accounts)
 * All routes are prefixed with /api/v1/candidates
 */
const router = Router();
const candidateSearchController = new CandidateSearchController();

/**
 * @route   GET /api/v1/candidates/search
 * @desc    Search for candidates (company premium feature)
 * @access  Private (requires company account)
 * @rate    60 requests per hour
 * @query   {string} [query] - Text search query
 * @query   {string|string[]} [skills] - Skills filter
 * @query   {number} [experienceMin] - Minimum years of experience
 * @query   {number} [experienceMax] - Maximum years of experience
 * @query   {string|string[]} [models] - LLM models filter
 * @query   {string|string[]} [frameworks] - Frameworks filter
 * @query   {string} [location] - Location filter
 * @query   {string} [remotePreference] - Remote preference (remote, hybrid, on_site, any)
 * @query   {string} [availabilityStatus] - Availability status
 * @query   {number} [salaryMin] - Minimum salary expectation
 * @query   {number} [salaryMax] - Maximum salary expectation
 * @query   {string} [salaryCurrency] - Salary currency (EUR, USD, etc.)
 * @query   {string|string[]} [jobTypes] - Job type preferences
 * @query   {string} [operator=AND] - Boolean operator for filters (AND, OR)
 * @query   {string} [sortBy=match_score] - Sort by field
 * @query   {string} [sortOrder=desc] - Sort order (asc, desc)
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=20] - Results per page (max 100)
 */
router.get(
  '/search',
  authenticate,
  apiLimiter,
  asyncHandler(candidateSearchController.searchCandidates)
);

/**
 * @route   POST /api/v1/candidates/track-view
 * @desc    Track profile view (for "who viewed my profile" feature)
 * @access  Private (requires company account)
 * @rate    60 requests per hour
 * @body    {string} profileId - User ID of the profile being viewed
 */
router.post(
  '/track-view',
  authenticate,
  apiLimiter,
  asyncHandler(candidateSearchController.trackProfileView)
);

/**
 * @route   POST /api/v1/candidates/save-search
 * @desc    Save a candidate search with optional alerts
 * @access  Private (requires company account)
 * @rate    10 requests per hour
 * @body    {string} name - Search name
 * @body    {object} filters - Search filters as JSON
 * @body    {boolean} [notificationEnabled=false] - Enable notifications
 * @body    {string} [notificationFrequency=daily] - Notification frequency
 */
router.post(
  '/save-search',
  authenticate,
  strictLimiter,
  asyncHandler(candidateSearchController.saveSearch)
);

/**
 * @route   GET /api/v1/candidates/saved-searches
 * @desc    Get saved candidate searches for the current user
 * @access  Private (requires company account)
 * @rate    60 requests per hour
 */
router.get(
  '/saved-searches',
  authenticate,
  apiLimiter,
  asyncHandler(candidateSearchController.getSavedSearches)
);

/**
 * @route   DELETE /api/v1/candidates/saved-searches/:searchId
 * @desc    Delete a saved candidate search
 * @access  Private (requires company account)
 * @rate    60 requests per hour
 */
router.delete(
  '/saved-searches/:searchId',
  authenticate,
  apiLimiter,
  asyncHandler(candidateSearchController.deleteSavedSearch)
);

/**
 * @route   POST /api/v1/candidates/export
 * @desc    Export candidate list to CSV or JSON
 * @access  Private (requires company account)
 * @rate    10 requests per hour
 * @body    {string[]} candidateIds - Array of candidate user IDs
 * @body    {string} [format=csv] - Export format (csv, json)
 * @body    {string[]} [fields] - Fields to include in export
 */
router.post(
  '/export',
  authenticate,
  strictLimiter,
  asyncHandler(candidateSearchController.exportCandidates)
);

/**
 * @route   GET /api/v1/candidates/profile-viewers
 * @desc    Get who viewed my profile (for candidates)
 * @access  Private (for individual accounts)
 * @rate    60 requests per hour
 * @query   {number} [page=1] - Page number
 * @query   {number} [limit=20] - Results per page
 */
router.get(
  '/profile-viewers',
  authenticate,
  apiLimiter,
  asyncHandler(candidateSearchController.getProfileViewers)
);

export default router;
