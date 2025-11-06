import React, { useState, Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserProfile } from '@/features/user/api/profileApi';

// Lazy load tab components
const AccountTab = lazy(() => import('../components/AccountTab'));
const PrivacyTab = lazy(() => import('../components/PrivacyTab'));
const SecurityTab = lazy(() => import('../components/SecurityTab'));
const NotificationsTab = lazy(() => import('../components/NotificationsTab'));
const SessionsTab = lazy(() => import('../components/SessionsTab'));
const DangerZoneTab = lazy(() => import('../components/DangerZoneTab'));

type TabId = 'account' | 'privacy' | 'security' | 'notifications' | 'sessions' | 'danger';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'account', label: 'Account', icon: '👤' },
  { id: 'privacy', label: 'Privacy', icon: '🔒' },
  { id: 'security', label: 'Security', icon: '🛡️' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'sessions', label: 'Sessions', icon: '💻' },
  { id: 'danger', label: 'Danger Zone', icon: '⚠️' },
];

const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
);

const SettingsPage: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [activeTab, setActiveTab] = useState<TabId>('account');

  // Fetch current user profile for email
  const { data: profile, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUserProfile,
    enabled: isAuthenticated,
  });

  // Redirect to home if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const renderTabContent = () => {
    if (isLoading) {
      return <TabLoader />;
    }

    switch (activeTab) {
      case 'account':
        return (
          <Suspense fallback={<TabLoader />}>
            <AccountTab currentEmail={profile?.email || ''} />
          </Suspense>
        );
      case 'privacy':
        return (
          <Suspense fallback={<TabLoader />}>
            <PrivacyTab />
          </Suspense>
        );
      case 'security':
        return (
          <Suspense fallback={<TabLoader />}>
            <SecurityTab />
          </Suspense>
        );
      case 'notifications':
        return (
          <Suspense fallback={<TabLoader />}>
            <NotificationsTab />
          </Suspense>
        );
      case 'sessions':
        return (
          <Suspense fallback={<TabLoader />}>
            <SessionsTab />
          </Suspense>
        );
      case 'danger':
        return (
          <Suspense fallback={<TabLoader />}>
            <DangerZoneTab />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container-custom py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Layout: Sidebar + Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                    ${tab.id === 'danger' && activeTab === tab.id && 'bg-accent-100 dark:bg-accent-900/30 text-accent-900 dark:text-accent-100'}
                    ${tab.id === 'danger' && activeTab !== tab.id && 'hover:bg-accent-50 dark:hover:bg-accent-900/10'}
                  `}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden">
            <div className="flex overflow-x-auto gap-2 pb-2 border-b border-gray-200 dark:border-gray-800">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap text-sm transition-colors flex-shrink-0
                    ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }
                    ${tab.id === 'danger' && activeTab === tab.id && 'bg-accent-600 text-white'}
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              {renderTabContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
