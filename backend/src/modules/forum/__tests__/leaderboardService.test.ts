import { LeaderboardService } from '../services/leaderboardService';
import { LeaderboardRepository, LeaderboardPeriod } from '../repositories/LeaderboardRepository';
import redisClient from '@/config/redisClient';

// Mock dependencies
jest.mock('../repositories/LeaderboardRepository');
jest.mock('@/config/redisClient');

describe('LeaderboardService', () => {
  let leaderboardService: LeaderboardService;
  let mockLeaderboardRepository: jest.Mocked<LeaderboardRepository>;
  let mockRedisClient: jest.Mocked<typeof redisClient>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock repository
    mockLeaderboardRepository = {
      getLeaderboard: jest.fn(),
      getUserRank: jest.fn(),
      getLeaderboardStats: jest.fn(),
      calculateAndStoreRankings: jest.fn(),
      getHallOfFame: jest.fn(),
      getPeriodBoundaries: jest.fn(),
    } as any;

    // Create mock Redis client
    mockRedisClient = {
      getJSON: jest.fn(),
      setJSON: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    } as any;

    // Replace actual Redis client with mock
    (redisClient.getJSON as jest.Mock) = mockRedisClient.getJSON;
    (redisClient.setJSON as jest.Mock) = mockRedisClient.setJSON;
    (redisClient.del as jest.Mock) = mockRedisClient.del;
    (redisClient.delPattern as jest.Mock) = mockRedisClient.delPattern;

    // Create service with mocked dependencies
    leaderboardService = new LeaderboardService(mockLeaderboardRepository);
  });

  describe('getLeaderboard', () => {
    it('should return cached leaderboard if available', async () => {
      // Arrange
      const period: LeaderboardPeriod = 'weekly';
      const cachedData = {
        period,
        entries: [
          {
            rank: 1,
            userId: 'user1',
            username: 'johndoe',
            displayName: 'John Doe',
            avatarUrl: 'https://example.com/avatar.jpg',
            reputationGain: 500,
            postCount: 10,
            replyCount: 25,
            acceptedAnswers: 5,
            totalReputation: 1000,
          },
        ],
        stats: {
          period,
          totalUsers: 100,
          topReputationGain: 500,
          updatedAt: new Date(),
        },
        updatedAt: new Date(),
      };

      mockRedisClient.getJSON.mockResolvedValue(cachedData);

      // Act
      const result = await leaderboardService.getLeaderboard(period);

      // Assert
      expect(result).toEqual(cachedData);
      expect(mockRedisClient.getJSON).toHaveBeenCalledWith('leaderboard:weekly');
      expect(mockLeaderboardRepository.getLeaderboard).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      // Arrange
      const period: LeaderboardPeriod = 'monthly';
      const entries = [
        {
          rank: 1,
          userId: 'user1',
          username: 'janedoe',
          displayName: 'Jane Doe',
          avatarUrl: null,
          reputationGain: 800,
          postCount: 15,
          replyCount: 30,
          acceptedAnswers: 8,
          totalReputation: 1500,
        },
      ];
      const stats = {
        period,
        totalUsers: 200,
        topReputationGain: 800,
        updatedAt: new Date(),
      };

      mockRedisClient.getJSON.mockResolvedValue(null);
      mockLeaderboardRepository.getLeaderboard.mockResolvedValue(entries);
      mockLeaderboardRepository.getLeaderboardStats.mockResolvedValue(stats);

      // Act
      const result = await leaderboardService.getLeaderboard(period);

      // Assert
      expect(result.period).toBe(period);
      expect(result.entries).toEqual(entries);
      expect(result.stats).toEqual(stats);
      expect(mockLeaderboardRepository.getLeaderboard).toHaveBeenCalledWith(period, 50);
      expect(mockRedisClient.setJSON).toHaveBeenCalledWith(
        'leaderboard:monthly',
        expect.any(Object),
        3600
      );
    });

    it('should fetch top 100 for all-time leaderboard', async () => {
      // Arrange
      const period: LeaderboardPeriod = 'all-time';
      mockRedisClient.getJSON.mockResolvedValue(null);
      mockLeaderboardRepository.getLeaderboard.mockResolvedValue([]);
      mockLeaderboardRepository.getLeaderboardStats.mockResolvedValue(null);

      // Act
      await leaderboardService.getLeaderboard(period);

      // Assert
      expect(mockLeaderboardRepository.getLeaderboard).toHaveBeenCalledWith(period, 100);
    });
  });

  describe('getUserRankings', () => {
    it('should return cached user rankings if available', async () => {
      // Arrange
      const userId = 'user123';
      const cachedRankings = {
        weekly: {
          period: 'weekly' as LeaderboardPeriod,
          rank: 10,
          reputationGain: 100,
          totalUsers: 500,
          percentile: 98,
        },
        monthly: {
          period: 'monthly' as LeaderboardPeriod,
          rank: 25,
          reputationGain: 400,
          totalUsers: 1000,
          percentile: 97.5,
        },
        allTime: {
          period: 'all-time' as LeaderboardPeriod,
          rank: 150,
          reputationGain: 2000,
          totalUsers: 5000,
          percentile: 97,
        },
      };

      mockRedisClient.getJSON.mockResolvedValue(cachedRankings);

      // Act
      const result = await leaderboardService.getUserRankings(userId);

      // Assert
      expect(result).toEqual(cachedRankings);
      expect(mockRedisClient.getJSON).toHaveBeenCalledWith('leaderboard:user:user123');
      expect(mockLeaderboardRepository.getUserRank).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      // Arrange
      const userId = 'user456';
      const weeklyRank = {
        period: 'weekly' as LeaderboardPeriod,
        rank: 5,
        reputationGain: 200,
        totalUsers: 300,
        percentile: 98.3,
      };
      const monthlyRank = {
        period: 'monthly' as LeaderboardPeriod,
        rank: 15,
        reputationGain: 500,
        totalUsers: 800,
        percentile: 98.1,
      };
      const allTimeRank = {
        period: 'all-time' as LeaderboardPeriod,
        rank: 100,
        reputationGain: 3000,
        totalUsers: 10000,
        percentile: 99,
      };

      mockRedisClient.getJSON.mockResolvedValue(null);
      mockLeaderboardRepository.getUserRank
        .mockResolvedValueOnce(weeklyRank)
        .mockResolvedValueOnce(monthlyRank)
        .mockResolvedValueOnce(allTimeRank);

      // Act
      const result = await leaderboardService.getUserRankings(userId);

      // Assert
      expect(result.weekly).toEqual(weeklyRank);
      expect(result.monthly).toEqual(monthlyRank);
      expect(result.allTime).toEqual(allTimeRank);
      expect(mockLeaderboardRepository.getUserRank).toHaveBeenCalledTimes(3);
      expect(mockRedisClient.setJSON).toHaveBeenCalled();
    });
  });

  describe('recalculateRankings', () => {
    it('should recalculate rankings and clear cache', async () => {
      // Arrange
      const period: LeaderboardPeriod = 'weekly';
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-08');

      mockLeaderboardRepository.getPeriodBoundaries.mockReturnValue({ start, end });
      mockLeaderboardRepository.calculateAndStoreRankings.mockResolvedValue(150);

      // Act
      const result = await leaderboardService.recalculateRankings(period);

      // Assert
      expect(result).toBe(150);
      expect(mockLeaderboardRepository.getPeriodBoundaries).toHaveBeenCalledWith(period);
      expect(mockLeaderboardRepository.calculateAndStoreRankings).toHaveBeenCalledWith(
        period,
        start,
        end
      );
      expect(mockRedisClient.del).toHaveBeenCalledWith('leaderboard:weekly');
    });
  });

  describe('recalculateAllRankings', () => {
    it('should recalculate all periods and clear all caches', async () => {
      // Arrange
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-08');

      mockLeaderboardRepository.getPeriodBoundaries.mockReturnValue({ start, end });
      mockLeaderboardRepository.calculateAndStoreRankings
        .mockResolvedValueOnce(100) // weekly
        .mockResolvedValueOnce(200) // monthly
        .mockResolvedValueOnce(500); // all-time

      // Act
      const result = await leaderboardService.recalculateAllRankings();

      // Assert
      expect(result).toEqual({
        weekly: 100,
        monthly: 200,
        allTime: 500,
      });
      expect(mockLeaderboardRepository.calculateAndStoreRankings).toHaveBeenCalledTimes(3);
      expect(mockRedisClient.delPattern).toHaveBeenCalledWith('leaderboard:*');
    });
  });

  describe('getHallOfFame', () => {
    it('should return cached Hall of Fame if available', async () => {
      // Arrange
      const cachedHallOfFame = {
        period: 'monthly' as LeaderboardPeriod,
        entries: [
          {
            rank: 1,
            userId: 'legend1',
            username: 'legend',
            displayName: 'Legend User',
            avatarUrl: 'https://example.com/legend.jpg',
            reputationGain: 10000,
            postCount: 0,
            replyCount: 0,
            acceptedAnswers: 0,
            totalReputation: 50000,
          },
        ],
        stats: null,
        updatedAt: new Date(),
      };

      mockRedisClient.getJSON.mockResolvedValue(cachedHallOfFame);

      // Act
      const result = await leaderboardService.getHallOfFame();

      // Assert
      expect(result).toEqual(cachedHallOfFame);
      expect(mockRedisClient.getJSON).toHaveBeenCalledWith('leaderboard:hall-of-fame');
      expect(mockLeaderboardRepository.getHallOfFame).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not in cache', async () => {
      // Arrange
      const entries = [
        {
          rank: 1,
          userId: 'legend1',
          username: 'legend',
          displayName: 'Legend User',
          avatarUrl: null,
          reputationGain: 9000,
          postCount: 0,
          replyCount: 0,
          acceptedAnswers: 0,
          totalReputation: 45000,
        },
      ];

      mockRedisClient.getJSON.mockResolvedValue(null);
      mockLeaderboardRepository.getHallOfFame.mockResolvedValue(entries);

      // Act
      const result = await leaderboardService.getHallOfFame();

      // Assert
      expect(result.entries).toEqual(entries);
      expect(mockLeaderboardRepository.getHallOfFame).toHaveBeenCalledWith(50);
      expect(mockRedisClient.setJSON).toHaveBeenCalled();
    });
  });
});
