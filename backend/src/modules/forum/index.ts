/**
 * Forum Module Entry Point
 *
 * Exports all forum-related routes, services, and utilities
 */

import categoryRoutes from './routes/categoryRoutes';
import topicRoutes from './routes/topicRoutes';
import replyRoutes from './routes/replyRoutes';
import voteRoutes from './routes/voteRoutes';
import reputationRoutes from './routes/reputationRoutes';
import { registerForumDependencies } from './forum.container';

// Export routes
export { categoryRoutes, topicRoutes, replyRoutes, voteRoutes, reputationRoutes };

// Export DI registration
export { registerForumDependencies };

// Export services and repositories for testing
export { ForumCategoryService } from './services/forumCategoryService';
export { ForumCategoryRepository } from './repositories/ForumCategoryRepository';
export { ForumCategoryController } from './controllers/ForumCategoryController';
export { TopicService } from './services/topicService';
export { TopicRepository } from './repositories/TopicRepository';
export { TopicController } from './controllers/TopicController';
export { ReplyService } from './services/replyService';
export { ReplyRepository } from './repositories/ReplyRepository';
export { ReplyController } from './controllers/ReplyController';
export { VoteService } from './services/voteService';
export { VoteRepository } from './repositories/VoteRepository';
export { VoteController } from './controllers/VoteController';
export { ReputationService } from './services/reputationService';
export { ReputationRepository } from './repositories/ReputationRepository';
export { ReputationController } from './controllers/ReputationController';

// Export types and validators
export * from './validators/categoryValidators';
export * from './validators/topicValidators';
export * from './validators/replyValidators';
export * from './validators/voteValidators';
export * from './validators/reputationValidators';
