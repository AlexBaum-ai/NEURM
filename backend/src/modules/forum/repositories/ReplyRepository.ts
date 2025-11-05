import { PrismaClient, Reply, Prisma } from '@prisma/client';
import { injectable, inject } from 'tsyringe';

/**
 * Reply Repository
 *
 * Handles all database operations for forum replies including:
 * - CRUD operations
 * - Nested reply tree generation (max 3 levels)
 * - Edit history tracking
 * - Soft deletes
 * - Accept answer functionality
 */

export interface CreateReplyData {
  topicId: string;
  authorId: string;
  content: string;
  parentReplyId?: string;
  quotedReplyId?: string;
  mentions?: string[];
}

export interface UpdateReplyData {
  content?: string;
  editedAt?: Date;
  isAccepted?: boolean;
}

export interface ReplyWithRelations extends Reply {
  author: {
    id: string;
    username: string;
    email: string;
    role: string;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
  childReplies?: ReplyWithRelations[];
  quotedReply?: {
    id: string;
    content: string;
    author: {
      username: string;
    };
  } | null;
  _count?: {
    childReplies: number;
  };
}

export interface ReplySortOptions {
  sort: 'oldest' | 'newest' | 'most_voted';
}

@injectable()
export class ReplyRepository {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient
  ) {}

  /**
   * Create a new reply
   */
  async create(data: CreateReplyData): Promise<ReplyWithRelations> {
    // Calculate depth if parent reply exists
    let depth = 0;
    if (data.parentReplyId) {
      const parentReply = await this.prisma.reply.findUnique({
        where: { id: data.parentReplyId },
        select: { depth: true },
      });
      depth = parentReply ? parentReply.depth + 1 : 0;
    }

    // Create the reply
    const reply = await this.prisma.reply.create({
      data: {
        topicId: data.topicId,
        authorId: data.authorId,
        content: data.content,
        parentReplyId: data.parentReplyId,
        quotedReplyId: data.quotedReplyId,
        mentions: data.mentions || [],
        depth,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        quotedReply: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            childReplies: true,
          },
        },
      },
    });

    return reply;
  }

  /**
   * Find reply by ID
   */
  async findById(id: string, includeDeleted = false): Promise<ReplyWithRelations | null> {
    const whereClause: Prisma.ReplyWhereInput = { id };
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }

    return this.prisma.reply.findFirst({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        quotedReply: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            childReplies: true,
          },
        },
      },
    });
  }

  /**
   * Get replies for a topic with nested structure
   */
  async findByTopicId(
    topicId: string,
    options: ReplySortOptions = { sort: 'oldest' },
    includeDeleted = false
  ): Promise<ReplyWithRelations[]> {
    // Build where clause
    const whereClause: Prisma.ReplyWhereInput = {
      topicId,
      parentReplyId: null, // Only get top-level replies
    };

    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }

    // Build order by clause
    let orderBy: Prisma.ReplyOrderByWithRelationInput = { createdAt: 'asc' };
    switch (options.sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'most_voted':
        orderBy = { voteScore: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'asc' };
    }

    // Fetch top-level replies with all nested children
    const replies = await this.prisma.reply.findMany({
      where: whereClause,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        quotedReply: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        childReplies: {
          where: includeDeleted ? {} : { isDeleted: false },
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
                profile: {
                  select: {
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            quotedReply: {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    username: true,
                  },
                },
              },
            },
            childReplies: {
              where: includeDeleted ? {} : { isDeleted: false },
              orderBy: { createdAt: 'asc' },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    profile: {
                      select: {
                        displayName: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
                quotedReply: {
                  select: {
                    id: true,
                    content: true,
                    author: {
                      select: {
                        username: true,
                      },
                    },
                  },
                },
                _count: {
                  select: {
                    childReplies: true,
                  },
                },
              },
            },
            _count: {
              select: {
                childReplies: true,
              },
            },
          },
        },
        _count: {
          select: {
            childReplies: true,
          },
        },
      },
    });

    return replies;
  }

  /**
   * Update a reply
   */
  async update(id: string, data: UpdateReplyData): Promise<ReplyWithRelations> {
    return this.prisma.reply.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        quotedReply: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            childReplies: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete a reply
   */
  async softDelete(id: string): Promise<ReplyWithRelations> {
    return this.prisma.reply.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: '[Deleted]',
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        quotedReply: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            childReplies: true,
          },
        },
      },
    });
  }

  /**
   * Create edit history record
   */
  async createEditHistory(
    replyId: string,
    previousContent: string,
    editedBy: string,
    editReason?: string
  ): Promise<void> {
    await this.prisma.replyEditHistory.create({
      data: {
        replyId,
        previousContent,
        editedBy,
        editReason,
      },
    });
  }

  /**
   * Get edit history for a reply
   */
  async getEditHistory(replyId: string) {
    return this.prisma.replyEditHistory.findMany({
      where: { replyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update topic's accepted answer
   */
  async setAcceptedAnswer(topicId: string, replyId: string): Promise<void> {
    await this.prisma.$transaction([
      // Unmark any previously accepted answer
      this.prisma.reply.updateMany({
        where: {
          topicId,
          isAccepted: true,
        },
        data: {
          isAccepted: false,
        },
      }),
      // Mark the new accepted answer
      this.prisma.reply.update({
        where: { id: replyId },
        data: { isAccepted: true },
      }),
      // Update topic with accepted answer reference
      this.prisma.topic.update({
        where: { id: topicId },
        data: { acceptedReplyId: replyId },
      }),
    ]);
  }

  /**
   * Remove accepted answer from topic
   */
  async removeAcceptedAnswer(topicId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.reply.updateMany({
        where: {
          topicId,
          isAccepted: true,
        },
        data: {
          isAccepted: false,
        },
      }),
      this.prisma.topic.update({
        where: { id: topicId },
        data: { acceptedReplyId: null },
      }),
    ]);
  }

  /**
   * Increment topic reply count
   */
  async incrementTopicReplyCount(topicId: string): Promise<void> {
    await this.prisma.topic.update({
      where: { id: topicId },
      data: {
        replyCount: {
          increment: 1,
        },
        lastReplyAt: new Date(),
      },
    });
  }

  /**
   * Decrement topic reply count
   */
  async decrementTopicReplyCount(topicId: string): Promise<void> {
    await this.prisma.topic.update({
      where: { id: topicId },
      data: {
        replyCount: {
          decrement: 1,
        },
      },
    });
  }

  /**
   * Count replies for a topic
   */
  async countByTopicId(topicId: string, includeDeleted = false): Promise<number> {
    const whereClause: Prisma.ReplyWhereInput = { topicId };
    if (!includeDeleted) {
      whereClause.isDeleted = false;
    }

    return this.prisma.reply.count({
      where: whereClause,
    });
  }
}
