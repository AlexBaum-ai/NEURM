import React, { Suspense, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { ProfileContent } from '../components/ProfileContent';
import { ProfileSkeleton } from '../components/ProfileSkeleton';
import { ProfileErrorFallback } from '../components/ProfileErrorFallback';
import { ProfileEditModal } from '../components';
import { useProfile } from '../hooks/useProfile';

/**
 * ProfilePage - Main profile page container
 *
 * Features:
 * - Uses Suspense for loading states (NO early returns with loading spinners)
 * - ErrorBoundary for error handling with retry functionality
 * - Responsive layout (mobile, tablet, desktop)
 * - Edit mode toggle (own profile only)
 * - Edit profile modal with image upload
 */
const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [showEditModal, setShowEditModal] = useState(false);

  if (!username) {
    throw new Error('Username parameter is required');
  }

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  return (
    <>
      <ErrorBoundary
        FallbackComponent={ProfileErrorFallback}
        resetKeys={[username]}
      >
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContent username={username} onEditClick={handleEditClick} />
        </Suspense>
      </ErrorBoundary>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <Suspense fallback={null}>
          <EditProfileModalWrapper username={username} onClose={handleCloseEditModal} />
        </Suspense>
      )}
    </>
  );
};

/**
 * EditProfileModalWrapper - Wrapper to handle profile data loading for modal
 */
const EditProfileModalWrapper: React.FC<{ username: string; onClose: () => void }> = ({
  username,
  onClose,
}) => {
  const { data: profile } = useProfile(username);

  if (!profile) {
    return null;
  }

  return <ProfileEditModal isOpen={true} onClose={onClose} profile={profile} />;
};

export default ProfilePage;
