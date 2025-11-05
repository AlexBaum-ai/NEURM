import * as Sentry from '@sentry/node';
import { Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { redis } from '@/config/redis';
import logger from '@/utils/logger';
import { NotFoundError, BadRequestError } from '@/utils/errors';

/**
 * MatchingService
 * Implements job matching algorithm with weighted scoring
 *
 * Weights:
 * - Skills: 40%
 * - Tech Stack: 20%
 * - Experience: 15%
 * - Location: 10%
 * - Salary: 10%
 * - Cultural Fit: 5%
 */

interface MatchScore {
  score: number;
  breakdown: {
    skills: number;
    techStack: number;
    experience: number;
    location: number;
    salary: number;
    culturalFit: number;
  };
  explanation: string[];
}

interface MatchFactor {
  name: string;
  score: number;
  weight: number;
  contribution: number;
  reason: string;
}

export class MatchingService {
  // Weights for each factor
  private readonly WEIGHTS = {
    skills: 0.4,
    techStack: 0.2,
    experience: 0.15,
    location: 0.1,
    salary: 0.1,
    culturalFit: 0.05,
  };

  // Cache TTL: 24 hours
  private readonly CACHE_TTL = 24 * 60 * 60;

  /**
   * Calculate match score between a job and candidate profile
   */
  async calculateMatchScore(jobId: string, userId: string): Promise<MatchScore> {
    try {
      // Check cache first
      const cachedScore = await this.getCachedMatchScore(jobId, userId);
      if (cachedScore) {
        logger.debug(`Cache hit for match score: job=${jobId}, user=${userId}`);
        return cachedScore;
      }

      // Fetch job with all necessary relations
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          skills: true,
          company: {
            select: {
              benefits: true,
              cultureDescription: true,
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      // Fetch user profile with all necessary data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          skills: true,
          userModels: {
            include: {
              model: true,
            },
          },
          workExperiences: {
            orderBy: { startDate: 'desc' },
            take: 1,
          },
          profile: true,
          jobPreferences: true,
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Calculate individual factor scores
      const skillsScore = this.calculateSkillsMatch(job, user);
      const techStackScore = this.calculateTechStackMatch(job, user);
      const experienceScore = this.calculateExperienceMatch(job, user);
      const locationScore = this.calculateLocationMatch(job, user);
      const salaryScore = this.calculateSalaryMatch(job, user);
      const culturalFitScore = this.calculateCulturalFitMatch(job, user);

      // Calculate weighted total score
      const totalScore =
        skillsScore * this.WEIGHTS.skills +
        techStackScore * this.WEIGHTS.techStack +
        experienceScore * this.WEIGHTS.experience +
        locationScore * this.WEIGHTS.location +
        salaryScore * this.WEIGHTS.salary +
        culturalFitScore * this.WEIGHTS.culturalFit;

      // Generate explanation
      const factors: MatchFactor[] = [
        {
          name: 'Skills',
          score: skillsScore,
          weight: this.WEIGHTS.skills,
          contribution: skillsScore * this.WEIGHTS.skills,
          reason: this.generateSkillsReason(skillsScore, job, user),
        },
        {
          name: 'Tech Stack',
          score: techStackScore,
          weight: this.WEIGHTS.techStack,
          contribution: techStackScore * this.WEIGHTS.techStack,
          reason: this.generateTechStackReason(techStackScore, job, user),
        },
        {
          name: 'Experience',
          score: experienceScore,
          weight: this.WEIGHTS.experience,
          contribution: experienceScore * this.WEIGHTS.experience,
          reason: this.generateExperienceReason(experienceScore, job, user),
        },
        {
          name: 'Location',
          score: locationScore,
          weight: this.WEIGHTS.location,
          contribution: locationScore * this.WEIGHTS.location,
          reason: this.generateLocationReason(locationScore, job, user),
        },
        {
          name: 'Salary',
          score: salaryScore,
          weight: this.WEIGHTS.salary,
          contribution: salaryScore * this.WEIGHTS.salary,
          reason: this.generateSalaryReason(salaryScore, job, user),
        },
        {
          name: 'Cultural Fit',
          score: culturalFitScore,
          weight: this.WEIGHTS.culturalFit,
          contribution: culturalFitScore * this.WEIGHTS.culturalFit,
          reason: this.generateCulturalFitReason(culturalFitScore, job, user),
        },
      ];

      // Sort by contribution and get top 3
      const topFactors = factors
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 3);

      const matchScore: MatchScore = {
        score: Math.round(totalScore),
        breakdown: {
          skills: Math.round(skillsScore),
          techStack: Math.round(techStackScore),
          experience: Math.round(experienceScore),
          location: Math.round(locationScore),
          salary: Math.round(salaryScore),
          culturalFit: Math.round(culturalFitScore),
        },
        explanation: topFactors.map((f) => f.reason),
      };

      // Cache the result
      await this.cacheMatchScore(jobId, userId, matchScore);

      return matchScore;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Sentry.captureException(error, {
        tags: { service: 'MatchingService', method: 'calculateMatchScore' },
        extra: { jobId, userId },
      });
      throw error;
    }
  }

  /**
   * Calculate skills match using Jaccard similarity with proficiency weighting
   */
  private calculateSkillsMatch(job: any, user: any): number {
    const jobSkills = job.skills || [];
    const userSkills = user.skills || [];

    if (jobSkills.length === 0) {
      return 100; // No skills required, perfect match
    }

    if (userSkills.length === 0) {
      return 0; // No skills, no match
    }

    // Create maps for quick lookup
    const jobSkillMap = new Map(
      jobSkills.map((s: any) => [s.skillName.toLowerCase(), s])
    );
    const userSkillMap = new Map(
      userSkills.map((s: any) => [s.skillName.toLowerCase(), s])
    );

    let totalRequiredWeight = 0;
    let matchedWeight = 0;

    // Calculate weighted matches
    for (const [skillName, jobSkill] of jobSkillMap) {
      const weight = jobSkill.isRequired ? 2 : 1;
      totalRequiredWeight += weight;

      const userSkill = userSkillMap.get(skillName);
      if (userSkill) {
        // Calculate proficiency match (0-100)
        const proficiencyRatio = Math.min(
          userSkill.proficiency / jobSkill.requiredLevel,
          1.0
        );
        matchedWeight += weight * proficiencyRatio;
      }
    }

    return (matchedWeight / totalRequiredWeight) * 100;
  }

  /**
   * Calculate tech stack match (models, frameworks, languages)
   */
  private calculateTechStackMatch(job: any, user: any): number {
    const userModels = user.userModels?.map((um: any) => um.model.name.toLowerCase()) || [];
    const jobModels = job.primaryLlms?.map((m: string) => m.toLowerCase()) || [];

    const userFrameworks: string[] = [];
    const jobFrameworks = job.frameworks?.map((f: string) => f.toLowerCase()) || [];

    const userLanguages: string[] = [];
    const jobLanguages = job.programmingLanguages?.map((l: string) => l.toLowerCase()) || [];

    // Extract frameworks and languages from work experience
    user.workExperiences?.forEach((exp: any) => {
      if (exp.techStack) {
        const stack = exp.techStack as any;
        if (Array.isArray(stack.frameworks)) {
          userFrameworks.push(...stack.frameworks.map((f: string) => f.toLowerCase()));
        }
        if (Array.isArray(stack.languages)) {
          userLanguages.push(...stack.languages.map((l: string) => l.toLowerCase()));
        }
      }
    });

    // Calculate Jaccard similarity for each category
    const modelsSimilarity = this.jaccardSimilarity(
      new Set(userModels),
      new Set(jobModels)
    );
    const frameworksSimilarity = this.jaccardSimilarity(
      new Set(userFrameworks),
      new Set(jobFrameworks)
    );
    const languagesSimilarity = this.jaccardSimilarity(
      new Set(userLanguages),
      new Set(jobLanguages)
    );

    // Weighted average (models most important)
    const score =
      modelsSimilarity * 0.5 +
      frameworksSimilarity * 0.3 +
      languagesSimilarity * 0.2;

    return score * 100;
  }

  /**
   * Calculate Jaccard similarity between two sets
   */
  private jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 && set2.size === 0) {
      return 1.0;
    }
    if (set1.size === 0 || set2.size === 0) {
      return 0.0;
    }

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate experience level match
   */
  private calculateExperienceMatch(job: any, user: any): number {
    const jobLevel = job.experienceLevel;
    const userYearsExp = user.profile?.yearsExperience || 0;

    // Map experience levels to years
    const levelToYears: Record<string, { min: number; max: number }> = {
      entry: { min: 0, max: 1 },
      junior: { min: 1, max: 3 },
      mid: { min: 3, max: 6 },
      senior: { min: 6, max: 10 },
      lead: { min: 8, max: 15 },
      principal: { min: 10, max: 99 },
    };

    const requiredRange = levelToYears[jobLevel];
    if (!requiredRange) {
      return 50; // Unknown level, neutral score
    }

    // Perfect match if within range
    if (userYearsExp >= requiredRange.min && userYearsExp <= requiredRange.max) {
      return 100;
    }

    // Calculate distance from range
    const distance = userYearsExp < requiredRange.min
      ? requiredRange.min - userYearsExp
      : userYearsExp - requiredRange.max;

    // Penalize based on distance (max penalty at 5+ years difference)
    const penalty = Math.min(distance * 15, 75);
    return Math.max(100 - penalty, 0);
  }

  /**
   * Calculate location match
   */
  private calculateLocationMatch(job: any, user: any): number {
    const jobWorkLocation = job.workLocation;
    const userPreferences = user.jobPreferences;

    if (!userPreferences) {
      return 50; // No preferences, neutral score
    }

    const userWorkLocations = userPreferences.workLocations || [];
    const userPreferredLocations = userPreferences.preferredLocations || [];

    // Remote jobs are flexible
    if (jobWorkLocation === 'remote') {
      if (userWorkLocations.includes('remote')) {
        return 100;
      }
      return 80; // Most people are okay with remote
    }

    // Hybrid jobs
    if (jobWorkLocation === 'hybrid') {
      if (userWorkLocations.includes('hybrid') || userWorkLocations.includes('remote')) {
        return 90;
      }
      if (userWorkLocations.includes('onsite')) {
        return 70;
      }
      return 50;
    }

    // Onsite jobs - check location match
    if (jobWorkLocation === 'onsite') {
      if (!userWorkLocations.includes('onsite') && !userPreferences.openToRelocation) {
        return 20; // Not willing to work onsite or relocate
      }

      // Check if job location matches preferred locations
      const jobLocation = job.location?.toLowerCase() || '';
      const locationMatch = userPreferredLocations.some((loc: string) =>
        jobLocation.includes(loc.toLowerCase()) || loc.toLowerCase().includes(jobLocation)
      );

      if (locationMatch) {
        return 100;
      }

      if (userPreferences.openToRelocation) {
        return 60;
      }

      return 30;
    }

    return 50;
  }

  /**
   * Calculate salary match
   */
  private calculateSalaryMatch(job: any, user: any): number {
    const userPreferences = user.jobPreferences;

    if (!userPreferences) {
      return 50; // No preferences, neutral score
    }

    const userMin = userPreferences.salaryExpectationMin
      ? Number(userPreferences.salaryExpectationMin)
      : null;
    const userMax = userPreferences.salaryExpectationMax
      ? Number(userPreferences.salaryExpectationMax)
      : null;

    const jobMin = job.salaryMin ? Number(job.salaryMin) : null;
    const jobMax = job.salaryMax ? Number(job.salaryMax) : null;

    // No salary information
    if (!jobMin && !jobMax) {
      return 50;
    }

    if (!userMin && !userMax) {
      return 50;
    }

    // Check if ranges overlap
    const jobAvg = jobMin && jobMax ? (jobMin + jobMax) / 2 : jobMin || jobMax || 0;
    const userAvg = userMin && userMax ? (userMin + userMax) / 2 : userMin || userMax || 0;

    // Perfect match if job salary meets or exceeds expectations
    if (jobAvg >= userAvg) {
      return 100;
    }

    // Calculate how far below expectations
    const difference = ((userAvg - jobAvg) / userAvg) * 100;

    // Penalize based on difference
    if (difference <= 10) {
      return 90;
    }
    if (difference <= 20) {
      return 70;
    }
    if (difference <= 30) {
      return 50;
    }

    return Math.max(30 - difference, 0);
  }

  /**
   * Calculate cultural fit (basic implementation using benefits)
   */
  private calculateCulturalFitMatch(job: any, user: any): number {
    // This is a simplified implementation
    // In a real system, this would analyze company values, work style, etc.

    const userPreferences = user.jobPreferences?.companyPreferences || {};
    const companyBenefits = job.company?.benefits || [];

    if (companyBenefits.length === 0) {
      return 50; // No information, neutral score
    }

    // Check for common preferred benefits
    const preferredBenefits = [
      'health insurance',
      'remote work',
      'flexible hours',
      'professional development',
      'equity',
    ];

    const matchCount = preferredBenefits.filter((benefit) =>
      companyBenefits.some((cb: string) =>
        cb.toLowerCase().includes(benefit.toLowerCase())
      )
    ).length;

    return (matchCount / preferredBenefits.length) * 100;
  }

  /**
   * Generate reason text for skills factor
   */
  private generateSkillsReason(score: number, job: any, user: any): string {
    const jobSkills = job.skills || [];
    const userSkills = user.skills || [];

    const matchedSkills = jobSkills.filter((js: any) =>
      userSkills.some(
        (us: any) => us.skillName.toLowerCase() === js.skillName.toLowerCase()
      )
    );

    const matchedCount = matchedSkills.length;
    const totalRequired = jobSkills.filter((s: any) => s.isRequired).length;

    if (score >= 80) {
      return `Strong skills match: ${matchedCount}/${jobSkills.length} required skills`;
    }
    if (score >= 60) {
      return `Good skills match: ${matchedCount}/${jobSkills.length} skills matched`;
    }
    if (score >= 40) {
      return `Moderate skills match: ${matchedCount}/${jobSkills.length} skills matched`;
    }
    return `Limited skills match: ${matchedCount}/${jobSkills.length} skills matched`;
  }

  /**
   * Generate reason text for tech stack factor
   */
  private generateTechStackReason(score: number, job: any, user: any): string {
    const userModels = user.userModels?.map((um: any) => um.model.name) || [];
    const jobModels = job.primaryLlms || [];

    const matchedModels = jobModels.filter((jm: string) =>
      userModels.some((um: string) => um.toLowerCase() === jm.toLowerCase())
    );

    if (score >= 80) {
      return `Excellent tech stack alignment with ${matchedModels.length} matching LLMs`;
    }
    if (score >= 60) {
      return `Good tech stack match: experience with ${matchedModels.join(', ')}`;
    }
    if (score >= 40) {
      return `Some tech stack overlap: ${matchedModels.length} matching technologies`;
    }
    return `Limited tech stack alignment with required tools`;
  }

  /**
   * Generate reason text for experience factor
   */
  private generateExperienceReason(score: number, job: any, user: any): string {
    const jobLevel = job.experienceLevel;
    const userYearsExp = user.profile?.yearsExperience || 0;

    if (score >= 90) {
      return `Perfect experience match for ${jobLevel} level (${userYearsExp} years)`;
    }
    if (score >= 70) {
      return `Good experience fit: ${userYearsExp} years for ${jobLevel} role`;
    }
    if (score >= 50) {
      return `Acceptable experience level: ${userYearsExp} years experience`;
    }
    return `Experience level may not align with ${jobLevel} requirements`;
  }

  /**
   * Generate reason text for location factor
   */
  private generateLocationReason(score: number, job: any, user: any): string {
    const jobWorkLocation = job.workLocation;

    if (score >= 90) {
      return `Ideal ${jobWorkLocation} work arrangement matches your preference`;
    }
    if (score >= 70) {
      return `Compatible ${jobWorkLocation} work location`;
    }
    if (score >= 50) {
      return `${jobWorkLocation} work location is workable`;
    }
    return `${jobWorkLocation} arrangement may not match your preference`;
  }

  /**
   * Generate reason text for salary factor
   */
  private generateSalaryReason(score: number, job: any, user: any): string {
    if (score >= 90) {
      return `Salary range meets or exceeds your expectations`;
    }
    if (score >= 70) {
      return `Competitive salary within your expected range`;
    }
    if (score >= 50) {
      return `Salary is close to your expectations`;
    }
    return `Salary may be below your expectations`;
  }

  /**
   * Generate reason text for cultural fit factor
   */
  private generateCulturalFitReason(score: number, job: any, user: any): string {
    const companyBenefits = job.company?.benefits || [];

    if (score >= 80) {
      return `Strong cultural fit with ${companyBenefits.length} matching benefits`;
    }
    if (score >= 60) {
      return `Good cultural alignment with company values`;
    }
    if (score >= 40) {
      return `Some cultural fit indicators present`;
    }
    return `Limited cultural fit information available`;
  }

  /**
   * Get cached match score from Redis
   */
  private async getCachedMatchScore(
    jobId: string,
    userId: string
  ): Promise<MatchScore | null> {
    try {
      const key = `match_score:${userId}:${jobId}`;
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.error('Failed to get cached match score', { error, jobId, userId });
      return null;
    }
  }

  /**
   * Cache match score in Redis
   */
  private async cacheMatchScore(
    jobId: string,
    userId: string,
    matchScore: MatchScore
  ): Promise<void> {
    try {
      const key = `match_score:${userId}:${jobId}`;
      await redis.setex(key, this.CACHE_TTL, JSON.stringify(matchScore));
    } catch (error) {
      logger.error('Failed to cache match score', { error, jobId, userId });
      // Don't throw, caching failure shouldn't break the flow
    }
  }

  /**
   * Invalidate cached match score
   */
  async invalidateMatchScore(jobId: string, userId: string): Promise<void> {
    try {
      const key = `match_score:${userId}:${jobId}`;
      await redis.del(key);
    } catch (error) {
      logger.error('Failed to invalidate match score', { error, jobId, userId });
    }
  }

  /**
   * Invalidate all match scores for a user (called when profile is updated)
   */
  async invalidateUserMatches(userId: string): Promise<void> {
    try {
      const pattern = `match_score:${userId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Invalidated ${keys.length} match scores for user ${userId}`);
      }
    } catch (error) {
      logger.error('Failed to invalidate user matches', { error, userId });
    }
  }

  /**
   * Get match scores for multiple jobs (for listing)
   */
  async getMatchScoresForJobs(
    jobIds: string[],
    userId: string
  ): Promise<Map<string, MatchScore>> {
    const scores = new Map<string, MatchScore>();

    // Calculate scores in parallel
    const promises = jobIds.map(async (jobId) => {
      try {
        const score = await this.calculateMatchScore(jobId, userId);
        scores.set(jobId, score);
      } catch (error) {
        logger.error('Failed to calculate match score', { error, jobId, userId });
        // Skip this job if calculation fails
      }
    });

    await Promise.all(promises);

    return scores;
  }
}

export default MatchingService;
