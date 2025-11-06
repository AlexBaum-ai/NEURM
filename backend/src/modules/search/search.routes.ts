/**
 * Search Routes
 *
 * API routes for universal search functionality
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Initialize search module
const searchRepository = new SearchRepository(prisma);
const searchService = new SearchService(searchRepository);
const searchController = new SearchController(searchService);

/**
 * Universal search
 * GET /api/search
 * Query params: q, type, sort, page, limit
 *
 * @example
 * GET /api/search?q=GPT&type=articles,jobs&sort=relevance&page=1&limit=20
 */
router.get('/', optionalAuth, searchController.search);

/**
 * Autocomplete suggestions
 * GET /api/search/suggest
 * Query params: q
 *
 * @example
 * GET /api/search/suggest?q=GPT
 */
router.get('/suggest', searchController.suggest);

/**
 * Get search history
 * GET /api/search/history
 * Requires authentication
 *
 * @example
 * GET /api/search/history
 */
router.get('/history', authenticate, searchController.getHistory);

/**
 * Get popular searches
 * GET /api/search/popular
 *
 * @example
 * GET /api/search/popular
 */
router.get('/popular', searchController.getPopularSearches);

/**
 * Get saved searches
 * GET /api/search/saved
 * Requires authentication
 *
 * @example
 * GET /api/search/saved
 */
router.get('/saved', authenticate, searchController.getSavedSearches);

/**
 * Save search
 * POST /api/search/saved
 * Requires authentication
 * Body: { name, query, contentTypes?, sortBy?, notificationEnabled? }
 *
 * @example
 * POST /api/search/saved
 * { "name": "My Search", "query": "GPT-4", "contentTypes": ["articles", "jobs"] }
 */
router.post('/saved', authenticate, searchController.saveSearch);

/**
 * Delete saved search
 * DELETE /api/search/saved/:searchId
 * Requires authentication
 *
 * @example
 * DELETE /api/search/saved/123e4567-e89b-12d3-a456-426614174000
 */
router.delete('/saved/:searchId', authenticate, searchController.deleteSavedSearch);

export default router;
