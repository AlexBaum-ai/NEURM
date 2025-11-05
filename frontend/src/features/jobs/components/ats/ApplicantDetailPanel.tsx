import React, { useState, Suspense } from 'react';
import { format } from 'date-fns';
import { X, Star, Mail, ExternalLink, FileText, Award, MessageSquare } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import type { ATSApplicant, ATSStatus } from '../../types';
import toast from 'react-hot-toast';

interface ApplicantDetailPanelProps {
  applicant: ATSApplicant | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: ATSStatus, note?: string) => Promise<void>;
  onRatingChange: (rating: number) => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  onShare: (userIds: string[]) => Promise<void>;
  isLoading?: boolean;
}

const statusOptions: Array<{ value: ATSStatus; label: string }> = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
];

const RatingStars: React.FC<{
  rating: number | null;
  onChange: (rating: number) => void;
  isEditable?: boolean;
}> = ({ rating, onChange, isEditable = true }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const displayRating = hoverRating !== null ? hoverRating : rating || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!isEditable}
          onMouseEnter={() => isEditable && setHoverRating(star)}
          onMouseLeave={() => isEditable && setHoverRating(null)}
          onClick={() => isEditable && onChange(star)}
          className={`${isEditable ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <Star
            className={`w-6 h-6 ${
              star <= displayRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
      {rating && (
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
          {rating}/5
        </span>
      )}
    </div>
  );
};

export const ApplicantDetailPanel: React.FC<ApplicantDetailPanelProps> = ({
  applicant,
  isOpen,
  onClose,
  onStatusChange,
  onRatingChange,
  onAddNote,
  onShare,
  isLoading = false,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ATSStatus | null>(null);

  if (!isOpen || !applicant) return null;

  const { candidate } = applicant;

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSavingNote(true);
    try {
      await onAddNote(newNote);
      setNewNote('');
      toast.success('Note added successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleStatusChange = async (status: ATSStatus) => {
    try {
      await onStatusChange(status);
      setSelectedStatus(null);
      toast.success('Status updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleRatingChange = async (rating: number) => {
    try {
      await onRatingChange(rating);
      toast.success('Rating updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update rating');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[600px] bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              {candidate.photoUrl ? (
                <img
                  src={candidate.photoUrl}
                  alt={candidate.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                    {candidate.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {candidate.name}
                </h2>
                {candidate.headline && (
                  <p className="text-gray-600 dark:text-gray-400">{candidate.headline}</p>
                )}
                {candidate.location && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {candidate.location}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `mailto:${candidate.email}`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Candidate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(candidate.profileUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </div>

          {/* Status and Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Status Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={applicant.status}
                onChange={(e) => handleStatusChange(e.target.value as ATSStatus)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              <RatingStars
                rating={applicant.rating}
                onChange={handleRatingChange}
              />
            </div>
          </div>

          {/* Match Score */}
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Match Score
              </span>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {applicant.matchScore}%
              </span>
            </div>
          </div>

          {/* Application Date */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Application Date
            </h3>
            <p className="text-gray-900 dark:text-white">
              {format(new Date(applicant.appliedAt), 'MMMM d, yyyy \'at\' h:mm a')}
            </p>
          </div>

          {/* Cover Letter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Letter
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {applicant.coverLetter}
              </p>
            </div>
          </div>

          {/* Resume */}
          {applicant.resumeUrl && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Resume
              </h3>
              <a
                href={applicant.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
              >
                <FileText className="w-4 h-4" />
                View Resume (PDF)
              </a>
            </div>
          )}

          {/* Screening Answers */}
          {applicant.screeningAnswers && applicant.screeningAnswers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Screening Questions
              </h3>
              <div className="space-y-4">
                {applicant.screeningAnswers.map((qa, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                      {qa.question}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Forum Stats */}
          {candidate.forumStats && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Forum Activity
              </h3>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 mb-1">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {candidate.forumStats.reputation}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Reputation</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {candidate.forumStats.topicsCount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Topics</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {candidate.forumStats.repliesCount}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Replies</div>
                </div>
              </div>
              {candidate.forumStats.badges.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Badges:</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.forumStats.badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium"
                      >
                        {badge.icon} {badge.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Internal Notes
            </h3>
            <div className="space-y-3 mb-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this candidate..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || isSavingNote}
                size="sm"
              >
                {isSavingNote ? 'Saving...' : 'Add Note'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
