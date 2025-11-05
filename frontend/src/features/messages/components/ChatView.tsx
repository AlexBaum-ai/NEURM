import React, { useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Check, CheckCheck, Loader2, MoreVertical, Trash2, Ban } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useMessages, useSendMessage, useMarkConversationAsRead } from '../hooks';
import MessageComposer from './MessageComposer';
import type { Message, Conversation } from '../types';
import { Button } from '@/components/common/Button/Button';

interface ChatViewProps {
  conversation: Conversation;
  onDeleteConversation: () => void;
  onBlockUser: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  onDeleteConversation,
  onBlockUser,
}) => {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = React.useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages({
    conversationId: conversation.id,
  });

  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkConversationAsRead();

  const { ref: loadMoreRef, inView } = useInView();

  // Get other participant
  const otherParticipant =
    conversation.participant1Id === user?.id
      ? conversation.participant2
      : conversation.participant1;

  // Flatten all messages from pages
  const allMessages = data?.pages.flatMap((page) => page.messages) ?? [];

  // Sort messages by date (oldest first for display)
  const sortedMessages = [...allMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sortedMessages.length]);

  // Mark conversation as read when viewing
  useEffect(() => {
    markAsReadMutation.mutate(conversation.id);
  }, [conversation.id]);

  // Load more messages when scrolling up
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSendMessage = useCallback(
    async (content: string, attachments?: File[]) => {
      await sendMessageMutation.mutateAsync({
        conversationId: conversation.id,
        content,
        attachments,
      });
    },
    [conversation.id, sendMessageMutation]
  );

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.senderId === user?.id;
    const showAvatar =
      index === 0 ||
      sortedMessages[index - 1]?.senderId !== message.senderId;

    return (
      <div
        key={message.id}
        className={cn('flex gap-3 mb-4', isOwnMessage ? 'flex-row-reverse' : 'flex-row')}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {showAvatar ? (
            isOwnMessage ? (
              user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                    {user?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              )
            ) : otherParticipant?.avatar ? (
              <img
                src={otherParticipant.avatar}
                alt={otherParticipant.username}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {otherParticipant?.username?.[0]?.toUpperCase()}
                </span>
              </div>
            )
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={cn(
            'flex-1 max-w-[70%]',
            isOwnMessage ? 'items-end' : 'items-start'
          )}
        >
          <div
            className={cn(
              'rounded-lg px-4 py-2',
              isOwnMessage
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
            )}
          >
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: message.content }}
            />

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm underline hover:no-underline"
                  >
                    {attachment.filename}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div
            className={cn(
              'flex items-center gap-1 mt-1 px-1 text-xs text-gray-500 dark:text-gray-400',
              isOwnMessage ? 'justify-end' : 'justify-start'
            )}
          >
            <span>
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
            {isOwnMessage && (
              <>
                {message.readAt ? (
                  <CheckCheck className="h-3 w-3 text-primary-600" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3">
          {otherParticipant?.avatar ? (
            <img
              src={otherParticipant.avatar}
              alt={otherParticipant.username}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {otherParticipant?.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {otherParticipant?.username || 'Unknown User'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {otherParticipant?.firstName && otherParticipant?.lastName
                ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                : 'Member'}
            </p>
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (confirm('Are you sure you want to delete this conversation?')) {
                    onDeleteConversation();
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-accent-600"
              >
                <Trash2 className="h-4 w-4" />
                Delete Conversation
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (confirm('Are you sure you want to block this user?')) {
                    onBlockUser();
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-accent-600"
              >
                <Ban className="h-4 w-4" />
                Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 dark:bg-gray-950"
      >
        {/* Load more trigger */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            )}
          </div>
        )}

        {/* Messages */}
        {sortedMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div>
            {sortedMessages.map((message, index) => renderMessage(message, index))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <MessageComposer
        onSend={handleSendMessage}
        disabled={sendMessageMutation.isPending}
      />
    </div>
  );
};

export default ChatView;
