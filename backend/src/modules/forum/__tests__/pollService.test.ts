import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PollService } from '../services/pollService';
import { PollRepository } from '../repositories/PollRepository';
import { PollType } from '@prisma/client';

// Mock PollRepository
vi.mock('../repositories/PollRepository');

describe('PollService', () => {
  let pollService: PollService;
  let mockPollRepository: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock repository
    mockPollRepository = {
      createPoll: vi.fn(),
      findById: vi.fn(),
      findByTopicId: vi.fn(),
      hasUserVoted: vi.fn(),
      castVote: vi.fn(),
      getVoteStatistics: vi.fn(),
      isPollExpired: vi.fn(),
      findUserVote: vi.fn(),
      deletePoll: vi.fn(),
    };

    // Create service instance with mock repository
    pollService = new PollService(mockPollRepository);
  });

  describe('createPoll', () => {
    it('should create a poll with valid options', async () => {
      const input = {
        question: 'What is your favorite LLM?',
        pollType: 'single' as PollType,
        isAnonymous: true,
        options: ['GPT-4', 'Claude', 'Gemini'],
      };

      const mockPoll = {
        id: 'poll-1',
        ...input,
        totalVotes: 0,
        deadline: null,
        topicId: null,
        createdAt: new Date(),
        options: [
          { id: 'opt-1', pollId: 'poll-1', optionText: 'GPT-4', voteCount: 0, displayOrder: 0 },
          { id: 'opt-2', pollId: 'poll-1', optionText: 'Claude', voteCount: 0, displayOrder: 1 },
          { id: 'opt-3', pollId: 'poll-1', optionText: 'Gemini', voteCount: 0, displayOrder: 2 },
        ],
      };

      mockPollRepository.createPoll.mockResolvedValue(mockPoll);

      const result = await pollService.createPoll(input);

      expect(result).toEqual(mockPoll);
      expect(mockPollRepository.createPoll).toHaveBeenCalledWith(input);
    });

    it('should reject poll with less than 2 options', async () => {
      const input = {
        question: 'Invalid poll?',
        pollType: 'single' as PollType,
        isAnonymous: true,
        options: ['Only one option'],
      };

      await expect(pollService.createPoll(input)).rejects.toThrow(
        'Poll must have at least 2 options'
      );

      expect(mockPollRepository.createPoll).not.toHaveBeenCalled();
    });

    it('should reject poll with more than 10 options', async () => {
      const input = {
        question: 'Too many options?',
        pollType: 'single' as PollType,
        isAnonymous: true,
        options: Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`),
      };

      await expect(pollService.createPoll(input)).rejects.toThrow(
        'Poll cannot have more than 10 options'
      );

      expect(mockPollRepository.createPoll).not.toHaveBeenCalled();
    });

    it('should reject poll with empty options', async () => {
      const input = {
        question: 'Empty option poll?',
        pollType: 'single' as PollType,
        isAnonymous: true,
        options: ['Valid option', '', 'Another valid'],
      };

      await expect(pollService.createPoll(input)).rejects.toThrow(
        'All poll options must be non-empty'
      );

      expect(mockPollRepository.createPoll).not.toHaveBeenCalled();
    });

    it('should reject poll with duplicate options', async () => {
      const input = {
        question: 'Duplicate options?',
        pollType: 'single' as PollType,
        isAnonymous: true,
        options: ['Option A', 'Option B', 'Option A'],
      };

      await expect(pollService.createPoll(input)).rejects.toThrow(
        'Poll options must be unique'
      );

      expect(mockPollRepository.createPoll).not.toHaveBeenCalled();
    });
  });

  describe('getPollById', () => {
    it('should return poll with results and user vote', async () => {
      const mockPoll = {
        id: 'poll-1',
        question: 'Test poll',
        pollType: 'single' as PollType,
        isAnonymous: true,
        deadline: null,
        totalVotes: 10,
        topicId: null,
        createdAt: new Date(),
        options: [
          { id: 'opt-1', pollId: 'poll-1', optionText: 'Option 1', voteCount: 7, displayOrder: 0 },
          { id: 'opt-2', pollId: 'poll-1', optionText: 'Option 2', voteCount: 3, displayOrder: 1 },
        ],
      };

      const mockUserVotes = [
        { id: 'vote-1', pollId: 'poll-1', optionId: 'opt-1', userId: 'user-1', createdAt: new Date() },
      ];

      const mockStats = {
        totalVotes: 10,
        options: [
          { id: 'opt-1', optionText: 'Option 1', voteCount: 7, percentage: 70 },
          { id: 'opt-2', optionText: 'Option 2', voteCount: 3, percentage: 30 },
        ],
      };

      mockPollRepository.findById.mockResolvedValue(mockPoll);
      mockPollRepository.findUserVote.mockResolvedValue(mockUserVotes);
      mockPollRepository.getVoteStatistics.mockResolvedValue(mockStats);
      mockPollRepository.isPollExpired.mockReturnValue(false);

      const result = await pollService.getPollById('poll-1', 'user-1');

      expect(result).toMatchObject({
        id: 'poll-1',
        question: 'Test poll',
        totalVotes: 10,
        options: mockStats.options,
        userVote: { optionIds: ['opt-1'] },
        hasExpired: false,
      });
    });

    it('should return null for non-existent poll', async () => {
      mockPollRepository.findById.mockResolvedValue(null);

      const result = await pollService.getPollById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('castVote', () => {
    const mockPoll = {
      id: 'poll-1',
      question: 'Test poll',
      pollType: 'single' as PollType,
      isAnonymous: true,
      deadline: null,
      totalVotes: 0,
      topicId: null,
      createdAt: new Date(),
      options: [
        { id: 'opt-1', pollId: 'poll-1', optionText: 'Option 1', voteCount: 0, displayOrder: 0 },
        { id: 'opt-2', pollId: 'poll-1', optionText: 'Option 2', voteCount: 0, displayOrder: 1 },
      ],
    };

    it('should cast vote successfully for single choice', async () => {
      mockPollRepository.findById.mockResolvedValue(mockPoll);
      mockPollRepository.isPollExpired.mockReturnValue(false);
      mockPollRepository.hasUserVoted.mockResolvedValue(false);
      mockPollRepository.castVote.mockResolvedValue([]);
      mockPollRepository.getVoteStatistics.mockResolvedValue({
        totalVotes: 1,
        options: [
          { id: 'opt-1', optionText: 'Option 1', voteCount: 1, percentage: 100 },
          { id: 'opt-2', optionText: 'Option 2', voteCount: 0, percentage: 0 },
        ],
      });
      mockPollRepository.findUserVote.mockResolvedValue([
        { id: 'vote-1', pollId: 'poll-1', optionId: 'opt-1', userId: 'user-1', createdAt: new Date() },
      ]);

      const result = await pollService.castVote({
        pollId: 'poll-1',
        userId: 'user-1',
        optionIds: ['opt-1'],
      });

      expect(result).toBeDefined();
      expect(mockPollRepository.castVote).toHaveBeenCalledWith('poll-1', 'user-1', ['opt-1']);
    });

    it('should reject vote on expired poll', async () => {
      mockPollRepository.findById.mockResolvedValue({
        ...mockPoll,
        deadline: new Date('2020-01-01'),
      });
      mockPollRepository.isPollExpired.mockReturnValue(true);

      await expect(
        pollService.castVote({
          pollId: 'poll-1',
          userId: 'user-1',
          optionIds: ['opt-1'],
        })
      ).rejects.toThrow('Poll has expired');
    });

    it('should reject duplicate vote on single choice poll', async () => {
      mockPollRepository.findById.mockResolvedValue(mockPoll);
      mockPollRepository.isPollExpired.mockReturnValue(false);
      mockPollRepository.hasUserVoted.mockResolvedValue(true);

      await expect(
        pollService.castVote({
          pollId: 'poll-1',
          userId: 'user-1',
          optionIds: ['opt-1'],
        })
      ).rejects.toThrow('already voted');
    });

    it('should reject multiple options for single choice poll', async () => {
      mockPollRepository.findById.mockResolvedValue(mockPoll);
      mockPollRepository.isPollExpired.mockReturnValue(false);
      mockPollRepository.hasUserVoted.mockResolvedValue(false);

      await expect(
        pollService.castVote({
          pollId: 'poll-1',
          userId: 'user-1',
          optionIds: ['opt-1', 'opt-2'],
        })
      ).rejects.toThrow('Single choice polls allow only one option');
    });

    it('should reject invalid option ID', async () => {
      mockPollRepository.findById.mockResolvedValue(mockPoll);
      mockPollRepository.isPollExpired.mockReturnValue(false);
      mockPollRepository.hasUserVoted.mockResolvedValue(false);

      await expect(
        pollService.castVote({
          pollId: 'poll-1',
          userId: 'user-1',
          optionIds: ['invalid-opt'],
        })
      ).rejects.toThrow('Invalid option ID');
    });
  });

  describe('deletePoll', () => {
    it('should delete poll successfully', async () => {
      mockPollRepository.deletePoll.mockResolvedValue(undefined);

      await expect(pollService.deletePoll('poll-1')).resolves.not.toThrow();

      expect(mockPollRepository.deletePoll).toHaveBeenCalledWith('poll-1');
    });
  });
});
