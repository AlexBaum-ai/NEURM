/**
 * GDPR Hooks
 * React Query hooks for GDPR and legal document operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLegalDocument,
  getLegalDocumentVersions,
  getUserConsents,
  updateUserConsents,
  getConsentHistory,
} from '@/api/gdpr.api';
import type {
  LegalDocumentType,
  UpdateConsentRequest,
} from '@/types/gdpr';

/**
 * Hook to fetch a legal document
 */
export const useLegalDocument = (type: LegalDocumentType) => {
  return useQuery({
    queryKey: ['legal-document', type],
    queryFn: () => getLegalDocument(type),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

/**
 * Hook to fetch legal document versions
 */
export const useLegalDocumentVersions = (type: LegalDocumentType) => {
  return useQuery({
    queryKey: ['legal-document-versions', type],
    queryFn: () => getLegalDocumentVersions(type),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

/**
 * Hook to fetch user's consent preferences
 */
export const useUserConsents = () => {
  return useQuery({
    queryKey: ['user-consents'],
    queryFn: getUserConsents,
    // Don't fetch if not authenticated
    retry: false,
  });
};

/**
 * Hook to fetch user's consent history
 */
export const useConsentHistory = () => {
  return useQuery({
    queryKey: ['consent-history'],
    queryFn: getConsentHistory,
    retry: false,
  });
};

/**
 * Hook to update user's consent preferences
 */
export const useUpdateConsents = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateConsentRequest) => updateUserConsents(data),
    onSuccess: () => {
      // Invalidate consent queries to refetch
      queryClient.invalidateQueries({ queryKey: ['user-consents'] });
      queryClient.invalidateQueries({ queryKey: ['consent-history'] });
    },
  });
};
