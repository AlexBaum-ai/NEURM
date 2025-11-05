/**
 * ReplyCard Component
 * Displays an individual reply with voting, editing, and action buttons
 */

import React, { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  Quote as QuoteIcon,
  Edit,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReplyComposer } from './ReplyComposer';
import { QuoteBlock } from './QuoteBlock';
import ReputationBadge from './ReputationBadge';
import type { ForumReply, QuotedReply, TopicType } from '../types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ReportButton } from './ReportButton';

interface ReplyCardProps {
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

export const ReplyCard: React.FC<ReplyCardProps> = ({
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
  isSubmitting = false,
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(reply.content);
  const [quotedReply, setQuotedReply] = useState<QuotedReply | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAuthor = user?.id === reply.authorId;
  const isTopicAuthor = user?.id === topicAuthorId;
  const isAccepted = acceptedAnswerId === reply.id;
  const canAccept = topicType === 'question' && isTopicAuthor && !acceptedAnswerId;

  // Calculate edit window (15 minutes)
  const createdTime = new Date(reply.createdAt).getTime();
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  const canEdit = isAuthor && (now - createdTime) < fifteenMinutes && !reply.isDeleted;

  const handleReplyClick = useCallback(() => {
    setIsReplying(true);
    setQuotedReply(null);
  }, []);

  const handleQuoteClick = useCallback(() => {
    setIsReplying(true);
    setQuotedReply({
      id: reply.id,
      authorUsername: reply.author.username,
      content: reply.content,
      createdAt: reply.createdAt,
    });
  }, [reply]);

  const handleSubmitReply = useCallback(() => {
    if (replyContent.trim()) {
      onReply(reply.id, replyContent, quotedReply || undefined);
      setReplyContent('');
      setQuotedReply(null);
      setIsReplying(false);
    }
  }, [replyContent, quotedReply, reply.id, onReply]);

  const handleSubmitEdit = useCallback(() => {
    if (editContent.trim()) {
      onEdit(reply.id, editContent);
      setIsEditing(false);
    }
  }, [editContent, reply.id, onEdit]);

  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      onDelete(reply.id);
    }
  }, [reply.id, onDelete]);

  const handleAccept = useCallback(() => {
    if (onAcceptAnswer) {
      onAcceptAnswer(reply.id);
    }
  }, [reply.id, onAcceptAnswer]);

  const timeAgo = formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true });

  // Visual indentation (max 3 levels on desktop)
  const indentLevel = Math.min(level, maxLevel);

  return (
    <div className={cn('group relative', indentLevel > 0 && 'border-l-2 border-gray-200 pl-4 dark:border-gray-700')}>
      {isAccepted && (
        <div className="absolute -left-px top-0 h-full w-1 bg-green-500" />
      )}

      <div
        className={cn(
          'rounded-lg border bg-white p-4 transition-colors dark:bg-gray-900',
          isAccepted
            ? 'border-green-500 dark:border-green-600'
            : 'border-gray-200 dark:border-gray-700',
          reply.isDeleted && 'opacity-60'
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              {reply.author.avatarUrl ? (
                <img
                  src={reply.author.avatarUrl}
                  alt={reply.author.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {reply.author.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Author Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {reply.author.displayName || reply.author.username}
                </span>
                {reply.author.reputationLevel && reply.author.reputation !== undefined && (
                  <ReputationBadge
                    level={reply.author.reputationLevel}
                    totalReputation={reply.author.reputation}
                    size="small"
                    showPoints={false}
                    showIcon={true}
                  />
                )}
                {isAccepted && (
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                    <CheckCircle className="h-3 w-3" />
                    Accepted Answer
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{timeAgo}</span>
                {reply.isEdited && <span>• edited</span>}
                {reply.isDeleted && <span>• deleted</span>}
              </div>
            </div>
          </div>

          {/* Collapse Button */}
          {reply.children && reply.children.length > 0 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={isCollapsed ? 'Expand thread' : 'Collapse thread'}
            >
              {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </button>
          )}
        </div>

        {/* Content or Edit Mode */}
        {isEditing ? (
          <div className="mb-3">
            <ReplyComposer
              value={editContent}
              onChange={setEditContent}
              onSubmit={handleSubmitEdit}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save Changes"
              isSubmitting={isSubmitting}
              autoFocus
            />
          </div>
        ) : (
          <>
            {/* Quoted Reply */}
            {reply.quotedReply && (
              <div className="mb-3">
                <QuoteBlock quotedReply={reply.quotedReply} />
              </div>
            )}

            {/* Reply Content */}
            {!isCollapsed && (
              <div
                className={cn(
                  'prose prose-sm dark:prose-invert max-w-none',
                  reply.isDeleted && 'italic text-gray-500'
                )}
              >
                {reply.isDeleted ? (
                  <p>This reply has been deleted.</p>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: reply.content }} />
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        {!isCollapsed && !reply.isDeleted && !isEditing && (
          <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            {/* Vote Score */}
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {reply.voteScore}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">votes</span>
            </div>

            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

            {/* Reply Button */}
            {level < maxLevel && user && (
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <MessageSquare className="h-4 w-4" />
                Reply
              </button>
            )}

            {/* Quote Button */}
            {level < maxLevel && user && (
              <button
                onClick={handleQuoteClick}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <QuoteIcon className="h-4 w-4" />
                Quote
              </button>
            )}

            {/* Edit Button */}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}

            {/* Delete Button */}
            {isAuthor && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}

            {/* Accept Answer Button */}
            {canAccept && (
              <button
                onClick={handleAccept}
                className="ml-auto flex items-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Accept Answer
              </button>
            )}

            {/* Report Button */}
            {user && !canAccept && (
              <div className="ml-auto">
                <ReportButton reportableType="reply" reportableId={reply.id} size="small" />
              </div>
            )}
          </div>
        )}

        {/* Reply Composer */}
        {isReplying && (
          <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
            <ReplyComposer
              value={replyContent}
              onChange={setReplyContent}
              onSubmit={handleSubmitReply}
              onCancel={() => {
                setIsReplying(false);
                setReplyContent('');
                setQuotedReply(null);
              }}
              quotedReply={quotedReply}
              onRemoveQuote={() => setQuotedReply(null)}
              isSubmitting={isSubmitting}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplyCard;
