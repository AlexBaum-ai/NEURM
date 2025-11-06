/**
 * SecuritySettings Component
 *
 * Configuration for security policies and rate limiting
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import {
  securitySettingsSchema,
  type SecuritySettingsFormData,
} from '../utils/validation';
import { hasUnsavedChanges } from '../utils/settings.helpers';
import type { SecuritySettings } from '../types/settings.types';

interface SecuritySettingsProps {
  settings: SecuritySettings;
  onSave: (data: SecuritySettings) => Promise<void>;
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

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: settings,
  });

  const formValues = watch();

  useEffect(() => {
    setHasChanges(hasUnsavedChanges(settings, formValues));
  }, [formValues, settings]);

  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: SecuritySettingsFormData) => {
    await onSave(data as SecuritySettings);
    reset(data);
    setHasChanges(false);
  };

  const rateLimitEnabled = watch('rate_limit_enabled');
  const captchaEnabled = watch('captcha_enabled');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Rate Limiting */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rate Limiting
            </h3>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Enable Rate Limiting</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Protect against abuse by limiting request rates
                </p>
              </div>
              <Controller
                name="rate_limit_enabled"
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

            {rateLimitEnabled && (
              <>
                <div>
                  <Input
                    type="number"
                    label="Time Window (milliseconds)"
                    {...register('rate_limit_window_ms', { valueAsNumber: true })}
                    error={errors.rate_limit_window_ms?.message}
                    placeholder="60000"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Time window for rate limiting (e.g., 60000 = 1 minute)
                  </p>
                </div>

                <div>
                  <Input
                    type="number"
                    label="Max Requests"
                    {...register('rate_limit_max_requests', { valueAsNumber: true })}
                    error={errors.rate_limit_max_requests?.message}
                    placeholder="100"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Maximum requests allowed in the time window
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Session */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Session</h3>

            <div>
              <Input
                type="number"
                label="Session Timeout (minutes)"
                {...register('session_timeout_minutes', { valueAsNumber: true })}
                error={errors.session_timeout_minutes?.message}
                placeholder="60"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                User sessions expire after this period of inactivity
              </p>
            </div>
          </div>

          {/* 2FA */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Two-Factor Authentication
            </h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                2FA Enforcement
              </label>
              <select
                {...register('two_factor_enforcement')}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
              >
                <option value="none">None (Optional)</option>
                <option value="admin">Admin Only (Required for admins)</option>
                <option value="all">All Users (Required for everyone)</option>
              </select>
              {errors.two_factor_enforcement && (
                <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">
                  {errors.two_factor_enforcement.message}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose who must use two-factor authentication
              </p>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CAPTCHA</h3>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white">Enable CAPTCHA</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Protect forms from bots and abuse
                </p>
              </div>
              <Controller
                name="captcha_enabled"
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

            {captchaEnabled && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CAPTCHA Provider
                  </label>
                  <select
                    {...register('captcha_provider')}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="">Select provider</option>
                    <option value="recaptcha">Google reCAPTCHA</option>
                    <option value="hcaptcha">hCaptcha</option>
                    <option value="turnstile">Cloudflare Turnstile</option>
                  </select>
                </div>

                <Input
                  label="Site Key"
                  {...register('captcha_site_key')}
                  error={errors.captcha_site_key?.message}
                  placeholder="6Lc..."
                />

                <Input
                  label="Secret Key"
                  type="password"
                  {...register('captcha_secret_key')}
                  error={errors.captcha_secret_key?.message}
                  placeholder="•••••••••••"
                />
              </>
            )}
          </div>

          {/* Password Policy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Password Policy
            </h3>

            <div>
              <Input
                type="number"
                label="Minimum Length"
                {...register('password_min_length', { valueAsNumber: true })}
                error={errors.password_min_length?.message}
                placeholder="8"
              />
            </div>

            <div className="space-y-3">
              <Controller
                name="password_require_uppercase"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Require uppercase letters
                    </span>
                  </label>
                )}
              />

              <Controller
                name="password_require_lowercase"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Require lowercase letters
                    </span>
                  </label>
                )}
              />

              <Controller
                name="password_require_numbers"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Require numbers
                    </span>
                  </label>
                )}
              />

              <Controller
                name="password_require_special"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={field.value ?? false}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Require special characters
                    </span>
                  </label>
                )}
              />
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
