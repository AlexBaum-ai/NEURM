import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import type { JobPreferences, JobPreferencesFormData } from '../../types';
import { jobPreferencesSchema } from '../../types';

interface JobPreferencesFormProps {
  initialData?: JobPreferences;
  onSubmit: (data: JobPreferencesFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * JobPreferencesForm - Form for editing job search preferences
 *
 * Features:
 * - Availability status and date
 * - Role preferences (multi-select)
 * - Location and remote preferences
 * - Salary expectations
 * - Company preferences
 * - Visibility controls
 */
export const JobPreferencesForm: React.FC<JobPreferencesFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<JobPreferencesFormData>({
    resolver: zodResolver(jobPreferencesSchema),
    defaultValues: {
      isLookingForWork: initialData?.isLookingForWork ?? false,
      availabilityStatus: initialData?.availabilityStatus ?? 'not_looking',
      availableFrom: initialData?.availableFrom,
      rolesInterestedIn: initialData?.rolesInterestedIn ?? [],
      experienceLevel: initialData?.experienceLevel ?? [],
      employmentTypes: initialData?.employmentTypes ?? [],
      preferredLocations: initialData?.preferredLocations ?? [],
      remotePreference: initialData?.remotePreference ?? 'flexible',
      willingToRelocate: initialData?.willingToRelocate ?? false,
      requiresVisaSponsorship: initialData?.requiresVisaSponsorship ?? false,
      salaryExpectation: initialData?.salaryExpectation,
      companySize: initialData?.companySize ?? [],
      companyType: initialData?.companyType ?? [],
      industryPreferences: initialData?.industryPreferences ?? [],
      visibleToRecruiters: initialData?.visibleToRecruiters ?? false,
    },
  });

  const isLookingForWork = watch('isLookingForWork');

  const handleFormSubmit = async (data: JobPreferencesFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = [
    'ML Engineer',
    'LLM Engineer',
    'AI Researcher',
    'Data Scientist',
    'AI Product Manager',
    'Prompt Engineer',
    'MLOps Engineer',
    'Applied AI Engineer',
    'Research Scientist',
  ];

  const locationSuggestions = [
    'San Francisco, USA',
    'New York, USA',
    'London, UK',
    'Berlin, Germany',
    'Amsterdam, Netherlands',
    'Toronto, Canada',
    'Singapore',
    'Tel Aviv, Israel',
  ];

  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'CHF'];

  const toggleArrayValue = (field: keyof JobPreferencesFormData, value: string) => {
    const currentValues = watch(field) as string[];
    if (currentValues.includes(value)) {
      setValue(
        field,
        currentValues.filter((v) => v !== value) as never
      );
    } else {
      setValue(field, [...currentValues, value] as never);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Looking for Work Toggle */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('isLookingForWork')}
            className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              I'm looking for work
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Enable this to be discovered by recruiters
            </div>
          </div>
        </label>
      </div>

      {/* Availability Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Availability Status *
        </label>
        <select
          {...register('availabilityStatus')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        >
          <option value="available_immediately">Available Immediately</option>
          <option value="available_2_weeks">Available in 2 weeks</option>
          <option value="available_1_month">Available in 1 month</option>
          <option value="available_3_months">Available in 3 months</option>
          <option value="open_to_offers">Open to offers</option>
          <option value="not_looking">Not actively looking</option>
        </select>
        {errors.availabilityStatus && (
          <p className="mt-1 text-sm text-red-600">{errors.availabilityStatus.message}</p>
        )}
      </div>

      {/* Roles Interested In */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Roles Interested In
        </label>
        <div className="flex flex-wrap gap-2">
          {roleOptions.map((role) => {
            const isSelected = watch('rolesInterestedIn').includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleArrayValue('rolesInterestedIn', role)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Experience Level
        </label>
        <div className="flex flex-wrap gap-2">
          {['junior', 'mid', 'senior', 'lead', 'principal'].map((level) => {
            const isSelected = watch('experienceLevel').includes(level as never);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleArrayValue('experienceLevel', level)}
                className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {level}
              </button>
            );
          })}
        </div>
      </div>

      {/* Employment Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Employment Types
        </label>
        <div className="flex flex-wrap gap-2">
          {['full_time', 'part_time', 'contract', 'freelance', 'internship'].map((type) => {
            const isSelected = watch('employmentTypes').includes(type as never);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleArrayValue('employmentTypes', type)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Remote Preference */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Remote Work Preference *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['remote_only', 'hybrid', 'onsite', 'flexible'].map((pref) => {
            const isSelected = watch('remotePreference') === pref;
            return (
              <button
                key={pref}
                type="button"
                onClick={() => setValue('remotePreference', pref as never)}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {pref.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preferred Locations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preferred Locations
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Click to add suggested locations or type your own
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {watch('preferredLocations').map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
            >
              {loc}
              <button
                type="button"
                onClick={() => {
                  setValue(
                    'preferredLocations',
                    watch('preferredLocations').filter((l) => l !== loc)
                  );
                }}
                className="hover:text-primary-900 dark:hover:text-primary-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {locationSuggestions
            .filter((loc) => !watch('preferredLocations').includes(loc))
            .map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => {
                  setValue('preferredLocations', [...watch('preferredLocations'), loc]);
                }}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-primary-100 dark:hover:bg-primary-900/30"
              >
                + {loc}
              </button>
            ))}
        </div>
      </div>

      {/* Relocation & Visa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('willingToRelocate')}
            className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Willing to relocate</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('requiresVisaSponsorship')}
            className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Requires visa sponsorship
          </span>
        </label>
      </div>

      {/* Salary Expectations */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Salary Expectations (Optional)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Controller
            name="salaryExpectation.min"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                placeholder="Min"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            )}
          />
          <Controller
            name="salaryExpectation.max"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                placeholder="Max"
                value={field.value || ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            )}
          />
          <Controller
            name="salaryExpectation.currency"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value || 'USD'}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                {currencyOptions.map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            )}
          />
          <Controller
            name="salaryExpectation.period"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value || 'annual'}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="annual">Annual</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
              </select>
            )}
          />
        </div>
      </div>

      {/* Company Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Company Size Preference
        </label>
        <div className="flex flex-wrap gap-2">
          {['startup', 'small', 'medium', 'large', 'enterprise'].map((size) => {
            const isSelected = watch('companySize')?.includes(size as never);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleArrayValue('companySize', size)}
                className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Company Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Company Type Preference
        </label>
        <div className="flex flex-wrap gap-2">
          {['startup', 'scaleup', 'enterprise', 'agency', 'research'].map((type) => {
            const isSelected = watch('companyType')?.includes(type as never);
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleArrayValue('companyType', type)}
                className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visibility to Recruiters */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('visibleToRecruiters')}
            disabled={!isLookingForWork}
            className="mt-0.5 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                Make profile visible to recruiters
              </span>
              {watch('visibleToRecruiters') ? (
                <Eye className="w-4 h-4 text-green-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              When enabled, recruiters can view your job preferences and contact you about opportunities
            </div>
          </div>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Preferences'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">
            Please fix the errors above before submitting.
          </p>
        </div>
      )}
    </form>
  );
};

export default JobPreferencesForm;
