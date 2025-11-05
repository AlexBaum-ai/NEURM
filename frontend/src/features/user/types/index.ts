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
