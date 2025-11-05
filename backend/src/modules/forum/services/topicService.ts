import { injectable, inject } from 'tsyringe';
import * as Sentry from '@sentry/node';
import {
  TopicRepository,
  CreateTopicData,
  UpdateTopicData,
  TopicFilters,
  TopicPagination,
} from '../repositories/TopicRepository';
import { TopicType, UserRole } from '@prisma/client';
import { ReputationService } from './reputationService';

interface User {
  id: string;
  role: UserRole;
}

interface CreateTopicInput {
  title: string;
  content: string;
  categoryId: string;
  type: TopicType;
  isDraft?: boolean;
  tags?: string[];
  attachments?: any[];
  poll?: {
    question: string;
    options: any[];
    multipleChoice: boolean;
    expiresAt?: string;
  };
}

interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

@injectable()
export class TopicService {
  constructor(
    private topicRepository: TopicRepository,
    @inject('ReputationService') private reputationService: ReputationService
  ) {}

  /**
   * Create a new topic
   */
  async createTopic(userId: string, input: CreateTopicInput) {
    try {
      // Generate slug from title
      const slug = this.generateSlug(input.title);

      // Check if slug already exists
      const slugExists = await this.topicRepository.slugExists(slug);
      if (slugExists) {
        throw new Error('A topic with this title already exists. Please choose a different title.');
      }

      // Spam detection
      const spamCheck = await this.checkForSpam(input.title, input.content);
      if (spamCheck.isSpam) {
        Sentry.captureMessage(`Spam detected in topic: ${input.title}`, {
          level: 'warning',
          extra: {
            userId,
            title: input.title,
            spamScore: spamCheck.score,
            keywords: spamCheck.keywords,
          },
        });
      }

      // Create topic data
      const topicData: CreateTopicData = {
        title: input.title,
        slug,
        content: input.content,
        authorId: userId,
        categoryId: input.categoryId,
        type: input.type,
        isDraft: input.isDraft || false,
        isFlagged: spamCheck.isSpam,
      };

      // Create poll if provided
      if (input.poll) {
        const poll = await this.createPoll(input.poll);
        topicData.pollId = poll.id;
      }

      // Create topic
      const topic = await this.topicRepository.create(topicData);

      // Add tags if provided
      if (input.tags && input.tags.length > 0) {
        await this.addTagsToTopic(topic.id, input.tags);
      }

      // Add attachments if provided
      if (input.attachments && input.attachments.length > 0) {
        await this.addAttachmentsToTopic(topic.id, input.attachments);
      }

      // Extract and generate link previews for URLs in content
      if (!input.isDraft) {
        this.generateLinkPreviews(input.content, topic.id).catch((err) => {
          Sentry.captureException(err, {
            extra: { topicId: topic.id },
          });
        });

        // Award reputation for topic creation (only for published topics)
        this.reputationService.awardTopicCreation(userId, topic.id).catch((err) => {
          Sentry.captureException(err, {
            tags: { module: 'forum', operation: 'awardTopicCreation' },
            extra: { topicId: topic.id, userId },
          });
        });
      }

      // Get complete topic with relations
      const completeTopic = await this.topicRepository.findById(topic.id);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Topic created',
        level: 'info',
        data: {
          topicId: topic.id,
          userId,
          type: input.type,
          isDraft: input.isDraft,
        },
      });

