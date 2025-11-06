import { apiClient } from '@/lib/api';
import type { UserProfile, ProfileCompletenessResult } from '../types';
import type { ProfileViewsData, ViewCountData } from '../types/profileViews';

export const profileApi = {
  /**
   * Get current user's full profile
   */
  getCurrentUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get<{ success: boolean; data: UserProfile }>('/users/me');
    return response.data;
  },

  /**
   * Check profile completeness for job applications
   */
  checkProfileCompleteness: (profile: UserProfile): ProfileCompletenessResult => {
    const missingFields: ProfileCompletenessResult['missingFields'] = [];

    // Required fields
    if (!profile.firstName || !profile.lastName) {
      missingFields.push({
        field: 'name',
        label: 'Full Name',
        importance: 'required',
      });
    }

    if (!profile.email) {
      missingFields.push({
        field: 'email',
        label: 'Email Address',
        importance: 'required',
      });
    }

    if (!profile.profile.resumeUrl) {
      missingFields.push({
        field: 'resume',
        label: 'Resume/CV',
        importance: 'required',
      });
    }

    // Recommended fields
    if (!profile.phone) {
      missingFields.push({
        field: 'phone',
        label: 'Phone Number',
        importance: 'recommended',
      });
    }

    if (!profile.profile.headline) {
      missingFields.push({
        field: 'headline',
        label: 'Professional Headline',
        importance: 'recommended',
      });
    }

    if (!profile.workExperiences || profile.workExperiences.length === 0) {
      missingFields.push({
        field: 'workExperience',
        label: 'Work Experience',
        importance: 'recommended',
      });
    }

    if (!profile.skills || profile.skills.length === 0) {
      missingFields.push({
        field: 'skills',
        label: 'Skills',
        importance: 'recommended',
      });
    }

    // Calculate completion percentage
    const totalFields = 7; // Total important fields
    const completedFields = totalFields - missingFields.length;
    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    return {
      isComplete: missingFields.filter((f) => f.importance === 'required').length === 0,
      completionPercentage,
      missingFields,
    };
  },

  /**
   * Get who viewed my profile (premium only)
   */
  getMyProfileViewers: async (page: number = 1, limit: number = 20): Promise<ProfileViewsData> => {
    const response = await apiClient.get<{ success: boolean; data: ProfileViewsData }>(
      `/profiles/me/views?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  /**
   * Get profile view count for any user
   */
  getProfileViewCount: async (username: string): Promise<ViewCountData> => {
    const response = await apiClient.get<{ success: boolean; data: ViewCountData }>(
      `/profiles/${username}/view-count`
    );
    return response.data;
  },

  /**
   * Track a profile view
   */
  trackProfileView: async (username: string, anonymous: boolean = false): Promise<void> => {
    await apiClient.post(`/profiles/${username}/view`, { anonymous });
  },
};
