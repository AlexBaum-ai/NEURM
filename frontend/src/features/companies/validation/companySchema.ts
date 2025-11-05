/**
 * Company Validation Schema
 *
 * Zod schemas for validating company form data
 */

import { z } from 'zod';

const urlSchema = z.string().url('Invalid URL format').optional().or(z.literal(''));

const techStackSchema = z
  .object({
    modelsUsed: z.array(z.string()).optional(),
    frameworks: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    infrastructure: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
  })
  .optional();

export const companySettingsSchema = z.object({
  name: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(200, 'Company name must be less than 200 characters'),
  website: urlSchema,
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
  logoUrl: urlSchema,
  headerImageUrl: urlSchema,
  industry: z.string().max(100).optional().or(z.literal('')),
  companySize: z
    .enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'])
    .optional()
    .or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  locations: z
    .array(z.string().max(100))
    .max(10, 'Maximum 10 locations allowed')
    .optional(),
  foundedYear: z
    .number()
    .int()
    .min(1800, 'Year must be after 1800')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .optional()
    .or(z.literal(null)),
  mission: z.string().max(1000).optional().or(z.literal('')),
  benefits: z
    .array(z.string().max(200))
    .max(20, 'Maximum 20 benefits allowed')
    .optional(),
  cultureDescription: z.string().max(5000).optional().or(z.literal('')),
  techStack: techStackSchema,
  linkedinUrl: urlSchema,
  twitterUrl: urlSchema,
  githubUrl: urlSchema,
});

export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>;

// File validation
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG, PNG, and WebP images are allowed',
    };
  }

  return { valid: true };
};

export const validateLogoFile = (file: File): { valid: boolean; error?: string } => {
  const baseValidation = validateImageFile(file);
  if (!baseValidation.valid) return baseValidation;

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Logo must be less than 2MB',
    };
  }

  return { valid: true };
};

export const validateHeaderFile = (file: File): { valid: boolean; error?: string } => {
  const baseValidation = validateImageFile(file);
  if (!baseValidation.valid) return baseValidation;

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Header image must be less than 5MB',
    };
  }

  return { valid: true };
};
