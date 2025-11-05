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
import analyticsRoutes from '@/modules/analytics/analytics.routes';

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
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/news/articles', articleRoutes);
app.use('/api/v1/admin/articles', articleRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before other error handlers)
// Note: Sentry error handler is automatically set up in instrument.ts

// Global error handler
app.use(errorHandler);

export default app;
