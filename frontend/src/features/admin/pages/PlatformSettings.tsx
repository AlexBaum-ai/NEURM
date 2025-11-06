/**
 * PlatformSettings Page
 *
 * Main admin settings page with tabbed interface
 */

import React, { useState, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { GeneralSettings } from '../components/GeneralSettings';
import { FeatureFlags } from '../components/FeatureFlags';
import { IntegrationSettings } from '../components/IntegrationSettings';
import { SecuritySettings } from '../components/SecuritySettings';
import { EmailSettings } from '../components/EmailSettings';
import {
  useSettingsGrouped,
  useUpdateSettings,
  useUpdateMaintenanceMode,
  useTestEmail,
  useTestOAuth,
} from '../hooks/useSettings';
import { settingsArrayToObject, createBulkUpdateInput } from '../utils/settings.helpers';
import type {
  GeneralSettings as GeneralSettingsType,
  FeatureSettings as FeatureSettingsType,
  IntegrationSettings as IntegrationSettingsType,
  SecuritySettings as SecuritySettingsType,
  EmailSettings as EmailSettingsType,
  SettingCategory,
} from '../types/settings.types';

type TabKey = 'general' | 'features' | 'integrations' | 'security' | 'email';

const PlatformSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [showMaintenanceWarning, setShowMaintenanceWarning] = useState(false);

  // Fetch settings
  const { data: settingsGroups, isLoading, error } = useSettingsGrouped();

  // Mutations
  const updateSettingsMutation = useUpdateSettings();
  const updateMaintenanceModeMutation = useUpdateMaintenanceMode();
  const testEmailMutation = useTestEmail();
  const testOAuthMutation = useTestOAuth();

  // Helper to get settings by category
  const getSettingsByCategory = (category: SettingCategory) => {
    const group = settingsGroups?.find((g) => g.category === category);
    return group ? settingsArrayToObject(group.settings) : {};
  };

  // Get settings for each tab
  const generalSettings = getSettingsByCategory('GENERAL' as SettingCategory);
  const featureSettings = getSettingsByCategory('FEATURES' as SettingCategory);
  const integrationSettings = getSettingsByCategory('INTEGRATIONS' as SettingCategory);
  const securitySettings = getSettingsByCategory('SECURITY' as SettingCategory);
  const emailSettings = getSettingsByCategory('EMAIL' as SettingCategory);

  // Update maintenance mode state from settings
  React.useEffect(() => {
    if (generalSettings.maintenance_mode !== undefined) {
      setMaintenanceEnabled(generalSettings.maintenance_mode as boolean);
    }
  }, [generalSettings.maintenance_mode]);

  // Save handlers
  const handleSaveGeneral = async (data: GeneralSettingsType) => {
    const input = createBulkUpdateInput(
      data,
      'GENERAL' as SettingCategory,
      settingsGroups?.find((g) => g.category === 'GENERAL')?.settings
    );
    await updateSettingsMutation.mutateAsync(input);
  };

  const handleSaveFeatures = async (data: FeatureSettingsType) => {
    const input = createBulkUpdateInput(
      data,
      'FEATURES' as SettingCategory,
      settingsGroups?.find((g) => g.category === 'FEATURES')?.settings
    );
    await updateSettingsMutation.mutateAsync(input);
  };

  const handleSaveIntegrations = async (data: IntegrationSettingsType) => {
    const input = createBulkUpdateInput(
      data,
      'INTEGRATIONS' as SettingCategory,
      settingsGroups?.find((g) => g.category === 'INTEGRATIONS')?.settings
    );
    await updateSettingsMutation.mutateAsync(input);
  };

  const handleSaveSecurity = async (data: SecuritySettingsType) => {
    const input = createBulkUpdateInput(
      data,
      'SECURITY' as SettingCategory,
      settingsGroups?.find((g) => g.category === 'SECURITY')?.settings
    );
    await updateSettingsMutation.mutateAsync(input);
  };

  const handleSaveEmail = async (data: EmailSettingsType) => {
    const input = createBulkUpdateInput(
      data,
      'EMAIL' as SettingCategory,
      settingsGroups?.find((g) => g.category === 'EMAIL')?.settings
    );
    await updateSettingsMutation.mutateAsync(input);
  };

  // Test handlers
  const handleTestEmail = async (recipient: string) => {
    await testEmailMutation.mutateAsync({ recipient });
  };

  const handleTestOAuth = async (provider: 'google' | 'linkedin' | 'github') => {
    await testOAuthMutation.mutateAsync({ provider });
  };

  // Maintenance mode toggle
  const handleMaintenanceToggle = () => {
    if (!maintenanceEnabled) {
      setShowMaintenanceWarning(true);
    } else {
      confirmMaintenanceMode(false);
    }
  };

  const confirmMaintenanceMode = async (enabled: boolean) => {
    await updateMaintenanceModeMutation.mutateAsync({
      enabled,
      message: generalSettings.maintenance_message as string,
    });
    setMaintenanceEnabled(enabled);
    setShowMaintenanceWarning(false);
  };

  const tabs = [
    { key: 'general' as const, label: 'General', icon: '⚙️' },
    { key: 'features' as const, label: 'Features', icon: '🎛️' },
    { key: 'integrations' as const, label: 'Integrations', icon: '🔌' },
    { key: 'security' as const, label: 'Security', icon: '🔒' },
    { key: 'email' as const, label: 'Email', icon: '📧' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-12">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-accent-600 dark:text-accent-400">
              Failed to load settings. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Platform Settings - Admin - Neurmatic</title>
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure platform-wide settings and features
          </p>
        </div>

        {/* Maintenance Mode Toggle */}
        <Card className="mb-6 border-l-4 border-accent-500">
          <CardHeader>
            <CardTitle>Maintenance Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {maintenanceEnabled
                    ? '⚠️ Platform is currently in maintenance mode. Users cannot access the site.'
                    : 'Platform is operational. Toggle to enable maintenance mode.'}
                </p>
              </div>
              <Button
                variant={maintenanceEnabled ? 'destructive' : 'outline'}
                onClick={handleMaintenanceToggle}
                disabled={updateMaintenanceModeMutation.isPending}
              >
                {maintenanceEnabled ? 'Disable' : 'Enable'} Maintenance Mode
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Mode Warning Modal */}
        {showMaintenanceWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle>⚠️ Enable Maintenance Mode?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-600 dark:text-gray-400">
                  This will prevent all users from accessing the platform. Only proceed if you need
                  to perform critical maintenance or updates.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowMaintenanceWarning(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => confirmMaintenanceMode(true)}
                  >
                    Yes, Enable Maintenance Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                  ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          }
        >
          {activeTab === 'general' && (
            <GeneralSettings
              settings={generalSettings as GeneralSettingsType}
              onSave={handleSaveGeneral}
              isSaving={updateSettingsMutation.isPending}
            />
          )}

          {activeTab === 'features' && (
            <FeatureFlags
              settings={featureSettings as FeatureSettingsType}
              onSave={handleSaveFeatures}
              isSaving={updateSettingsMutation.isPending}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationSettings
              settings={integrationSettings as IntegrationSettingsType}
              onSave={handleSaveIntegrations}
              onTestOAuth={handleTestOAuth}
              isSaving={updateSettingsMutation.isPending}
              isTesting={testOAuthMutation.isPending}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettings
              settings={securitySettings as SecuritySettingsType}
              onSave={handleSaveSecurity}
              isSaving={updateSettingsMutation.isPending}
            />
          )}

          {activeTab === 'email' && (
            <EmailSettings
              settings={emailSettings as EmailSettingsType}
              onSave={handleSaveEmail}
              onTestEmail={handleTestEmail}
              isSaving={updateSettingsMutation.isPending}
              isTesting={testEmailMutation.isPending}
            />
          )}
        </Suspense>
      </div>
    </>
  );
};

export default PlatformSettings;
