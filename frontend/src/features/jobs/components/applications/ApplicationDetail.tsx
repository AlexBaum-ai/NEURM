import React, { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/common/Badge/Badge';
import { StatusTimeline } from './StatusTimeline';
import type { Application, ApplicationStatus } from '../../types';

interface ApplicationDetailProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onWithdraw: (applicationId: string) => void;
  isWithdrawing?: boolean;
}

const getStatusConfig = (status: ApplicationStatus) => {
  const configs = {
    submitted: {
      label: 'Submitted',
      variant: 'blue' as const,
    },
    under_review: {
      label: 'Under Review',
      variant: 'yellow' as const,
    },
    interview_scheduled: {
      label: 'Interview Scheduled',
      variant: 'purple' as const,
    },
    interview_completed: {
      label: 'Interview Completed',
      variant: 'purple' as const,
    },
    offer_extended: {
      label: 'Offer Extended',
      variant: 'green' as const,
    },
    offer_accepted: {
      label: 'Offer Accepted',
      variant: 'green' as const,
    },
    offer_declined: {
      label: 'Offer Declined',
      variant: 'gray' as const,
    },
    rejected: {
      label: 'Rejected',
      variant: 'red' as const,
    },
    withdrawn: {
      label: 'Withdrawn',
      variant: 'gray' as const,
    },
  };
  return configs[status] || configs.submitted;
};

export const ApplicationDetail: React.FC<ApplicationDetailProps> = ({
  application,
  isOpen,
  onClose,
  onWithdraw,
  isWithdrawing = false,
}) => {
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  if (!isOpen || !application) return null;

  const { job } = application;
  const statusConfig = getStatusConfig(application.status);

  const canWithdraw = !['withdrawn', 'rejected', 'offer_accepted', 'offer_declined'].includes(
    application.status
  );

  const handleWithdraw = () => {
    onWithdraw(application.id);
    setShowWithdrawConfirm(false);
  };

  const formattedSalary =
    job.salaryMin && job.salaryMax
      ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`
      : job.salaryMin
      ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()}+`
      : 'Not specified';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {job.title}
                </h2>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {job.company.companyName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canWithdraw && (
              <button
                onClick={() => setShowWithdrawConfirm(true)}
                disabled={isWithdrawing}
                className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
              </button>
            )}
            <a
              href={`/jobs/${job.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              View Job Posting
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Job Details */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>{job.location} ({job.locationType.replace('_', ' ')})</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formattedSalary}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span className="capitalize">{job.employmentType.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Applied on {format(new Date(application.appliedAt), 'MMMM d, yyyy')}</span>
            </div>
          </div>

          {/* Cover Letter */}
          {application.coverLetter && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Cover Letter
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {application.coverLetter}
                </p>
              </div>
            </div>
          )}

          {/* Screening Answers */}
          {application.screeningAnswers && application.screeningAnswers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Screening Questions
              </h3>
              <div className="space-y-4">
                {application.screeningAnswers.map((qa, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                      {qa.question}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div>
            <StatusTimeline
              statusHistory={application.statusHistory}
              currentStatus={application.status}
            />
          </div>

          {/* Messages */}
          {application.messages && application.messages.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Messages from Recruiter
              </h3>
              <div className="space-y-3">
                {application.messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {message.from === 'recruiter' ? 'Recruiter' : 'You'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(message.timestamp), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{message.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume */}
          {application.resumeUrl && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Resume
              </h3>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Resume
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowWithdrawConfirm(false)}
          ></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 z-50">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Withdraw Application?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to withdraw your application for {job.title} at{' '}
              {job.company.companyName}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isWithdrawing ? 'Withdrawing...' : 'Yes, Withdraw'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
