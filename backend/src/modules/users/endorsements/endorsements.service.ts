import * as Sentry from '@sentry/node';
import { SkillEndorsement } from '@prisma/client';
import EndorsementsRepository, { EndorsementWithUser } from './endorsements.repository';
import SkillsRepository from '../skills.repository';
import { UserRepository } from '../users.repository';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} from '@/utils/errors';
import logger from '@/utils/logger';

/**
 * Endorsement response DTO
 */
export interface EndorsementResponse {
  id: string;
  userId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  headline: string | null;
  createdAt: Date;
}

/**
 * Endorsements list response
 */
export interface EndorsementsListResponse {
  endorsements: EndorsementResponse[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * EndorsementsService
 * Business logic for skill endorsements
 */
export class EndorsementsService {
  private endorsementsRepository: EndorsementsRepository;
  private skillsRepository: SkillsRepository;
  private userRepository: UserRepository;

  constructor(
    endorsementsRepository?: EndorsementsRepository,
    skillsRepository?: SkillsRepository,
    userRepository?: UserRepository
  ) {
    this.endorsementsRepository = endorsementsRepository || new EndorsementsRepository();
    this.skillsRepository = skillsRepository || new SkillsRepository();
    this.userRepository = userRepository || new UserRepository();
  }

  /**
   * Create an endorsement
   */
  async createEndorsement(
    endorserId: string,
    profileUsername: string,
    skillId: string
  ): Promise<void> {
    try {
      // 1. Get the profile user by username
      const profileUser = await this.userRepository.findByUsername(profileUsername);
      if (!profileUser) {
        throw new NotFoundError('User not found');
      }

      // 2. Cannot endorse own skills
      if (endorserId === profileUser.id) {
        throw new ForbiddenError('Cannot endorse your own skills');
      }

      // 3. Verify the skill exists and belongs to the profile user
      const skill = await this.skillsRepository.findById(skillId, profileUser.id);
      if (!skill) {
        throw new NotFoundError('Skill not found');
      }

      // 4. Check if endorsement already exists
      const exists = await this.endorsementsRepository.exists(
        endorserId,
        profileUser.id,
        skillId
      );
      if (exists) {
        throw new ConflictError('You have already endorsed this skill');
      }

      // 5. Create endorsement and increment count in a transaction
      await this.endorsementsRepository.transaction(async (tx) => {
        // Create the endorsement
        await this.endorsementsRepository.create(endorserId, profileUser.id, skillId);

        // Increment the endorsement count
        await this.endorsementsRepository.incrementSkillEndorsementCount(skillId);
      });

      logger.info(`User ${endorserId} endorsed skill ${skillId} of user ${profileUser.id}`, {
        endorserId,
        profileId: profileUser.id,
        skillId,
        skillName: skill.skillName,
      });

      // 6. Create notification (TODO: integrate with notification system when available)
      await this.createEndorsementNotification(endorserId, profileUser.id, skill.skillName);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'EndorsementsService', method: 'createEndorsement' },
        extra: { endorserId, profileUsername, skillId },
      });
      throw error;
    }
  }

  /**
   * Remove an endorsement
   */
  async removeEndorsement(
    endorserId: string,
    profileUsername: string,
    skillId: string
  ): Promise<void> {
    try {
      // 1. Get the profile user by username
      const profileUser = await this.userRepository.findByUsername(profileUsername);
      if (!profileUser) {
        throw new NotFoundError('User not found');
      }

      // 2. Verify the skill exists
      const skill = await this.skillsRepository.findById(skillId, profileUser.id);
      if (!skill) {
        throw new NotFoundError('Skill not found');
      }

      // 3. Check if endorsement exists
      const exists = await this.endorsementsRepository.exists(
        endorserId,
        profileUser.id,
        skillId
      );
      if (!exists) {
        throw new NotFoundError('Endorsement not found');
      }

      // 4. Delete endorsement and decrement count in a transaction
      await this.endorsementsRepository.transaction(async (tx) => {
        // Delete the endorsement
        await this.endorsementsRepository.delete(endorserId, profileUser.id, skillId);

        // Decrement the endorsement count
        await this.endorsementsRepository.decrementSkillEndorsementCount(skillId);
      });

      logger.info(`User ${endorserId} removed endorsement from skill ${skillId} of user ${profileUser.id}`, {
        endorserId,
        profileId: profileUser.id,
        skillId,
        skillName: skill.skillName,
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'EndorsementsService', method: 'removeEndorsement' },
        extra: { endorserId, profileUsername, skillId },
      });
      throw error;
    }
  }

  /**
   * Get all endorsements for a skill
   */
  async getEndorsements(
    profileUsername: string,
    skillId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<EndorsementsListResponse> {
    try {
      // 1. Get the profile user by username
      const profileUser = await this.userRepository.findByUsername(profileUsername);
      if (!profileUser) {
        throw new NotFoundError('User not found');
      }

      // 2. Verify the skill exists
      const skill = await this.skillsRepository.findById(skillId, profileUser.id);
      if (!skill) {
        throw new NotFoundError('Skill not found');
      }

      // 3. Get endorsements
      const endorsements = await this.endorsementsRepository.findBySkillId(skillId, options);

      // 4. Get total count
      const total = await this.endorsementsRepository.countBySkillId(skillId);

      return {
        endorsements: endorsements.map(this.mapToEndorsementResponse),
        total,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
      };
    } catch (error) {
      Sentry.captureException(error, {
        tags: { service: 'EndorsementsService', method: 'getEndorsements' },
        extra: { profileUsername, skillId, options },
      });
      throw error;
    }
  }

  /**
   * Create a notification for skill endorsement
   * TODO: Integrate with notification system when available (SPRINT-13-001)
   */
  private async createEndorsementNotification(
    endorserId: string,
    profileId: string,
    skillName: string
  ): Promise<void> {
    try {
      // Placeholder for notification creation
      // This will be implemented when the notification system is ready
      logger.info(`Notification: User ${endorserId} endorsed skill "${skillName}" of user ${profileId}`, {
        type: 'skill_endorsement',
        endorserId,
        profileId,
        skillName,
      });

      // TODO: When notification system is available:
      // await notificationService.create({
      //   userId: profileId,
      //   type: 'social',
      //   title: 'New skill endorsement',
      //   message: `${endorserName} endorsed your ${skillName} skill`,
      //   data: { endorserId, skillName },
      // });
    } catch (error) {
      // Don't throw - notification failures should not break the endorsement flow
      logger.error('Failed to create endorsement notification', {
        error,
        endorserId,
        profileId,
        skillName,
      });
      Sentry.captureException(error, {
        tags: { service: 'EndorsementsService', method: 'createEndorsementNotification' },
        extra: { endorserId, profileId, skillName },
      });
    }
  }

  /**
   * Map endorsement with user to response DTO
   */
  private mapToEndorsementResponse(endorsement: EndorsementWithUser): EndorsementResponse {
    return {
      id: endorsement.id,
      userId: endorsement.user.id,
      username: endorsement.user.username,
      firstName: endorsement.user.profile?.firstName || null,
      lastName: endorsement.user.profile?.lastName || null,
      photoUrl: endorsement.user.profile?.photoUrl || null,
      headline: endorsement.user.profile?.headline || null,
      createdAt: endorsement.createdAt,
    };
  }
}

export default EndorsementsService;
