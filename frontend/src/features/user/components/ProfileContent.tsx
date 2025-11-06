import React, { Suspense, lazy } from 'react';
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
import { RecommendationsSidebar, RecommendationsSidebarSkeleton } from '@/features/recommendations';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';

// Lazy load ActivityFeed for code splitting
const ActivityFeed = lazy(() => import('@/features/activities/components/ActivityFeed'));

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

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - About, Skills, LLM Experience, Reputation, and Suggested Users */}
            <div className="lg:col-span-1 space-y-6">
              <AboutSection profile={profile} />
              <SkillsSection profile={profile} />
              <LLMExperienceSection profile={profile} />
              <ReputationSection profile={profile} />

              {/* Suggested Users to Follow */}
              {!profile.isOwner && (
                <Suspense fallback={<RecommendationsSidebarSkeleton />}>
                  <RecommendationsSidebar
                    type="user"
                    excludeIds={[profile.id]}
                    limit={5}
                    title="Suggested Users"
                    emptyMessage="No user recommendations available"
                  />
                </Suspense>
              )}
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
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            }
          >
            <ActivityFeed username={username} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileContent;
