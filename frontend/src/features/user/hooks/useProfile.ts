import { useQuery, useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import {
  getUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
  uploadAvatar,
  uploadCoverImage,
  getUserBadges,
  createSkill,
  updateSkill,
  deleteSkill,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  createEducation,
  updateEducation,
  deleteEducation,
  createPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
  uploadPortfolioImage,
} from '../api/profileApi';
import type {
  ProfileUpdatePayload,
  SkillFormData,
  WorkExperienceFormData,
  EducationFormData,
  PortfolioProjectFormData,
} from '../types';

// Query keys
export const profileKeys = {
  all: ['profiles'] as const,
  profile: (username: string) => [...profileKeys.all, username] as const,
  currentUser: () => [...profileKeys.all, 'me'] as const,
  badges: (username: string) => [...profileKeys.all, username, 'badges'] as const,
};

/**
 * Hook to fetch user profile by username with Suspense
 */
export const useProfileSuspense = (username: string) => {
  return useSuspenseQuery({
    queryKey: profileKeys.profile(username),
    queryFn: () => getUserProfile(username),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch user profile by username (without Suspense)
 */
export const useProfile = (username: string) => {
  return useQuery({
    queryKey: profileKeys.profile(username),
    queryFn: () => getUserProfile(username),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

/**
 * Hook to fetch current user profile
 */
export const useCurrentUserProfile = () => {
  return useQuery({
    queryKey: profileKeys.currentUser(),
    queryFn: getCurrentUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch user badges
 */
export const useUserBadges = (username: string) => {
  return useQuery({
    queryKey: profileKeys.badges(username),
    queryFn: () => getUserBadges(username),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileUpdatePayload) => updateUserProfile(data),
    onSuccess: (data) => {
      // Update current user cache
      queryClient.setQueryData(profileKeys.currentUser(), data);
      // Update profile cache by username
      queryClient.setQueryData(profileKeys.profile(data.username), data);
      // Invalidate to refetch
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to upload avatar
 */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      // Invalidate profile queries to refetch with new avatar
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to upload cover image
 */
export const useUploadCoverImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadCoverImage(file),
    onSuccess: () => {
      // Invalidate profile queries to refetch with new cover
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

// ===== Skills Mutations =====

/**
 * Hook to create a skill
 */
export const useCreateSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SkillFormData) => createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to update a skill
 */
export const useUpdateSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SkillFormData }) =>
      updateSkill(id, data.proficiency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to delete a skill
 */
export const useDeleteSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

// ===== Work Experience Mutations =====

/**
 * Hook to create work experience
 */
export const useCreateWorkExperience = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WorkExperienceFormData) => createWorkExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to update work experience
 */
export const useUpdateWorkExperience = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkExperienceFormData }) =>
      updateWorkExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to delete work experience
 */
export const useDeleteWorkExperience = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWorkExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

// ===== Education Mutations =====

/**
 * Hook to create education
 */
export const useCreateEducation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EducationFormData) => createEducation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to update education
 */
export const useUpdateEducation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EducationFormData }) =>
      updateEducation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to delete education
 */
export const useDeleteEducation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

// ===== Portfolio Mutations =====

/**
 * Hook to create portfolio project
 */
export const useCreatePortfolioProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PortfolioProjectFormData & { thumbnailUrl?: string }) =>
      createPortfolioProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to update portfolio project
 */
export const useUpdatePortfolioProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PortfolioProjectFormData & { thumbnailUrl?: string };
    }) => updatePortfolioProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to delete portfolio project
 */
export const useDeletePortfolioProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePortfolioProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

/**
 * Hook to upload portfolio image
 */
export const useUploadPortfolioImage = () => {
  return useMutation({
    mutationFn: (file: File) => uploadPortfolioImage(file),
  });
};
