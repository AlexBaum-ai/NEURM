import React from 'react';
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Home,
  Globe,
  Target,
} from 'lucide-react';
import type { UserProfile } from '../types';

interface JobPreferencesSectionProps {
  profile: UserProfile;
  viewerRole?: 'owner' | 'recruiter' | 'public';
}

/**
 * JobPreferencesSection - Display candidate's job preferences
 *
 * Visibility rules:
 * - Only shown if candidate is looking for work
 * - Visible to:
 *   - Profile owner (always)
 *   - Recruiters (if visibleToRecruiters is true)
 *   - Public (never, unless owner)
 *
 * Shows:
 * - Availability status
 * - Roles interested in
 * - Location preferences
 * - Remote preference
 * - Salary expectations
 * - Company preferences
 */
export const JobPreferencesSection: React.FC<JobPreferencesSectionProps> = ({
  profile,
  viewerRole = 'public',
}) => {
  const { jobPreferences, isOwner } = profile;

  // Don't render if no job preferences
  if (!jobPreferences) {
    return null;
  }

  // Check visibility
  const canView =
    isOwner ||
    (viewerRole === 'recruiter' && jobPreferences.visibleToRecruiters && jobPreferences.isLookingForWork);

  if (!canView) {
    return null;
  }

  // Don't show if not looking for work (unless owner)
  if (!jobPreferences.isLookingForWork && !isOwner) {
    return null;
  }

  const formatAvailability = (status: string) => {
    const map: Record<string, string> = {
      available_immediately: 'Available Immediately',
      available_2_weeks: 'Available in 2 weeks',
      available_1_month: 'Available in 1 month',
      available_3_months: 'Available in 3 months',
      open_to_offers: 'Open to offers',
      not_looking: 'Not actively looking',
    };
    return map[status] || status;
  };

  const formatRemotePreference = (pref: string) => {
    const map: Record<string, string> = {
      remote_only: 'Remote Only',
      hybrid: 'Hybrid',
      onsite: 'On-site',
      flexible: 'Flexible',
    };
    return map[pref] || pref;
  };

  const formatSalary = () => {
    if (!jobPreferences.salaryExpectation) return null;

    const { min, max, currency, period } = jobPreferences.salaryExpectation;
    const periodMap: Record<string, string> = {
      annual: 'year',
      monthly: 'month',
      hourly: 'hour',
    };

    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} / ${periodMap[period]}`;
  };

  const availabilityColors: Record<string, string> = {
    available_immediately: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    available_2_weeks: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    available_1_month: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    available_3_months: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    open_to_offers: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    not_looking: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Job Preferences</h2>
        </div>
        {isOwner && (
          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            {jobPreferences.visibleToRecruiters ? 'Visible to Recruiters' : 'Private'}
          </span>
        )}
      </div>

      <div className="space-y-6">
        {/* Availability Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Availability
            </span>
          </div>
          <span
            className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${
              availabilityColors[jobPreferences.availabilityStatus] || availabilityColors.not_looking
            }`}
          >
            {formatAvailability(jobPreferences.availabilityStatus)}
          </span>
        </div>

        {/* Roles Interested In */}
        {jobPreferences.rolesInterestedIn.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Interested Roles
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {jobPreferences.rolesInterestedIn.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Remote Preference */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Home className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Remote Work
              </span>
            </div>
            <div className="text-gray-900 dark:text-white">
              {formatRemotePreference(jobPreferences.remotePreference)}
            </div>
          </div>

          {/* Preferred Locations */}
          {jobPreferences.preferredLocations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Preferred Locations
                </span>
              </div>
              <div className="text-gray-900 dark:text-white">
                {jobPreferences.preferredLocations.slice(0, 3).join(', ')}
                {jobPreferences.preferredLocations.length > 3 && ' ...'}
              </div>
            </div>
          )}
        </div>

        {/* Relocation & Visa */}
        {(jobPreferences.willingToRelocate || jobPreferences.requiresVisaSponsorship) && (
          <div className="flex flex-wrap gap-2">
            {jobPreferences.willingToRelocate && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                <Globe className="w-3 h-3 inline mr-1" />
                Willing to relocate
              </span>
            )}
            {jobPreferences.requiresVisaSponsorship && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                Requires visa sponsorship
              </span>
            )}
          </div>
        )}

        {/* Salary Expectations */}
        {jobPreferences.salaryExpectation && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Salary Expectations
              </span>
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatSalary()}
            </div>
          </div>
        )}

        {/* Company Preferences */}
        {(jobPreferences.companySize || jobPreferences.companyType) && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Preferences
              </span>
            </div>
            <div className="space-y-2">
              {jobPreferences.companySize && jobPreferences.companySize.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Size:</span>
                  {jobPreferences.companySize.map((size) => (
                    <span
                      key={size}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              )}
              {jobPreferences.companyType && jobPreferences.companyType.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Type:</span>
                  {jobPreferences.companyType.map((type) => (
                    <span
                      key={type}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Employment Types */}
        {jobPreferences.employmentTypes.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Employment Types
            </div>
            <div className="flex flex-wrap gap-2">
              {jobPreferences.employmentTypes.map((type) => (
                <span
                  key={type}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                >
                  {type.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPreferencesSection;
