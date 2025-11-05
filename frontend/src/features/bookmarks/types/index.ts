import type { Article } from '@/features/news/types';

export interface BookmarkCollection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isDefault: boolean;
  bookmarkCount: number;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  article: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    featuredImageUrl?: string;
    readingTimeMinutes: number;
    publishedAt: string;
    author: {
      username: string;
      profile: {
        avatarUrl?: string;
        displayName?: string;
      };
    };
    category: {
      slug: string;
      name: string;
    };
  };
  collection: {
    id: string;
    name: string;
  };
  notes?: string;
  createdAt: string;
}

export interface BookmarksResponse {
  success: boolean;
  data: {
    bookmarks: Bookmark[];
  };
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CollectionsResponse {
  success: boolean;
  data: {
    collections: BookmarkCollection[];
  };
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  isPublic: boolean;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateBookmarkInput {
  collectionId?: string;
  notes?: string;
}
