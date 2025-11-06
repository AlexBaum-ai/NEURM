/**
 * Candidate Search Types
 *
 * Type definitions for recruiter candidate search functionality
 */

import type { ExperienceLevel } from './index';

export interface CandidateSkill {
  id?: string; // Skill ID for endorsements
  name: string;
  level: number; // 1-5 stars
  yearsOfExperience?: number;
  endorsementCount?: number; // Number of endorsements
  hasEndorsed?: boolean; // Whether current user has endorsed this skill
}

export interface CandidateProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  headline?: string;
  bio?: string;
  location?: string;
  experienceLevel?: ExperienceLevel;
  reputation: number;
  skills: CandidateSkill[];
  topSkills: string[]; // Top 3-5 skills
  primaryLlms: string[];
  frameworks: string[];
  programmingLanguages: string[];
  yearsOfExperience?: number;
  openToWork: boolean;
  remoteOnly: boolean;
  privacySettings: {
    showEmail: boolean;
    showPhone: boolean;
    showResume: boolean;
    showGithub: boolean;
    showLinkedin: boolean;
  };
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  lastActive: string;
  createdAt: string;
}

export interface CandidateSearchResult extends CandidateProfile {
  matchScore?: number; // Match percentage (0-100)
  matchReasons?: string[];
}

export interface CandidateSearchFilters {
  query?: string; // Search query (name, skills, bio)
  skills?: string[]; // Required skills
  models?: string[]; // LLM models
  frameworks?: string[];
  languages?: string[];
  location?: string;
  remoteOnly?: boolean;
  experienceLevel?: ExperienceLevel[];
  minYearsExperience?: number;
  maxYearsExperience?: number;
  minReputation?: number;
  openToWorkOnly?: boolean;
  lastActiveWithin?: '7d' | '30d' | '90d' | 'any';
  sort?: 'relevance' | 'reputation' | 'experience' | 'recent';
  // Boolean operators for skills (AND, OR)
  skillsOperator?: 'AND' | 'OR';
}

export interface CandidateSearchResponse {
  candidates: CandidateSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: CandidateSearchFilters;
  resultCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedCandidate {
  id: string;
  candidateId: string;
  candidate: CandidateProfile;
  notes?: string;
  tags?: string[];
  savedAt: string;
}

export interface CandidateExportFormat {
  format: 'csv' | 'json';
  candidateIds: string[];
  fields?: string[]; // Optional: specific fields to export
}

export interface CandidateMessage {
  recipientId: string;
  subject: string;
  message: string;
}

export interface TrackViewRequest {
  candidateId: string;
  source: 'search' | 'profile' | 'list';
}

export interface Endorser {
  id: string;
  userId: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  headline: string | null;
  createdAt: string;
}

export interface EndorsementsListResponse {
  endorsements: Endorser[];
  total: number;
  limit: number;
  offset: number;
}
