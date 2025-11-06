import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import api from '@/lib/api';
import type {
  GlossaryTerm,
  GlossaryCategory,
  GlossaryAlphabet,
  GlossarySearchResult,
  GlossaryFilters,
  PopularTerm,
} from '../types';

// Query keys
export const glossaryKeys = {
  all: ['glossary'] as const,
  lists: () => [...glossaryKeys.all, 'list'] as const,
  list: (filters?: GlossaryFilters) => [...glossaryKeys.lists(), filters] as const,
  details: () => [...glossaryKeys.all, 'detail'] as const,
  detail: (slug: string) => [...glossaryKeys.details(), slug] as const,
  search: (query: string) => [...glossaryKeys.all, 'search', query] as const,
  categories: () => [...glossaryKeys.all, 'categories'] as const,
  alphabet: () => [...glossaryKeys.all, 'alphabet'] as const,
  popular: () => [...glossaryKeys.all, 'popular'] as const,
};

// Fetch all glossary terms
export const useGlossaryTerms = (filters?: GlossaryFilters) => {
  return useSuspenseQuery({
    queryKey: glossaryKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) {
        params.append('category', filters.category);
      }
      if (filters?.letter) {
        params.append('letter', filters.letter);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const response = await api.get<{ data: GlossaryTerm[] }>(`/glossary?${params.toString()}`);
      return response.data.data;
    },
  });
};

// Group terms by first letter
export const useGroupedGlossaryTerms = (filters?: GlossaryFilters) => {
  const { data: terms } = useGlossaryTerms(filters);

  return useMemo(() => {
    const grouped = terms.reduce((acc, term) => {
      const firstLetter = term.term[0].toUpperCase();
      if (!acc[firstLetter]) {
        acc[firstLetter] = [];
      }
      acc[firstLetter].push(term);
      return acc;
    }, {} as Record<string, GlossaryTerm[]>);

    // Sort letters alphabetically
    return Object.keys(grouped)
      .sort()
      .reduce((acc, letter) => {
        acc[letter] = grouped[letter];
        return acc;
      }, {} as Record<string, GlossaryTerm[]>);
  }, [terms]);
};

// Fetch single glossary term
export const useGlossaryTerm = (slug: string) => {
  return useSuspenseQuery({
    queryKey: glossaryKeys.detail(slug),
    queryFn: async () => {
      const response = await api.get<{ data: GlossaryTerm }>(`/glossary/${slug}`);
      return response.data.data;
    },
  });
};

// Search glossary terms with autocomplete
export const useGlossarySearch = (query: string, enabled = true) => {
  return useSuspenseQuery({
    queryKey: glossaryKeys.search(query),
    queryFn: async () => {
      if (!query || query.length < 2) {
        return { terms: [], total: 0 };
      }
      const response = await api.get<{ data: GlossarySearchResult }>(
        `/glossary/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data;
    },
    enabled: enabled && query.length >= 2,
  });
};

// Fetch glossary categories
export const useGlossaryCategories = () => {
  return useSuspenseQuery({
    queryKey: glossaryKeys.categories(),
    queryFn: async () => {
      const response = await api.get<{ data: GlossaryCategory[] }>('/glossary/categories');
      return response.data.data;
    },
  });
};

// Fetch alphabet navigation data
export const useGlossaryAlphabet = () => {
  return useSuspenseQuery({
    queryKey: glossaryKeys.alphabet(),
    queryFn: async () => {
      const response = await api.get<{ data: GlossaryAlphabet[] }>('/glossary/alphabet');
      return response.data.data;
    },
  });
};

// Fetch popular terms
export const usePopularTerms = (limit = 10) => {
  return useSuspenseQuery({
    queryKey: [...glossaryKeys.popular(), limit],
    queryFn: async () => {
      const response = await api.get<{ data: PopularTerm[] }>(`/glossary/popular?limit=${limit}`);
      return response.data.data;
    },
  });
};

// Increment view count mutation
export const useIncrementTermView = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post(`/glossary/${slug}/view`);
    },
    onSuccess: () => {
      // Invalidate detail query to refetch with updated view count
      queryClient.invalidateQueries({ queryKey: glossaryKeys.detail(slug) });
      // Invalidate popular terms to reflect the change
      queryClient.invalidateQueries({ queryKey: glossaryKeys.popular() });
    },
  });
};
