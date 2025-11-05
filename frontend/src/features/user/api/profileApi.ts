import apiClient from '@/lib/api';
import type {
  UserProfile,
  ProfileResponse,
  ProfileUpdatePayload,
  UserSkill,
  WorkExperience,
  Education,
  PortfolioProject,
  ProfilePrivacySettings,
  Badge,
} from '../types';

/**
 * Profile API Service
 * Handles all profile-related API calls
 */

// Get user profile by username
export const getUserProfile = async (username: string): Promise<UserProfile> => {
  const response = await apiClient.get<ProfileResponse>(`/users/${username}`);
  return response.data;
};

// Get current user profile
export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  const response = await apiClient.get<ProfileResponse>('/users/me');
  return response.data;
};

// Update current user profile
export const updateUserProfile = async (data: ProfileUpdatePayload): Promise<UserProfile> => {
  const response = await apiClient.patch<ProfileResponse>('/users/me', data);
  return response.data;
};

// Upload avatar
export const uploadAvatar = async (file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiClient.post<{ data: { avatarUrl: string } }>(
    '/users/me/avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// Delete avatar
export const deleteAvatar = async (): Promise<void> => {
  await apiClient.delete('/users/me/avatar');
};

// Upload cover image
export const uploadCoverImage = async (file: File): Promise<{ coverImageUrl: string }> => {
  const formData = new FormData();
  formData.append('cover', file);

  const response = await apiClient.post<{ data: { coverImageUrl: string } }>(
    '/users/me/cover',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// Delete cover image
export const deleteCoverImage = async (): Promise<void> => {
  await apiClient.delete('/users/me/cover');
};

// Skills Management
export const getUserSkills = async (): Promise<UserSkill[]> => {
  const response = await apiClient.get<{ data: UserSkill[] }>('/users/me/skills');
  return response.data;
};

export const createSkill = async (
  skill: Omit<UserSkill, 'id' | 'createdAt' | 'endorsementCount'>
): Promise<UserSkill> => {
  const response = await apiClient.post<{ data: UserSkill }>('/users/me/skills', skill);
  return response.data;
};

export const updateSkill = async (id: string, proficiency: number): Promise<UserSkill> => {
  const response = await apiClient.patch<{ data: UserSkill }>(`/users/me/skills/${id}`, {
    proficiency,
  });
  return response.data;
};

export const deleteSkill = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/me/skills/${id}`);
};

// Work Experience Management
export const getWorkExperience = async (): Promise<WorkExperience[]> => {
  const response = await apiClient.get<{ data: WorkExperience[] }>('/users/me/work-experience');
  return response.data;
};

export const createWorkExperience = async (
  experience: Omit<WorkExperience, 'id' | 'displayOrder'>
): Promise<WorkExperience> => {
  const response = await apiClient.post<{ data: WorkExperience }>(
    '/users/me/work-experience',
    experience
  );
  return response.data;
};

export const updateWorkExperience = async (
  id: string,
  experience: Partial<WorkExperience>
): Promise<WorkExperience> => {
  const response = await apiClient.put<{ data: WorkExperience }>(
    `/users/me/work-experience/${id}`,
    experience
  );
  return response.data;
};

export const deleteWorkExperience = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/me/work-experience/${id}`);
};

// Education Management
export const getEducation = async (): Promise<Education[]> => {
  const response = await apiClient.get<{ data: Education[] }>('/users/me/education');
  return response.data;
};

export const createEducation = async (
  education: Omit<Education, 'id' | 'displayOrder'>
): Promise<Education> => {
  const response = await apiClient.post<{ data: Education }>('/users/me/education', education);
  return response.data;
};

export const updateEducation = async (
  id: string,
  education: Partial<Education>
): Promise<Education> => {
  const response = await apiClient.put<{ data: Education }>(
    `/users/me/education/${id}`,
    education
  );
  return response.data;
};

export const deleteEducation = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/me/education/${id}`);
};

// Portfolio Management
export const getPortfolio = async (): Promise<PortfolioProject[]> => {
  const response = await apiClient.get<{ data: PortfolioProject[] }>('/users/me/portfolio');
  return response.data;
};

export const createPortfolioProject = async (
  project: Omit<PortfolioProject, 'id' | 'displayOrder' | 'createdAt'>
): Promise<PortfolioProject> => {
  const response = await apiClient.post<{ data: PortfolioProject }>(
    '/users/me/portfolio',
    project
  );
  return response.data;
};

export const updatePortfolioProject = async (
  id: string,
  project: Partial<PortfolioProject>
): Promise<PortfolioProject> => {
  const response = await apiClient.put<{ data: PortfolioProject }>(
    `/users/me/portfolio/${id}`,
    project
  );
  return response.data;
};

export const deletePortfolioProject = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/me/portfolio/${id}`);
};

// Privacy Settings
export const getPrivacySettings = async (): Promise<ProfilePrivacySettings> => {
  const response = await apiClient.get<{ data: ProfilePrivacySettings }>('/users/me/privacy');
  return response.data;
};

export const updatePrivacySettings = async (
  settings: Partial<ProfilePrivacySettings>
): Promise<ProfilePrivacySettings> => {
  const response = await apiClient.patch<{ data: ProfilePrivacySettings }>(
    '/users/me/privacy',
    settings
  );
  return response.data;
};

// Upload portfolio image
export const uploadPortfolioImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<{ data: { imageUrl: string } }>(
    '/users/me/portfolio/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.imageUrl;
};

// Badges
export const getUserBadges = async (username: string): Promise<Badge[]> => {
  const response = await apiClient.get<{ data: Badge[] }>(`/users/${username}/badges`);
  return response.data;
};
