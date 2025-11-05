/**
 * ReplyTree Component
 * Recursively renders nested replies with flattening on mobile
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ReplyCard } from './ReplyCard';
import { ReplyComposer } from './ReplyComposer';
import type { ForumReply, QuotedReply, ReplySortOption, TopicType } from '../types';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ReplyTreeProps {
  replies: ForumReply[];
  topicId: string;
  topicType: TopicType;
  topicAuthorId: string;
  acceptedAnswerId: string | null;
  sortBy: ReplySortOption;
  onSortChange: (sortBy: ReplySortOption) => void;
  onCreateReply: (parentId: string | null, content: string, quotedReply?: QuotedReply) => void;
  onUpdateReply: (replyId: string, content: string) => void;
  onDeleteReply: (replyId: string) => void;
  onAcceptAnswer?: (replyId: string) => void;
  isSubmitting?: boolean;
}

// Maximum nesting level on desktop
const MAX_LEVEL_DESKTOP = 3;
// Maximum nesting level on mobile (flatten beyond this)
const MAX_LEVEL_MOBILE = 2;

/**
 * Flatten replies beyond maxLevel for mobile
 */
const flattenReplies = (replies: ForumReply[], maxLevel: number): ForumReply[] => {
  const flattened: ForumReply[] = [];

  const flatten = (reply: ForumReply, level: number) => {
    flattened.push({ ...reply, level });

    if (reply.children && reply.children.length > 0) {
      if (level < maxLevel) {
        // Keep nesting
        reply.children.forEach(child => flatten(child, level + 1));
      } else {
        // Flatten to current level
        reply.children.forEach(child => flatten(child, level));
      }
    }
  };

  replies.forEach(reply => flatten(reply, 0));
  return flattened;
};

/**
 * Recursive reply renderer
 */
interface ReplyNodeProps {
  reply: ForumReply;
  topicType: TopicType;
  topicAuthorId: string;
  acceptedAnswerId: string | null;
  level: number;
  maxLevel: number;
  onReply: (parentId: string, content: string, quotedReply?: QuotedReply) => void;
  onEdit: (replyId: string, content: string) => void;
  onDelete: (replyId: string) => void;
  onAcceptAnswer?: (replyId: string) => void;
  isSubmitting?: boolean;
}

const ReplyNode: React.FC<ReplyNodeProps> = ({
  reply,
  topicType,
  topicAuthorId,
  acceptedAnswerId,
  level,
  maxLevel,
  onReply,
  onEdit,
  onDelete,
  onAcceptAnswer,
  isSubmitting,
}) => {
  return (
    <div className="space-y-3">
      <ReplyCard
        reply={reply}
        topicType={topicType}
        topicAuthorId={topicAuthorId}
        acceptedAnswerId={acceptedAnswerId}
        level={level}
        maxLevel={maxLevel}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onAcceptAnswer={onAcceptAnswer}
        isSubmitting={isSubmitting}
      />

      {/* Render children recursively */}
      {reply.children && reply.children.length > 0 && level < maxLevel && (
        <div className="space-y-3">
          {reply.children.map(child => (
            <ReplyNode
              key={child.id}
              reply={child}
              topicType={topicType}
              topicAuthorId={topicAuthorId}
              acceptedAnswerId={acceptedAnswerId}
              level={level + 1}
              maxLevel={maxLevel}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onAcceptAnswer={onAcceptAnswer}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ReplyTree: React.FC<ReplyTreeProps> = ({
  replies,
  topicType,
  topicAuthorId,
  acceptedAnswerId,
  sortBy,
  onSortChange,
  onCreateReply,
  onUpdateReply,
  onDeleteReply,
  onAcceptAnswer,
  isSubmitting = false,
}) => {
  const { user } = useAuth();
  const [newReplyContent, setNewReplyContent] = useState('');
  const [showNewReply, setShowNewReply] = useState(false);

  // Detect mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const maxLevel = isMobile ? MAX_LEVEL_MOBILE : MAX_LEVEL_DESKTOP;

  // Flatten replies on mobile if needed
  const displayReplies = useMemo(() => {
    if (isMobile) {
      return flattenReplies(replies, maxLevel);
    }
    return replies;
  }, [replies, isMobile, maxLevel]);

  const handleSubmitNewReply = useCallback(() => {
    if (newReplyContent.trim()) {
      onCreateReply(null, newReplyContent);
      setNewReplyContent('');
      setShowNewReply(false);
    }
  }, [newReplyContent, onCreateReply]);

  const totalCount = useMemo(() => {
    const count = (replies: ForumReply[]): number => {
      return replies.reduce((acc, reply) => {
        return acc + 1 + (reply.children ? count(reply.children) : 0);
      }, 0);
    };
    return count(replies);
  }, [replies]);

  return (
    <div className="space-y-4">
      {/* Header with sort and count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {totalCount} {totalCount === 1 ? 'Reply' : 'Replies'}
        </h3>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as ReplySortOption)}
            className="appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <option value="oldest">Oldest First</option>
            <option value="newest">Newest First</option>
            <option value="most_voted">Most Voted</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      {/* New Reply Composer (for top-level replies) */}
      {user && !showNewReply && (
        <button
          onClick={() => setShowNewReply(true)}
          className="w-full rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-left text-sm text-gray-600 hover:border-primary-500 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-primary-500 dark:hover:bg-gray-700"
        >
          Add a reply...
        </button>
      )}

      {showNewReply && (
        <ReplyComposer
          value={newReplyContent}
          onChange={setNewReplyContent}
          onSubmit={handleSubmitNewReply}
          onCancel={() => {
            setShowNewReply(false);
            setNewReplyContent('');
          }}
          isSubmitting={isSubmitting}
          autoFocus
        />
      )}

      {/* Reply List */}
      {replies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            No replies yet. Be the first to reply!
          </p>
        </div>
      ) : isMobile ? (
        // Flattened view for mobile
        <div className="space-y-3">
          {displayReplies.map(reply => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              topicType={topicType}
              topicAuthorId={topicAuthorId}
              acceptedAnswerId={acceptedAnswerId}
              level={reply.level}
              maxLevel={maxLevel}
              onReply={onCreateReply}
              onEdit={onUpdateReply}
              onDelete={onDeleteReply}
              onAcceptAnswer={onAcceptAnswer}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      ) : (
        // Nested tree view for desktop
        <div className="space-y-4">
          {replies.map(reply => (
            <ReplyNode
              key={reply.id}
              reply={reply}
              topicType={topicType}
              topicAuthorId={topicAuthorId}
              acceptedAnswerId={acceptedAnswerId}
              level={0}
              maxLevel={maxLevel}
              onReply={onCreateReply}
              onEdit={onUpdateReply}
              onDelete={onDeleteReply}
              onAcceptAnswer={onAcceptAnswer}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}

      {/* Mobile responsive notice */}
      {isMobile && totalCount > 0 && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Viewing flattened reply thread for mobile
        </p>
      )}
    </div>
  );
};

export default ReplyTree;
