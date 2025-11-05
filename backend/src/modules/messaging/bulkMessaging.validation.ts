import { z } from 'zod';

/**
 * Validation schemas for bulk messaging endpoints
 */

// ============================================================================
// MESSAGE TEMPLATE SCHEMAS
// ============================================================================

export const createMessageTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().max(255).optional(),
  body: z.string().min(10),
  isDefault: z.boolean().optional().default(false),
});

export const updateMessageTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subject: z.string().max(255).optional(),
  body: z.string().min(10).optional(),
  isDefault: z.boolean().optional(),
});

export const getTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

// ============================================================================
// BULK MESSAGE SCHEMAS
// ============================================================================

export const sendBulkMessageSchema = z.object({
  templateId: z.string().uuid().optional(),
  subject: z.string().max(255).optional(),
  body: z.string().min(10),
  recipientIds: z.array(z.string().uuid()).min(1).max(50), // Max 50 recipients per request
  personalizeContent: z.boolean().optional().default(true),
});

export const getBulkMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['sent', 'delivered', 'failed', 'pending']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const getBulkMessageRecipientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['sent', 'delivered', 'read', 'replied', 'failed']).optional(),
});

// ============================================================================
// COMPANY BLOCK SCHEMAS
// ============================================================================

export const blockCompanySchema = z.object({
  reason: z.string().max(500).optional(),
});

export const getBlockedCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================================================
// TEMPLATE VARIABLES SCHEMA
// ============================================================================

export const templateVariablesSchema = z.object({
  candidate_name: z.string().optional(),
  candidate_username: z.string().optional(),
  candidate_skills: z.string().optional(),
  candidate_experience: z.string().optional(),
  candidate_location: z.string().optional(),
  job_title: z.string().optional(),
  company_name: z.string().optional(),
});

// ============================================================================
// UUID PARAM SCHEMA
// ============================================================================

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type CreateMessageTemplateInput = z.infer<typeof createMessageTemplateSchema>;
export type UpdateMessageTemplateInput = z.infer<typeof updateMessageTemplateSchema>;
export type GetTemplatesQuery = z.infer<typeof getTemplatesQuerySchema>;
export type SendBulkMessageInput = z.infer<typeof sendBulkMessageSchema>;
export type GetBulkMessagesQuery = z.infer<typeof getBulkMessagesQuerySchema>;
export type GetBulkMessageRecipientsQuery = z.infer<typeof getBulkMessageRecipientsQuerySchema>;
export type BlockCompanyInput = z.infer<typeof blockCompanySchema>;
export type GetBlockedCompaniesQuery = z.infer<typeof getBlockedCompaniesQuerySchema>;
export type TemplateVariables = z.infer<typeof templateVariablesSchema>;
