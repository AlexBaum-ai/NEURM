import React from 'react';
import { useProfileSuspense } from '../hooks/useProfile';
import { ProfileHeader } from './ProfileHeader';
import { AboutSection } from './AboutSection';
import { SkillsSection } from './SkillsSection';
import { ExperienceSection } from './ExperienceSection';
import { EducationSection } from './EducationSection';
import { PortfolioSection } from './PortfolioSection';
import { ReputationSection } from './ReputationSection';
import { ReputationHistorySection } from './ReputationHistorySection';
import { LLMExperienceSection } from './LLMExperienceSection';
import { CommunityStatsSection } from './CommunityStatsSection';
import { JobPreferencesSection } from './JobPreferencesSection';

interface ProfileContentProps {
  username: string;
  onEditClick?: () => void;
}

/**
 * ProfileContent - Inner component that uses Suspense
 * This component will suspend while data is loading
 */
export const ProfileContent: React.FC<ProfileContentProps> = ({ username, onEditClick }) => {
  // This hook uses useSuspenseQuery, which will suspend until data is loaded
  const { data: profile } = useProfileSuspense(username);

  return (
    <div className="container-custom py-8 space-y-6">
      {/* Profile Header */}
      <ProfileHeader profile={profile} onEditClick={onEditClick} />

      {/* Profile Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - About, Skills, LLM Experience, and Reputation */}
        <div className="lg:col-span-1 space-y-6">
          <AboutSection profile={profile} />
          <SkillsSection profile={profile} />
          <LLMExperienceSection profile={profile} />
          <ReputationSection profile={profile} />
        </div>

        {/* Right Column - Experience, Education, Portfolio, Community Stats, Job Preferences, and Reputation History */}
        <div className="lg:col-span-2 space-y-6">
          <ExperienceSection profile={profile} />
          <EducationSection profile={profile} />
          <PortfolioSection profile={profile} />
          <CommunityStatsSection profile={profile} />
          <JobPreferencesSection profile={profile} viewerRole={profile.isOwner ? 'owner' : 'public'} />
          <ReputationHistorySection profile={profile} />
        </div>
      </div>
    </div>
  );
};

export default ProfileContent;
