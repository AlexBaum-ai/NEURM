/**
 * EmailSettings Component
 *
 * Configuration for email and SMTP settings
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { emailSettingsSchema, type EmailSettingsFormData } from '../utils/validation';
import { hasUnsavedChanges } from '../utils/settings.helpers';
import type { EmailSettings } from '../types/settings.types';

interface EmailSettingsProps {
  settings: EmailSettings;
  onSave: (data: EmailSettings) => Promise<void>;
  onTestEmail?: (recipient: string) => Promise<void>;
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

export const EmailSettings: React.FC<EmailSettingsProps> = ({
  settings,
  onSave,
  onTestEmail,
  isSaving,
  isTesting,
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: settings,
  });

  const formValues = watch();

  useEffect(() => {
    setHasChanges(hasUnsavedChanges(settings, formValues));
  }, [formValues, settings]);

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: EmailSettingsFormData) => {
    await onSave(data as EmailSettings);
    reset(data);
    setHasChanges(false);
  };

  const handleTestEmail = async () => {
    if (onTestEmail && testEmailAddress) {
      await onTestEmail(testEmailAddress);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* SMTP Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              SMTP Configuration
            </h3>

            <Input
              label="SMTP Host"
              {...register('smtp_host')}
              error={errors.smtp_host?.message}
              placeholder="smtp.example.com"
            />

            <Input
              type="number"
              label="SMTP Port"
              {...register('smtp_port', { valueAsNumber: true })}
              error={errors.smtp_port?.message}
              placeholder="587"
            />

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Use SSL/TLS</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enable secure connection for SMTP
                </p>
              </div>
              <Controller
                name="smtp_secure"
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

            <Input
              label="SMTP Username"
              {...register('smtp_user')}
              error={errors.smtp_user?.message}
              placeholder="user@example.com"
              autoComplete="username"
            />

            <Input
              type="password"
              label="SMTP Password"
              {...register('smtp_password')}
              error={errors.smtp_password?.message}
              placeholder="•••••••••••"
              autoComplete="current-password"
            />
          </div>

          {/* Email Addresses */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Addresses
            </h3>

            <Input
              type="email"
              label="From Email"
              {...register('from_email')}
              error={errors.from_email?.message}
              placeholder="noreply@example.com"
            />

            <Input
              type="email"
              label="Support Email"
              {...register('support_email')}
              error={errors.support_email?.message}
              placeholder="support@example.com"
            />

            <Input
              type="email"
              label="No-Reply Email"
              {...register('noreply_email')}
              error={errors.noreply_email?.message}
              placeholder="noreply@example.com"
            />
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notification Settings
            </h3>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send email notifications for user events
                </p>
              </div>
              <Controller
                name="notification_email_enabled"
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

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Digest Emails</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Send periodic digest emails to users
                </p>
              </div>
              <Controller
                name="digest_email_enabled"
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

            {watch('digest_email_enabled') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Digest Frequency
                </label>
                <select
                  {...register('digest_frequency')}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Test Email */}
          {onTestEmail && (
            <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Test Email Configuration
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Send a test email to verify your SMTP settings
              </p>
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={isTesting || !testEmailAddress}
                >
                  {isTesting ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </div>
          )}

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
