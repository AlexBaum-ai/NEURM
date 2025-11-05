import { PrismaClient, Topic, TopicType, TopicStatus, Prisma } from '@prisma/client';
import { injectable } from 'tsyringe';

export interface TopicWithRelations extends Topic {
  author: {
    id: string;
    username: string;
    email: string;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  tags: {
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  attachments: {
    id: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    url: string;
    width: number | null;
    height: number | null;
  }[];
  poll?: {
    id: string;
    question: string;
    options: any;
    multipleChoice: boolean;
    expiresAt: Date | null;
  } | null;
  _count?: {
    replies: number;
    votes: number;
  };
}

export interface CreateTopicData {
  title: string;
  slug: string;
  content: string;
  authorId: string;
  categoryId: string;
  type: TopicType;
  isDraft?: boolean;
  isFlagged?: boolean;
  pollId?: string;
}

export interface UpdateTopicData {
  title?: string;
  slug?: string;
  content?: string;
  categoryId?: string;
  type?: TopicType;
  status?: TopicStatus;
  isDraft?: boolean;
  isPinned?: boolean;
  isLocked?: boolean;
}

export interface TopicFilters {
  categoryId?: string;
  authorId?: string;
  type?: TopicType;
  status?: TopicStatus;
  isDraft?: boolean;
  isFlagged?: boolean;
  search?: string;
  tag?: string;
}

export interface TopicPagination {
  page: number;
  limit: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'replyCount' | 'voteScore';
  sortOrder?: 'asc' | 'desc';
}

@injectable()
export class TopicRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new topic
   */
  async create(data: CreateTopicData): Promise<Topic> {
    return await this.prisma.topic.create({
      data,
    });
  }

  /**
   * Find topic by ID with all relations
   */
  async findById(id: string): Promise<TopicWithRelations | null> {
    return await this.prisma.topic.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            fileSize: true,
            url: true,
            width: true,
            height: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        poll: {
          select: {
            id: true,
            question: true,
            options: true,
            multipleChoice: true,
            expiresAt: true,
          },
        },
        _count: {
          select: {
            replies: true,
            votes: true,
          },
        },
      },
    });
  }

  /**
   * Find topic by slug
   */
  async findBySlug(slug: string): Promise<TopicWithRelations | null> {
    return await this.prisma.topic.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            fileSize: true,
            url: true,
            width: true,
            height: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        poll: true,
        _count: {
          select: {
            replies: true,
            votes: true,
          },
        },
      },
    });
  }

  /**
   * Find topics with filters and pagination
   */
  async findMany(
    filters: TopicFilters,
    pagination: TopicPagination
  ): Promise<{ topics: TopicWithRelations[]; total: number }> {
    const where: Prisma.TopicWhereInput = {};

    // Apply filters
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isDraft !== undefined) {
      where.isDraft = filters.isDraft;
    }

    if (filters.isFlagged !== undefined) {
      where.isFlagged = filters.isFlagged;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tag) {
      where.tags = {
        some: {
          tag: {
            slug: filters.tag,
          },
        },
      };
    }

    const orderBy: Prisma.TopicOrderByWithRelationInput = {};
    if (pagination.sortBy) {
      orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Get total count
    const total = await this.prisma.topic.count({ where });

    // Get paginated topics
    const topics = await this.prisma.topic.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            fileSize: true,
            url: true,
            width: true,
            height: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
        poll: {
          select: {
            id: true,
            question: true,
            options: true,
            multipleChoice: true,
            expiresAt: true,
          },
        },
        _count: {
          select: {
            replies: true,
            votes: true,
          },
        },
      },
      orderBy,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return { topics, total };
  }

  /**
   * Update topic
   */
  async update(id: string, data: UpdateTopicData): Promise<Topic> {
    return await this.prisma.topic.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete topic (set status to archived)
   */
  async softDelete(id: string): Promise<Topic> {
    return await this.prisma.topic.update({
      where: { id },
      data: {
        status: 'archived',
      },
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.topic.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Check if slug exists
   */
  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.TopicWhereInput = { slug };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const count = await this.prisma.topic.count({ where });
    return count > 0;
  }

  /**
   * Create topic attachment
   */
  async createAttachment(topicId: string, attachmentData: any): Promise<any> {
    return await this.prisma.topicAttachment.create({
      data: {
        topicId,
        ...attachmentData,
      },
    });
  }

  /**
   * Delete topic attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.prisma.topicAttachment.delete({
      where: { id: attachmentId },
    });
  }

  /**
   * Add tags to topic
   */
  async addTags(topicId: string, tagIds: string[]): Promise<void> {
    await this.prisma.topicTag.createMany({
      data: tagIds.map((tagId) => ({
        topicId,
        tagId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Remove all tags from topic
   */
  async removeTags(topicId: string): Promise<void> {
    await this.prisma.topicTag.deleteMany({
      where: { topicId },
    });
  }

  /**
   * Create or get tag by name
   */
  async findOrCreateTag(name: string, slug: string): Promise<any> {
    return await this.prisma.forumTag.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        usageCount: 0,
      },
    });
  }

  /**
   * Increment tag usage count
   */
  async incrementTagUsage(tagId: string): Promise<void> {
    await this.prisma.forumTag.update({
      where: { id: tagId },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get active spam keywords
   */
  async getActiveSpamKeywords(): Promise<{ keyword: string; severity: number }[]> {
    return await this.prisma.spamKeyword.findMany({
      where: { isActive: true },
      select: {
        keyword: true,
        severity: true,
      },
    });
  }
}
