import { z } from 'zod';
import { ConsentType, ConsentStatus, LegalDocumentType, DataDeletionStatus } from '@prisma/client';

/**
 * Validation schemas for GDPR compliance endpoints
 */

// Update consent preferences
export const updateConsentSchema = z.object({
  body: z.object({
    consents: z.array(
      z.object({
        consentType: z.nativeEnum(ConsentType),
        granted: z.boolean(),
      })
    ).min(1, 'At least one consent must be provided'),
  }),
});

export type UpdateConsentInput = z.infer<typeof updateConsentSchema>['body'];

// Get consent preferences (no input needed, uses authenticated user)
export const getConsentSchema = z.object({
  params: z.object({}),
});

// Request data export
export const requestDataExportSchema = z.object({
  body: z.object({
    format: z.enum(['json', 'csv']).optional().default('json'),
    includeContent: z.boolean().optional().default(true),
  }),
});

export type RequestDataExportInput = z.infer<typeof requestDataExportSchema>['body'];

// Request data deletion (right to be forgotten)
export const requestDataDeletionSchema = z.object({
  body: z.object({
    reason: z.string().min(10, 'Please provide a reason (minimum 10 characters)').max(1000).optional(),
    confirmEmail: z.string().email('Valid email is required'),
  }),
});

export type RequestDataDeletionInput = z.infer<typeof requestDataDeletionSchema>['body'];

// Email unsubscribe
export const emailUnsubscribeSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

export type EmailUnsubscribeInput = z.infer<typeof emailUnsubscribeSchema>['body'];

// Get email unsubscribe by token (query param)
export const getUnsubscribeByTokenSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

// Legal document queries
export const getLegalDocumentSchema = z.object({
  params: z.object({
    type: z.nativeEnum(LegalDocumentType),
  }),
  query: z.object({
    version: z.string().optional(),
  }),
});

export type GetLegalDocumentParams = z.infer<typeof getLegalDocumentSchema>['params'];
export type GetLegalDocumentQuery = z.infer<typeof getLegalDocumentSchema>['query'];

// DPO contact request
export const dpoContactRequestSchema = z.object({
  body: z.object({
    subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
    message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
    email: z.string().email('Valid email is required'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  }),
});

export type DPOContactRequestInput = z.infer<typeof dpoContactRequestSchema>['body'];

// Admin: Create/update legal document
export const createLegalDocumentSchema = z.object({
  body: z.object({
    documentType: z.nativeEnum(LegalDocumentType),
    version: z.string().min(1).max(50),
    title: z.string().min(5).max(255),
    content: z.string().min(100), // Legal documents should be substantial
    effectiveAt: z.string().datetime().or(z.date()),
    isActive: z.boolean().optional().default(false),
  }),
});

export type CreateLegalDocumentInput = z.infer<typeof createLegalDocumentSchema>['body'];

// Admin: Update data retention policy
export const updateRetentionPolicySchema = z.object({
  body: z.object({
    dataType: z.string().min(1).max(100),
    retentionDays: z.number().int().min(1).max(3650), // Max 10 years
    description: z.string().max(500).optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export type UpdateRetentionPolicyInput = z.infer<typeof updateRetentionPolicySchema>['body'];

// Admin: Process data deletion request
export const processDataDeletionSchema = z.object({
  params: z.object({
    requestId: z.string().uuid('Valid request ID is required'),
  }),
  body: z.object({
    status: z.nativeEnum(DataDeletionStatus),
    notes: z.string().max(1000).optional(),
  }),
});

export type ProcessDataDeletionParams = z.infer<typeof processDataDeletionSchema>['params'];
export type ProcessDataDeletionInput = z.infer<typeof processDataDeletionSchema>['body'];

// Admin: Update DPO contact
export const updateDPOContactSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(255),
    email: z.string().email(),
    phone: z.string().max(50).optional(),
    address: z.string().max(500).optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export type UpdateDPOContactInput = z.infer<typeof updateDPOContactSchema>['body'];
