import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import PreferenceGroup from './notifications/PreferenceGroup';
import DndSchedule from './notifications/DndSchedule';
import { NOTIFICATION_SECTIONS } from '../constants/notificationConfig';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  updateDndSchedule,
  sendTestPushNotification,
} from '../api/notificationPreferences.api';
import type {
  NotificationPreference,
  DndSchedule as DndScheduleType,
  NotificationType,
} from '../types/notifications.types';

const NotificationsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [vacationMode, setVacationMode] = useState(false);
  const [localPreferences, setLocalPreferences] = useState<Map<NotificationType, NotificationPreference>>(
    new Map()
  );
  const [localDndSchedule, setLocalDndSchedule] = useState<DndScheduleType>({
    startTime: '22:00',
    endTime: '08:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: false,
    timezone: 'UTC',
  });

  // Fetch preferences
  const { data, isLoading, error } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: getNotificationPreferences,
  });

  // Initialize local state when data is loaded
  useEffect(() => {
    if (data) {
      const prefsMap = new Map<NotificationType, NotificationPreference>();
      data.preferences.forEach((pref) => {
        prefsMap.set(pref.notificationType, pref);
      });
      setLocalPreferences(prefsMap);
      setLocalDndSchedule(data.dndSchedule);
      setVacationMode(data.vacationMode || false);
    }
  }, [data]);

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      Sentry.captureException(error);
      console.error('Failed to update preferences:', error);
    },
  });

  // Update DND schedule mutation
  const updateDndMutation = useMutation({
    mutationFn: updateDndSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      Sentry.captureException(error);
      console.error('Failed to update DND schedule:', error);
    },
  });

  // Send test push notification mutation
  const testPushMutation = useMutation({
    mutationFn: sendTestPushNotification,
    onError: (error) => {
      Sentry.captureException(error);
      console.error('Failed to send test push notification:', error);
    },
  });

  const handlePreferenceChange = (preference: NotificationPreference) => {
    const newPreferences = new Map(localPreferences);
    newPreferences.set(preference.notificationType, preference);
    setLocalPreferences(newPreferences);
    setHasUnsavedChanges(true);
  };

  const handleDndScheduleChange = (schedule: DndScheduleType) => {
    setLocalDndSchedule(schedule);
    setHasUnsavedChanges(true);
  };

  const handleVacationModeToggle = () => {
    setVacationMode(!vacationMode);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      // Save preferences
      const preferencesArray = Array.from(localPreferences.values());
      await updatePreferencesMutation.mutateAsync({
        preferences: preferencesArray,
      });

      // Save DND schedule
      await updateDndMutation.mutateAsync(localDndSchedule);

      // Show success message (you can replace with toast notification)
      alert('Notification preferences saved successfully!');
    } catch (error) {
      alert('Failed to save preferences. Please try again.');
    }
  };

  const handleTestPush = async () => {
    try {
      const result = await testPushMutation.mutateAsync();
      alert(result.message || 'Test notification sent!');
    } catch (error) {
      alert('Failed to send test notification. Please try again.');
    }
  };

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Failed to load notification preferences</p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] })}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Notification Preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Vacation Mode */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <span>🏖️</span>
              Vacation Mode
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Pause all notifications temporarily
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={vacationMode}
              onChange={handleVacationModeToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
          </label>
        </div>
      </div>

      {/* Notification Sections */}
      {NOTIFICATION_SECTIONS.map((section) => (
        <div key={section.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
          {/* Section Header */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">{section.icon}</span>
              {section.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
          </div>

          {/* Notification Types */}
          <div className="space-y-0">
            {section.types.map((typeConfig) => (
              <PreferenceGroup
                key={typeConfig.type}
                config={typeConfig}
                preference={localPreferences.get(typeConfig.type)}
                onChange={handlePreferenceChange}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Do Not Disturb Schedule */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <DndSchedule schedule={localDndSchedule} onChange={handleDndScheduleChange} />
      </div>

      {/* Email Digest Preview */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Email Digest Preview</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              See what your email digests will look like
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            onClick={() => alert('Email digest preview coming soon!')}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Push Notification Test */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Test Push Notifications</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Send a test push notification to verify it's working
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestPush}
            disabled={testPushMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testPushMutation.isPending ? 'Sending...' : 'Send Test'}
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-800">
        <div>
          {hasUnsavedChanges && (
            <p className="text-sm text-amber-600 dark:text-amber-400">You have unsaved changes</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasUnsavedChanges || updatePreferencesMutation.isPending || updateDndMutation.isPending}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {updatePreferencesMutation.isPending || updateDndMutation.isPending
            ? 'Saving...'
            : 'Save Preferences'}
        </button>
      </div>

      {/* Success Message */}
      {updatePreferencesMutation.isSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ Your notification preferences have been saved successfully!
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;
