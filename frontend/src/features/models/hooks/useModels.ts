import { useSuspenseQuery, useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  Model,
  ModelListResponse,
  ModelNewsItem,
  ModelDiscussion,
  ModelJob,
  ModelFilters,
  ModelVersionsResponse,
  RelatedModel,
  CommunityResource,
  BenchmarkComparisonData,
} from '../types';

// Query keys
export const modelKeys = {
  all: ['models'] as const,
  lists: () => [...modelKeys.all, 'list'] as const,
  list: (filters?: ModelFilters) => [...modelKeys.lists(), filters] as const,
  details: () => [...modelKeys.all, 'detail'] as const,
  detail: (slug: string) => [...modelKeys.details(), slug] as const,
  news: (slug: string) => [...modelKeys.detail(slug), 'news'] as const,
  discussions: (slug: string) => [...modelKeys.detail(slug), 'discussions'] as const,
  jobs: (slug: string) => [...modelKeys.detail(slug), 'jobs'] as const,
  versions: (slug: string) => [...modelKeys.detail(slug), 'versions'] as const,
  benchmarks: (slug: string) => [...modelKeys.detail(slug), 'benchmarks'] as const,
  relatedModels: (slug: string) => [...modelKeys.detail(slug), 'related'] as const,
  communityResources: (slug: string) => [...modelKeys.detail(slug), 'community'] as const,
  benchmarkComparison: (modelIds: number[]) => [...modelKeys.all, 'benchmarkComparison', modelIds] as const,
};

// Fetch all models
export const useModels = (filters?: ModelFilters) => {
  return useSuspenseQuery({
    queryKey: modelKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters?.category?.length) {
        params.append('category', filters.category.join(','));
      }
      if (filters?.provider?.length) {
        params.append('provider', filters.provider.join(','));
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await api.get<{ data: ModelListResponse }>(`/models?${params.toString()}`);
      return response.data.data;
    },
  });
};

// Fetch single model details
export const useModel = (slug: string) => {
  return useSuspenseQuery({
    queryKey: modelKeys.detail(slug),
    queryFn: async () => {
      const response = await api.get<{ data: Model }>(`/models/${slug}`);
      return response.data.data;
    },
  });
};

// Fetch model news (infinite scroll)
export const useModelNews = (slug: string) => {
  return useInfiniteQuery({
    queryKey: modelKeys.news(slug),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get<{ data: { articles: ModelNewsItem[]; total: number; page: number; hasMore: boolean } }>(
        `/models/${slug}/news?page=${pageParam}&limit=10`
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

// Fetch model discussions
export const useModelDiscussions = (slug: string) => {
  return useSuspenseQuery({
    queryKey: modelKeys.discussions(slug),
    queryFn: async () => {
      const response = await api.get<{ data: { discussions: ModelDiscussion[]; total: number } }>(
        `/models/${slug}/discussions?limit=10`
      );
      return response.data.data;
    },
  });
};

// Fetch model jobs
export const useModelJobs = (slug: string) => {
  return useSuspenseQuery({
    queryKey: modelKeys.jobs(slug),
    queryFn: async () => {
      const response = await api.get<{ data: { jobs: ModelJob[]; total: number } }>(
        `/models/${slug}/jobs?limit=10`
      );
      return response.data.data;
    },
  });
};

// Follow/unfollow model mutation
export const useFollowModel = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ data: { isFollowing: boolean; followerCount: number } }>(
        `/models/${slug}/follow`
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      // Update the model detail cache
      queryClient.setQueryData(modelKeys.detail(slug), (old: Model | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: data.isFollowing,
          followerCount: data.followerCount,
        };
      });
    },
  });
};

// Fetch model versions
export const useModelVersions = (slug: string) => {
  return useQuery({
    queryKey: modelKeys.versions(slug),
    queryFn: async () => {
      const response = await api.get<{ data: ModelVersionsResponse }>(`/models/${slug}/versions`);
      return response.data.data;
    },
  });
};

// Fetch model benchmarks (for comparison)
export const useModelBenchmarks = (slug: string) => {
  return useQuery({
    queryKey: modelKeys.benchmarks(slug),
    queryFn: async () => {
      const response = await api.get<{ data: { benchmarks: any[] } }>(`/models/${slug}/benchmarks`);
      return response.data.data;
    },
  });
};

// Fetch related models
export const useRelatedModels = (slug: string) => {
  return useQuery({
    queryKey: modelKeys.relatedModels(slug),
    queryFn: async () => {
      const response = await api.get<{ data: { models: RelatedModel[]; total: number } }>(
        `/models/${slug}/related?limit=6`
      );
      return response.data.data;
    },
  });
};

// Fetch community resources
export const useCommunityResources = (slug: string) => {
  return useQuery({
    queryKey: modelKeys.communityResources(slug),
    queryFn: async () => {
      const response = await api.get<{ data: { resources: CommunityResource[]; total: number } }>(
        `/models/${slug}/community-resources?limit=10`
      );
      return response.data.data;
    },
  });
};

// Fetch benchmark comparison data for multiple models
export const useBenchmarkComparison = (modelIds: number[]) => {
  return useQuery({
    queryKey: modelKeys.benchmarkComparison(modelIds),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('ids', modelIds.join(','));
      const response = await api.get<{ data: BenchmarkComparisonData }>(
        `/models/compare/benchmarks?${params.toString()}`
      );
      return response.data.data;
    },
    enabled: modelIds.length > 0,
  });
};
