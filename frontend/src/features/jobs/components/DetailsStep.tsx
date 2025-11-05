import React, { useState } from 'react';
import { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import Input from '@/components/common/Input/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import Button from '@/components/common/Button/Button';
import type { JobFormValues } from '../utils/validation';

interface DetailsStepProps {
  register: UseFormRegister<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
  watch: UseFormWatch<JobFormValues>;
  setValue: UseFormSetValue<JobFormValues>;
}

const REMOTE_TYPES = [
  { value: 'remote', label: 'Fully Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on_site', label: 'On-Site' }
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' }
];

const DetailsStep: React.FC<DetailsStepProps> = ({
  register,
  errors,
  watch,
  setValue
}) => {
  const benefits = watch('benefits') || '';
  const responsibilities = watch('responsibilities') || '';
  const screeningQuestions = watch('screeningQuestions') || [];
  const salaryIsPublic = watch('salaryIsPublic');

  const [newQuestion, setNewQuestion] = useState('');
  const [questionRequired, setQuestionRequired] = useState(true);

  const benefitsLength = benefits.length;
  const responsibilitiesLength = responsibilities.length;

  const handleAddQuestion = () => {
    if (!newQuestion.trim() || screeningQuestions.length >= 5) return;

    const question = {
      question: newQuestion.trim(),
      required: questionRequired
    };

    setValue('screeningQuestions', [...screeningQuestions, question]);
    setNewQuestion('');
    setQuestionRequired(true);
  };

  const handleRemoveQuestion = (index: number) => {
    setValue(
      'screeningQuestions',
      screeningQuestions.filter((_, i) => i !== index)
    );
  };

  // Get minimum date for deadline (tomorrow)
  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 1);
  const minDeadlineStr = minDeadline.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Job Details & Compensation
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Complete the posting with location, salary, and additional details
        </p>
      </div>

      {/* Location & Remote Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Location"
          placeholder="e.g., San Francisco, CA or Europe"
          {...register('location')}
          error={errors.location?.message}
          required
        />

        <Select
          label="Remote Type"
          {...register('remoteType')}
          error={errors.remoteType?.message}
          options={REMOTE_TYPES}
          required
        />
      </div>

      {/* Salary Range */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="salaryIsPublic"
            {...register('salaryIsPublic')}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="salaryIsPublic" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Display salary publicly
          </label>
        </div>

        {salaryIsPublic && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Minimum Salary"
              type="number"
              placeholder="80000"
              {...register('salaryMin', { valueAsNumber: true })}
              error={errors.salaryMin?.message}
            />

            <Input
              label="Maximum Salary"
              type="number"
              placeholder="120000"
              {...register('salaryMax', { valueAsNumber: true })}
              error={errors.salaryMax?.message}
            />

            <Select
              label="Currency"
              {...register('salaryCurrency')}
              options={CURRENCIES}
            />
          </div>
        )}
      </div>

      {/* Additional Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="hasVisaSponsorship"
            {...register('hasVisaSponsorship')}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="hasVisaSponsorship" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Visa sponsorship available
          </label>
        </div>

        <Input
          label="Application Deadline (Optional)"
          type="date"
          min={minDeadlineStr}
          {...register('applicationDeadline')}
          error={errors.applicationDeadline?.message}
        />
      </div>

      {/* Responsibilities */}
      <div>
        <Textarea
          label="Responsibilities (Optional)"
          placeholder="Describe the day-to-day responsibilities:&#10;• Design and develop LLM-powered features&#10;• Optimize prompt engineering workflows&#10;• Collaborate with product team on AI features&#10;..."
          rows={8}
          {...register('responsibilities')}
          error={errors.responsibilities?.message}
        />
        <div className="mt-1 flex justify-end text-xs text-gray-500 dark:text-gray-400">
          <span className={responsibilitiesLength > 5000 ? 'text-red-500' : ''}>
            {responsibilitiesLength}/5,000
          </span>
        </div>
      </div>

      {/* Benefits */}
      <div>
        <Textarea
          label="Benefits & Perks (Optional)"
          placeholder="List the benefits and perks:&#10;• Competitive equity package&#10;• Health, dental, vision insurance&#10;• Unlimited PTO&#10;• Remote work flexibility&#10;• Learning & development budget&#10;..."
          rows={8}
          {...register('benefits')}
          error={errors.benefits?.message}
        />
        <div className="mt-1 flex justify-end text-xs text-gray-500 dark:text-gray-400">
          <span className={benefitsLength > 5000 ? 'text-red-500' : ''}>
            {benefitsLength}/5,000
          </span>
        </div>
      </div>

      {/* Screening Questions */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Screening Questions (Optional, Max 5)
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Ask specific questions to help filter candidates
          </p>

          <div className="space-y-3">
            <Textarea
              placeholder="e.g., Describe your experience building RAG systems with LLMs"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
              disabled={screeningQuestions.length >= 5}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="questionRequired"
                  checked={questionRequired}
                  onChange={(e) => setQuestionRequired(e.target.checked)}
                  disabled={screeningQuestions.length >= 5}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="questionRequired" className="text-sm text-gray-700 dark:text-gray-300">
                  Required question
                </label>
              </div>

              <Button
                type="button"
                onClick={handleAddQuestion}
                variant="secondary"
                disabled={!newQuestion.trim() || screeningQuestions.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {screeningQuestions.length > 0 && (
          <div className="space-y-2">
            {screeningQuestions.map((q, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{q.question}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {q.required ? 'Required' : 'Optional'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(index)}
                  className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>Pro Tips:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-400 list-disc list-inside">
          <li>Public salary ranges attract 30% more qualified applicants</li>
          <li>Be specific about remote work expectations (timezone, office visits)</li>
          <li>Screening questions help identify serious candidates early</li>
          <li>Highlight unique benefits that differentiate your company</li>
        </ul>
      </div>
    </div>
  );
};

export default DetailsStep;
