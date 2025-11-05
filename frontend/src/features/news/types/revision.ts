/**
 * Revision types for article version history
 */

export interface ArticleRevision {
  id: string;
  articleId: string;
  revisionNumber: number;
  title: string;
  content: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  createdBy: {
    id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
}

export interface RevisionComparison {
  from: ArticleRevision;
  to: ArticleRevision;
  changes: {
    title: DiffResult[];
    content: DiffResult[];
    summary: DiffResult[];
  };
}

export interface DiffResult {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber?: number;
}

export interface RevisionRestoreResponse {
  success: boolean;
  message: string;
  revision: ArticleRevision;
}
