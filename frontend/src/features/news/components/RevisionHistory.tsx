/**
 * RevisionHistory component - main component for viewing and managing article revisions
 */

import React, { useState, Suspense } from 'react';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, RotateCcw, X, Eye, GitCompare } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import RevisionTimeline from './RevisionTimeline';
import RevisionDiff from './RevisionDiff';
import { getArticleRevisions, restoreRevision } from '../api/revisions';
import type { ArticleRevision } from '../types';
import { useToast } from '@/hooks/useToast';

interface RevisionHistoryProps {
  articleId: string;
  onRevisionRestored?: (revision: ArticleRevision) => void;
}

const RevisionHistoryContent: React.FC<RevisionHistoryProps> = ({
  articleId,
  onRevisionRestored,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<ArticleRevision | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState<ArticleRevision | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch revisions
  const { data: revisions } = useSuspenseQuery({
    queryKey: ['article-revisions', articleId],
    queryFn: () => getArticleRevisions(articleId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (revisionId: string) => restoreRevision(articleId, revisionId),
    onSuccess: (data) => {
      showToast({
        title: 'Success',
        message: 'Revision restored successfully',
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['article-revisions', articleId] });
      queryClient.invalidateQueries({ queryKey: ['article', articleId] });
      setRestoreDialogOpen(false);
      setIsOpen(false);
      if (onRevisionRestored && data.revision) {
        onRevisionRestored(data.revision);
      }
    },
    onError: (error: Error) => {
      showToast({
        title: 'Error',
        message: error.message || 'Failed to restore revision',
        type: 'error',
      });
    },
  });

  const handleSelectRevision = (revision: ArticleRevision) => {
    if (compareMode && !compareWith) {
      setCompareWith(revision);
    } else if (compareMode && compareWith) {
      setSelectedRevision(revision);
    } else {
      setSelectedRevision(revision);
    }
  };

  const handleRestore = () => {
    if (selectedRevision) {
      restoreMutation.mutate(selectedRevision.id);
    }
  };

  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    setCompareWith(null);
    if (compareMode) {
      setSelectedRevision(null);
    }
  };

  const currentRevision = revisions[0];
  const canCompare = compareMode && compareWith && selectedRevision;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
          aria-label="View revision history"
        >
          <History className="w-5 h-5" />
          <span>Revision History</span>
          <span className="ml-1 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full">
            {revisions.length}
          </span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content
          className="fixed inset-0 sm:inset-4 lg:inset-8 bg-white dark:bg-gray-900 rounded-none sm:rounded-xl shadow-xl z-50 overflow-hidden flex flex-col"
          aria-describedby="revision-history-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
            <div>
              <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Revision History
              </Dialog.Title>
              <Dialog.Description
                id="revision-history-description"
                className="text-sm text-gray-600 dark:text-gray-400 mt-1"
              >
                View and restore previous versions of this article
              </Dialog.Description>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleCompareMode}
                className={`
                  inline-flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
                  ${
                    compareMode
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                <GitCompare className="w-4 h-4" />
                <span className="text-sm">{compareMode ? 'Exit Compare' : 'Compare'}</span>
              </button>
              <Dialog.Close asChild>
                <button
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Sidebar - Revision Timeline */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r dark:border-gray-800 overflow-y-auto">
              <div className="p-4">
                {compareMode && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                    {!compareWith
                      ? 'Select first revision to compare'
                      : !selectedRevision
                        ? 'Select second revision to compare'
                        : 'Comparing revisions'}
                  </div>
                )}
                <RevisionTimeline
                  revisions={revisions}
                  selectedRevisionId={selectedRevision?.id || null}
                  onSelectRevision={handleSelectRevision}
                />
              </div>
            </div>

            {/* Main Content - Preview or Diff */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {!selectedRevision && !compareMode && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <Eye className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">Select a revision to preview</p>
                  </div>
                )}

                {!selectedRevision && compareMode && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                    <GitCompare className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg">
                      Select two revisions to compare
                    </p>
                  </div>
                )}

                {selectedRevision && !canCompare && (
                  <div className="space-y-6">
                    {/* Revision Info */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Revision #{selectedRevision.revisionNumber}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            By {selectedRevision.createdBy.username}
                          </p>
                        </div>
                        {selectedRevision.id !== currentRevision.id && (
                          <button
                            onClick={() => setRestoreDialogOpen(true)}
                            disabled={restoreMutation.isPending}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restore This Version</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="prose dark:prose-invert max-w-none">
                      <h2 className="text-2xl font-bold mb-4">{selectedRevision.title}</h2>
                      {selectedRevision.summary && (
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                          {selectedRevision.summary}
                        </p>
                      )}
                      <div
                        className="mt-4"
                        dangerouslySetInnerHTML={{ __html: selectedRevision.content }}
                      />
                    </div>
                  </div>
                )}

                {canCompare && compareWith && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Comparing Revisions
                    </h3>

                    {/* Title Diff */}
                    {compareWith.title !== selectedRevision.title && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Title Changes
                        </h4>
                        <RevisionDiff
                          oldRevision={compareWith}
                          newRevision={selectedRevision}
                          field="title"
                        />
                      </div>
                    )}

                    {/* Summary Diff */}
                    {compareWith.summary !== selectedRevision.summary && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Summary Changes
                        </h4>
                        <RevisionDiff
                          oldRevision={compareWith}
                          newRevision={selectedRevision}
                          field="summary"
                        />
                      </div>
                    )}

                    {/* Content Diff */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Content Changes
                      </h4>
                      <RevisionDiff
                        oldRevision={compareWith}
                        newRevision={selectedRevision}
                        field="content"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Restore Confirmation Dialog */}
          <AlertDialog.Root open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full z-50">
                <AlertDialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Restore This Revision?
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  This will replace the current version with revision #
                  {selectedRevision?.revisionNumber}. The current version will be saved as a new
                  revision. This action can be undone by restoring a different revision.
                </AlertDialog.Description>
                <div className="flex justify-end space-x-3">
                  <AlertDialog.Cancel asChild>
                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      onClick={handleRestore}
                      disabled={restoreMutation.isPending}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                    >
                      {restoreMutation.isPending ? 'Restoring...' : 'Restore'}
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Wrapper with Suspense
const RevisionHistory: React.FC<RevisionHistoryProps> = (props) => {
  return (
    <Suspense
      fallback={
        <button
          disabled
          className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg"
        >
          <History className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </button>
      }
    >
      <RevisionHistoryContent {...props} />
    </Suspense>
  );
};

export default RevisionHistory;
