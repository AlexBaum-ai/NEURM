import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messagesApi';
import type { MessagesResponse } from '../types';

interface UseMessagesOptions {
  conversationId: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export const useMessages = ({
  conversationId,
  enabled = true,
  refetchInterval = 5000,
}: UseMessagesOptions) => {
  return useInfiniteQuery<MessagesResponse>({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam = 1 }) =>
      messagesApi.getMessages(conversationId, {
        page: pageParam as number,
        limit: 50,
      }),
    getNextPageParam: (lastPage) => {
      const hasMore = lastPage.page * lastPage.limit < lastPage.total;
      return hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
    refetchInterval,
    staleTime: 0,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagesApi.markConversationAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};
