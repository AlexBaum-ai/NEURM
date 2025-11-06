/**
 * Forum Category Types
 * Based on backend API schema from SPRINT-4-001
 */

export type CategoryVisibility = 'public' | 'private' | 'moderator_only';

export interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  level: number;
  displayOrder: number;
  guidelines: string | null;
  visibility: CategoryVisibility;
  isActive: boolean;
  topicCount: number;
  postCount: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  children?: ForumCategory[];
  parent?: ForumCategory | null;
  moderators?: CategoryModerator[];

  // UI-only fields
  isFollowing?: boolean;
  followerCount?: number;
  lastActivity?: LastActivity;
}

export interface CategoryModerator {
  userId: string;
  categoryId: string;
  assignedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface LastActivity {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  timestamp: string;
}

export interface CategoryTree {
  categories: ForumCategory[];
  count: number;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  visibility?: CategoryVisibility;
  guidelines?: string;
  displayOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string | null;
  visibility?: CategoryVisibility;
  guidelines?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface ReorderCategoryInput {
  categoryIds: string[];
}

export interface AssignModeratorInput {
  userId: string;
}

// API Response types
export interface CategoryResponse {
  success: boolean;
  data: {
    category: ForumCategory;
  };
}

export interface CategoryTreeResponse {
  success: boolean;
  data: {
    categories: ForumCategory[];
    count: number;
  };
}

export interface ModeratorsResponse {
  success: boolean;
  data: {
    moderators: CategoryModerator[];
  };
}

// ============================================================================
// TOPIC TYPES
// ============================================================================

export type TopicType = 'discussion' | 'question' | 'showcase' | 'tutorial' | 'announcement' | 'paper';
export type TopicStatus = 'open' | 'closed' | 'resolved' | 'archived';

export interface ForumTopic {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categoryId: string;
  authorId: string;
  type: TopicType;
  status: TopicStatus;
  isDraft: boolean;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  voteScore: number;
  hasCode: boolean;
  acceptedAnswerId: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;

  // Relations
  author: TopicAuthor;
  category: ForumCategory;
  tags: TopicTag[];
  attachments?: TopicAttachment[];
  poll?: TopicPoll;

