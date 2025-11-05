import { PrismaClient, Poll, PollOption, PollVote, PollType } from '@prisma/client';
import { injectable, inject } from 'tsyringe';

export interface CreatePollData {
  topicId?: string;
  question: string;
  pollType: PollType;
  isAnonymous: boolean;
  deadline?: Date;
  options: string[];
}

export interface PollWithOptions extends Poll {
  options: PollOption[];
  votes?: PollVote[];
  _count?: {
    votes: number;
  };
}

export interface PollVoteWithRelations extends PollVote {
  option: PollOption;
  poll: Poll;
}

/**
 * PollRepository
 *
 * Data access layer for Poll operations
 * Handles database queries for polls, poll options, and poll votes
 */
@injectable()
export class PollRepository {
  constructor(
    @inject('PrismaClient')
    private prisma: PrismaClient
  ) {}

  /**
   * Create a new poll with options
   */
  async createPoll(data: CreatePollData): Promise<PollWithOptions> {
    const { options, ...pollData } = data;

    return await this.prisma.poll.create({
      data: {
        ...pollData,
        options: {
          create: options.map((text, index) => ({
            optionText: text,
            displayOrder: index,
          })),
        },
      },
      include: {
        options: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });
  }

  /**
   * Find poll by ID
   */
  async findById(pollId: string, includeVotes = false): Promise<PollWithOptions | null> {
    return await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        votes: includeVotes,
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });
  }

  /**
   * Find poll by topic ID
   */
  async findByTopicId(topicId: string): Promise<PollWithOptions | null> {
    return await this.prisma.poll.findFirst({
      where: { topicId },
      include: {
        options: {
          orderBy: {
            displayOrder: 'asc',
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });
  }

  /**
   * Find poll option by ID
   */
  async findOptionById(optionId: string): Promise<PollOption | null> {
    return await this.prisma.pollOption.findUnique({
      where: { id: optionId },
    });
  }

  /**
   * Find user's vote on a poll
   */
  async findUserVote(pollId: string, userId: string): Promise<PollVote[]> {
    return await this.prisma.pollVote.findMany({
      where: {
        pollId,
        userId,
      },
      include: {
        option: true,
      },
    });
  }

  /**
   * Check if user has already voted on a poll
   */
  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.pollVote.count({
      where: {
        pollId,
        userId,
      },
    });
    return count > 0;
  }

  /**
   * Cast a vote (or multiple votes for multiple choice)
   */
  async castVote(pollId: string, userId: string, optionIds: string[]): Promise<PollVote[]> {
    // Create votes in a transaction
    const votes = await this.prisma.$transaction(
      optionIds.map((optionId) =>
        this.prisma.pollVote.create({
          data: {
            pollId,
            userId,
            optionId,
          },
        })
      )
    );

    // Update vote counts
    await this.updateVoteCounts(pollId);

    return votes;
  }

  /**
   * Remove user's votes from a poll (for changing vote)
   */
  async removeUserVotes(pollId: string, userId: string): Promise<number> {
    const result = await this.prisma.pollVote.deleteMany({
      where: {
        pollId,
        userId,
      },
    });

    // Update vote counts
    await this.updateVoteCounts(pollId);

    return result.count;
  }

  /**
   * Update vote counts for poll and options
   */
  async updateVoteCounts(pollId: string): Promise<void> {
    // Get all options for this poll
    const options = await this.prisma.pollOption.findMany({
      where: { pollId },
      select: { id: true },
    });

    // Update vote count for each option
    await Promise.all(
      options.map(async (option) => {
        const count = await this.prisma.pollVote.count({
          where: { optionId: option.id },
        });

        await this.prisma.pollOption.update({
          where: { id: option.id },
          data: { voteCount: count },
        });
      })
    );

    // Update total votes count for poll
    const totalVotes = await this.prisma.pollVote.count({
      where: { pollId },
    });

    await this.prisma.poll.update({
      where: { id: pollId },
      data: { totalVotes },
    });
  }

  /**
   * Get poll results with percentages
   */
  async getPollResults(pollId: string): Promise<PollWithOptions | null> {
    return await this.findById(pollId, false);
  }

  /**
   * Check if poll has expired
   */
  isPollExpired(poll: Poll): boolean {
    if (!poll.deadline) return false;
    return new Date() > poll.deadline;
  }

  /**
   * Delete a poll and all related data
   */
  async deletePoll(pollId: string): Promise<void> {
    // Cascade delete will handle options and votes
    await this.prisma.poll.delete({
      where: { id: pollId },
    });
  }

  /**
   * Get vote statistics for a poll
   */
  async getVoteStatistics(pollId: string) {
    const poll = await this.findById(pollId, false);
    if (!poll) return null;

    return {
      totalVotes: poll.totalVotes,
      options: poll.options.map((option) => ({
        id: option.id,
        optionText: option.optionText,
        voteCount: option.voteCount,
        percentage:
          poll.totalVotes > 0
            ? Math.round((option.voteCount / poll.totalVotes) * 100 * 10) / 10
            : 0,
      })),
    };
  }
}
