import { z } from 'zod';

// Topic types enum
export const topicTypes = [
  'discussion',
  'question',
  'showcase',
  'tutorial',
  'announcement',
  'paper',
] as const;

// Attachment validation schema
const attachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/i, 'Only images allowed'),
  fileSize: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  width: z.number().optional(),
  height: z.number().optional(),
  url: z.string().url(),
  storageKey: z.string(),
});

// Poll option schema
const pollOptionSchema = z.object({
  text: z.string().min(1).max(200),
  votes: z.number().default(0),
});

// Poll creation schema
const pollCreationSchema = z.object({
  question: z.string().min(5, 'Poll question must be at least 5 characters').max(255),
  options: z
    .array(pollOptionSchema)
    .min(2, 'Poll must have at least 2 options')
    .max(10, 'Poll can have at most 10 options'),
  multipleChoice: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
});

// Create topic validation schema
export const createTopicSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be less than 255 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  categoryId: z.string().uuid('Invalid category ID'),
  type: z.enum(topicTypes, {
    errorMap: () => ({ message: 'Invalid topic type' }),
  }),
  isDraft: z.boolean().default(false),
  tags: z
    .array(z.string().min(1).max(50))
    .max(5, 'Maximum 5 tags allowed')
    .optional()
    .default([]),
  attachments: z
    .array(attachmentSchema)
    .max(5, 'Maximum 5 attachments allowed')
    .optional()
    .default([]),
  poll: pollCreationSchema.optional(),
});

export type CreateTopicInput = z.infer<typeof createTopicSchema>;

// Update topic validation schema
export const updateTopicSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be less than 255 characters')
    .optional(),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters')
    .optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  type: z.enum(topicTypes).optional(),
  isDraft: z.boolean().optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(5, 'Maximum 5 tags allowed')
    .optional(),
});

export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

// List topics query parameters validation
export const listTopicsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  type: z.enum(topicTypes).optional(),
  status: z.enum(['open', 'closed', 'resolved', 'archived']).optional(),
  authorId: z.string().uuid().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'viewCount', 'replyCount', 'voteScore'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeDrafts: z.coerce.boolean().default(false),
});

export type ListTopicsQuery = z.infer<typeof listTopicsQuerySchema>;

// Pin topic validation
export const pinTopicSchema = z.object({
  isPinned: z.boolean(),
});

// Lock topic validation
export const lockTopicSchema = z.object({
  isLocked: z.boolean(),
});

// Topic ID param validation
export const topicIdParamSchema = z.object({
  id: z.string().uuid('Invalid topic ID'),
});

// Unanswered questions query parameters validation
export const unansweredQuestionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  tag: z.string().optional(),
  dateFrom: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z.string().datetime().optional().transform((val) => (val ? new Date(val) : undefined)),
  sortBy: z
    .enum(['createdAt', 'viewCount', 'voteScore'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type UnansweredQuestionsQuery = z.infer<typeof unansweredQuestionsQuerySchema>;
