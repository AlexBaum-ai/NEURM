import { z } from 'zod';

/**
 * Tech stack schema for company profiles
 */
const techStackSchema = z.object({
  modelsUsed: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  infrastructure: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
});

/**
 * Schema for updating company profile
 */
export const updateCompanyProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Company name must be at least 2 characters')
      .max(200, 'Company name must not exceed 200 characters')
      .optional(),

    description: z
      .string()
      .max(5000, 'Description must not exceed 5000 characters')
      .optional(),

    website: z
      .string()
      .url('Invalid website URL')
      .max(255, 'Website URL must not exceed 255 characters')
      .optional()
      .nullable(),

    logoUrl: z
      .string()
      .url('Invalid logo URL')
      .max(500, 'Logo URL must not exceed 500 characters')
      .optional()
      .nullable(),

    headerImageUrl: z
      .string()
      .url('Invalid header image URL')
      .max(500, 'Header image URL must not exceed 500 characters')
      .optional()
      .nullable(),

    industry: z
      .string()
      .max(100, 'Industry must not exceed 100 characters')
      .optional()
      .nullable(),

    companySize: z
      .enum([
        '1-10',
        '11-50',
        '51-200',
        '201-500',
        '501-1000',
        '1000+',
      ])
      .optional()
      .nullable(),

    location: z
      .string()
      .max(100, 'Location must not exceed 100 characters')
      .optional()
      .nullable(),

    locations: z
      .array(z.string().max(100, 'Location must not exceed 100 characters'))
      .max(10, 'Maximum 10 locations allowed')
      .optional(),

    foundedYear: z
      .number()
      .int('Founded year must be an integer')
      .min(1800, 'Founded year must be 1800 or later')
      .max(new Date().getFullYear(), 'Founded year cannot be in the future')
      .optional()
      .nullable(),

    mission: z
      .string()
      .max(2000, 'Mission statement must not exceed 2000 characters')
      .optional()
      .nullable(),

    benefits: z
      .array(z.string().max(200, 'Benefit must not exceed 200 characters'))
      .max(20, 'Maximum 20 benefits allowed')
      .optional(),

    cultureDescription: z
      .string()
      .max(3000, 'Culture description must not exceed 3000 characters')
      .optional()
      .nullable(),

    techStack: techStackSchema.optional().nullable(),

    linkedinUrl: z
      .string()
      .url('Invalid LinkedIn URL')
      .max(255, 'LinkedIn URL must not exceed 255 characters')
      .optional()
      .nullable(),

    twitterUrl: z
      .string()
      .url('Invalid Twitter URL')
      .max(255, 'Twitter URL must not exceed 255 characters')
      .optional()
      .nullable(),

    githubUrl: z
      .string()
      .url('Invalid GitHub URL')
      .max(255, 'GitHub URL must not exceed 255 characters')
      .optional()
      .nullable(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid company ID'),
  }),
});

/**
 * Schema for getting company profile
 */
export const getCompanyProfileSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Company ID or slug is required'),
  }),
});

/**
 * Schema for getting company jobs
 */
export const getCompanyJobsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Company ID is required'),
  }),
  query: z
    .object({
      includeDetails: z
        .enum(['true', 'false'])
        .optional()
        .transform((val) => val === 'true'),
    })
    .optional(),
});

/**
 * Schema for following/unfollowing company
 */
export const followCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid company ID'),
  }),
});

/**
 * Schema for creating company
 */
export const createCompanySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Company name must be at least 2 characters')
      .max(200, 'Company name must not exceed 200 characters'),

    website: z
      .string()
      .url('Invalid website URL')
      .max(255, 'Website URL must not exceed 255 characters')
      .optional(),

    description: z
      .string()
      .max(5000, 'Description must not exceed 5000 characters')
      .optional(),

    industry: z
      .string()
      .max(100, 'Industry must not exceed 100 characters')
      .optional(),

    companySize: z
      .enum([
        '1-10',
        '11-50',
        '51-200',
        '201-500',
        '501-1000',
        '1000+',
      ])
      .optional(),

    location: z
      .string()
      .max(100, 'Location must not exceed 100 characters')
      .optional(),
  }),
});

/**
 * Schema for listing companies
 */
export const listCompaniesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, 'Page must be a positive number'),

    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),

    search: z.string().optional(),

    industry: z.string().max(100).optional(),

    companySize: z
      .enum([
        '1-10',
        '11-50',
        '51-200',
        '201-500',
        '501-1000',
        '1000+',
      ])
      .optional(),

    verified: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  }),
});

export type UpdateCompanyProfileInput = z.infer<typeof updateCompanyProfileSchema>;
export type GetCompanyProfileInput = z.infer<typeof getCompanyProfileSchema>;
export type GetCompanyJobsInput = z.infer<typeof getCompanyJobsSchema>;
export type FollowCompanyInput = z.infer<typeof followCompanySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type ListCompaniesInput = z.infer<typeof listCompaniesSchema>;
