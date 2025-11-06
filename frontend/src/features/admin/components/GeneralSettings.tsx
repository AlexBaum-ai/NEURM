/**
 * GeneralSettings Component
 *
 * Form for managing general platform settings
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import {
  generalSettingsSchema,
  type GeneralSettingsFormData,
} from '../utils/validation';
import { hasUnsavedChanges } from '../utils/settings.helpers';
import type { GeneralSettings } from '../types/settings.types';

interface GeneralSettingsProps {
  settings: GeneralSettings;
  onSave: (data: GeneralSettings) => Promise<void>;
  isSaving: boolean;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  onSave,
  isSaving,
}) => {
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: settings,
  });

  // Watch form values to detect changes
  const formValues = watch();

  useEffect(() => {
    setHasChanges(hasUnsavedChanges(settings, formValues));
  }, [formValues, settings]);

  // Reset form when settings change from parent
  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: GeneralSettingsFormData) => {
    await onSave(data as GeneralSettings);
    reset(data);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Platform Name */}
          <Input
            label="Platform Name"
            {...register('platform_name')}
            error={errors.platform_name?.message}
            placeholder="Neurmatic"
          />

          {/* Tagline */}
          <Input
            label="Tagline"
            {...register('tagline')}
            error={errors.tagline?.message}
            placeholder="LLM Community Platform"
          />

          {/* Logo URL */}
          <div>
            <Input
              label="Logo URL"
              {...register('logo_url')}
              error={errors.logo_url?.message}
              placeholder="https://example.com/logo.png"
              type="url"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the URL of your platform logo
            </p>
          </div>

          {/* Favicon URL */}
          <div>
            <Input
              label="Favicon URL"
              {...register('favicon_url')}
              error={errors.favicon_url?.message}
              placeholder="https://example.com/favicon.ico"
              type="url"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the URL of your favicon (16x16 or 32x32 pixels)
            </p>
          </div>

          {/* Default Language */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default Language
            </label>
            <select
              {...register('default_language')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
            >
              <option value="en">English</option>
              <option value="nl">Nederlands</option>
            </select>
            {errors.default_language && (
              <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">
                {errors.default_language.message}
              </p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <Input
              label="Timezone"
              {...register('timezone')}
              error={errors.timezone?.message}
              placeholder="Europe/Amsterdam"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              IANA timezone identifier (e.g., Europe/Amsterdam, America/New_York)
            </p>
          </div>

          {/* Maintenance Message */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Maintenance Message
            </label>
            <textarea
              {...register('maintenance_message')}
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-gray-500"
              placeholder="We are performing scheduled maintenance. We'll be back shortly."
              rows={3}
            />
            {errors.maintenance_message && (
              <p className="mt-1 text-sm text-accent-600 dark:text-accent-400">
                {errors.maintenance_message.message}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Message displayed when maintenance mode is enabled
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
