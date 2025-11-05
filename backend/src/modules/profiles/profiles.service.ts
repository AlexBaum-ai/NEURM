import * as Sentry from '@sentry/node';
import { UserRole } from '@prisma/client';
import ProfilesRepository, { CandidateProfileWithRelations } from './profiles.repository';
import {
  UpdateJobPreferencesInput,
  UpdateCandidateProfileInput,
} from './profiles.validation';
import { NotFoundError, ForbiddenError } from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Candidate Profile Response DTO
 */
export interface CandidateProfileResponse {
  id: string;
  username: string;
  accountType: string;
  createdAt: Date;
  profile: {
    displayName: string | null;
    headline: string | null;
    bio: string | null;
    avatarUrl: string | null;
    coverImageUrl: string | null;
    location: string | null;
    website: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    huggingfaceUrl: string | null;
    pronouns: string | null;
    availabilityStatus: string | null;
    yearsExperience: number | null;
  } | null;
  jobPreferences?: {
    rolesInterested: string[];
    jobTypes: string[];
    workLocations: string[];
    preferredLocations: string[];
    openToRelocation: boolean;
    salaryExpectationMin: number | null;
    salaryExpectationMax: number | null;
    salaryCurrency: string | null;
    desiredStartDate: Date | null;
    availability: string | null;
    companyPreferences: any;
    visibleToRecruiters: boolean;
  } | null;
  skills: Array<{
    id: string;
    skillName: string;
    skillType: string;
    proficiency: number;
    endorsementCount: number;
  }>;
  workExperience: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    employmentType: string | null;
    startDate: Date;
    endDate: Date | null;
    description: string | null;
    techStack: any;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: Date | null;
    endDate: Date | null;
    description: string | null;
  }>;
  portfolio: Array<{
    id: string;
    title: string;
    description: string | null;
    techStack: any;
    projectUrl: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
    thumbnailUrl: string | null;
    screenshots: string[];
    isFeatured: boolean;
  }>;
  communityStats: {
    reputation: number;
    reputationLevel: string;
    topicsCount: number;
    repliesCount: number;
    articlesCount: number;
    badges: Array<{
      id: string;
      name: string;
      iconUrl: string;
      badgeType: string;
      earnedAt: Date;
    }>;
    topContributions: {
      topTopics: Array<{
        id: string;
        title: string;
        slug: string;
        voteScore: number;
        replyCount: number;
        viewCount: number;
      }>;
      topReplies: Array<{
        id: string;
        topicTitle: string;
        topicSlug: string;
      }>;
    };
  };
}

/**
 * ProfilesService
 * Business logic for candidate profiles
 */
export class ProfilesService {
  private profilesRepository: ProfilesRepository;

  constructor(profilesRepository?: ProfilesRepository) {
    this.profilesRepository = profilesRepository || new ProfilesRepository();
  }

