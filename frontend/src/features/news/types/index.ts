export interface Author {
  id: string;
  username: string;
  profile: {
    avatarUrl?: string;
    bio?: string;
    displayName?: string;
  };
}

export interface Category {
  slug: string;
  name: string;
  description?: string;
}

export interface Tag {
  slug: string;
  name: string;
  description?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  featuredImageUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  readingTimeMinutes: number;
  viewCount: number;
  bookmarkCount: number;
  publishedAt: string;
  author: Author;
  category: Category;
  tags: Tag[];
  isBookmarked: boolean;
}

export interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  featuredImageUrl?: string;
  readingTimeMinutes: number;
  publishedAt: string;
  author: {
    username: string;
    profile: {
      avatarUrl?: string;
    };
  };
  category: {
    slug: string;
    name: string;
  };
}

export interface ArticleDetailResponse {
  success: boolean;
  data: {
    article: Article;
    relatedArticles: RelatedArticle[];
  };
}

export interface TableOfContentsItem {
  id: string;
  text: string;
  level: number;
}

// Category with hierarchy support
export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  level: number;
  articleCount: number;
  children?: CategoryNode[];
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    categories: CategoryNode[];
  };
}

// Tag with usage count
export interface TagOption {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

export interface TagsResponse {
  success: boolean;
  data: {
    tags: TagOption[];
  };
}

// Filter types
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface NewsFilters {
  search?: string;
  categorySlug?: string;
  tags?: string[];
  difficulty?: DifficultyLevel;
  modelSlug?: string;
}

// Model option for filter
export interface ModelOption {
  id: string;
  name: string;
  slug: string;
}

// Article list item for homepage
export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  featuredImageUrl?: string;
  difficulty: DifficultyLevel;
  readingTimeMinutes: number;
  viewCount: number;
  bookmarkCount: number;
  publishedAt: string;
  author: {
    id: string;
    username: string;
    profile: {
      avatarUrl?: string;
      displayName?: string;
    };
  };
  category: Category;
  tags: Tag[];
  isBookmarked: boolean;
}

// Paginated articles response
export interface ArticlesResponse {
  success: boolean;
  data: ArticleListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// View mode for article grid
export type ViewMode = 'grid' | 'list';

// Sort options - aligned with backend API
export type SortOption =
  | 'publishedAt-desc'
  | 'publishedAt-asc'
  | 'viewCount-desc'
  | 'bookmarkCount-desc'
  | 'createdAt-desc'
  | 'createdAt-asc'
  | 'relevance';

// Backend sort parameters
export interface SortParams {
  sortBy: 'publishedAt' | 'viewCount' | 'bookmarkCount' | 'createdAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}
