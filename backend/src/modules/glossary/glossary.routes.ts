import { Router } from 'express';
import glossaryController from './glossary.controller';
import { authenticate, requireAdmin } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/asyncHandler.middleware';

const router = Router();

/**
 * Public routes
 */

// GET /api/v1/glossary - Get all glossary terms (A-Z)
router.get('/', asyncHandler(glossaryController.getAllTerms));

// GET /api/v1/glossary/search - Search glossary terms
router.get('/search', asyncHandler(glossaryController.searchTerms));

// GET /api/v1/glossary/popular - Get popular glossary terms
router.get('/popular', asyncHandler(glossaryController.getPopularTerms));

// GET /api/v1/glossary/categories - Get all categories with counts
router.get('/categories', asyncHandler(glossaryController.getCategories));

// GET /api/v1/glossary/index - Get alphabetical index (A-Z)
router.get('/index', asyncHandler(glossaryController.getAlphabeticalIndex));

// GET /api/v1/glossary/:slug - Get glossary term details by slug
router.get('/:slug', asyncHandler(glossaryController.getTermBySlug));

/**
 * Protected routes (Admin only)
 */

// POST /api/v1/glossary - Create a new glossary term
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(glossaryController.createTerm)
);

// PUT /api/v1/glossary/:id - Update a glossary term
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(glossaryController.updateTerm)
);

// DELETE /api/v1/glossary/:id - Delete a glossary term
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(glossaryController.deleteTerm)
);

export default router;
