import React from 'react';
import { CheckCircleIcon } from '@radix-ui/react-icons';
import Button from '@/components/common/Button/Button';
import type { JobDetail } from '../../types';

interface ApplicationSuccessProps {
  job: JobDetail;
  onViewApplications: () => void;
  onClose: () => void;
}

export const ApplicationSuccess: React.FC<ApplicationSuccessProps> = ({
  job,
  onViewApplications,
  onClose,
}) => {
  return (
    <div className="text-center py-8 space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
          <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Application Submitted Successfully!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your application for <span className="font-semibold">{job.title}</span> at{' '}
          <span className="font-semibold">{job.company.companyName}</span> has been submitted.
        </p>
      </div>

      {/* Next Steps */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 text-left space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-white">What happens next?</h4>
        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold mr-3 flex-shrink-0">
              1
            </span>
            <span>
              The employer will review your application and may reach out to you directly via email.
            </span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold mr-3 flex-shrink-0">
              2
            </span>
            <span>
              You'll receive email notifications when your application status changes.
            </span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-semibold mr-3 flex-shrink-0">
              3
            </span>
            <span>
              Track your application progress in your{' '}
              <button
                onClick={onViewApplications}
                className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Applications Dashboard
              </button>
              .
            </span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onViewApplications}>View My Applications</Button>
      </div>

      {/* Additional Info */}
      <p className="text-xs text-gray-500 dark:text-gray-500">
        Application submitted on {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );
};

export default ApplicationSuccess;
