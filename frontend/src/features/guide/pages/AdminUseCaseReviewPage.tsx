import React, { useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdminUseCases, useReviewUseCase } from '../hooks/useUseCases';
import { cn } from '@/lib/utils';

const AdminUseCaseReviewPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const { data, isLoading, refetch } = useAdminUseCases({ status: statusFilter });
  const { mutate: reviewUseCase, isPending: isReviewing } = useReviewUseCase();

  const [feedbackModal, setFeedbackModal] = useState<{
    id: string;
    action: 'APPROVED' | 'REJECTED';
  } | null>(null);
  const [feedback, setFeedback] = useState('');

  const handleReview = (id: string, action: 'APPROVED' | 'REJECTED') => {
    if (action === 'REJECTED') {
      setFeedbackModal({ id, action });
    } else {
      reviewUseCase(
        { id, action },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
  };

  const handleSubmitFeedback = () => {
    if (feedbackModal) {
      reviewUseCase(
        {
          id: feedbackModal.id,
          action: feedbackModal.action,
          feedback,
        },
        {
          onSuccess: () => {
            setFeedbackModal(null);
            setFeedback('');
            refetch();
          },
        }
      );
    }
  };

  const useCases = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Use Case Review Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve community-submitted use cases
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Filter */}
        <div className="mb-6 flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
              )}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Use Cases List */}
        {!isLoading && useCases.length > 0 && (
          <div className="space-y-4">
            {useCases.map((useCase) => (
              <div
                key={useCase.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{useCase.summary}</p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {useCase.companyName && (
                        <span>
                          <strong>Company:</strong> {useCase.companyName}
                        </span>
                      )}
                      <span>
                        <strong>Industry:</strong> {useCase.industry}
                      </span>
                      <span>
                        <strong>Category:</strong> {useCase.category}
                      </span>
                      <span>
                        <strong>Type:</strong>{' '}
                        {useCase.implementationType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {useCase.techStack.map((tech) => (
                        <span
                          key={tech.id}
                          className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                        >
                          {tech.name}
                        </span>
                      ))}
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 mt-3">
                      {useCase.hasCode && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                          Has Code
                        </span>
                      )}
                      {useCase.hasROI && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                          Has ROI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Link
                      to={`/guide/use-cases/${useCase.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>

                    {statusFilter === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleReview(useCase.id, 'APPROVED')}
                          disabled={isReviewing}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(useCase.id, 'REJECTED')}
                          disabled={isReviewing}
                          className="inline-flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Results Metrics */}
                {useCase.resultsMetrics && useCase.resultsMetrics.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      Results:
                    </h4>
                    {useCase.resultsMetrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-green-700 dark:text-green-300"
                      >
                        <strong>{metric.metric}:</strong> {metric.value}
                        {metric.improvement && (
                          <span className="ml-1">({metric.improvement})</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && useCases.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No {statusFilter.toLowerCase()} use cases found.
            </p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Rejection Feedback
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please provide feedback on why this use case is being rejected:
            </p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-4"
              placeholder="Enter feedback..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFeedbackModal(null);
                  setFeedback('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedback.trim() || isReviewing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isReviewing ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUseCaseReviewPage;
