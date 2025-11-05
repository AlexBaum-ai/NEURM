import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Building2, Bookmark, Clock } from 'lucide-react';
import { Card } from '@/components/common/Card/Card';
import { Badge } from '@/components/common/Badge/Badge';
import { Button } from '@/components/common/Button/Button';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { MatchBadge } from './matching/MatchBadge';
import type { JobListItem } from '../types';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: JobListItem;
  onSave?: (job: JobListItem) => void;
  onUnsave?: (job: JobListItem) => void;
  isSaving?: boolean;
}

const formatSalary = (min: number | null, max: number | null, currency: string) => {
  if (!min && !max) return null;
  if (min && max) {
    return `${currency} ${(min / 1000).toFixed(0)}k - ${(max / 1000).toFixed(0)}k`;
  }
  if (min) return `${currency} ${(min / 1000).toFixed(0)}k+`;
  if (max) return `${currency} Up to ${(max / 1000).toFixed(0)}k`;
  return null;
};

const locationTypeLabels = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  on_site: 'On-site',
};

const experienceLevelLabels = {
  junior: 'Junior',
  mid: 'Mid-Level',
  senior: 'Senior',
  lead: 'Lead',
  principal: 'Principal',
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onSave,
  onUnsave,
  isSaving = false,
}) => {
  const { isAuthenticated } = useAuthStore();
  const salaryDisplay = job.salaryIsPublic
    ? formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)
    : null;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (job.isSaved) {
      onUnsave?.(job);
    } else {
      onSave?.(job);
    }
  };

  return (
    <Link to={`/jobs/${job.slug}`}>
      <Card
        className={cn(
          'hover:shadow-lg transition-shadow duration-200 h-full',
          job.isFeatured && 'border-primary-500 border-2'
        )}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex gap-3 flex-1 min-w-0">
              {/* Company Logo */}
              {job.company.logoUrl ? (
                <img
                  src={job.company.logoUrl}
                  alt={`${job.company.companyName} logo`}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
              )}

              {/* Job Title & Company */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {job.company.companyName}
                </p>
              </div>
            </div>

            {/* Save Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveClick}
              disabled={isSaving}
              className="flex-shrink-0"
            >
              <Bookmark
                className={cn(
                  'w-5 h-5',
                  job.isSaved ? 'fill-current text-primary-600' : 'text-gray-400'
                )}
              />
            </Button>
          </div>

          {/* Job Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{job.location}</span>
              <span className="text-gray-400">•</span>
              <span>{locationTypeLabels[job.locationType]}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Briefcase className="w-4 h-4 flex-shrink-0" />
              <span>{experienceLevelLabels[job.experienceLevel]}</span>
              {salaryDisplay && (
                <>
                  <span className="text-gray-400">•</span>
                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                  <span>{salaryDisplay}</span>
                </>
              )}
            </div>

            {job.hasVisaSponsorship && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Badge variant="success" className="text-xs">
                  Visa Sponsorship
                </Badge>
              </div>
            )}
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            {job.primaryLlms.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.primaryLlms.slice(0, 3).map((llm) => (
                  <Badge key={llm} variant="tech" className="text-xs">
                    {llm}
                  </Badge>
                ))}
                {job.primaryLlms.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{job.primaryLlms.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {job.frameworks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {job.frameworks.slice(0, 3).map((framework) => (
                  <Badge key={framework} variant="outline" className="text-xs">
                    {framework}
                  </Badge>
                ))}
                {job.frameworks.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{job.frameworks.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {formatDistanceToNow(new Date(job.publishedAt), { addSuffix: true })}
              </span>
            </div>

            {/* Match Score Badge */}
            {isAuthenticated && job.matchScore !== undefined && job.matchScore > 0 ? (
              <MatchBadge
                matchScore={job.matchScore}
                showTooltip={true}
                tooltipText="Match based on your profile and preferences"
                className="text-xs"
              />
            ) : !isAuthenticated ? (
              <Link
                to="/login"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
              >
                Login to see match score
              </Link>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
};
