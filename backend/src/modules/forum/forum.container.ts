import { container } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { ForumCategoryRepository } from './repositories/ForumCategoryRepository';
import { ForumCategoryService } from './services/forumCategoryService';
import { ForumCategoryController } from './controllers/ForumCategoryController';
import { TopicRepository } from './repositories/TopicRepository';
import { TopicService } from './services/topicService';
import { TopicController } from './controllers/TopicController';
import { ReplyRepository } from './repositories/ReplyRepository';
import { ReplyService } from './services/replyService';
import { ReplyController } from './controllers/ReplyController';
import { VoteRepository } from './repositories/VoteRepository';
import { VoteService } from './services/voteService';
import { VoteController } from './controllers/VoteController';
import { ReputationRepository } from './repositories/ReputationRepository';
import { ReputationService } from './services/reputationService';
import { ReputationController } from './controllers/ReputationController';

/**
 * Forum Module Dependency Injection Container
 *
 * Registers all forum-related dependencies for dependency injection.
 * This ensures proper separation of concerns and testability.
 */

export function registerForumDependencies(prisma: PrismaClient): void {
  // Register Prisma client
  container.registerInstance('PrismaClient', prisma);

  // Register repositories
  container.register('ForumCategoryRepository', {
    useFactory: () => new ForumCategoryRepository(prisma),
  });
  container.register('TopicRepository', {
    useFactory: () => new TopicRepository(prisma),
  });
  container.register(ReplyRepository, {
    useFactory: () => new ReplyRepository(prisma),
  });
  container.register(VoteRepository, {
    useClass: VoteRepository,
  });
  container.register(ReputationRepository, {
    useClass: ReputationRepository,
  });

  // Register services
  container.register('ForumCategoryService', {
    useClass: ForumCategoryService,
  });
  container.register('TopicService', {
    useClass: TopicService,
  });
  container.register('ReplyService', {
    useClass: ReplyService,
  });
  container.register('VoteService', {
    useClass: VoteService,
  });
  container.register('ReputationService', {
    useClass: ReputationService,
  });

  // Register controllers
  container.register(ForumCategoryController, {
    useClass: ForumCategoryController,
  });
  container.register(TopicController, {
    useClass: TopicController,
  });
  container.register(ReplyController, {
    useClass: ReplyController,
  });
  container.register(VoteController, {
    useClass: VoteController,
  });
  container.register(ReputationController, {
    useClass: ReputationController,
  });
}

export default registerForumDependencies;
