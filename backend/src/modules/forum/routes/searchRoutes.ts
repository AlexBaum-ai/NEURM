import { Router } from 'express';
import { container } from 'tsyringe';
import { SearchController } from '../controllers/SearchController';
import { authenticate, optionalAuth } from '@/middleware/auth.middleware';
import { createRateLimiter } from '@/middleware/rateLimiter.middleware';

/**
 * Forum Search Routes
 * Defines all routes for forum search API endpoints
 *
 * Public Routes (with optional auth):
 * - GET /api/forum/search - Search topics and replies
 * - GET /api/forum/search/suggest - Get autocomplete suggestions
 * - GET /api/forum/search/popular - Get popular queries
 *
 * Authenticated Routes:
 * - GET /api/forum/search/history - Get search history
 * - DELETE /api/forum/search/history - Clear search history
 * - DELETE /api/forum/search/history/:id - Delete specific history entry
 * - POST /api/forum/search/saved - Create saved search
 * - GET /api/forum/search/saved - Get saved searches
 * - GET /api/forum/search/saved/:id - Get specific saved search
 * - PATCH /api/forum/search/saved/:id - Update saved search
 * - DELETE /api/forum/search/saved/:id - Delete saved search
 */

const router = Router();
const controller = container.resolve(SearchController);

// ============================================================================
// RATE LIMITERS
// ============================================================================

// Search limiter: 60 searches per minute
const searchLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many search requests, please try again later',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

// Suggestions limiter: 100 requests per minute
const suggestionsLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many autocomplete requests, please try again later',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous',
});

// Saved search limiter: 20 operations per minute
const savedSearchLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: 'Too many requests, please try again later',
  keyGenerator: (req) => req.user?.id || 'anonymous',
});

// ============================================================================
// SEARCH ROUTES
// ============================================================================

/**
 * @route   GET /api/forum/search
 * @desc    Search topics and replies with filters
 * @access  Public (with optional auth for history tracking)
 * @query   {
 *   query: string (required),
 *   categoryId?: string,
 *   type?: string[], // comma-separated
 *   status?: string[], // comma-separated
 *   dateFrom?: ISO date string,
 *   dateTo?: ISO date string,
 *   hasCode?: boolean,
 *   minUpvotes?: number,
 *   authorId?: string,
 *   sortBy?: 'relevance' | 'date' | 'popularity' | 'votes',
 *   sortOrder?: 'asc' | 'desc',
 *   page?: number,
 *   limit?: number (max 100)
 * }
 */
router.get('/', optionalAuth, searchLimiter, controller.search);

/**
 * @route   GET /api/forum/search/suggest
 * @desc    Get autocomplete suggestions for search query
 * @access  Public (with optional auth for personalized suggestions)
 * @query   {
 *   query: string (min 2 chars),
 *   limit?: number (max 20)
 * }
 */
router.get('/suggest', optionalAuth, suggestionsLimiter, controller.getSuggestions);

/**
 * @route   GET /api/forum/search/popular
 * @desc    Get popular search queries (last 30 days)
 * @access  Public
 * @query   {
 *   limit?: number (max 20)
 * }
 */
router.get('/popular', controller.getPopularQueries);

// ============================================================================
// SEARCH HISTORY ROUTES (Authenticated)
// ============================================================================

/**
 * @route   GET /api/forum/search/history
 * @desc    Get user's search history (last 10)
 * @access  Private
 * @query   {
 *   limit?: number (max 50)
 * }
 */
router.get('/history', authenticate, controller.getSearchHistory);

/**
 * @route   DELETE /api/forum/search/history
 * @desc    Clear all search history for user
 * @access  Private
 */
router.delete('/history', authenticate, controller.clearSearchHistory);

/**
 * @route   DELETE /api/forum/search/history/:id
 * @desc    Delete a specific search history entry
 * @access  Private
 * @param   id - Search history entry ID
 */
router.delete('/history/:id', authenticate, controller.deleteSearchHistoryEntry);

// ============================================================================
// SAVED SEARCHES ROUTES (Authenticated)
// ============================================================================

/**
 * @route   POST /api/forum/search/saved
 * @desc    Save a search for quick access
 * @access  Private
 * @body    {
 *   name: string (required),
 *   query: string (required),
 *   filters?: {
 *     categoryId?: string,
 *     type?: string[],
 *     status?: string[],
 *     dateFrom?: ISO date string,
 *     dateTo?: ISO date string,
 *     hasCode?: boolean,
 *     minUpvotes?: number,
 *     authorId?: string
 *   }
 * }
 */
router.post('/saved', authenticate, savedSearchLimiter, controller.createSavedSearch);

/**
 * @route   GET /api/forum/search/saved
 * @desc    Get all saved searches for user
 * @access  Private
 */
router.get('/saved', authenticate, controller.getSavedSearches);

/**
 * @route   GET /api/forum/search/saved/:id
 * @desc    Get a specific saved search
 * @access  Private
 * @param   id - Saved search ID
 */
router.get('/saved/:id', authenticate, controller.getSavedSearch);

/**
 * @route   PATCH /api/forum/search/saved/:id
 * @desc    Update a saved search
 * @access  Private
 * @param   id - Saved search ID
 * @body    {
 *   name?: string,
 *   query?: string,
 *   filters?: object
 * }
 */
router.patch('/saved/:id', authenticate, savedSearchLimiter, controller.updateSavedSearch);

/**
 * @route   DELETE /api/forum/search/saved/:id
 * @desc    Delete a saved search
 * @access  Private
 * @param   id - Saved search ID
 */
router.delete('/saved/:id', authenticate, controller.deleteSavedSearch);

export default router;
