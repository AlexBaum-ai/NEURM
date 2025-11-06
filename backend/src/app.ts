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

// Router imports
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
import adminUsersRoutes from '@/modules/admin/users/adminUsers.routes';
import adminRoutes from '@/modules/admin/routes';
import settingsRoutes from '@/modules/admin/settings.routes';
import prisma from '@/config/database';
import { redis } from '@/config/redis';

const app: Application = express();

// Sentry request handler (must be first)
// Sentry v8+ automatically instruments Express when initialized in instrument.ts

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Request logging (development)
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users', createUserFollowsRoutes(prisma, redis)); // User following/followers routes
app.use('/api/v1/profiles', profilesRoutes); // Candidate profile routes
app.use('/api/v1/admin/users', adminUsersRoutes); // Admin user management routes
app.use('/api/v1/admin', adminRoutes); // Admin content moderation routes
app.use('/api/v1', settingsRoutes); // Platform settings routes (includes /api/v1/admin/settings and /api/v1/settings/public)
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/news/articles', articleRoutes);
app.use('/api/v1/admin/articles', articleRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/models', modelRoutes);
app.use('/api/v1/glossary', glossaryRoutes);
app.use('/api/v1/use-cases', useCaseRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/media/folders', folderRoutes);
app.use('/api/v1/forum', forumRoutes);
app.use('/api/v1', reputationRoutes); // Reputation routes for /api/v1/users/:userId/reputation
app.use('/api/v1/users/:userId/badges', userBadgeRoutes); // Badge routes for /api/v1/users/:userId/badges
app.use('/api/v1', messagingRoutes); // Messaging routes for /api/v1/messages and /api/v1/conversations
app.use('/api/v1', bulkMessagingRoutes); // Bulk messaging routes for recruiters
app.use('/api/v1/jobs', jobRoutes); // Job posting routes
app.use('/api/v1/companies', companyRoutes); // Company profile routes
app.use('/api/v1/companies/applications', atsRoutes); // ATS (company-side application management) routes
app.use('/api/v1/applications', applicationRoutes); // Job application routes (candidate-side)
app.use('/api/v1/candidates', candidateSearchRoutes); // Candidate search routes (premium feature for recruiters)
app.use('/api/v1/search', searchRoutes); // Universal search routes
app.use('/api/v1/dashboard', dashboardRoutes); // Personalized dashboard routes
app.use('/api/v1/recommendations', recommendationsRoutes); // AI recommendation engine routes
app.use('/api/v1/follows', createFollowsRoutes(prisma, redis)); // Follow/unfollow and feed routes
app.use('/api/v1/following', createFollowsRoutes(prisma, redis)); // Alternative path for following feed
app.use('/api/v1', createEntityFollowsRoutes(prisma, redis)); // Entity followers routes

// RSS Feed routes (no version prefix for feed URLs)
app.use('/api/feed', rssRoutes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before other error handlers)
// Note: Sentry error handler is automatically set up in instrument.ts

// Global error handler
app.use(errorHandler);

export default app;
