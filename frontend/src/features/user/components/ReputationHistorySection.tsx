/**
 * ReputationHistorySection Component
 * Displays reputation history timeline on profile page
 * Uses Suspense for loading - wraps forum components
 */

import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useReputation } from '@/features/forum/hooks';
import { ReputationHistory } from '@/features/forum/components';
import type { UserProfile } from '../types';

interface ReputationHistorySectionProps {
  profile: UserProfile;
}

/**
 * Inner component that suspends during data loading
 */
const ReputationHistorySectionInner: React.FC<ReputationHistorySectionProps> = ({ profile }) => {
  const { data: reputation } = useReputation({ userId: profile.id });

  if (!reputation || reputation.recentActivity.length === 0) {
    return null;
  }

  return <ReputationHistory activities={reputation.recentActivity} maxItems={10} />;
};

/**
 * Outer component with Suspense boundary
 */
export const ReputationHistorySection: React.FC<ReputationHistorySectionProps> = ({ profile }) => {
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
      <ReputationHistorySectionInner profile={profile} />
    </Suspense>
  );
};

export default ReputationHistorySection;
