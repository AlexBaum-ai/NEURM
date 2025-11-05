import { PrismaClient, Prisma } from '@prisma/client';
import { CandidateSearchInput } from './candidateSearch.validation';

/**
 * Candidate Search Result Type
 */
export interface CandidateSearchResult {
  userId: string;
  username: string;
  displayName: string | null;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  yearsExperience: number | null;
  availabilityStatus: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  website: string | null;
  skills: Array<{
    skillName: string;
    skillType: string;
    proficiency: number;
  }>;
  models: Array<{
    modelName: string;
    proficiency: number;
  }>;
  workExperience: Array<{
    title: string;
    company: string;
    startDate: Date;
    endDate: Date | null;
  }>;
  jobPreferences: {
    rolesInterested: string[];
    jobTypes: string[];
    workLocations: string[];
    salaryExpectationMin: number | null;
    salaryExpectationMax: number | null;
    salaryCurrency: string | null;
  } | null;
  reputation: number;
  profileViews: number;
  matchScore?: number; // Optional calculated match score
}

export class CandidateSearchRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Search for candidates with filters and pagination
   */
  async searchCandidates(
    filters: CandidateSearchInput,
    companyId?: string
  ): Promise<{ candidates: CandidateSearchResult[]; total: number }> {
    const {
      query,
      skills,
      experience,
      experienceMin,
      experienceMax,
      models,
      frameworks,
      location,
      remotePreference,
      availabilityStatus,
      salaryMin,
      salaryMax,
      salaryCurrency,
      jobTypes,
      operator = 'AND',
      sortBy = 'match_score',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    const whereConditions: Prisma.UserWhereInput = {
      status: 'active',
      accountType: 'individual',
      profile: {
        isNot: null,
      },
      jobPreferences: {
        visibleToRecruiters: true,
      },
    };

    // Text search on profile fields
    if (query) {
      // Use PostgreSQL full-text search
      whereConditions.OR = [
        {
          profile: {
            OR: [
              { headline: { contains: query, mode: 'insensitive' } },
              { bio: { contains: query, mode: 'insensitive' } },
              { displayName: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
        {
          username: { contains: query, mode: 'insensitive' },
        },
      ];
    }

    // Skills filter
    if (skills && skills.length > 0) {
      const skillCondition = operator === 'AND'
        ? { AND: skills.map(skill => ({
            skills: {
              some: {
                skillName: { equals: skill, mode: 'insensitive' },
              },
            },
          }))
        }
        : {
            skills: {
              some: {
                skillName: { in: skills, mode: 'insensitive' },
              },
            },
          };

      Object.assign(whereConditions, skillCondition);
    }

    // Experience filter
    if (experienceMin !== undefined || experienceMax !== undefined) {
      whereConditions.profile = {
        ...whereConditions.profile,
        yearsExperience: {
          ...(experienceMin !== undefined && { gte: experienceMin }),
          ...(experienceMax !== undefined && { lte: experienceMax }),
        },
      };
    }

    // Models filter
    if (models && models.length > 0) {
      const modelCondition = operator === 'AND'
        ? { AND: models.map(model => ({
            userModels: {
              some: {
                model: {
                  name: { equals: model, mode: 'insensitive' },
                },
              },
            },
          }))
        }
        : {
            userModels: {
              some: {
                model: {
                  name: { in: models, mode: 'insensitive' },
                },
              },
            },
          };

      Object.assign(whereConditions, modelCondition);
    }

    // Location filter
    if (location) {
      whereConditions.profile = {
        ...whereConditions.profile,
        location: { contains: location, mode: 'insensitive' },
      };
    }

    // Remote preference filter
    if (remotePreference && remotePreference !== 'any') {
      whereConditions.jobPreferences = {
        ...whereConditions.jobPreferences,
        workLocations: { has: remotePreference },
      };
    }

    // Availability status filter
    if (availabilityStatus) {
      whereConditions.profile = {
        ...whereConditions.profile,
        availabilityStatus,
      };
    }

    // Salary expectations filter
    if (salaryMin !== undefined || salaryMax !== undefined) {
      const salaryConditions: any = {};

      if (salaryMin !== undefined) {
        salaryConditions.salaryExpectationMax = { gte: salaryMin };
      }

      if (salaryMax !== undefined) {
        salaryConditions.salaryExpectationMin = { lte: salaryMax };
      }

      if (salaryCurrency) {
        salaryConditions.salaryCurrency = salaryCurrency;
      }

      whereConditions.jobPreferences = {
        ...whereConditions.jobPreferences,
        ...salaryConditions,
      };
    }

    // Job types filter
    if (jobTypes && jobTypes.length > 0) {
      whereConditions.jobPreferences = {
        ...whereConditions.jobPreferences,
        jobTypes: { hasSome: jobTypes },
      };
    }

    // Check privacy settings - ensure sections are visible to recruiters
    const privacyCondition = {
      OR: [
        // No privacy settings (default public)
        { privacySettings: { none: {} } },
        // Or all sections are public or visible to recruiters
        {
          privacySettings: {
            every: {
              visibility: { in: ['public', 'recruiters'] },
            },
          },
        },
      ],
    };

    Object.assign(whereConditions, privacyCondition);

    // Build ORDER BY clause
    let orderBy: Prisma.UserOrderByWithRelationInput = {};

    switch (sortBy) {
      case 'reputation':
        orderBy = { reputation: { totalPoints: sortOrder } };
        break;
      case 'years_experience':
        orderBy = { profile: { yearsExperience: sortOrder } };
        break;
      case 'recent_activity':
        orderBy = { updatedAt: sortOrder };
        break;
      case 'created_at':
        orderBy = { createdAt: sortOrder };
        break;
      case 'profile_views':
      case 'match_score':
      default:
        // For profile_views and match_score, we'll sort in memory after fetching
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Execute query with pagination
    const [candidates, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereConditions,
        include: {
          profile: true,
          skills: {
            orderBy: { proficiency: 'desc' },
            take: 10,
          },
          userModels: {
            include: {
              model: true,
            },
            orderBy: { proficiency: 'desc' },
            take: 5,
          },
          workExperiences: {
            orderBy: { startDate: 'desc' },
            take: 3,
          },
          jobPreferences: true,
          reputation: true,
          profile: {
            include: {
              profileViewsReceived: {
                select: { id: true },
              },
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({ where: whereConditions }),
    ]);

    // Map to result format
    const results: CandidateSearchResult[] = candidates.map((candidate) => ({
      userId: candidate.id,
      username: candidate.username,
      displayName: candidate.profile?.displayName || null,
      headline: candidate.profile?.headline || null,
      bio: candidate.profile?.bio || null,
      avatarUrl: candidate.profile?.avatarUrl || null,
      location: candidate.profile?.location || null,
      yearsExperience: candidate.profile?.yearsExperience || null,
      availabilityStatus: candidate.profile?.availabilityStatus || null,
      githubUrl: candidate.profile?.githubUrl || null,
      linkedinUrl: candidate.profile?.linkedinUrl || null,
      website: candidate.profile?.website || null,
      skills: candidate.skills.map((skill) => ({
        skillName: skill.skillName,
        skillType: skill.skillType,
        proficiency: skill.proficiency,
      })),
      models: candidate.userModels.map((um) => ({
        modelName: um.model.name,
        proficiency: um.proficiency,
      })),
      workExperience: candidate.workExperiences.map((we) => ({
        title: we.title,
        company: we.company,
        startDate: we.startDate,
        endDate: we.endDate,
      })),
      jobPreferences: candidate.jobPreferences
        ? {
            rolesInterested: candidate.jobPreferences.rolesInterested,
            jobTypes: candidate.jobPreferences.jobTypes,
            workLocations: candidate.jobPreferences.workLocations,
            salaryExpectationMin: candidate.jobPreferences.salaryExpectationMin
              ? Number(candidate.jobPreferences.salaryExpectationMin)
              : null,
            salaryExpectationMax: candidate.jobPreferences.salaryExpectationMax
              ? Number(candidate.jobPreferences.salaryExpectationMax)
              : null,
            salaryCurrency: candidate.jobPreferences.salaryCurrency,
          }
        : null,
      reputation: candidate.reputation?.totalPoints || 0,
      profileViews: candidate.profile?.profileViewsReceived?.length || 0,
    }));

    // Sort by profile_views or match_score in memory if needed
    if (sortBy === 'profile_views') {
      results.sort((a, b) =>
        sortOrder === 'desc'
          ? b.profileViews - a.profileViews
          : a.profileViews - b.profileViews
      );
    }

    return { candidates: results, total };
  }

  /**
   * Track profile view by recruiter
   */
  async trackProfileView(
    profileId: string,
    viewerId: string,
    companyId?: string
  ): Promise<void> {
    await this.prisma.profileView.create({
      data: {
        profileId,
        viewerId,
        viewerType: 'recruiter',
        companyId,
      },
    });
  }

  /**
   * Save a candidate search
   */
  async saveSearch(
    userId: string,
    name: string,
    filters: Record<string, any>,
    notificationEnabled: boolean = false,
    notificationFrequency: string = 'daily'
  ): Promise<void> {
    await this.prisma.savedSearch.create({
      data: {
        userId,
        name,
        searchType: 'candidates',
        filters,
        notificationEnabled,
        notificationFrequency,
      },
    });
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: {
        userId,
        searchType: 'candidates',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string, userId: string): Promise<void> {
    await this.prisma.savedSearch.deleteMany({
      where: {
        id: searchId,
        userId,
      },
    });
  }
}
