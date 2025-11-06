import React from 'react';
import type { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import Input from '@/components/common/Input/Input';
import { Select } from '@/components/forms/Select';
import RichTextEditor from '@/components/editors/RichTextEditor';
import type { JobFormValues } from '../utils/validation';

interface BasicInfoStepProps {
  register: UseFormRegister<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
  watch: UseFormWatch<JobFormValues>;
  setValue: (name: any, value: any) => void;
}

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'freelance', label: 'Freelance/Contract' },
  { value: 'internship', label: 'Internship' }
];

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  register,
  errors,
  watch,
  setValue
}) => {
  const title = watch('title') || '';
  const description = watch('description') || '';

  const titleLength = title.length;
  const descriptionText = description.replace(/<[^>]*>/g, '');
  const descriptionLength = descriptionText.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Basic Information
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Start with the fundamental details of your job posting
        </p>
      </div>

      {/* Job Title */}
      <div>
        <Input
          label="Job Title"
          placeholder="e.g., Senior LLM Engineer, AI Prompt Specialist"
          {...register('title')}
          error={errors.title?.message}
          required
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Be specific and descriptive</span>
          <span className={titleLength > 100 ? 'text-red-500' : ''}>
            {titleLength}/100
          </span>
        </div>
      </div>

      {/* Job Description */}
      <div>
        <RichTextEditor
          label="Job Description"
          value={description}
          onChange={(value) => setValue('description', value)}
          placeholder="Describe the role, what you're building, and what makes this opportunity exciting..."
          error={errors.description?.message}
          maxLength={10000}
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Include company overview, role overview, and what you're building</span>
          <span className={descriptionLength > 10000 ? 'text-red-500' : ''}>
            {descriptionLength}/10,000
          </span>
        </div>
      </div>

      {/* Employment Type & Positions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Employment Type"
          {...register('employmentType')}
          error={errors.employmentType?.message}
          options={EMPLOYMENT_TYPES}
          required
        />

        <Input
          label="Number of Positions"
          type="number"
          min={1}
          max={100}
          placeholder="1"
          {...register('positionsAvailable', { valueAsNumber: true })}
          error={errors.positionsAvailable?.message}
          required
        />
      </div>

      {/* Help Text */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Tip:</strong> A compelling job description should include:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-400 list-disc list-inside">
          <li>What problem your company/product solves</li>
          <li>Overview of the role and day-to-day responsibilities</li>
          <li>What makes this opportunity unique or exciting</li>
          <li>Your tech stack and LLM implementation approach</li>
        </ul>
      </div>
    </div>
  );
};

export default BasicInfoStep;
