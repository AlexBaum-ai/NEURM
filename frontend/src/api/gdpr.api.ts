/**
 * GDPR API Client
 * Handles all GDPR and legal document API requests
 */

import { apiClient } from '@/lib/api';
import type {
  LegalDocument,
  LegalDocumentVersion,
  UserConsent,
  ConsentHistoryEntry,
  UpdateConsentRequest,
  LegalDocumentType,
} from '@/types/gdpr';

/**
 * Get a legal document by type
 */
export const getLegalDocument = async (
  type: LegalDocumentType
): Promise<LegalDocument> => {
  return apiClient.get<LegalDocument>(`/gdpr/legal/${type}`);
};

/**
 * Get all versions of a legal document
 */
export const getLegalDocumentVersions = async (
  type: LegalDocumentType
): Promise<LegalDocumentVersion[]> => {
  return apiClient.get<LegalDocumentVersion[]>(`/gdpr/legal/${type}/versions`);
};

/**
 * Get user's current consent preferences
 */
export const getUserConsents = async (): Promise<UserConsent[]> => {
  return apiClient.get<UserConsent[]>('/gdpr/consent');
};

/**
 * Update user's consent preferences
 */
export const updateUserConsents = async (
  data: UpdateConsentRequest
): Promise<UserConsent[]> => {
  return apiClient.post<UserConsent[]>('/gdpr/consent', data);
};

/**
 * Get user's consent history
 */
export const getConsentHistory = async (): Promise<ConsentHistoryEntry[]> => {
  return apiClient.get<ConsentHistoryEntry[]>('/gdpr/consent/history');
};
