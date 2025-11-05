import { QueryClient } from '@tanstack/react-query';
import type { DefaultOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import type { APIError } from './api';

const queryConfig: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: (failureCount, error) => {
      const axiosError = error as AxiosError<APIError>;

      // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
      if (axiosError.response?.status) {
        const status = axiosError.response.status;
        if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
          return false;
        }
      }

      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  },
  mutations: {
    retry: false,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

export default queryClient;
