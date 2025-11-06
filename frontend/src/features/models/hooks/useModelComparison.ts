import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import api from '@/lib/api';
import type { Model, ModelComparisonResponse, SavedComparison } from '../types';

// Query keys
export const comparisonKeys = {
  all: ['model-comparisons'] as const,
  compare: (ids: string[]) => [...comparisonKeys.all, 'compare', ids.sort().join(',')] as const,
  saved: () => [...comparisonKeys.all, 'saved'] as const,
  shared: (id: string) => [...comparisonKeys.all, 'shared', id] as const,
};

// Fetch model comparison
export const useModelComparison = (modelIds: string[]) => {
  return useSuspenseQuery({
    queryKey: comparisonKeys.compare(modelIds),
    queryFn: async () => {
      if (modelIds.length < 2) {
        throw new Error('At least 2 models are required for comparison');
      }
      if (modelIds.length > 5) {
        throw new Error('Maximum 5 models can be compared');
      }

      const idsParam = modelIds.join(',');
      const response = await api.get<{ data: ModelComparisonResponse }>(
        `/models/compare?ids=${idsParam}`
      );
      return response.data.data;
    },
    enabled: modelIds.length >= 2 && modelIds.length <= 5,
  });
};

// Save comparison for later
export const useSaveComparison = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; modelIds: number[] }) => {
      const response = await api.post<{ data: SavedComparison }>(
        '/models/comparisons',
        params
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comparisonKeys.saved() });
    },
  });
};

// Get saved comparisons
export const useSavedComparisons = () => {
  return useSuspenseQuery({
    queryKey: comparisonKeys.saved(),
    queryFn: async () => {
      const response = await api.get<{ data: SavedComparison[] }>('/models/comparisons');
      return response.data.data;
    },
  });
};

// Share comparison (generates unique URL)
export const useShareComparison = () => {
  return useMutation({
    mutationFn: async (modelIds: number[]) => {
      const response = await api.post<{ data: { id: string; url: string } }>(
        '/models/comparisons/share',
        { modelIds }
      );
      return response.data.data;
    },
  });
};

// Get shared comparison by ID
export const useSharedComparison = (id: string) => {
  return useSuspenseQuery({
    queryKey: comparisonKeys.shared(id),
    queryFn: async () => {
      const response = await api.get<{ data: ModelComparisonResponse }>(
        `/models/comparisons/shared/${id}`
      );
      return response.data.data;
    },
    enabled: !!id,
  });
};

// Hook to manage selected models for comparison
export const useComparisonSelection = () => {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

  const addModel = useCallback((modelId: string) => {
    setSelectedModelIds((prev) => {
      if (prev.includes(modelId)) return prev;
      if (prev.length >= 5) {
        throw new Error('Maximum 5 models can be compared');
      }
      return [...prev, modelId];
    });
  }, []);

  const removeModel = useCallback((modelId: string) => {
    setSelectedModelIds((prev) => prev.filter((id) => id !== modelId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedModelIds([]);
  }, []);

  const isSelected = useCallback(
    (modelId: string) => selectedModelIds.includes(modelId),
    [selectedModelIds]
  );

  const canAddMore = selectedModelIds.length < 5;
  const canCompare = selectedModelIds.length >= 2 && selectedModelIds.length <= 5;

  return {
    selectedModelIds,
    addModel,
    removeModel,
    clearSelection,
    isSelected,
    canAddMore,
    canCompare,
  };
};

// Popular comparisons suggestions
export const POPULAR_COMPARISONS = [
  { name: 'GPT-4 vs Claude 3', modelSlugs: ['gpt-4', 'claude-3-opus'] },
  { name: 'GPT-4 vs GPT-3.5', modelSlugs: ['gpt-4', 'gpt-3-5-turbo'] },
  { name: 'Claude 3 Opus vs Sonnet vs Haiku', modelSlugs: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { name: 'Gemini vs GPT-4', modelSlugs: ['gemini-pro', 'gpt-4'] },
  { name: 'LLaMA 3 vs Mistral', modelSlugs: ['llama-3-70b', 'mistral-large'] },
];

export default useModelComparison;
