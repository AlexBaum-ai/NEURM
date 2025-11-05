import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newsApi } from '../api/newsApi';
import type { ArticleDetailResponse } from '../types';

export const useArticleDetail = (slug: string) => {
  return useSuspenseQuery<ArticleDetailResponse>({
    queryKey: ['article', slug],
    queryFn: () => newsApi.getArticleBySlug(slug),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBookmarkArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ articleId, isBookmarked }: { articleId: string; isBookmarked: boolean }) => {
      return isBookmarked
        ? newsApi.unbookmarkArticle(articleId)
        : newsApi.bookmarkArticle(articleId);
    },
    onMutate: async ({ isBookmarked }) => {
      // Optimistic update
      const queryKey = ['article'];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueriesData({ queryKey });

      queryClient.setQueriesData({ queryKey }, (old: ArticleDetailResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            article: {
              ...old.data.article,
              isBookmarked: !isBookmarked,
              bookmarkCount: old.data.article.bookmarkCount + (isBookmarked ? -1 : 1),
            },
          },
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Revert optimistic update
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['article'] });
    },
  });
};
