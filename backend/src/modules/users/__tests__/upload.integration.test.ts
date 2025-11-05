import request from 'supertest';
import express, { Application } from 'express';
import userRoutes from '../users.routes';
import { authenticate } from '@/middleware/auth.middleware';
import { errorHandler } from '@/middleware/errorHandler.middleware';

// Mock authentication middleware
jest.mock('@/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  }),
  optionalAuth: jest.fn((_req, _res, next) => next()),
}));

// Mock rate limiters
jest.mock('@/middleware/rateLimiter.middleware', () => ({
  apiLimiter: jest.fn((_req, _res, next) => next()),
  profileUpdateLimiter: jest.fn((_req, _res, next) => next()),
  accountSettingsLimiter: jest.fn((_req, _res, next) => next()),
}));

jest.mock('@/middleware/uploadRateLimiter.middleware', () => ({
  uploadRateLimiter: jest.fn((_req, _res, next) => next()),
}));

// Mock services
jest.mock('@/services/upload.service');
jest.mock('@/services/storage.service');
jest.mock('@/services/image.service');
jest.mock('@/modules/users/users.repository');
jest.mock('@/utils/logger');

describe('Upload Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/users', userRoutes);
    app.use(errorHandler);
  });

  describe('POST /api/v1/users/me/avatar', () => {
    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/v1/users/me/avatar')
        .set('Authorization', 'Bearer fake-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No file uploaded');
    });

    it('should return 400 if file type is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/users/me/avatar')
        .set('Authorization', 'Bearer fake-token')
        .attach('avatar', Buffer.from('fake-pdf-content'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/users/me/cover', () => {
    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/v1/users/me/cover')
        .set('Authorization', 'Bearer fake-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No file uploaded');
    });
  });
});
