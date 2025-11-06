// IMPORTANT: Sentry must be imported first
import './instrument';

import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import env from '@/config/env';

// Middleware imports
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.middleware';
import { enforceHttps, helmetConfig, securityHeaders, requestId } from '@/middleware/security.middleware';
import { setCsrfToken, verifyCsrfToken, getCsrfToken } from '@/middleware/csrf.middleware';
import { sanitizeBody, sanitizeQuery } from '@/middleware/sanitization.middleware';
import { apiLimiter } from '@/middleware/rateLimiter.middleware';
import performanceMonitoringMiddleware from '@/middleware/performance-monitoring.middleware';

// Router imports
import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/users/users.routes';
import articleRoutes from '@/modules/news/articles.routes';
import newsRoutes from '@/modules/news/news.routes';
import rssRoutes from '@/modules/news/rss.routes';
import analyticsRoutes from '@/modules/analytics/analytics.routes';
import modelRoutes from '@/modules/models/models.routes';
import glossaryRoutes from '@/modules/glossary/glossary.routes';
import useCaseRoutes from '@/modules/use-cases/useCase.routes';
import mediaRoutes from '@/modules/media/media.routes';
import folderRoutes from '@/modules/media/folder.routes';
import forumRoutes from '@/modules/forum/routes';
import { reputationRoutes, userBadgeRoutes } from '@/modules/forum';
import messagingRoutes from '@/modules/messaging/messaging.routes';
import bulkMessagingRoutes from '@/modules/messaging/bulkMessaging.routes';
import notificationRoutes from '@/modules/notifications/notifications.routes';
import jobRoutes from '@/modules/jobs/jobs.routes';
import companyRoutes from '@/modules/jobs/company.routes';
import applicationRoutes from '@/modules/jobs/application.routes';
import atsRoutes from '@/modules/jobs/ats.routes';
import candidateSearchRoutes from '@/modules/jobs/candidateSearch.routes';
import profilesRoutes from '@/modules/profiles/profiles.routes';
import searchRoutes from '@/modules/search/search.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';
import recommendationsRoutes from '@/modules/recommendations/recommendations.routes';
import {
  createFollowsRoutes,
  createUserFollowsRoutes,
  createEntityFollowsRoutes,
} from '@/modules/follows/follows.routes';
import { createActivitiesRoutes } from '@/modules/activities/activities.routes';
import adminUsersRoutes from '@/modules/admin/users/adminUsers.routes';
import adminRoutes from '@/modules/admin/routes';
import settingsRoutes from '@/modules/admin/settings.routes';
import seoRoutes from '@/modules/seo/seo.routes';
import gdprRoutes from '@/modules/gdpr/gdpr.routes';
import monitoringRoutes from '@/modules/monitoring/monitoring.routes';
import { serverAdapter as bullBoardAdapter } from '@/config/bull-board.config';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/authorize.middleware';
import prisma from '@/config/database';
import { redis } from '@/config/redis';

const app: Application = express();

// Sentry request handler (must be first)
// Sentry v8+ automatically instruments Express when initialized in instrument.ts

// Trust proxy (for HTTPS detection behind reverse proxy)
app.set('trust proxy', 1);

// HTTPS enforcement (production only)
app.use(enforceHttps);

// Request ID tracking
app.use(requestId);

// Enhanced security headers (Helmet)
app.use(helmet(helmetConfig));

// Additional security headers
app.use(securityHeaders);

// Cookie parser (must be before CSRF)
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging (development)
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Performance monitoring middleware
app.use(performanceMonitoringMiddleware);

// Input sanitization (XSS prevention)
app.use(sanitizeQuery);
app.use(sanitizeBody({
  skipFields: ['password', 'currentPassword', 'newPassword'], // Don't sanitize passwords
}));

// Global rate limiting
app.use(apiLimiter);

// CSRF token generation (must be after cookie parser and auth)
app.use(setCsrfToken);

// Health check and monitoring routes (no auth required for basic health)
app.use('/', monitoringRoutes);

// Bull Board dashboard (admin only)
app.use('/admin/queues', authenticate, authorize(['admin']), bullBoardAdapter.getRouter());

// CSRF token endpoint (requires authentication)
app.get('/api/v1/csrf-token', getCsrfToken);

