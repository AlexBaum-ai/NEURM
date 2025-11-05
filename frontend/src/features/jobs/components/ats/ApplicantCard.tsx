import React from 'react';
import { format } from 'date-fns';
import { Star, MapPin, Award } from 'lucide-react';
import type { ATSApplicant } from '../../types';

interface ApplicantCardProps {
  applicant: ATSApplicant;
  onClick: (applicant: ATSApplicant) => void;
  isDragging?: boolean;
}

const MatchBadge: React.FC<{ score: number }> = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
  };

  return (
    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getColor()}`}>
      {score}% match
    </div>
  );
};

const RatingStars: React.FC<{ rating: number | null }> = ({ rating }) => {
  if (!rating) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <Star className="w-4 h-4" />
        <span className="text-xs">Not rated</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

export const ApplicantCard: React.FC<ApplicantCardProps> = ({
  applicant,
  onClick,
  isDragging = false,
}) => {
  const { candidate } = applicant;

  return (
    <div
      onClick={() => onClick(applicant)}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        p-4 cursor-pointer transition-all hover:shadow-md
        ${isDragging ? 'opacity-50 rotate-2' : ''}
      `}
    >
      {/* Header with photo and name */}
      <div className="flex items-start gap-3 mb-3">
        {/* Photo */}
        <div className="flex-shrink-0">
          {candidate.photoUrl ? (
            <img
              src={candidate.photoUrl}
              alt={candidate.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                {candidate.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Name and headline */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
            {candidate.name}
          </h4>
          {candidate.headline && (
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {candidate.headline}
            </p>
          )}
          {candidate.location && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{candidate.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Match and Rating */}
      <div className="flex items-center justify-between mb-3">
        <MatchBadge score={applicant.matchScore} />
        <RatingStars rating={applicant.rating} />
      </div>

      {/* Forum Stats (if available) */}
      {candidate.forumStats && (
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>{candidate.forumStats.reputation} rep</span>
          </div>
          {candidate.forumStats.badges.length > 0 && (
            <div className="flex items-center gap-1">
              <span>{candidate.forumStats.badges.length} badges</span>
            </div>
          )}
        </div>
      )}

      {/* Applied date */}
      <div className="text-xs text-gray-500 dark:text-gray-500">
        Applied {format(new Date(applicant.appliedAt), 'MMM d, yyyy')}
      </div>
    </div>
  );
};
