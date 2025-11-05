/**
 * useModeration Hook
 * Custom hook for moderation actions with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { forumApi } from '../api/forumApi';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';

export const useModeration = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [openMoveModal, setOpenMoveModal] = useState(false);
  const [openMergeModal, setOpenMergeModal] = useState(false);
  const [openUserModerationPanel, setOpenUserModerationPanel] = useState(false);

  const isModerator = user?.role === 'moderator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // Pin/Unpin Topic
  const pinTopicMutation = useMutation({
    mutationFn: ({ topicId, isPinned }: { topicId: string; isPinned: boolean }) =>
      forumApi.pinTopic(topicId, isPinned),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['topic', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  // Lock/Unlock Topic
  const lockTopicMutation = useMutation({
    mutationFn: ({ topicId, isLocked }: { topicId: string; isLocked: boolean }) =>
      forumApi.lockTopic(topicId, isLocked),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['topic', variables.topicId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  // Delete Topic
  const deleteTopicMutation = useMutation({
    mutationFn: ({ topicId, reason }: { topicId: string; reason?: string }) =>
      isAdmin ? forumApi.hardDeleteTopic(topicId, reason) : forumApi.deleteTopic(topicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });

  // Hide Reply
  const hideReplyMutation = useMutation({
    mutationFn: ({
      replyId,
      isHidden,
      reason,
    }: {
      replyId: string;
      isHidden: boolean;
      reason?: string;
    }) => forumApi.hideReply(replyId, isHidden, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });

  // Moderate (edit) Reply
  const moderateReplyMutation = useMutation({
    mutationFn: ({
      replyId,
      content,
      reason,
    }: {
      replyId: string;
      content: string;
      reason?: string;
    }) => forumApi.moderateReply(replyId, content, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });

  // Delete Reply
  const deleteReplyMutation = useMutation({
    mutationFn: ({ replyId }: { replyId: string }) => forumApi.deleteReply(replyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['replies'] });
    },
  });

  return {
    // Permissions
    isModerator,
    isAdmin,

    // Mutations
    pinTopic: pinTopicMutation.mutate,
    lockTopic: lockTopicMutation.mutate,
    deleteTopic: deleteTopicMutation.mutate,
    hideReply: hideReplyMutation.mutate,
    moderateReply: moderateReplyMutation.mutate,
    deleteReply: deleteReplyMutation.mutate,

    // Loading states
    isPinning: pinTopicMutation.isPending,
    isLocking: lockTopicMutation.isPending,
    isDeleting: deleteTopicMutation.isPending || deleteReplyMutation.isPending,
    isHiding: hideReplyMutation.isPending,
    isModerating: moderateReplyMutation.isPending,

    // Modal states
    openMoveModal,
    setOpenMoveModal,
    openMergeModal,
    setOpenMergeModal,
    openUserModerationPanel,
    setOpenUserModerationPanel,
  };
};

export default useModeration;
