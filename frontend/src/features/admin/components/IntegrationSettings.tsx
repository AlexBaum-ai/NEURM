/**
 * IntegrationSettings Component
 *
 * Configuration for third-party integrations
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import {
  integrationSettingsSchema,
  type IntegrationSettingsFormData,
} from '../utils/validation';
import { hasUnsavedChanges } from '../utils/settings.helpers';
import type { IntegrationSettings } from '../types/settings.types';

interface IntegrationSettingsProps {
  settings: IntegrationSettings;
  onSave: (data: IntegrationSettings) => Promise<void>;
  onTestOAuth?: (provider: 'google' | 'linkedin' | 'github') => Promise<void>;
  isSaving: boolean;
  isTesting?: boolean;
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

export const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  settings,
  onSave,
  onTestOAuth,
  isSaving,
  isTesting,
}) => {
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<IntegrationSettingsFormData>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: settings,
  });

  const formValues = watch();

  useEffect(() => {
    setHasChanges(hasUnsavedChanges(settings, formValues));
  }, [formValues, settings]);

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: IntegrationSettingsFormData) => {
    await onSave(data as IntegrationSettings);
    reset(data);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* OAuth Providers */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              OAuth Providers
            </h3>

            {/* Google OAuth */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Google OAuth</h4>
                <Controller
                  name="google_oauth_enabled"
                  control={control}
                  render={({ field }) => (
                    <ToggleSwitch
                      enabled={field.value ?? false}
                      onChange={field.onChange}
                      disabled={isSaving}
                    />
                  )}
                />
              </div>
              {onTestOAuth && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onTestOAuth('google')}
                  disabled={isTesting || !watch('google_oauth_enabled')}
                >
                  Test Google OAuth
                </Button>
              )}
            </div>

            {/* LinkedIn OAuth */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">LinkedIn OAuth</h4>
                <Controller
                  name="linkedin_oauth_enabled"
                  control={control}
                  render={({ field }) => (
                    <ToggleSwitch
                      enabled={field.value ?? false}
                      onChange={field.onChange}
                      disabled={isSaving}
                    />
                  )}
                />
              </div>
              {onTestOAuth && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onTestOAuth('linkedin')}
                  disabled={isTesting || !watch('linkedin_oauth_enabled')}
                >
                  Test LinkedIn OAuth
                </Button>
              )}
            </div>

            {/* GitHub OAuth */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">GitHub OAuth</h4>
                <Controller
                  name="github_oauth_enabled"
                  control={control}
                  render={({ field }) => (
                    <ToggleSwitch
                      enabled={field.value ?? false}
                      onChange={field.onChange}
                      disabled={isSaving}
                    />
                  )}
                />
              </div>
              {onTestOAuth && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onTestOAuth('github')}
                  disabled={isTesting || !watch('github_oauth_enabled')}
                >
                  Test GitHub OAuth
                </Button>
              )}
            </div>
          </div>

          {/* Analytics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h3>

            <Input
              label="Google Analytics ID"
              {...register('google_analytics_id')}
              error={errors.google_analytics_id?.message}
              placeholder="G-XXXXXXXXXX"
            />

            <Input
              label="Plausible Domain"
              {...register('plausible_domain')}
              error={errors.plausible_domain?.message}
              placeholder="example.com"
            />
          </div>

          {/* CDN */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CDN</h3>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Enable CDN</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use CDN for static asset delivery
                </p>
              </div>
              <Controller
                name="cdn_enabled"
                control={control}
                render={({ field }) => (
                  <ToggleSwitch
                    enabled={field.value ?? false}
                    onChange={field.onChange}
                    disabled={isSaving}
                  />
                )}
              />
            </div>

            {watch('cdn_enabled') && (
              <Input
                label="CDN URL"
                {...register('cdn_url')}
                error={errors.cdn_url?.message}
                placeholder="https://cdn.example.com"
                type="url"
              />
            )}
          </div>

          {/* Email Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Service
            </h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Provider
              </label>
              <select
                {...register('email_service')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="">Select provider</option>
                <option value="sendgrid">SendGrid</option>
                <option value="aws_ses">AWS SES</option>
              </select>
              {errors.email_service && (
                <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">
                  {errors.email_service.message}
                </p>
              )}
            </div>
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