  /**
   * Update candidate profile (job preferences + basic profile fields)
   */
  async updateCandidateProfile(
    userId: string,
    data: UpdateCandidateProfileInput
  ): Promise<CandidateProfileResponse> {
    try {
      logger.info(`Updating candidate profile for user ${userId}`);

      // Update job preferences if provided
      if (data.jobPreferences) {
        await this.profilesRepository.upsertJobPreferences(userId, data.jobPreferences);
      }

      // Update basic profile fields if provided
      const profileFields = { ...data };
      delete (profileFields as any).jobPreferences;

      if (Object.keys(profileFields).length > 0) {
        await this.profilesRepository.updateProfile(userId, profileFields);
      }

      // Fetch complete profile
      const candidateProfile = await this.profilesRepository.findCandidateProfileById(userId);

      if (!candidateProfile) {
        throw new NotFoundError('User not found');
      }

      // Get community stats
      const communityStats = await this.profilesRepository.getCommunityStats(userId);

      const response = this.mapToProfileResponse(candidateProfile, communityStats, true);

      logger.info(`Candidate profile updated successfully for user ${userId}`);
      return response;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ProfilesService', method: 'updateCandidateProfile' },
        extra: { userId, data },
      });
      logger.error(`Failed to update candidate profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get public candidate profile by username
   * Respects privacy settings and recruiter visibility
   */
  async getCandidateProfile(
    username: string,
    requestingUserId?: string
  ): Promise<CandidateProfileResponse> {
    try {
      const candidateProfile =
        await this.profilesRepository.findCandidateProfileByUsername(username);

      if (!candidateProfile) {
        throw new NotFoundError('User not found');
      }

      // Check if requesting user is viewing their own profile
      const isOwnProfile = requestingUserId === candidateProfile.id;

      // Get privacy settings
      const privacySettings = await this.profilesRepository.getPrivacySettings(
        candidateProfile.id
      );

      // Check recruiter access
      let isRecruiter = false;
      if (requestingUserId) {
        const requestingUser = await this.profilesRepository.getUserRole(requestingUserId);
        isRecruiter = requestingUser?.role === UserRole.company;
      }

      // Check if profile is visible to recruiters
      const visibleToRecruiters = await this.profilesRepository.isVisibleToRecruiters(
        candidateProfile.id
      );

      // If recruiter is trying to view profile and it's not visible, throw error
      if (isRecruiter && !visibleToRecruiters && !isOwnProfile) {
        throw new ForbiddenError('This profile is not visible to recruiters');
      }

      // Get community stats
      const communityStats = await this.profilesRepository.getCommunityStats(
        candidateProfile.id
      );

      // Map to response
      const response = this.mapToProfileResponse(
        candidateProfile,
        communityStats,
        isOwnProfile
      );

      // Apply privacy filters if not own profile
      if (!isOwnProfile) {
        await this.applyPrivacyFilters(
          response,
          privacySettings,
          requestingUserId,
          isRecruiter
        );
      }

      return response;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ProfilesService', method: 'getCandidateProfile' },
        extra: { username, requestingUserId },
      });
      throw error;
    }
  }

  /**
   * Get portfolio projects for a user
   */
  async getPortfolio(username: string, requestingUserId?: string) {
    try {
      const candidateProfile =
        await this.profilesRepository.findCandidateProfileByUsername(username);

      if (!candidateProfile) {
        throw new NotFoundError('User not found');
      }

      // Check if requesting user is viewing their own profile
      const isOwnProfile = requestingUserId === candidateProfile.id;

      // Get privacy settings
      const privacySettings = await this.profilesRepository.getPrivacySettings(
        candidateProfile.id
      );

      // Check portfolio visibility
      const portfolioVisibility = privacySettings.portfolio || 'public';

      // Check access
      if (!isOwnProfile) {
        let isRecruiter = false;
        const isAuthenticated = !!requestingUserId;

        if (requestingUserId) {
          const requestingUser = await this.profilesRepository.getUserRole(requestingUserId);
          isRecruiter = requestingUser?.role === UserRole.company;
        }

        const isVisible = this.checkVisibility(
          portfolioVisibility,
          isAuthenticated,
          isRecruiter
        );

        if (!isVisible) {
          throw new ForbiddenError('Portfolio is not publicly accessible');
        }
      }

      // Get all portfolio projects
      const projects = await this.profilesRepository.getPortfolioProjects(candidateProfile.id);

      return projects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        projectUrl: project.projectUrl,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        thumbnailUrl: project.thumbnailUrl,
        screenshots: project.screenshots,
        isFeatured: project.isFeatured,
        displayOrder: project.displayOrder,
        createdAt: project.createdAt,
      }));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'ProfilesService', method: 'getPortfolio' },
        extra: { username, requestingUserId },
      });
      throw error;
    }
  }

  /**
   * Map database entity to response DTO
   */
  private mapToProfileResponse(
    candidateProfile: CandidateProfileWithRelations,
    communityStats: any,
    includePrivateData: boolean = false
  ): CandidateProfileResponse {
    return {
      id: candidateProfile.id,
      username: candidateProfile.username,
      accountType: candidateProfile.accountType,
      createdAt: candidateProfile.createdAt,
      profile: candidateProfile.profile
        ? {
            displayName: candidateProfile.profile.displayName,
            headline: candidateProfile.profile.headline,
            bio: candidateProfile.profile.bio,
            avatarUrl: candidateProfile.profile.avatarUrl,
            coverImageUrl: candidateProfile.profile.coverImageUrl,
            location: candidateProfile.profile.location,
            website: candidateProfile.profile.website,
            githubUrl: candidateProfile.profile.githubUrl,
            linkedinUrl: candidateProfile.profile.linkedinUrl,
            twitterUrl: candidateProfile.profile.twitterUrl,
            huggingfaceUrl: candidateProfile.profile.huggingfaceUrl,
            pronouns: candidateProfile.profile.pronouns,
            availabilityStatus: candidateProfile.profile.availabilityStatus,
            yearsExperience: candidateProfile.profile.yearsExperience,
          }
        : null,
      jobPreferences: candidateProfile.jobPreferences
        ? {
            rolesInterested: candidateProfile.jobPreferences.rolesInterested,
            jobTypes: candidateProfile.jobPreferences.jobTypes,
            workLocations: candidateProfile.jobPreferences.workLocations,
            preferredLocations: candidateProfile.jobPreferences.preferredLocations,
            openToRelocation: candidateProfile.jobPreferences.openToRelocation,
            salaryExpectationMin: candidateProfile.jobPreferences.salaryExpectationMin
              ? Number(candidateProfile.jobPreferences.salaryExpectationMin)
              : null,
            salaryExpectationMax: candidateProfile.jobPreferences.salaryExpectationMax
              ? Number(candidateProfile.jobPreferences.salaryExpectationMax)
              : null,
            salaryCurrency: candidateProfile.jobPreferences.salaryCurrency,
            desiredStartDate: candidateProfile.jobPreferences.desiredStartDate,
            availability: candidateProfile.jobPreferences.availability,
            companyPreferences: candidateProfile.jobPreferences.companyPreferences,
            visibleToRecruiters: candidateProfile.jobPreferences.visibleToRecruiters,
          }
        : null,
      skills: candidateProfile.skills.map((skill) => ({
        id: skill.id,
        skillName: skill.skillName,
        skillType: skill.skillType,
        proficiency: skill.proficiency,
        endorsementCount: skill.endorsementCount,
      })),
      workExperience: candidateProfile.workExperiences.map((exp) => ({
        id: exp.id,
        title: exp.title,
        company: exp.company,
        location: exp.location,
        employmentType: exp.employmentType,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        techStack: exp.techStack,
      })),
      education: candidateProfile.educations.map((edu) => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate,
        description: edu.description,
      })),
      portfolio: candidateProfile.portfolioProjects.map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        techStack: project.techStack,
        projectUrl: project.projectUrl,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        thumbnailUrl: project.thumbnailUrl,
        screenshots: project.screenshots,
        isFeatured: project.isFeatured,
      })),
      communityStats: {
        reputation: communityStats.reputation,
        reputationLevel: communityStats.reputationLevel,
        topicsCount: candidateProfile._count.topics,
        repliesCount: candidateProfile._count.replies,
        articlesCount: candidateProfile._count.articles,
        badges: candidateProfile.userBadges.map((ub) => ({
          id: ub.badge.id,
          name: ub.badge.name,
          iconUrl: ub.badge.iconUrl,
          badgeType: ub.badge.badgeType,
          earnedAt: ub.earnedAt,
        })),
        topContributions: {
          topTopics: communityStats.topTopics,
          topReplies: communityStats.topReplies.map((reply: any) => ({
            id: reply.id,
            topicTitle: reply.topic.title,
            topicSlug: reply.topic.slug,
          })),
        },
      },
    };
  }

  /**
   * Apply privacy filters to profile response
   */
  private async applyPrivacyFilters(
    response: CandidateProfileResponse,
    privacySettings: Record<string, string>,
    requestingUserId?: string,
    isRecruiter: boolean = false
  ): Promise<void> {
    const isAuthenticated = !!requestingUserId;

    // Filter based on privacy settings
    if (
      response.profile &&
      !this.checkVisibility(privacySettings.bio || 'public', isAuthenticated, isRecruiter)
    ) {
      response.profile.bio = null;
    }

    if (
      response.profile &&
      !this.checkVisibility(privacySettings.contact || 'public', isAuthenticated, isRecruiter)
    ) {
      response.profile.website = null;
      response.profile.githubUrl = null;
      response.profile.linkedinUrl = null;
      response.profile.twitterUrl = null;
      response.profile.huggingfaceUrl = null;
    }

    if (
      !this.checkVisibility(
        privacySettings.workExperience || 'public',
        isAuthenticated,
        isRecruiter
      )
    ) {
      response.workExperience = [];
    }

    if (
      !this.checkVisibility(privacySettings.education || 'public', isAuthenticated, isRecruiter)
    ) {
      response.education = [];
    }

    if (
      !this.checkVisibility(privacySettings.skills || 'public', isAuthenticated, isRecruiter)
    ) {
      response.skills = [];
    }

    if (
      !this.checkVisibility(privacySettings.portfolio || 'public', isAuthenticated, isRecruiter)
    ) {
      response.portfolio = [];
    }

    // Hide job preferences from non-recruiters
    if (!isRecruiter && !isAuthenticated) {
      response.jobPreferences = undefined;
    }
  }

  /**
   * Check if field is visible based on privacy setting
   */
  private checkVisibility(
    visibility: string,
    isAuthenticated: boolean,
    isRecruiter: boolean
  ): boolean {
    if (visibility === 'public') return true;
    if (visibility === 'private') return false;
    if (visibility === 'community') return isAuthenticated;
    if (visibility === 'recruiters') return isRecruiter;
    return false;
  }
}

export default ProfilesService;
