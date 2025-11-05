import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profileApi';

/**
 * Hook for fetching current user's profile
 */
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.getCurrentUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for checking profile completeness
 */
export const useProfileCompleteness = () => {
  const { data: profile } = useProfile();

  if (!profile) {
    return {
      isComplete: false,
      completionPercentage: 0,
      missingFields: [],
    };
  }

  return profileApi.checkProfileCompleteness(profile);
};