      return completeTopic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'createTopic' },
        extra: { userId, input },
      });
      throw error;
    }
  }

  /**
   * Get topic by ID
   */
  async getTopicById(topicId: string, userId?: string) {
    try {
      const topic = await this.topicRepository.findById(topicId);

      if (!topic) {
        throw new Error('Topic not found');
      }

      // Check if user can view draft topics
      if (topic.isDraft && topic.authorId !== userId) {
        throw new Error('Topic not found');
      }

      // Increment view count (async, don't wait)
      this.topicRepository.incrementViewCount(topicId).catch((err) => {
        Sentry.captureException(err);
      });

      return topic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'getTopicById' },
        extra: { topicId, userId },
      });
      throw error;
    }
  }

  /**
   * Get topic by slug
   */
  async getTopicBySlug(slug: string, userId?: string) {
    try {
      const topic = await this.topicRepository.findBySlug(slug);

      if (!topic) {
        throw new Error('Topic not found');
      }

      // Check if user can view draft topics
      if (topic.isDraft && topic.authorId !== userId) {
        throw new Error('Topic not found');
      }

      // Increment view count
      this.topicRepository.incrementViewCount(topic.id).catch((err) => {
        Sentry.captureException(err);
      });

      return topic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'getTopicBySlug' },
        extra: { slug, userId },
      });
      throw error;
    }
  }

  /**
   * List topics with filters and pagination
   */
  async listTopics(filters: TopicFilters, pagination: TopicPagination, user?: User) {
    try {
      // Non-admin users can't see drafts unless they're the author
      if (filters.isDraft && user?.role !== 'admin' && user?.role !== 'moderator') {
        if (!filters.authorId || filters.authorId !== user?.id) {
          filters.isDraft = false;
        }
      }

      const result = await this.topicRepository.findMany(filters, pagination);

      return {
        topics: result.topics,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'listTopics' },
        extra: { filters, pagination },
      });
      throw error;
    }
  }

  /**
   * Update topic
   */
  async updateTopic(topicId: string, userId: string, input: any, user: User) {
    try {
      const topic = await this.topicRepository.findById(topicId);

      if (!topic) {
        throw new Error('Topic not found');
      }

      // Authorization check
      const canUpdate = this.canUserModifyTopic(user, topic.authorId);
      if (!canUpdate) {
        throw new Error('You do not have permission to update this topic');
      }

      // Prepare update data
      const updateData: UpdateTopicData = {};

      if (input.title) {
        updateData.title = input.title;
        // Generate new slug if title changed
        const newSlug = this.generateSlug(input.title);
        if (newSlug !== topic.slug) {
          const slugExists = await this.topicRepository.slugExists(newSlug, topicId);
          if (slugExists) {
            throw new Error('A topic with this title already exists');
          }
          updateData.slug = newSlug;
        }
      }

      if (input.content !== undefined) {
        updateData.content = input.content;

        // Check for spam on content update
        const spamCheck = await this.checkForSpam(
          input.title || topic.title,
          input.content
        );
        if (spamCheck.isSpam) {
          Sentry.captureMessage(`Spam detected in topic update: ${topicId}`, {
            level: 'warning',
            extra: {
              userId,
              topicId,
              spamScore: spamCheck.score,
            },
          });
        }
      }

      if (input.categoryId) updateData.categoryId = input.categoryId;
      if (input.type) updateData.type = input.type;
      if (input.isDraft !== undefined) updateData.isDraft = input.isDraft;

      // Update topic
      await this.topicRepository.update(topicId, updateData);

      // Update tags if provided
      if (input.tags) {
        await this.topicRepository.removeTags(topicId);
        await this.addTagsToTopic(topicId, input.tags);
      }

      // Get updated topic
      const updatedTopic = await this.topicRepository.findById(topicId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Topic updated',
        level: 'info',
        data: { topicId, userId },
      });

      return updatedTopic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'updateTopic' },
        extra: { topicId, userId, input },
      });
      throw error;
    }
  }

  /**
   * Delete topic (soft delete)
   */
  async deleteTopic(topicId: string, userId: string, user: User) {
    try {
      const topic = await this.topicRepository.findById(topicId);

      if (!topic) {
        throw new Error('Topic not found');
      }

      // Authorization check
      const canDelete = this.canUserModifyTopic(user, topic.authorId);
      if (!canDelete) {
        throw new Error('You do not have permission to delete this topic');
      }

      await this.topicRepository.softDelete(topicId);

      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Topic deleted',
        level: 'info',
        data: { topicId, userId },
      });

      return { message: 'Topic deleted successfully' };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'deleteTopic' },
        extra: { topicId, userId },
      });
      throw error;
    }
  }

  /**
   * Pin/unpin topic (moderator only)
   */
  async pinTopic(topicId: string, isPinned: boolean, user: User) {
    try {
      if (user.role !== 'moderator' && user.role !== 'admin') {
        throw new Error('Only moderators can pin topics');
      }

      const topic = await this.topicRepository.update(topicId, { isPinned });

      Sentry.addBreadcrumb({
        category: 'forum',
        message: isPinned ? 'Topic pinned' : 'Topic unpinned',
        level: 'info',
        data: { topicId, userId: user.id },
      });

      return topic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'pinTopic' },
        extra: { topicId, isPinned },
      });
      throw error;
    }
  }

  /**
   * Lock/unlock topic (moderator only)
   */
  async lockTopic(topicId: string, isLocked: boolean, user: User) {
    try {
      if (user.role !== 'moderator' && user.role !== 'admin') {
        throw new Error('Only moderators can lock topics');
      }

      const topic = await this.topicRepository.update(topicId, { isLocked });

      Sentry.addBreadcrumb({
        category: 'forum',
        message: isLocked ? 'Topic locked' : 'Topic unlocked',
        level: 'info',
        data: { topicId, userId: user.id },
      });

      return topic;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { module: 'forum', operation: 'lockTopic' },
        extra: { topicId, isLocked },
      });
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 200) + '-' + Date.now().toString(36);
  }

  /**
   * Check content for spam keywords
   */
  private async checkForSpam(
    title: string,
    content: string
  ): Promise<{ isSpam: boolean; score: number; keywords: string[] }> {
    try {
      const spamKeywords = await this.topicRepository.getActiveSpamKeywords();
      const textToCheck = `${title} ${content}`.toLowerCase();

      let score = 0;
      const matchedKeywords: string[] = [];

      for (const { keyword, severity } of spamKeywords) {
        if (textToCheck.includes(keyword.toLowerCase())) {
          score += severity;
          matchedKeywords.push(keyword);
        }
      }

      // Flag as spam if score >= 5
      return {
        isSpam: score >= 5,
        score,
        keywords: matchedKeywords,
      };
    } catch (error) {
      Sentry.captureException(error);
      return { isSpam: false, score: 0, keywords: [] };
    }
  }

  /**
   * Extract URLs from content and generate link previews
   */
  private async generateLinkPreviews(content: string, topicId: string): Promise<void> {
    try {
      // Extract URLs from markdown/text content
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      const urls = content.match(urlRegex) || [];

      // Limit to first 3 URLs to avoid excessive processing
      const uniqueUrls = [...new Set(urls)].slice(0, 3);

      // Generate previews for each URL (simplified - in production use a service like Unfurl)
      const previews: LinkPreview[] = uniqueUrls.map((url) => ({
        url,
        title: url, // In production, fetch actual metadata
        description: 'Link preview',
        image: undefined,
      }));

      // Store previews (could be stored in a separate table or in topic metadata)
      // For now, we just log them
      Sentry.addBreadcrumb({
        category: 'forum',
        message: 'Link previews generated',
        level: 'info',
        data: {
          topicId,
          previewCount: previews.length,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  }

  /**
   * Add tags to topic
   */
  private async addTagsToTopic(topicId: string, tagNames: string[]): Promise<void> {
    const tagIds: string[] = [];

    for (const tagName of tagNames) {
      const slug = this.generateSlug(tagName);
      const tag = await this.topicRepository.findOrCreateTag(tagName, slug);
      tagIds.push(tag.id);

      // Increment usage count
      await this.topicRepository.incrementTagUsage(tag.id);
    }

    await this.topicRepository.addTags(topicId, tagIds);
  }

  /**
   * Add attachments to topic
   */
  private async addAttachmentsToTopic(topicId: string, attachments: any[]): Promise<void> {
    for (let i = 0; i < attachments.length; i++) {
      await this.topicRepository.createAttachment(topicId, {
        ...attachments[i],
        displayOrder: i,
      });
    }
  }

  /**
   * Create poll
   */
  private async createPoll(pollData: any): Promise<any> {
    // This would use PollRepository in a real implementation
    // For now, return mock data
    return {
      id: 'poll-' + Date.now(),
    };
  }

  /**
   * Check if user can modify topic
   */
  private canUserModifyTopic(user: User, topicAuthorId: string): boolean {
    return (
      user.id === topicAuthorId ||
      user.role === 'admin' ||
      user.role === 'moderator'
    );
  }
}
