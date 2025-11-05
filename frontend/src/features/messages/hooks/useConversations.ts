import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messagesApi';
import type { Conversation } from '../types';

interface UseConversationsOptions {
  refetchInterval?: number;
}

export const useConversations = (options: UseConversationsOptions = {}) => {
  const { refetchInterval = 5000 } = options;

  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations(),
    refetchInterval,
    staleTime: 0,
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      messagesApi.deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      // Remove conversation from cache
      queryClient.setQueryData(['conversations'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          conversations: old.conversations.filter(
            (conv: Conversation) => conv.id !== conversationId
          ),
        };
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => messagesApi.getUnreadCount(),
    refetchInterval: 10000, // Poll every 10 seconds
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => messagesApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
};
