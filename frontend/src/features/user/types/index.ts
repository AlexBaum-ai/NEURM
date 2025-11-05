import { z } from 'zod';

// User Profile Types
export interface UserProfile {
  id: string;
  username: string;
  email?: string; // Only visible to owner
  displayName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  coverImage?: string;
  role: 'user' | 'admin' | 'moderator' | 'recruiter';
  emailVerified: boolean;
  createdAt: string;

  // Social links
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    huggingface?: string;
  };

  // Stats
  stats: {
    reputation: number;
    badgeCount: number;
    contributionsCount: number;
    followersCount: number;
    followingCount: number;
  };

  // Profile sections
  skills: UserSkill[];
  workExperience: WorkExperience[];
  education: Education[];
  portfolio: PortfolioProject[];

  // Candidate-specific sections (Jobs Module)
  llmExperience?: LLMExperience;
  jobPreferences?: JobPreferences;
  communityStats?: CommunityStats;

  // Privacy
  privacy?: ProfilePrivacySettings;

  // Owner-only fields
  isOwner?: boolean;
  canEdit?: boolean;
}

export interface UserSkill {
  id: string;
  name: string;
  category: string;
  proficiency: number; // 1-5
  endorsementCount?: number;
  createdAt: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';
  startDate: string;
  endDate?: string; // null if current
  description?: string;
  techStack?: string[];
  displayOrder: number;
  isCurrent?: boolean;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  description?: string;
  displayOrder: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  projectUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  thumbnailUrl?: string;
  screenshots?: string[];
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ProfilePrivacySettings {
  bio: VisibilityLevel;
  workExperience: VisibilityLevel;
  education: VisibilityLevel;
  portfolio: VisibilityLevel;
  skills: VisibilityLevel;
  contact: VisibilityLevel;
}

export type VisibilityLevel = 'public' | 'community' | 'recruiters' | 'private';

// Badge types
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  earnedAt: string;
}

// API response types
export interface ProfileResponse {
  data: UserProfile;
}

