import { PrismaClient } from '@prisma/client';
import {
  CandidateSearchRepository,
  CandidateSearchResult,
} from './candidateSearch.repository';
import {
  CandidateSearchInput,
  SaveSearchInput,
  ExportCandidatesInput,
} from './candidateSearch.validation';
import { ForbiddenError, NotFoundError, BadRequestError } from '@/utils/errors';
import logger from '@/utils/logger';

export class CandidateSearchService {
  private repository: CandidateSearchRepository;

  constructor(private prisma: PrismaClient = new PrismaClient()) {
    this.repository = new CandidateSearchRepository(prisma);
  }

  /**
   * Search for candidates (Premium feature for companies)
   */
  async searchCandidates(
    filters: CandidateSearchInput,
    userId: string
  ): Promise<{ candidates: CandidateSearchResult[]; total: number; page: number; limit: number }> {
    // Check if user is a company account
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.accountType !== 'company' || !user.company) {
      throw new ForbiddenError(
        'Candidate search is only available for company accounts'
      );
    }

    // TODO: Check if company has premium subscription
    // For now, we'll allow all companies to search

    logger.info(`Company ${user.company.id} searching candidates`, {
      companyId: user.company.id,
      filters,
    });

    // Perform search
    const { candidates, total } = await this.repository.searchCandidates(
      filters,
      user.company.id
    );

