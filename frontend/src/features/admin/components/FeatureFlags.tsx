/**
 * FeatureFlags Component
 *
 * Toggle switches for platform feature flags
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { featureSettingsSchema, type FeatureSettingsFormData } from '../utils/validation';
import { hasUnsavedChanges } from '../utils/settings.helpers';
import type { FeatureSettings } from '../types/settings.types';

interface FeatureFlagsProps {
  settings: FeatureSettings;
  onSave: (data: FeatureSettings) => Promise<void>;
  isSaving: boolean;
}

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

export const FeatureFlags: React.FC<FeatureFlagsProps> = ({ settings, onSave, isSaving }) => {
  const [hasChanges, setHasChanges] = useState(false);

  const { control, handleSubmit, watch, reset } = useForm<FeatureSettingsFormData>({
    resolver: zodResolver(featureSettingsSchema),
    defaultValues: settings,
  });

  const formValues = watch();

  useEffect(() => {
    setHasChanges(hasUnsavedChanges(settings, formValues));
  }, [formValues, settings]);

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: FeatureSettingsFormData) => {
    await onSave(data as FeatureSettings);
    reset(data);
    setHasChanges(false);
  };

  const featureToggles = [
    {
      name: 'forum_enabled' as const,
      label: 'Forum',
      description: 'Enable community forum discussions',
    },
    {
      name: 'jobs_enabled' as const,
      label: 'Jobs Board',
      description: 'Enable job postings and applications',
    },
    {
      name: 'llm_guide_enabled' as const,
      label: 'LLM Guide',
      description: 'Enable LLM model reference and guides',
    },
    {
      name: 'messaging_enabled' as const,
      label: 'Messaging',
      description: 'Enable private messaging between users',
    },
    {
      name: 'notifications_enabled' as const,
      label: 'Notifications',
      description: 'Enable real-time notifications',
    },
    {
      name: 'search_enabled' as const,
      label: 'Search',
      description: 'Enable platform-wide search functionality',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Feature Toggles */}
          <div className="space-y-4">
            {featureToggles.map((feature) => (
              <Controller
                key={feature.name}
                name={feature.name}
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {feature.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                    <ToggleSwitch
                      enabled={field.value ?? false}
                      onChange={field.onChange}
                      disabled={isSaving}
                    />
                  </div>
                )}
              />
            ))}
          </div>

          {/* Beta Features */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Beta Features
            </label>
            <Controller
              name="beta_features"
              control={control}
              render={({ field }) => (
                <textarea
                  value={(field.value || []).join('\n')}
                  onChange={(e) => {
                    const features = e.target.value
                      .split('\n')
                      .map((f) => f.trim())
                      .filter(Boolean);
                    field.onChange(features);
                  }}
                  className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-gray-500"
                  placeholder="Enter beta feature names (one per line)"
                  rows={5}
                />
              )}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter beta feature names, one per line. These features will be hidden behind feature
              flags.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            {hasChanges && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                You have unsaved changes
              </p>
            )}
            <div className="ml-auto flex gap-3">
              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset(settings);
                    setHasChanges(false);
                  }}
                  disabled={isSaving}
                >
                  Reset
                </Button>
              )}
              <Button type="submit" disabled={isSaving || !hasChanges}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