// Auth routes (NO CSRF - public endpoints like login/register)
app.use('/api/v1/auth', authRoutes);

// API routes (CSRF protection applied to state-changing methods)
app.use('/api/v1/users', verifyCsrfToken, userRoutes);
app.use('/api/v1/users', verifyCsrfToken, createUserFollowsRoutes(prisma, redis)); // User following/followers routes
app.use('/api/v1/profiles', verifyCsrfToken, profilesRoutes); // Candidate profile routes
app.use('/api/v1/admin/users', verifyCsrfToken, adminUsersRoutes); // Admin user management routes
app.use('/api/v1/admin', verifyCsrfToken, adminRoutes); // Admin content moderation routes
app.use('/api/v1', verifyCsrfToken, settingsRoutes); // Platform settings routes (includes /api/v1/admin/settings and /api/v1/settings/public)
app.use('/api/v1/news', verifyCsrfToken, newsRoutes);
app.use('/api/v1/news/articles', verifyCsrfToken, articleRoutes);
app.use('/api/v1/admin/articles', verifyCsrfToken, articleRoutes);
app.use('/api/v1/analytics', verifyCsrfToken, analyticsRoutes);
app.use('/api/v1/models', verifyCsrfToken, modelRoutes);
app.use('/api/v1/glossary', verifyCsrfToken, glossaryRoutes);
app.use('/api/v1/use-cases', verifyCsrfToken, useCaseRoutes);
app.use('/api/v1/media', verifyCsrfToken, mediaRoutes);
app.use('/api/v1/media/folders', verifyCsrfToken, folderRoutes);
app.use('/api/v1/forum', verifyCsrfToken, forumRoutes);
app.use('/api/v1', verifyCsrfToken, reputationRoutes); // Reputation routes for /api/v1/users/:userId/reputation
app.use('/api/v1/users/:userId/badges', verifyCsrfToken, userBadgeRoutes); // Badge routes for /api/v1/users/:userId/badges
app.use('/api/v1', verifyCsrfToken, messagingRoutes); // Messaging routes for /api/v1/messages and /api/v1/conversations
app.use('/api/v1', verifyCsrfToken, bulkMessagingRoutes); // Bulk messaging routes for recruiters
app.use('/api/v1/notifications', verifyCsrfToken, notificationRoutes); // Notification system routes
app.use('/api/v1/jobs', verifyCsrfToken, jobRoutes); // Job posting routes
app.use('/api/v1/companies', verifyCsrfToken, companyRoutes); // Company profile routes
app.use('/api/v1/companies/applications', verifyCsrfToken, atsRoutes); // ATS (company-side application management) routes
app.use('/api/v1/applications', verifyCsrfToken, applicationRoutes); // Job application routes (candidate-side)
app.use('/api/v1/candidates', verifyCsrfToken, candidateSearchRoutes); // Candidate search routes (premium feature for recruiters)
app.use('/api/v1/search', searchRoutes); // Universal search routes (GET only, no CSRF needed)
app.use('/api/v1/dashboard', dashboardRoutes); // Personalized dashboard routes (GET only, no CSRF needed)
app.use('/api/v1/recommendations', recommendationsRoutes); // AI recommendation engine routes (GET only, no CSRF needed)
app.use('/api/v1/follows', verifyCsrfToken, createFollowsRoutes(prisma, redis)); // Follow/unfollow and feed routes
app.use('/api/v1/following', verifyCsrfToken, createFollowsRoutes(prisma, redis)); // Alternative path for following feed
app.use('/api/v1', verifyCsrfToken, createEntityFollowsRoutes(prisma, redis)); // Entity followers routes
app.use('/api/v1', verifyCsrfToken, createActivitiesRoutes(prisma, redis)); // Activity tracking and feeds
app.use('/api/v1/gdpr', verifyCsrfToken, gdprRoutes); // GDPR compliance routes (consent, data export, privacy)

// RSS Feed routes (no version prefix for feed URLs)
app.use('/api/feed', rssRoutes);

// SEO routes (public, no authentication or CSRF required)
// sitemap.xml, robots.txt, and RSS feeds at root level for search engines
app.use('/', seoRoutes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before other error handlers)
// Note: Sentry error handler is automatically set up in instrument.ts

// Global error handler
app.use(errorHandler);

export default app;
