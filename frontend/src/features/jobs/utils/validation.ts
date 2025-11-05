import { z } from 'zod';

// Skill schema
export const jobSkillSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required'),
  skillType: z.string().min(1, 'Skill type is required'),
  requiredLevel: z.number().min(1).max(5),
  isRequired: z.boolean()
});

// Screening question schema
export const screeningQuestionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters').max(500, 'Question must be less than 500 characters'),
  required: z.boolean()
});

// Step 1: Basic Info
export const basicInfoSchema = z.object({
  title: z.string()
    .min(10, 'Job title must be at least 10 characters')
    .max(100, 'Job title must be less than 100 characters'),
  description: z.string()
    .min(100, 'Job description must be at least 100 characters')
    .max(10000, 'Job description must be less than 10,000 characters'),
  employmentType: z.enum(['full_time', 'part_time', 'freelance', 'internship']),
  positionsAvailable: z.number()
    .min(1, 'At least 1 position required')
    .max(100, 'Maximum 100 positions')
});

// Step 2: Requirements
export const requirementsSchema = z.object({
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead', 'principal']),
  requirements: z.string()
    .min(50, 'Requirements must be at least 50 characters')
    .max(5000, 'Requirements must be less than 5,000 characters'),
  skills: z.array(jobSkillSchema)
    .min(1, 'At least one skill is required')
    .max(20, 'Maximum 20 skills allowed')
});

// Step 3: Tech Stack
export const techStackSchema = z.object({
  metadata: z.object({
    primaryLlms: z.array(z.string())
      .min(1, 'Select at least one LLM model')
      .max(10, 'Maximum 10 models allowed'),
    frameworks: z.array(z.string())
      .max(10, 'Maximum 10 frameworks allowed'),
    vectorDatabases: z.array(z.string())
      .max(5, 'Maximum 5 vector databases allowed'),
    infrastructure: z.array(z.string())
      .max(5, 'Maximum 5 infrastructure platforms allowed'),
    programmingLanguages: z.array(z.string())
      .min(1, 'Select at least one programming language')
      .max(10, 'Maximum 10 languages allowed'),
    useCaseType: z.string().optional(),
    modelStrategy: z.string().optional()
  })
});

// Step 4: Details
export const detailsSchema = z.object({
  location: z.string()
    .min(2, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  remoteType: z.enum(['remote', 'hybrid', 'on_site']),
  countryCode: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().min(3).max(3),
  salaryIsPublic: z.boolean(),
  hasVisaSponsorship: z.boolean(),
  applicationDeadline: z.string().optional(),
  benefits: z.string()
    .max(5000, 'Benefits must be less than 5,000 characters')
    .optional(),
  responsibilities: z.string()
    .max(5000, 'Responsibilities must be less than 5,000 characters')
    .optional(),
  screeningQuestions: z.array(screeningQuestionSchema)
    .max(5, 'Maximum 5 screening questions allowed')
}).refine(
  (data) => {
    // If both salaries are provided, max must be greater than min
    if (data.salaryMin && data.salaryMax) {
      return data.salaryMax > data.salaryMin;
    }
    return true;
  },
  {
    message: 'Maximum salary must be greater than minimum salary',
    path: ['salaryMax']
  }
).refine(
  (data) => {
    // If deadline is provided, it must be in the future
    if (data.applicationDeadline) {
      const deadline = new Date(data.applicationDeadline);
      return deadline > new Date();
    }
    return true;
  },
  {
    message: 'Application deadline must be in the future',
    path: ['applicationDeadline']
  }
);

// Complete form schema
export const jobFormSchema = z.object({
  // Step 1
  title: z.string().min(10).max(100),
  description: z.string().min(100).max(10000),
  employmentType: z.enum(['full_time', 'part_time', 'freelance', 'internship']),
  positionsAvailable: z.number().min(1).max(100),

  // Step 2
  experienceLevel: z.enum(['junior', 'mid', 'senior', 'lead', 'principal']),
  requirements: z.string().min(50).max(5000),
  skills: z.array(jobSkillSchema).min(1).max(20),

  // Step 3
  metadata: z.object({
    primaryLlms: z.array(z.string()).min(1).max(10),
    frameworks: z.array(z.string()).max(10),
    vectorDatabases: z.array(z.string()).max(5),
    infrastructure: z.array(z.string()).max(5),
    programmingLanguages: z.array(z.string()).min(1).max(10),
    useCaseType: z.string().optional(),
    modelStrategy: z.string().optional()
  }),

  // Step 4
  location: z.string().min(2).max(100),
  remoteType: z.enum(['remote', 'hybrid', 'on_site']),
  countryCode: z.string().optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryCurrency: z.string().min(3).max(3),
  salaryIsPublic: z.boolean(),
  hasVisaSponsorship: z.boolean(),
  applicationDeadline: z.string().optional(),
  benefits: z.string().max(5000).optional(),
  responsibilities: z.string().max(5000).optional(),
  screeningQuestions: z.array(screeningQuestionSchema).max(5),

  // Status
  status: z.enum(['draft', 'active', 'closed', 'filled'])
}).refine(
  (data) => {
    if (data.salaryMin && data.salaryMax) {
      return data.salaryMax > data.salaryMin;
    }
    return true;
  },
  {
    message: 'Maximum salary must be greater than minimum salary',
    path: ['salaryMax']
  }
);

export type JobFormValues = z.infer<typeof jobFormSchema>;
