import React from 'react';
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import SkillsSelector from './SkillsSelector';
import type { JobFormValues } from '../utils/validation';

interface RequirementsStepProps {
  register: UseFormRegister<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
  watch: UseFormWatch<JobFormValues>;
  setValue: UseFormSetValue<JobFormValues>;
}

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior (0-2 years)' },
  { value: 'mid', label: 'Mid-Level (2-5 years)' },
  { value: 'senior', label: 'Senior (5-8 years)' },
  { value: 'lead', label: 'Lead (8+ years)' },
  { value: 'principal', label: 'Principal (10+ years)' }
];

const RequirementsStep: React.FC<RequirementsStepProps> = ({
  register,
  errors,
  watch,
  setValue
}) => {
  const requirements = watch('requirements') || '';
  const skills = watch('skills') || [];
  const requirementsLength = requirements.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Requirements & Skills
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Define the qualifications and skills needed for this role
        </p>
      </div>

      {/* Experience Level */}
      <Select
        label="Experience Level"
        {...register('experienceLevel')}
        error={errors.experienceLevel?.message}
        options={EXPERIENCE_LEVELS}
        required
      />

      {/* Requirements */}
      <div>
        <Textarea
          label="Requirements"
          placeholder="List the key requirements for this role:&#10;• 5+ years of experience with LLMs&#10;• Strong understanding of prompt engineering&#10;• Experience building RAG systems&#10;• Bachelor's degree in CS or related field&#10;..."
          rows={10}
          {...register('requirements')}
          error={errors.requirements?.message}
          required
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Be specific about must-have vs. nice-to-have qualifications</span>
          <span className={requirementsLength > 5000 ? 'text-red-500' : ''}>
            {requirementsLength}/5,000
          </span>
        </div>
      </div>

      {/* Skills Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Required Skills <span className="text-red-500">*</span>
        </label>
        <SkillsSelector
          skills={skills}
          onChange={(newSkills) => setValue('skills', newSkills)}
          error={errors.skills?.message}
        />
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Add specific LLM and AI skills with proficiency levels. This helps candidates understand expectations.
        </p>
      </div>

      {/* Help Text */}
      <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
        <p className="text-sm text-green-800 dark:text-green-300">
          <strong>Best Practices:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-green-700 dark:text-green-400 list-disc list-inside">
          <li>Separate must-have requirements from nice-to-have</li>
          <li>Be realistic about experience level needed</li>
          <li>Include both technical and soft skills</li>
          <li>Use star ratings to indicate proficiency levels clearly</li>
          <li>Avoid overly long lists that might discourage qualified candidates</li>
        </ul>
      </div>
    </div>
  );
};

export default RequirementsStep;
