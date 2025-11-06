import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { SpamDetectionService } from './services/spamDetectionService';
import { ContentModerationService } from './services/contentModerationService';
import { ContentModerationController } from './controllers/contentModerationController';

/**
 * Admin Module Dependency Injection Container
 *
 * Registers all admin-related dependencies for dependency injection.
 * This ensures proper separation of concerns and testability.
 */

export function registerAdminDependencies(prisma: PrismaClient): void {
  // Prisma client is already registered globally

  // Register services
  container.register('SpamDetectionService', {
    useFactory: () => new SpamDetectionService(prisma),
  });

  container.register('ContentModerationService', {
    useClass: ContentModerationService,
  });

  // Register controllers
  container.register(ContentModerationController, {
    useClass: ContentModerationController,
  });
}

export default registerAdminDependencies;
