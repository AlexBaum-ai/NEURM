import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@radix-ui/react-icons';
import type { ProfileCompletenessResult } from '@/features/profile';

interface ProfileCompletenessCheckProps {
  completeness: ProfileCompletenessResult;
}

export const ProfileCompletenessCheck: React.FC<ProfileCompletenessCheckProps> = ({
  completeness,
}) => {
  const { isComplete, completionPercentage, missingFields } = completeness;

  const requiredMissing = missingFields.filter((f) => f.importance === 'required');
  const recommendedMissing = missingFields.filter((f) => f.importance === 'recommended');

  if (isComplete && recommendedMissing.length === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
              Profile Complete
            </h4>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Your profile is {completionPercentage}% complete and ready for applications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg p-4 ${
        requiredMissing.length > 0
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      }`}
    >
      <div className="flex items-start">
        <ExclamationTriangleIcon
          className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
            requiredMissing.length > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-yellow-600 dark:text-yellow-400'
          }`}
        />
        <div className="flex-1">
          <h4
            className={`text-sm font-medium ${
              requiredMissing.length > 0
                ? 'text-red-800 dark:text-red-300'
                : 'text-yellow-800 dark:text-yellow-300'
            }`}
          >
            {requiredMissing.length > 0
              ? 'Profile Incomplete - Cannot Apply'
              : 'Profile Could Be Stronger'}
          </h4>
          <p
            className={`text-sm mt-1 ${
              requiredMissing.length > 0
                ? 'text-red-700 dark:text-red-400'
                : 'text-yellow-700 dark:text-yellow-400'
            }`}
          >
            Your profile is {completionPercentage}% complete.{' '}
            {requiredMissing.length > 0
              ? 'Please complete the required fields to apply.'
              : 'Adding more information will strengthen your application.'}
          </p>

          {requiredMissing.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                Required fields:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {requiredMissing.map((field) => (
                  <li
                    key={field.field}
                    className="text-sm text-red-700 dark:text-red-400"
                  >
                    {field.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendedMissing.length > 0 && requiredMissing.length === 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                Recommended to add:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {recommendedMissing.map((field) => (
                  <li
                    key={field.field}
                    className="text-sm text-yellow-700 dark:text-yellow-400"
                  >
                    {field.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            to="/profile/edit"
            className={`inline-flex items-center text-sm font-medium mt-3 hover:underline ${
              requiredMissing.length > 0
                ? 'text-red-800 dark:text-red-300'
                : 'text-yellow-800 dark:text-yellow-300'
            }`}
          >
            Complete Your Profile →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletenessCheck;
