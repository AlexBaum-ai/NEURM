import { injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';
import * as Sentry from '@sentry/node';

/**
 * SpamDetectionService
 *
 * Provides spam detection and content analysis:
 * - Keyword-based spam detection
 * - Spam score calculation
 * - Auto-flagging based on thresholds
 * - ML model integration placeholder
 */

export interface SpamAnalysisResult {
  spamScore: number; // 0-100
  flaggedKeywords: string[];
  isSpam: boolean;
  reason: string;
  confidence: number; // 0-1
}

@injectable()
export class SpamDetectionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Analyze content for spam
   * Combines keyword matching, pattern detection, and heuristics
   */
  public async analyzeContent(content: string, title?: string): Promise<SpamAnalysisResult> {
    try {
      const fullText = `${title || ''} ${content}`.toLowerCase();

      // Get active spam keywords from database
      const spamKeywords = await this.getSpamKeywords();

      // Keyword-based detection
      const keywordScore = this.calculateKeywordScore(fullText, spamKeywords);

      // Pattern-based detection
      const patternScore = this.calculatePatternScore(fullText);

      // Heuristic-based detection
      const heuristicScore = this.calculateHeuristicScore(fullText, content);

      // Combine scores (weighted average)
      const spamScore = Math.round(
        keywordScore * 0.5 + patternScore * 0.3 + heuristicScore * 0.2
      );

      const flaggedKeywords = this.findFlaggedKeywords(fullText, spamKeywords);
      const isSpam = spamScore >= 75; // Default threshold
      const confidence = this.calculateConfidence(keywordScore, patternScore, heuristicScore);

      const reason = this.generateReason(flaggedKeywords, patternScore, heuristicScore);

      return {
        spamScore: Math.min(100, spamScore),
        flaggedKeywords,
        isSpam,
        reason,
        confidence,
      };
    } catch (error) {
      logger.error('Error analyzing content for spam:', error);
      Sentry.captureException(error);

      // Return safe default on error
      return {
        spamScore: 0,
        flaggedKeywords: [],
        isSpam: false,
        reason: 'Analysis failed',
        confidence: 0,
      };
    }
  }

  /**
   * Get active spam keywords from database
   */
  private async getSpamKeywords(): Promise<Array<{ keyword: string; severity: number }>> {
    try {
      const keywords = await this.prisma.spamKeyword.findMany({
        where: { isActive: true },
        select: { keyword: true, severity: true },
      });

      return keywords;
    } catch (error) {
      logger.error('Error fetching spam keywords:', error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Calculate spam score based on keyword matches
   */
  private calculateKeywordScore(
    text: string,
    keywords: Array<{ keyword: string; severity: number }>
  ): number {
    let score = 0;

    for (const { keyword, severity } of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        // Each match adds to score based on severity
        score += matches.length * severity * 10;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate spam score based on suspicious patterns
   */
  private calculatePatternScore(text: string): number {
    let score = 0;

    // Excessive links
    const linkCount = (text.match(/https?:\/\//gi) || []).length;
    if (linkCount > 5) score += 30;
    else if (linkCount > 3) score += 15;

    // Repeated characters
    if (/(.)\1{4,}/.test(text)) score += 15;

    // All caps
    const capsPercentage = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsPercentage > 0.5 && text.length > 20) score += 20;

    // Excessive exclamation marks
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount > 5) score += 15;

    // Suspicious phrases
    const suspiciousPhrases = [
      'click here',
      'buy now',
      'limited time',
      'act now',
      'free money',
      'make money fast',
      'work from home',
      'get paid',
      'no experience',
    ];

    for (const phrase of suspiciousPhrases) {
      if (text.includes(phrase)) score += 10;
    }

    // Cryptocurrency/financial spam indicators
    if (/(bitcoin|crypto|invest|profit|roi|guaranteed returns)/gi.test(text)) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate spam score based on content heuristics
   */
  private calculateHeuristicScore(text: string, rawContent: string): number {
    let score = 0;

    // Very short content
    if (text.length < 20) score += 20;

    // Very long content without structure
    if (rawContent.length > 2000 && !rawContent.includes('\n\n')) {
      score += 15;
    }

    // Excessive emojis
    const emojiCount = (rawContent.match(/[\u{1F600}-\u{1F64F}]/gu) || []).length;
    if (emojiCount > 10) score += 20;

    // Excessive numbers (phone numbers, etc.)
    const numberSequences = rawContent.match(/\d{8,}/g) || [];
    if (numberSequences.length > 2) score += 15;

    // Excessive special characters
    const specialChars = (rawContent.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const specialCharsRatio = specialChars / rawContent.length;
    if (specialCharsRatio > 0.3) score += 20;

    return Math.min(100, score);
  }

  /**
   * Find which keywords were matched
   */
  private findFlaggedKeywords(
    text: string,
    keywords: Array<{ keyword: string; severity: number }>
  ): string[] {
    const flagged: string[] = [];

    for (const { keyword } of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(text)) {
        flagged.push(keyword);
      }
    }

    return flagged;
  }

  /**
   * Calculate confidence level of spam detection
   */
  private calculateConfidence(
    keywordScore: number,
    patternScore: number,
    heuristicScore: number
  ): number {
    // High confidence if multiple detection methods agree
    const scores = [keywordScore, patternScore, heuristicScore];
    const highScores = scores.filter((s) => s > 50).length;

    if (highScores >= 2) return 0.9;
    if (highScores === 1 && Math.max(...scores) > 75) return 0.7;
    if (Math.max(...scores) > 50) return 0.5;

    return 0.3;
  }

  /**
   * Generate human-readable reason for spam detection
   */
  private generateReason(
    flaggedKeywords: string[],
    patternScore: number,
    heuristicScore: number
  ): string {
    const reasons: string[] = [];

    if (flaggedKeywords.length > 0) {
      reasons.push(`Contains spam keywords: ${flaggedKeywords.slice(0, 3).join(', ')}`);
    }

    if (patternScore > 50) {
      reasons.push('Suspicious patterns detected');
    }

    if (heuristicScore > 50) {
      reasons.push('Content structure indicates spam');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Low spam probability';
  }

  /**
   * Placeholder for ML model integration
   * Future: Integrate with ML model for advanced spam detection
   */
  public async analyzeWithMLModel(content: string): Promise<SpamAnalysisResult> {
    // TODO: Implement ML model integration
    // For now, fall back to rule-based detection
    logger.info('ML model not yet implemented, using rule-based detection');

    return this.analyzeContent(content);
  }

  /**
   * Add new spam keyword to database
   */
  public async addSpamKeyword(keyword: string, severity: number = 1): Promise<void> {
    try {
      await this.prisma.spamKeyword.create({
        data: {
          keyword: keyword.toLowerCase(),
          severity,
          isActive: true,
        },
      });

      logger.info(`Spam keyword added: ${keyword}`);
    } catch (error) {
      logger.error('Error adding spam keyword:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Update spam keyword severity
   */
  public async updateSpamKeyword(id: string, severity: number, isActive: boolean): Promise<void> {
    try {
      await this.prisma.spamKeyword.update({
        where: { id },
        data: { severity, isActive },
      });

      logger.info(`Spam keyword updated: ${id}`);
    } catch (error) {
      logger.error('Error updating spam keyword:', error);
      Sentry.captureException(error);
      throw error;
    }
  }
}
