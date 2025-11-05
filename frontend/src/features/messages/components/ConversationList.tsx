import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConversations } from '../hooks';
import { useAuthStore } from '@/store/authStore';
import type { Conversation } from '../types';

interface ConversationListProps {
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({ className }) => {
  const { conversationId } = useParams();
  const { user } = useAuthStore();
  const { data, isLoading, error } = useConversations();

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.participant1Id === user?.id) {
      return conversation.participant2;
    }
    return conversation.participant1;
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('p-4 text-center text-accent-600', className)}>
        Failed to load conversations
      </div>
    );
  }

  if (!data?.conversations || data.conversations.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No conversations yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Start a conversation from a user's profile
        </p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-y-auto', className)}>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {data.conversations.map((conversation) => {
          const otherParticipant = getOtherParticipant(conversation);
          const isActive = conversation.id === conversationId;
          const hasUnread = (conversation.unreadCount ?? 0) > 0;

          return (
            <Link
              key={conversation.id}
              to={`/messages/${conversation.id}`}
              className={cn(
                'block p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800',
                isActive && 'bg-primary-50 dark:bg-primary-900/20',
                hasUnread && 'bg-blue-50 dark:bg-blue-900/10'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {otherParticipant?.avatar ? (
                    <img
                      src={otherParticipant.avatar}
                      alt={otherParticipant.username}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary-700 dark:text-primary-300">
                        {otherParticipant?.username?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3
                      className={cn(
                        'text-sm font-medium truncate',
                        hasUnread
                          ? 'text-gray-900 dark:text-white font-semibold'
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {otherParticipant?.username || 'Unknown User'}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {conversation.lastMessageAt &&
                        formatDistanceToNow(new Date(conversation.lastMessageAt), {
                          addSuffix: true,
                        })}
                    </span>
                  </div>

                  {conversation.lastMessage && (
                    <p
                      className={cn(
                        'text-sm truncate',
                        hasUnread
                          ? 'text-gray-900 dark:text-white font-medium'
                          : 'text-gray-600 dark:text-gray-400'
                      )}
                      dangerouslySetInnerHTML={{
                        __html: conversation.lastMessage.content.substring(0, 60),
                      }}
                    />
                  )}
                </div>

                {/* Unread badge */}
                {hasUnread && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary-600 text-xs font-semibold text-white">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationList;
