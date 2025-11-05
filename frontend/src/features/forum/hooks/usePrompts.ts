import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promptsApi } from '../api/promptsApi';
import type {
  PromptsQueryParams,
  CreatePromptDto,
  UpdatePromptDto,
  RatePromptDto,
  VotePromptDto,
} from '../types/prompt';
import type { CreateReplyInput } from '../types';
import toast from 'react-hot-toast';

const PROMPTS_QUERY_KEY = 'prompts';

/**
 * Get list of prompts with filters
 */
export const usePrompts = (params?: PromptsQueryParams) => {
  return useSuspenseQuery({
    queryKey: [PROMPTS_QUERY_KEY, 'list', params],
    queryFn: () => promptsApi.getPrompts(params),
  });
};

/**
 * Get single prompt by ID
 */
export const usePrompt = (id: string) => {
  return useSuspenseQuery({
    queryKey: [PROMPTS_QUERY_KEY, 'detail', id],
    queryFn: () => promptsApi.getPromptById(id),
  });
};

/**
 * Get prompt comments
 */
export const usePromptComments = (promptId: string) => {
  return useSuspenseQuery({
    queryKey: [PROMPTS_QUERY_KEY, 'comments', promptId],
    queryFn: () => promptsApi.getPromptComments(promptId),
  });
};

/**
 * Get prompt forks
 */
export const usePromptForks = (promptId: string) => {
  return useSuspenseQuery({
    queryKey: [PROMPTS_QUERY_KEY, 'forks', promptId],
    queryFn: () => promptsApi.getPromptForks(promptId),
  });
};

/**
 * Create new prompt
 */
export const useCreatePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePromptDto) => promptsApi.createPrompt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'list'] });
      toast.success('Prompt created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create prompt');
    },
  });
};

/**
 * Update prompt
 */
export const useUpdatePrompt = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePromptDto) => promptsApi.updatePrompt(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'detail', id] });
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'list'] });
      toast.success('Prompt updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update prompt');
    },
  });
};

/**
 * Delete prompt
 */
export const useDeletePrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promptsApi.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'list'] });
      toast.success('Prompt deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete prompt');
    },
  });
};

/**
 * Fork prompt
 */
export const useForkPrompt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promptsApi.forkPrompt(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'list'] });
      toast.success('Prompt forked successfully!');
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to fork prompt');
    },
  });
};

/**
 * Rate prompt (1-5 stars)
 */
export const useRatePrompt = (promptId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RatePromptDto) => promptsApi.ratePrompt(promptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'detail', promptId] });
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'list'] });
      toast.success('Rating submitted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to rate prompt');
    },
  });
};

/**
 * Vote on prompt (upvote/downvote)
 */
export const useVotePrompt = (promptId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VotePromptDto) => promptsApi.votePrompt(promptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'detail', promptId] });
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'list'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to vote');
    },
  });
};

/**
 * Add comment to prompt
 */
export const useAddPromptComment = (promptId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateReplyInput, 'topicId'>) =>
      promptsApi.addPromptComment(promptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROMPTS_QUERY_KEY, 'comments', promptId] });
      toast.success('Comment added!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
};

/**
 * Copy prompt to clipboard
 */
export const useCopyPrompt = () => {
  return (content: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          toast.success('Prompt copied to clipboard!');
        })
        .catch(() => {
          toast.error('Failed to copy prompt');
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Prompt copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy prompt');
      }
      document.body.removeChild(textArea);
    }
  };
};
