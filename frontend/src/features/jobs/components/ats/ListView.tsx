import React from 'react';
import { format } from 'date-fns';
import { Star, ExternalLink } from 'lucide-react';
import type { ATSApplicant, ATSStatus } from '../../types';

interface ListViewProps {
  applicants: ATSApplicant[];
  onApplicantClick: (applicant: ATSApplicant) => void;
}

const getStatusBadge = (status: ATSStatus) => {
  const configs: Record<
    ATSStatus,
    { label: string; className: string }
  > = {
    submitted: {
      label: 'Submitted',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    screening: {
      label: 'Screening',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    interview: {
      label: 'Interview',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    },
    offer: {
      label: 'Offer',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    },
    hired: {
      label: 'Hired',
      className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    withdrawn: {
      label: 'Withdrawn',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    },
  };

  const config = configs[status];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const RatingDisplay: React.FC<{ rating: number | null }> = ({ rating }) => {
  if (!rating) {
    return <span className="text-xs text-gray-400">-</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium text-gray-900 dark:text-white">{rating}</span>
    </div>
  );
};

const MatchScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return <span className={`font-semibold ${getColor()}`}>{score}%</span>;
};

export const ListView: React.FC<ListViewProps> = ({ applicants, onApplicantClick }) => {
  if (applicants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No applicants found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Candidate
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Job
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Status
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Match
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Rating
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Applied
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {applicants.map((applicant) => (
            <tr
              key={applicant.id}
              onClick={() => onApplicantClick(applicant)}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
            >
              {/* Candidate */}
              <td className="py-4 px-4">
                <div className="flex items-center gap-3">
                  {applicant.candidate.photoUrl ? (
                    <img
                      src={applicant.candidate.photoUrl}
                      alt={applicant.candidate.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {applicant.candidate.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {applicant.candidate.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {applicant.candidate.email}
                    </div>
                  </div>
                </div>
              </td>

              {/* Job */}
              <td className="py-4 px-4">
                <div className="text-sm text-gray-900 dark:text-white">
                  {applicant.job.title}
                </div>
              </td>

              {/* Status */}
              <td className="py-4 px-4">{getStatusBadge(applicant.status)}</td>

              {/* Match */}
              <td className="py-4 px-4 text-center">
                <MatchScoreBadge score={applicant.matchScore} />
              </td>

              {/* Rating */}
              <td className="py-4 px-4 text-center">
                <RatingDisplay rating={applicant.rating} />
              </td>

              {/* Applied */}
              <td className="py-4 px-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {format(new Date(applicant.appliedAt), 'MMM d, yyyy')}
                </div>
              </td>

              {/* Actions */}
              <td className="py-4 px-4 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(applicant.candidate.profileUrl, '_blank');
                  }}
                  className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  title="View profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
