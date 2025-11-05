/**
 * ReputationSection Component
 * Displays user reputation widget on profile page
 * Uses Suspense for loading - wraps forum components
 */

import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useReputation } from '@/features/forum/hooks';
import { ReputationWidget } from '@/features/forum/components';
import type { UserProfile } from '../types';

interface ReputationSectionProps {
  profile: UserProfile;
}

/**
 * Inner component that suspends during data loading
 */
const ReputationSectionInner: React.FC<ReputationSectionProps> = ({ profile }) => {
  const { data: reputation } = useReputation({ userId: profile.id });

  if (!reputation) {
    return null;
  }

  return <ReputationWidget reputation={reputation} />;
};

/**
 * Outer component with Suspense boundary
 */
export const ReputationSection: React.FC<ReputationSectionProps> = ({ profile }) => {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 200,
          }}
        >
          <CircularProgress size={40} />
        </Box>
      }
    >
      <ReputationSectionInner profile={profile} />
    </Suspense>
  );
};

export default ReputationSection;