export interface ProfileUpdatePayload {
  displayName?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

// Validation schemas
export const profileUpdateSchema = z.object({
  displayName: z.string().max(100).optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  socialLinks: z.object({
    twitter: z.string().url().optional().or(z.literal('')),
    linkedin: z.string().url().optional().or(z.literal('')),
    github: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.string().min(1).max(50),
  proficiency: z.number().min(1).max(5),
});

export const workExperienceSchema = z.object({
  title: z.string().min(1).max(100),
  company: z.string().min(1).max(100),
  location: z.string().max(100).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship']),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string().max(2000).optional(),
  techStack: z.array(z.string()).optional(),
  isCurrent: z.boolean().optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(1).max(100),
  degree: z.string().min(1).max(100),
  fieldOfStudy: z.string().min(1).max(100),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string().max(1000).optional(),
});

export const portfolioProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  techStack: z.array(z.string()).min(1),
  projectUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  demoUrl: z.string().url().optional().or(z.literal('')),
  isFeatured: z.boolean().optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type SkillFormData = z.infer<typeof skillSchema>;
export type WorkExperienceFormData = z.infer<typeof workExperienceSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type PortfolioProjectFormData = z.infer<typeof portfolioProjectSchema>;

// ============================================================================
// Candidate Profile Types (Jobs Module - SPRINT-7-007)
// ============================================================================

/**
 * LLM Experience - Candidate's experience with LLM technologies
 */
export interface LLMExperience {
  id: string;
  // Models worked with
  models: LLMModel[];
  // LLM-specific frameworks
  frameworks: string[]; // e.g., LangChain, LlamaIndex, Haystack, Semantic Kernel
  // Vector databases
  vectorDatabases: string[]; // e.g., Pinecone, Weaviate, Chroma, FAISS
  // Cloud platforms
  cloudPlatforms: string[]; // e.g., AWS Bedrock, Azure OpenAI, Google Vertex AI
  // Programming languages for LLM work
  programmingLanguages: string[]; // e.g., Python, TypeScript, Java, Go
  // Use case types
  useCaseTypes: string[]; // e.g., Chatbots, RAG, Agents, Fine-tuning
}

export interface LLMModel {
  name: string; // e.g., GPT-4, Claude, Llama 2
  provider: string; // e.g., OpenAI, Anthropic, Meta
  proficiency: number; // 1-5 stars
  category?: string; // e.g., Chat, Embedding, Code Generation
}

/**
 * Community Stats - User's community contributions and achievements
 */
export interface CommunityStats {
  // Forum activity
  forumReputation: number;
  topAnswersCount: number;
  helpfulAnswersCount: number;
  questionsAskedCount: number;
  answersGivenCount: number;

  // Badges and achievements
  badges: Badge[];

  // Content contributions
  tutorialsPublished: number;
  articlesPublished: number;

  // Engagement
  upvotesReceived: number;
  bestAnswersCount: number;
}

/**
 * Job Preferences - Candidate's job search preferences
 */
export interface JobPreferences {
  id: string;

  // Looking for work
  isLookingForWork: boolean;
  availabilityStatus: AvailabilityStatus;
  availableFrom?: string; // ISO date

  // Role preferences
  rolesInterestedIn: string[]; // e.g., ML Engineer, LLM Researcher, AI Product Manager
  experienceLevel: ExperienceLevel[];
  employmentTypes: EmploymentType[];

  // Location preferences
  preferredLocations: string[]; // City, Country
  remotePreference: RemotePreference;
  willingToRelocate: boolean;
  requiresVisaSponsorship: boolean;

  // Compensation
  salaryExpectation?: SalaryExpectation;

  // Company preferences
  companySize?: CompanySize[];
  companyType?: CompanyType[];
  industryPreferences?: string[];

  // Visibility
  visibleToRecruiters: boolean;

  // Updated timestamp
  updatedAt: string;
}

export type AvailabilityStatus =
  | 'available_immediately'
  | 'available_2_weeks'
  | 'available_1_month'
  | 'available_3_months'
  | 'open_to_offers'
  | 'not_looking';

export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'freelance' | 'internship';

export type RemotePreference = 'remote_only' | 'hybrid' | 'onsite' | 'flexible';

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

export type CompanyType = 'startup' | 'scaleup' | 'enterprise' | 'agency' | 'research';

export interface SalaryExpectation {
  min: number;
  max: number;
  currency: string; // ISO 4217 currency code (e.g., USD, EUR, GBP)
  period: 'annual' | 'monthly' | 'hourly';
}

// ============================================================================
// Validation Schemas (Jobs Module)
// ============================================================================

export const llmModelSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(100),
  proficiency: z.number().min(1).max(5),
  category: z.string().max(100).optional(),
});

export const llmExperienceSchema = z.object({
  models: z.array(llmModelSchema).min(0).max(20),
  frameworks: z.array(z.string()).max(20),
  vectorDatabases: z.array(z.string()).max(20),
  cloudPlatforms: z.array(z.string()).max(20),
  programmingLanguages: z.array(z.string()).min(0).max(20),
  useCaseTypes: z.array(z.string()).max(20),
});

export const salaryExpectationSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  currency: z.string().length(3),
  period: z.enum(['annual', 'monthly', 'hourly']),
}).refine(data => data.max >= data.min, {
  message: 'Maximum salary must be greater than or equal to minimum',
});

export const jobPreferencesSchema = z.object({
  isLookingForWork: z.boolean(),
  availabilityStatus: z.enum([
    'available_immediately',
    'available_2_weeks',
    'available_1_month',
    'available_3_months',
    'open_to_offers',
    'not_looking',
  ]),
  availableFrom: z.string().optional(),
  rolesInterestedIn: z.array(z.string()).min(0).max(10),
  experienceLevel: z.array(z.enum(['junior', 'mid', 'senior', 'lead', 'principal'])),
  employmentTypes: z.array(z.enum(['full_time', 'part_time', 'contract', 'freelance', 'internship'])),
  preferredLocations: z.array(z.string()).max(10),
  remotePreference: z.enum(['remote_only', 'hybrid', 'onsite', 'flexible']),
  willingToRelocate: z.boolean(),
  requiresVisaSponsorship: z.boolean(),
  salaryExpectation: salaryExpectationSchema.optional(),
  companySize: z.array(z.enum(['startup', 'small', 'medium', 'large', 'enterprise'])).optional(),
  companyType: z.array(z.enum(['startup', 'scaleup', 'enterprise', 'agency', 'research'])).optional(),
  industryPreferences: z.array(z.string()).max(10).optional(),
  visibleToRecruiters: z.boolean(),
});

export type LLMExperienceFormData = z.infer<typeof llmExperienceSchema>;
export type JobPreferencesFormData = z.infer<typeof jobPreferencesSchema>;
