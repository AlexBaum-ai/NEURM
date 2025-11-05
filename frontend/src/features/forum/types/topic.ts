/**
 * Topic Types and Schemas
 * Frontend types for forum topics based on backend API
 */

import { z } from 'zod';

// Topic types enum (6 types as per backend)
export const topicTypes = [
  'discussion',
  'question',
  'showcase',
  'tutorial',
  'announcement',
  'paper',
] as const;

export type TopicType = (typeof topicTypes)[number];

// Topic type metadata for UI
export const topicTypeMetadata: Record<
  TopicType,
  { label: string; description: string; icon: string }
> = {
  discussion: {
    label: 'Discussion',
    description: 'General discussion on any LLM topic',
    icon: '💬',
  },
  question: {
    label: 'Question',
    description: 'Ask for help or clarification',
    icon: '❓',
  },
  showcase: {
    label: 'Showcase',
    description: 'Show off your project or implementation',
    icon: '🎨',
  },
  tutorial: {
    label: 'Tutorial',
    description: 'Share a guide or how-to',
    icon: '📚',
  },
  announcement: {
    label: 'Announcement',
    description: 'Important news or updates',
    icon: '📢',
  },
  paper: {
    label: 'Paper',
    description: 'Discuss a research paper',
    icon: '📄',
  },
};

// Topic status
export type TopicStatus = 'open' | 'closed' | 'resolved' | 'archived';

// Attachment schema (matches backend)
export const attachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/i, 'Only images allowed'),
  fileSize: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  width: z.number().optional(),
  height: z.number().optional(),
  url: z.string().url(),
  storageKey: z.string(),
});

export type Attachment = z.infer<typeof attachmentSchema>;

// Poll option schema
export const pollOptionSchema = z.object({
  text: z.string().min(1, 'Option text is required').max(200, 'Option must be less than 200 characters'),
  votes: z.number().default(0),
});

export type PollOption = z.infer<typeof pollOptionSchema>;

// Poll schema
export const pollSchema = z.object({
  question: z
    .string()
    .min(5, 'Poll question must be at least 5 characters')
    .max(255, 'Poll question must be less than 255 characters'),
  options: z
    .array(pollOptionSchema)
    .min(2, 'Poll must have at least 2 options')
    .max(10, 'Poll can have at most 10 options'),
  multipleChoice: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

export type Poll = z.infer<typeof pollSchema>;

// Create topic form schema (client-side validation)
export const createTopicFormSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  type: z.enum(topicTypes, {
    errorMap: () => ({ message: 'Please select a topic type' }),
  }),
  isDraft: z.boolean().default(false),
  tags: z
    .array(z.string().min(1).max(50))
    .max(5, 'Maximum 5 tags allowed')
    .default([]),
  attachments: z
    .array(attachmentSchema)
    .max(5, 'Maximum 5 attachments allowed')
    .default([]),
  poll: pollSchema.optional(),
});

export type CreateTopicFormData = z.infer<typeof createTopicFormSchema>;

// Topic entity (from API response)
export interface Topic {
  id: string;
  title: string;
  content: string;
  contentHtml: string;
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
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  author?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: TopicTag[];
  attachments?: Attachment[];
  poll?: TopicPoll | null;
}

export interface TopicTag {
  id: string;
  name: string;
  slug: string;
  usageCount: number;
}

export interface TopicPoll {
  id: string;
  topicId: string;
  question: string;
  multipleChoice: boolean;
  expiresAt: string | null;
  createdAt: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted?: boolean;
  userVotes?: string[];
}

// API Response types
export interface TopicResponse {
  success: boolean;
  data: {
    topic: Topic;
  };
}

export interface TopicsListResponse {
  success: boolean;
  data: {
    topics: Topic[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Draft storage (localStorage)
export interface TopicDraft {
  title: string;
  content: string;
  categoryId: string;
  type: TopicType;
  tags: string[];
  attachments: Attachment[];
  poll?: Poll;
  savedAt: string;
}
