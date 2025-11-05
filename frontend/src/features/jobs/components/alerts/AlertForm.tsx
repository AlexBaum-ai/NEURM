import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Badge } from '@/components/common/Badge/Badge';
import type { CreateAlertRequest, ExperienceLevel, EmploymentType } from '../../types';

const alertFormSchema = z.object({
  keywords: z.array(z.string()).optional(),
  location: z.string().optional(),
  remote: z.boolean().optional(),
  jobTypes: z.array(z.string()).optional(),
  experienceLevels: z.array(z.string()).optional(),
  models: z.array(z.string()).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  emailFrequency: z.enum(['instant', 'daily', 'weekly']).optional(),
});

const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  freelance: 'Freelance',
  internship: 'Internship',
};

const experienceLevelLabels: Record<ExperienceLevel, string> = {
  junior: 'Junior',
  mid: 'Mid-Level',
  senior: 'Senior',
  lead: 'Lead',
  principal: 'Principal',
};

const commonModels = [
  'GPT-4',
  'GPT-3.5',
  'Claude',
  'Llama',
  'PaLM',
  'Gemini',
  'Mistral',
  'Cohere',
];

interface AlertFormProps {
  initialData?: Partial<CreateAlertRequest>;
  onSubmit: (data: CreateAlertRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const AlertForm: React.FC<AlertFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [keywordInput, setKeywordInput] = useState('');
  const [modelInput, setModelInput] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(alertFormSchema),
    defaultValues: {
      keywords: initialData?.keywords || [],
      location: initialData?.location || '',
      remote: initialData?.remote || false,
      jobTypes: initialData?.jobTypes || [],
      experienceLevels: initialData?.experienceLevels || [],
      models: initialData?.models || [],
      salaryMin: initialData?.salaryMin || undefined,
      salaryMax: initialData?.salaryMax || undefined,
      emailFrequency: initialData?.emailFrequency || 'daily',
    },
  });

  const keywords = watch('keywords') || [];
  const models = watch('models') || [];
  const jobTypes = watch('jobTypes') || [];
  const experienceLevels = watch('experienceLevels') || [];

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setValue('keywords', [...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setValue(
      'keywords',
      keywords.filter((k) => k !== keyword)
    );
  };

  const addModel = () => {
    if (modelInput.trim() && !models.includes(modelInput.trim())) {
      setValue('models', [...models, modelInput.trim()]);
      setModelInput('');
    }
  };

  const removeModel = (model: string) => {
    setValue(
      'models',
      models.filter((m) => m !== model)
    );
  };

  const toggleJobType = (type: EmploymentType) => {
    if (jobTypes.includes(type)) {
      setValue(
        'jobTypes',
        jobTypes.filter((t) => t !== type)
      );
    } else {
      setValue('jobTypes', [...jobTypes, type]);
    }
  };

  const toggleExperienceLevel = (level: ExperienceLevel) => {
    if (experienceLevels.includes(level)) {
      setValue(
        'experienceLevels',
        experienceLevels.filter((l) => l !== level)
      );
    } else {
      setValue('experienceLevels', [...experienceLevels, level]);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Keywords (optional)
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addKeyword();
              }
            }}
            placeholder="e.g., machine learning, NLP, Python"
          />
          <Button type="button" onClick={addKeyword} variant="outline" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="hover:text-accent-600 dark:hover:text-accent-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Location (optional)
        </label>
        <Input
          id="location"
          type="text"
          {...register('location')}
          placeholder="e.g., San Francisco, New York"
        />
      </div>

      {/* Remote */}
      <div className="flex items-center">
        <input
          id="remote"
          type="checkbox"
          {...register('remote')}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
        />
        <label htmlFor="remote" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          Include remote jobs only
        </label>
      </div>

      {/* Job Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Job Types (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(employmentTypeLabels) as EmploymentType[]).map((type) => (
            <Badge
              key={type}
              variant={jobTypes.includes(type) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleJobType(type)}
            >
              {employmentTypeLabels[type]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Experience Levels */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Experience Levels (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(experienceLevelLabels) as ExperienceLevel[]).map((level) => (
            <Badge
              key={level}
              variant={experienceLevels.includes(level) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleExperienceLevel(level)}
            >
              {experienceLevelLabels[level]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Models */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          LLM Models (optional)
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addModel();
              }
            }}
            placeholder="Add custom model"
          />
          <Button type="button" onClick={addModel} variant="outline" size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {commonModels.map((model) => (
            <Badge
              key={model}
              variant={models.includes(model) ? 'tech' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                if (models.includes(model)) {
                  removeModel(model);
                } else {
                  setValue('models', [...models, model]);
                }
              }}
            >
              {model}
            </Badge>
          ))}
        </div>
        {models.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {models
              .filter((m) => !commonModels.includes(m))
              .map((model) => (
                <Badge key={model} variant="tech" className="flex items-center gap-1">
                  {model}
                  <button
                    type="button"
                    onClick={() => removeModel(model)}
                    className="hover:text-accent-600 dark:hover:text-accent-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
          </div>
        )}
      </div>

      {/* Salary Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="salaryMin"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Min Salary (optional)
          </label>
          <Input
            id="salaryMin"
            type="number"
            {...register('salaryMin', { valueAsNumber: true })}
            placeholder="e.g., 80000"
          />
        </div>
        <div>
          <label
            htmlFor="salaryMax"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Max Salary (optional)
          </label>
          <Input
            id="salaryMax"
            type="number"
            {...register('salaryMax', { valueAsNumber: true })}
            placeholder="e.g., 150000"
          />
        </div>
      </div>

      {/* Email Frequency */}
      <div>
        <label
          htmlFor="emailFrequency"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Email Frequency
        </label>
        <select
          id="emailFrequency"
          {...register('emailFrequency')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="instant">Instant (as jobs are posted)</option>
          <option value="daily">Daily Digest</option>
          <option value="weekly">Weekly Digest</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : initialData ? 'Update Alert' : 'Create Alert'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
