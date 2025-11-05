export type PromptCategory =
  | 'content_creation'
  | 'code_generation'
  | 'analysis'
  | 'education'
  | 'research'
  | 'creative_writing'
  | 'debugging'
  | 'optimization'
  | 'translation'
  | 'summarization'
  | 'other';

export type PromptUseCase =
  | 'chatbot'
  | 'code_assistant'
  | 'writing_assistant'
  | 'data_analysis'
  | 'tutoring'
  | 'creative_projects'
  | 'automation'
  | 'research'
  | 'other';

export interface PromptTemplate {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  userPrompt?: string;
  [key: string]: string | number | undefined;
}

export interface Prompt {
  id: string;
  userId: string;
  parentId: string | null;
  title: string;
  content: string;
  category: PromptCategory;
  useCase: PromptUseCase;
  model: string | null;
  templateJson: PromptTemplate | null;
  ratingAvg: number;
  ratingCount: number;
  voteScore: number;
  upvotes: number;
  downvotes: number;
  forkCount: number;
  viewCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  parentPrompt?: {
    id: string;
    title: string;
    author: {
      username: string;
      displayName: string;
    };
  };
  userRating?: number;
  userVote?: 'up' | 'down' | null;
}

export interface CreatePromptDto {
  title: string;
  content: string;
  category: PromptCategory;
  useCase: PromptUseCase;
  model?: string;
  templateJson?: PromptTemplate;
  isPublic?: boolean;
}

export interface UpdatePromptDto extends Partial<CreatePromptDto> {}

export interface PromptFilters {
  category?: PromptCategory;
  useCase?: PromptUseCase;
  model?: string;
  rating?: number;
  search?: string;
}

export interface PromptSortOptions {
  sortBy: 'top_rated' | 'most_voted' | 'newest' | 'most_forked' | 'most_viewed';
  order?: 'asc' | 'desc';
}

export interface PromptsQueryParams extends PromptFilters, PromptSortOptions {
  page?: number;
  limit?: number;
}

export interface PromptsResponse {
  prompts: Prompt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RatePromptDto {
  rating: number; // 1-5
}

export interface VotePromptDto {
  voteType: 'up' | 'down';
}

export const PROMPT_CATEGORIES: { value: PromptCategory; label: string }[] = [
  { value: 'content_creation', label: 'Content Creation' },
  { value: 'code_generation', label: 'Code Generation' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'education', label: 'Education' },
  { value: 'research', label: 'Research' },
  { value: 'creative_writing', label: 'Creative Writing' },
  { value: 'debugging', label: 'Debugging' },
  { value: 'optimization', label: 'Optimization' },
  { value: 'translation', label: 'Translation' },
  { value: 'summarization', label: 'Summarization' },
  { value: 'other', label: 'Other' },
];

export const PROMPT_USE_CASES: { value: PromptUseCase; label: string }[] = [
  { value: 'chatbot', label: 'Chatbot' },
  { value: 'code_assistant', label: 'Code Assistant' },
  { value: 'writing_assistant', label: 'Writing Assistant' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'tutoring', label: 'Tutoring' },
  { value: 'creative_projects', label: 'Creative Projects' },
  { value: 'automation', label: 'Automation' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' },
];

export const LLM_MODELS = [
  'gpt-4',
  'gpt-4-turbo',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'gemini-pro',
  'gemini-ultra',
  'llama-2-70b',
  'llama-2-13b',
  'mistral-large',
  'mistral-medium',
  'palm-2',
  'other',
];
