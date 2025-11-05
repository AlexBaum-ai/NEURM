import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Textarea from '@/components/forms/Textarea';
import Button from '@/components/common/Button/Button';
import type { UserProfile } from '@/features/profile';
import type { ApplicationFormData } from './types';
import ScreeningQuestions from './ScreeningQuestions';

const applicationFormSchema = z.object({
  coverLetter: z.string().min(50, 'Cover letter should be at least 50 characters').max(5000),
  screeningAnswers: z.array(
    z.object({
      question: z.string(),
      answer: z.string().min(10, 'Answer should be at least 10 characters'),
    })
  ),
});

interface ApplicationFormProps {
  profile: UserProfile;
  screeningQuestions: Array<{ question: string }> | null;
  initialData?: Partial<ApplicationFormData>;
  onSubmit: (data: ApplicationFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onDraftSave: (data: ApplicationFormData) => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  profile,
  screeningQuestions,
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  onDraftSave,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      coverLetter: initialData?.coverLetter || '',
      screeningAnswers:
        initialData?.screeningAnswers ||
        screeningQuestions?.map((q) => ({ question: q.question, answer: '' })) ||
        [],
    },
  });

  // Watch form data for draft saving
  const formData = watch();

  // Auto-save draft every 30 seconds if there are changes
  React.useEffect(() => {
    if (!isDirty) return;

    const interval = setInterval(() => {
      onDraftSave(formData);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [formData, isDirty, onDraftSave]);

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Not provided';
  const resumeFileName = profile.profile.resumeUrl
    ? profile.profile.resumeUrl.split('/').pop()
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Data Preview */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Application Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Name:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">{fullName}</span>
          </div>

          <div>
            <span className="text-gray-600 dark:text-gray-400">Email:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">
              {profile.email}
            </span>
          </div>

          {profile.phone && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Phone:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {profile.phone}
              </span>
            </div>
          )}

          {profile.profile.location && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Location:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">
                {profile.profile.location}
              </span>
            </div>
          )}
        </div>

        {resumeFileName && (
          <div className="flex items-center pt-2 border-t border-gray-200 dark:border-gray-700">
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Resume</p>
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {resumeFileName}
              </p>
            </div>
            <a
              href={profile.profile.resumeUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              View
            </a>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          This information will be sent to the employer. You can update your profile anytime.
        </p>
      </div>

      {/* Cover Letter */}
      <div>
        <Textarea
          label="Cover Letter (Optional)"
          placeholder="Introduce yourself and explain why you're a great fit for this role..."
          rows={8}
          error={errors.coverLetter?.message}
          {...register('coverLetter')}
        />
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          A personalized cover letter can help you stand out.
        </p>
      </div>

      {/* Screening Questions */}
      {screeningQuestions && screeningQuestions.length > 0 && (
        <ScreeningQuestions questions={screeningQuestions} control={control} />
      )}

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onDraftSave(formData)}
          disabled={!isDirty || isSubmitting}
        >
          Save Draft
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
};

export default ApplicationForm;
