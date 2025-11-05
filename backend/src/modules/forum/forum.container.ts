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
import { LeaderboardRepository } from './repositories/LeaderboardRepository';
import { LeaderboardService } from './services/leaderboardService';
import { LeaderboardController } from './controllers/LeaderboardController';
import { ModerationRepository } from './repositories/ModerationRepository';
import { ModerationService } from './services/moderationService';
import { ModerationController } from './controllers/ModerationController';
import { SearchRepository } from './repositories/SearchRepository';
import { SavedSearchRepository } from './repositories/SavedSearchRepository';
import { SearchHistoryRepository } from './repositories/SearchHistoryRepository';
import { SearchService } from './services/searchService';
import { SearchController } from './controllers/SearchController';
import { ReportRepository } from './repositories/ReportRepository';
import { ReportService } from './services/reportService';
import { ReportController } from './controllers/ReportController';
import { BadgeRepository } from './repositories/BadgeRepository';
import { BadgeService } from './services/badgeService';
import { BadgeController } from './controllers/BadgeController';
import { PollRepository } from './repositories/PollRepository';
import { PollService } from './services/pollService';
import { PollController } from './controllers/PollController';

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
  container.register(LeaderboardRepository, {
    useClass: LeaderboardRepository,
  });
  container.register('ModerationRepository', {
    useClass: ModerationRepository,
  });
  container.register('SearchRepository', {
    useFactory: () => new SearchRepository(prisma),
  });
  container.register('SavedSearchRepository', {
    useFactory: () => new SavedSearchRepository(prisma),
  });
  container.register('SearchHistoryRepository', {
    useFactory: () => new SearchHistoryRepository(prisma),
  });
  container.register('ReportRepository', {
    useFactory: () => new ReportRepository(prisma),
  });
  container.register(BadgeRepository, {
    useClass: BadgeRepository,
  });
  container.register('PollRepository', {
    useClass: PollRepository,
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
  container.register('LeaderboardService', {
    useClass: LeaderboardService,
  });
  container.register('ModerationService', {
    useClass: ModerationService,
  });
  container.register('SearchService', {
    useClass: SearchService,
  });
  container.register('ReportService', {
    useClass: ReportService,
  });
  container.register(BadgeService, {
    useClass: BadgeService,
  });
  container.register('PollService', {
    useClass: PollService,
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
  container.register(LeaderboardController, {
    useClass: LeaderboardController,
  });
  container.register(ModerationController, {
    useClass: ModerationController,
  });
  container.register(SearchController, {
    useClass: SearchController,
  });
  container.register(ReportController, {
    useClass: ReportController,
  });
  container.register(BadgeController, {
    useClass: BadgeController,
  });
  container.register(PollController, {
    useClass: PollController,
  });
}

export default registerForumDependencies;
