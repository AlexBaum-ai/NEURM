/**
 * Messaging Hooks
 *
 * Custom hooks for bulk messaging functionality
 */

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  sendBulkMessages,
  getRateLimitStatus,
  getBulkMessageHistory,
} from '../api/companiesApi';

/**
 * Hook to fetch all message templates
 */
export const useMessageTemplates = () => {
  return useSuspenseQuery({
    queryKey: ['message-templates'],
    queryFn: getMessageTemplates,
  });
};

/**
 * Hook to create a new message template
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });
};

/**
 * Hook to update a message template
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: Parameters<typeof updateMessageTemplate>) =>
      updateMessageTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });
};

/**
 * Hook to delete a message template
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMessageTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
    },
  });
};

/**
 * Hook to send bulk messages
 */
export const useSendBulkMessages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendBulkMessages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-limit'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-message-history'] });
    },
  });
};

/**
 * Hook to get rate limit status
 */
export const useRateLimitStatus = () => {
  return useSuspenseQuery({
    queryKey: ['rate-limit'],
    queryFn: getRateLimitStatus,
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook to get bulk message history
 */
export const useBulkMessageHistory = (page = 1, limit = 20) => {
  return useSuspenseQuery({
    queryKey: ['bulk-message-history', page, limit],
    queryFn: () => getBulkMessageHistory(page, limit),
  });
};
