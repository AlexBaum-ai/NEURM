/**
 * API functions for article revision history
 */

import { apiClient } from '@/lib/api';
import type {
  ArticleRevision,
  RevisionComparison,
  RevisionRestoreResponse,
} from '../types';

/**
 * Fetch all revisions for an article
 */
export async function getArticleRevisions(articleId: string): Promise<ArticleRevision[]> {
  const response = await apiClient.get<{ success: boolean; data: ArticleRevision[] }>(
    `/articles/${articleId}/revisions`
  );
  return response.data;
}

/**
 * Fetch a specific revision by ID
 */
export async function getRevisionById(
  articleId: string,
  revisionId: string
): Promise<ArticleRevision> {
  const response = await apiClient.get<{ success: boolean; data: ArticleRevision }>(
    `/articles/${articleId}/revisions/${revisionId}`
  );
  return response.data;
}

/**
 * Compare two revisions
 */
export async function compareRevisions(
  articleId: string,
  fromRevisionId: string,
  toRevisionId: string
): Promise<RevisionComparison> {
  const response = await apiClient.get<{ success: boolean; data: RevisionComparison }>(
    `/articles/${articleId}/revisions/compare/${fromRevisionId}/${toRevisionId}`
  );
  return response.data;
}

/**
 * Restore a specific revision
 */
export async function restoreRevision(
  articleId: string,
  revisionId: string
): Promise<RevisionRestoreResponse> {
  return await apiClient.post<RevisionRestoreResponse>(
    `/articles/${articleId}/revisions/${revisionId}/restore`
  );
}
