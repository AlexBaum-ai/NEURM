/**
 * Content Moderation Page
 *
 * Main page for content moderation with tabs, filters, and actions
 */

import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Filter, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Hooks
import {
  useContentQueue,
  useModerateContent,
  useBulkModerate,
  useApproveContent,
  useRejectContent,
  useHideContent,
  useDeleteContent,
} from '../hooks/useContentModeration';

// Components
import Button from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Select } from '@/components/forms/Select';
import Modal from '@/components/common/Modal/Modal';
import { Textarea } from '@/components/forms';
import ContentTypeBadge from '../components/ContentTypeBadge';
import StatusBadge from '../components/StatusBadge';
import SpamScoreIndicator from '../components/SpamScoreIndicator';

// Types
import type { ContentItem, ModerationTab, ContentType, ContentStatus } from '../types';

const ContentModerationPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<ModerationTab>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [reviewingItem, setReviewingItem] = useState<ContentItem | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'hide' | 'delete' | null;
    item: ContentItem | null;
  }>({ type: null, item: null });
  const [actionReason, setActionReason] = useState('');
  const [page, setPage] = useState(1);

  // Queries
  const { data, isLoading, refetch } = useContentQueue({
    page,
    limit: 20,
    filters: {
      tab: activeTab,
      contentType: contentTypeFilter === 'all' ? undefined : contentTypeFilter,
      search: searchQuery || undefined,
    },
    refetchInterval: 60000, // 60 seconds
  });

  // Mutations
  const approveMutation = useApproveContent();
  const rejectMutation = useRejectContent();
  const hideMutation = useHideContent();
  const deleteMutation = useDeleteContent();
  const bulkMutation = useBulkModerate();

  // Handlers
  const handleTabChange = useCallback((tab: ModerationTab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedItems(new Set());
  }, []);

  const handleSelectItem = useCallback((id: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!data?.content) return;
    if (selectedItems.size === data.content.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.content.map(item => item.id)));
    }
  }, [data?.content, selectedItems.size]);

  const handleApprove = useCallback(async (item: ContentItem) => {
    await approveMutation.mutateAsync({
      contentType: item.type,
      contentId: item.id,
    });
    setActionModal({ type: null, item: null });
    setReviewingItem(null);
  }, [approveMutation]);

  const handleReject = useCallback(async (item: ContentItem, reason: string) => {
    await rejectMutation.mutateAsync({
      contentType: item.type,
      contentId: item.id,
      reason,
    });
    setActionModal({ type: null, item: null });
    setActionReason('');
    setReviewingItem(null);
  }, [rejectMutation]);

  const handleHide = useCallback(async (item: ContentItem, reason: string) => {
    await hideMutation.mutateAsync({
      contentType: item.type,
      contentId: item.id,
      reason,
    });
    setActionModal({ type: null, item: null });
    setActionReason('');
    setReviewingItem(null);
  }, [hideMutation]);

  const handleDelete = useCallback(async (item: ContentItem, reason: string) => {
    await deleteMutation.mutateAsync({
      contentType: item.type,
      contentId: item.id,
      reason,
    });
    setActionModal({ type: null, item: null });
    setActionReason('');
    setReviewingItem(null);
  }, [deleteMutation]);

  const handleBulkAction = useCallback(async (action: 'approve' | 'reject' | 'hide' | 'delete') => {
    if (selectedItems.size === 0) return;

    const contentItems = data?.content.filter(item => selectedItems.has(item.id)) || [];
    if (contentItems.length === 0) return;

    // Group by content type
    const grouped = contentItems.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item.id);
      return acc;
    }, {} as Record<ContentType, string[]>);

    // Perform bulk action for each type
    for (const [contentType, ids] of Object.entries(grouped)) {
      await bulkMutation.mutateAsync({
        contentType: contentType as ContentType,
        contentIds: ids,
        action,
      });
    }

    setSelectedItems(new Set());
  }, [selectedItems, data?.content, bulkMutation]);

  const handleActionConfirm = useCallback(async () => {
    const { type, item } = actionModal;
    if (!type || !item) return;

    switch (type) {
      case 'approve':
        await handleApprove(item);
        break;
      case 'reject':
        await handleReject(item, actionReason);
        break;
      case 'hide':
        await handleHide(item, actionReason);
        break;
      case 'delete':
        await handleDelete(item, actionReason);
        break;
    }
  }, [actionModal, actionReason, handleApprove, handleReject, handleHide, handleDelete]);

  // Render helpers
  const tabs: { key: ModerationTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All Content', count: data?.stats.pending },
    { key: 'pending', label: 'Pending Review', count: data?.stats.pending },
    { key: 'reported', label: 'Reported', count: data?.stats.reported },
    { key: 'flagged', label: 'Auto-flagged', count: data?.stats.flagged },
  ];

  return (
    <>
      <Helmet>
        <title>Content Moderation - Admin - Neurmatic</title>
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Content Moderation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and moderate user-generated content
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select
            value={contentTypeFilter}
            onChange={(e) => setContentTypeFilter(e.target.value as ContentType | 'all')}
          >
            <option value="all">All Types</option>
            <option value="article">Articles</option>
            <option value="topic">Topics</option>
            <option value="reply">Replies</option>
            <option value="job">Jobs</option>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => handleBulkAction('approve')}>
                Approve All
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('reject')}>
                Reject All
              </Button>
            </div>
          </div>
        )}

        {/* Content List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : !data?.content || data.content.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No content to moderate</p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItems.size === data.content.length && data.content.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Select all</span>
            </div>

            <div className="space-y-4">
              {data.content.map(item => (
                <ContentQueueItemComponent
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.has(item.id)}
                  onSelect={handleSelectItem}
                  onView={setReviewingItem}
                  onQuickApprove={() => setActionModal({ type: 'approve', item })}
                  onQuickReject={() => setActionModal({ type: 'reject', item })}
                />
              ))}
            </div>

            {/* Pagination */}
            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === data.pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {reviewingItem && (
        <ReviewModal
          item={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onApprove={() => setActionModal({ type: 'approve', item: reviewingItem })}
          onReject={() => setActionModal({ type: 'reject', item: reviewingItem })}
          onHide={() => setActionModal({ type: 'hide', item: reviewingItem })}
          onDelete={() => setActionModal({ type: 'delete', item: reviewingItem })}
        />
      )}

      {/* Action Confirmation Modal */}
      {actionModal.type && actionModal.item && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActionModal({ type: null, item: null });
            setActionReason('');
          }}
          title={`Confirm ${actionModal.type.charAt(0).toUpperCase() + actionModal.type.slice(1)}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to {actionModal.type} this content?
              {actionModal.type === 'delete' && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  This action cannot be undone!
                </span>
              )}
            </p>

            {(actionModal.type === 'reject' || actionModal.type === 'hide' || actionModal.type === 'delete') && (
              <Textarea
                label="Reason (optional)"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                placeholder="Provide a reason for this action..."
              />
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setActionModal({ type: null, item: null });
                  setActionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant={actionModal.type === 'delete' ? 'destructive' : 'default'}
                onClick={handleActionConfirm}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// Content Queue Item Component (inline for simplicity)
interface ContentQueueItemProps {
  item: ContentItem;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onView: (item: ContentItem) => void;
  onQuickApprove?: (item: ContentItem) => void;
  onQuickReject?: (item: ContentItem) => void;
}

const ContentQueueItemComponent: React.FC<ContentQueueItemProps> = ({
  item,
  isSelected,
  onSelect,
  onView,
  onQuickApprove,
  onQuickReject,
}) => {
  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(item)}
    >
      <div className="flex items-start gap-4">
        <div className="flex items-center pt-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(item.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
              {item.title}
            </h3>
            <div className="flex-shrink-0 flex items-center gap-2">
              <ContentTypeBadge type={item.type} />
              <StatusBadge status={item.status} />
            </div>
          </div>

          {item.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {item.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span className="font-medium">{item.author.displayName}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
            {item.reportCount > 0 && (
              <>
                <span>•</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {item.reportCount} {item.reportCount === 1 ? 'report' : 'reports'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">Spam Score:</span>
            <SpamScoreIndicator score={item.spamScore} size="sm" />
          </div>

          {item.status === 'pending' && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" onClick={() => onQuickApprove?.(item)}>
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onQuickReject?.(item)}>
                Reject
              </Button>
              <Button size="sm" variant="outline" onClick={() => onView(item)}>
                Review
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Review Modal Component (inline for simplicity)
interface ReviewModalProps {
  item: ContentItem;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onHide: () => void;
  onDelete: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  item,
  onClose,
  onApprove,
  onReject,
  onHide,
  onDelete,
}) => {
  return (
    <Modal isOpen={true} onClose={onClose} title="Content Review" size="xl">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {item.title}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <ContentTypeBadge type={item.type} />
              <StatusBadge status={item.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {item.author.displayName}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              @{item.author.username}
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none p-4 border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
          <div>{item.content || item.excerpt}</div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Spam Analysis
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Spam Score:</span>
            <SpamScoreIndicator score={item.spamScore} size="lg" />
          </div>
        </div>

        {item.reports && item.reports.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Reports ({item.reportCount})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {item.reports.map((report) => (
                <div
                  key={report.id}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">@{report.reporterUsername}</span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-400">
                    {report.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {item.status === 'pending' && (
            <>
              <Button onClick={onApprove}>Approve</Button>
              <Button variant="destructive" onClick={onReject}>Reject</Button>
              <Button variant="outline" onClick={onHide}>Hide</Button>
              <Button variant="destructive" onClick={onDelete}>Delete</Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ContentModerationPage;