  // User-specific fields (optional)
  userVote?: number; // -1, 0, 1
  isBookmarked?: boolean;
  isFollowing?: boolean;
}

export interface TopicAuthor {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  reputation?: number;
  reputationLevel?: string;
}

export interface TopicTag {
  id: string;
  name: string;
  slug: string;
  usageCount?: number;
}

export interface TopicAttachment {
  id: string;
  topicId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface TopicPoll {
  id: string;
  topicId: string;
  question: string;
  allowMultiple: boolean;
  isAnonymous: boolean;
  endsAt: string | null;
  totalVotes: number;
  userHasVoted: boolean;
  options: PollOption[];
  createdAt: string;
  updatedAt: string;
}

export interface PollOption {
  id: string;
  pollId: string;
  text: string;
  voteCount: number;
  displayOrder: number;
  userVoted?: boolean;
}

// Poll input types
export interface CreatePollInput {
  topicId: string;
  question: string;
  allowMultiple: boolean;
  isAnonymous: boolean;
  endsAt?: string;
  options: string[]; // Array of option texts
}

export interface VotePollInput {
  optionIds: string[]; // Array of option IDs to vote for
}

export interface PollResponse {
  success: boolean;
  data: {
    poll: TopicPoll;
  };
}

// Topic filter and query types
export interface TopicFilters {
  categoryId?: string;
  type?: TopicType;
  status?: TopicStatus;
  authorId?: string;
  tag?: string;
  search?: string;
  hasCode?: boolean;
  includeDrafts?: boolean;
}

export interface TopicPagination {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'replyCount' | 'voteScore';
  sortOrder?: 'asc' | 'desc';
}

export interface TopicListQuery extends TopicFilters, TopicPagination {}

// Topic input types
export interface CreateTopicInput {
  title: string;
  content: string;
  categoryId: string;
  type: TopicType;
  isDraft?: boolean;
  tags?: string[];
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  poll?: {
    question: string;
    allowMultiple: boolean;
    isAnonymous: boolean;
    endsAt?: string;
    options: string[];
  };
}

export interface UpdateTopicInput {
  title?: string;
  content?: string;
  categoryId?: string;
  type?: TopicType;
  isDraft?: boolean;
  tags?: string[];
}

// API Response types
export interface TopicResponse {
  success: boolean;
  data: {
    topic: ForumTopic;
  };
}

export interface TopicListResponse {
  success: boolean;
  data: {
    topics: ForumTopic[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

// ============================================================================
// REPLY TYPES
// ============================================================================

export interface ForumReply {
  id: string;
  topicId: string;
  authorId: string;
  parentReplyId: string | null;
  content: string;
  level: number;
  voteScore: number;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;

  // Relations
  author: TopicAuthor;
  children?: ForumReply[];
  quotedReply?: QuotedReply | null;

  // User-specific fields
  userVote?: number; // -1, 0, 1
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface QuotedReply {
  id: string;
  authorUsername: string;
  content: string;
  createdAt: string;
}

export interface CreateReplyInput {
  topicId: string;
  content: string;
  parentReplyId?: string | null;
  quotedReplyId?: string | null;
}

export interface UpdateReplyInput {
  content: string;
}

export interface ReplyTreeResponse {
  success: boolean;
  data: {
    replies: ForumReply[];
    totalCount: number;
  };
}

export interface ReplyResponse {
  success: boolean;
  data: {
    reply: ForumReply;
  };
}

export interface AcceptAnswerResponse {
  success: boolean;
  data: {
    topic: ForumTopic;
  };
}

export type ReplySortOption = 'oldest' | 'newest' | 'most_voted';

// ============================================================================
// VOTING TYPES
// ============================================================================

export type VoteType = 1 | -1 | 0; // 1 = upvote, -1 = downvote, 0 = no vote
export type VoteableType = 'topic' | 'reply';

export interface Vote {
  voteableType: VoteableType;
  voteableId: string;
  voteType: VoteType;
}

export interface VoteResponse {
  success: boolean;
  data: {
    voteScore: number;
    userVote: number;
  };
}

export interface UserVotesResponse {
  success: boolean;
  data: {
    votes: Vote[];
  };
}

export interface VotesMap {
  [key: string]: VoteType; // key format: "{type}:{id}"
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export type SearchResultType = 'topic' | 'reply';
export type SearchSortBy = 'relevance' | 'date' | 'votes' | 'popularity';

export interface SearchFilters {
  categoryId?: string;
  type?: TopicType;
  status?: TopicStatus;
  dateFrom?: string;
  dateTo?: string;
  hasCode?: boolean;
  minUpvotes?: number;
  tag?: string;
}

export interface SearchQuery extends SearchFilters {
  q: string;
  page?: number;
  limit?: number;
  sortBy?: SearchSortBy;
}

export interface SearchResultTopic extends ForumTopic {
  resultType: 'topic';
  highlightedTitle?: string;
  highlightedContent?: string;
  matchedTerms?: string[];
}

export interface SearchResultReply extends ForumReply {
  resultType: 'reply';
  topicTitle: string;
  topicSlug: string;
  highlightedContent?: string;
  matchedTerms?: string[];
}

export type SearchResult = SearchResultTopic | SearchResultReply;

export interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    query: string;
    filters: SearchFilters;
  };
}

export interface SearchSuggestion {
  id: string;
  title: string;
  type: TopicType;
  slug: string;
  categoryName: string;
}

export interface SearchSuggestionsResponse {
  success: boolean;
  data: {
    suggestions: SearchSuggestion[];
  };
}

export interface PopularSearch {
  query: string;
  count: number;
}

export interface PopularSearchesResponse {
  success: boolean;
  data: {
    searches: PopularSearch[];
  };
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface SavedSearchInput {
  name: string;
  query: string;
  filters?: SearchFilters;
}

export interface SavedSearchesResponse {
  success: boolean;
  data: {
    searches: SavedSearch[];
  };
}

export interface SearchHistoryItem {
  query: string;
  timestamp: string;
}

export interface SearchHistoryResponse {
  success: boolean;
  data: {
    history: SearchHistoryItem[];
  };
}

// Re-export reputation types
export * from './reputation';

// Re-export moderation types
export * from './moderation';

// Re-export report types
export * from './report';

// Re-export prompt types
export * from './prompt';

// Re-export leaderboard types
export * from './leaderboard';

// Re-export badge types
export * from './badge';