    return {
      candidates,
      total,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };
  }

  /**
   * Track profile view by recruiter
   */
  async trackProfileView(
    profileUserId: string,
    viewerUserId: string
  ): Promise<void> {
    // Get viewer's company
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerUserId },
      include: { company: true },
    });

    if (!viewer) {
      throw new NotFoundError('Viewer not found');
    }

    // Check if profile exists and is visible to recruiters
    const profile = await this.prisma.profile.findUnique({
      where: { userId: profileUserId },
      include: {
        user: {
          include: {
            jobPreferences: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    if (!profile.user.jobPreferences?.visibleToRecruiters) {
      throw new ForbiddenError('This profile is not visible to recruiters');
    }

    // Track the view
    await this.repository.trackProfileView(
      profileUserId,
      viewerUserId,
      viewer.company?.id
    );

    logger.info(`Profile view tracked`, {
      profileUserId,
      viewerUserId,
      companyId: viewer.company?.id,
    });
  }

  /**
   * Save a candidate search
   */
  async saveSearch(
    userId: string,
    input: SaveSearchInput
  ): Promise<void> {
    const { name, filters, notificationEnabled, notificationFrequency } = input;

    // Check if user is a company
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true },
    });

    if (!user || user.accountType !== 'company') {
      throw new ForbiddenError('Only company accounts can save searches');
    }

    await this.repository.saveSearch(
      userId,
      name,
      filters,
      notificationEnabled,
      notificationFrequency || 'daily'
    );

    logger.info(`Search saved by user ${userId}`, { name });
  }

  /**
   * Get saved searches for a user
   */
  async getSavedSearches(userId: string) {
    return this.repository.getSavedSearches(userId);
  }

  /**
   * Delete a saved search
   */
  async deleteSavedSearch(searchId: string, userId: string): Promise<void> {
    await this.repository.deleteSavedSearch(searchId, userId);
    logger.info(`Search deleted`, { searchId, userId });
  }

  /**
   * Export candidate list to CSV
   */
  async exportCandidates(
    input: ExportCandidatesInput,
    userId: string
  ): Promise<string> {
    const { candidateIds, format = 'csv', fields } = input;

    // Check if user is a company
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || user.accountType !== 'company' || !user.company) {
      throw new ForbiddenError('Only company accounts can export candidates');
    }

    // Fetch candidates
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { in: candidateIds },
        status: 'active',
        accountType: 'individual',
        jobPreferences: {
          visibleToRecruiters: true,
        },
      },
      include: {
        profile: true,
        skills: true,
        userModels: {
          include: { model: true },
        },
        jobPreferences: true,
        workExperiences: {
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    });

    if (candidates.length === 0) {
      throw new BadRequestError('No candidates found to export');
    }

    // Track views for all exported candidates
    await Promise.all(
      candidates.map((candidate) =>
        this.repository.trackProfileView(
          candidate.id,
          userId,
          user.company!.id
        )
      )
    );

    if (format === 'csv') {
      return this.generateCSV(candidates);
    } else {
      return JSON.stringify(
        candidates.map((c) => this.formatCandidateForExport(c)),
        null,
        2
      );
    }
  }

  /**
   * Generate CSV content from candidates
   */
  private generateCSV(candidates: any[]): string {
    const headers = [
      'Username',
      'Display Name',
      'Email',
      'Headline',
      'Location',
      'Years Experience',
      'Availability',
      'Skills',
      'Models',
      'Current Role',
      'Salary Min',
      'Salary Max',
      'Currency',
      'Remote Preference',
      'LinkedIn',
      'GitHub',
      'Website',
    ];

    const rows = candidates.map((candidate) => {
      const skills = candidate.skills
        .map((s: any) => s.skillName)
        .join('; ');
      const models = candidate.userModels
        .map((um: any) => um.model.name)
        .join('; ');
      const currentRole = candidate.workExperiences[0]
        ? `${candidate.workExperiences[0].title} at ${candidate.workExperiences[0].company}`
        : '';
      const remotePreference = candidate.jobPreferences?.workLocations?.join(', ') || '';

      return [
        candidate.username,
        candidate.profile?.displayName || '',
        candidate.email,
        candidate.profile?.headline || '',
        candidate.profile?.location || '',
        candidate.profile?.yearsExperience || '',
        candidate.profile?.availabilityStatus || '',
        skills,
        models,
        currentRole,
        candidate.jobPreferences?.salaryExpectationMin || '',
        candidate.jobPreferences?.salaryExpectationMax || '',
        candidate.jobPreferences?.salaryCurrency || '',
        remotePreference,
        candidate.profile?.linkedinUrl || '',
        candidate.profile?.githubUrl || '',
        candidate.profile?.website || '',
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
    });

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n'
    );

    return csv;
  }

  /**
   * Format candidate for JSON export
   */
  private formatCandidateForExport(candidate: any) {
    return {
      username: candidate.username,
      email: candidate.email,
      profile: {
        displayName: candidate.profile?.displayName,
        headline: candidate.profile?.headline,
        bio: candidate.profile?.bio,
        location: candidate.profile?.location,
        yearsExperience: candidate.profile?.yearsExperience,
        availabilityStatus: candidate.profile?.availabilityStatus,
        avatarUrl: candidate.profile?.avatarUrl,
        linkedinUrl: candidate.profile?.linkedinUrl,
        githubUrl: candidate.profile?.githubUrl,
        website: candidate.profile?.website,
      },
      skills: candidate.skills.map((s: any) => ({
        name: s.skillName,
        type: s.skillType,
        proficiency: s.proficiency,
      })),
      models: candidate.userModels.map((um: any) => ({
        name: um.model.name,
        proficiency: um.proficiency,
      })),
      workExperience: candidate.workExperiences.map((we: any) => ({
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
            salaryExpectationMin: candidate.jobPreferences.salaryExpectationMin,
            salaryExpectationMax: candidate.jobPreferences.salaryExpectationMax,
            salaryCurrency: candidate.jobPreferences.salaryCurrency,
          }
        : null,
    };
  }

  /**
   * Get who viewed my profile
   */
  async getProfileViewers(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [views, total] = await Promise.all([
      this.prisma.profileView.findMany({
        where: { profileId: userId },
        include: {
          viewer: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { viewedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.profileView.count({
        where: { profileId: userId },
      }),
    ]);

    return {
      views: views.map((v) => ({
        id: v.id,
        viewedAt: v.viewedAt,
        viewer: {
          id: v.viewer.id,
          username: v.viewer.username,
          displayName: v.viewer.profile?.displayName || null,
          avatarUrl: v.viewer.profile?.avatarUrl || null,
        },
        company: v.company
          ? {
              id: v.company.id,
              name: v.company.name,
              logoUrl: v.company.logoUrl,
            }
          : null,
      })),
      total,
      page,
      limit,
    };
  }
}
