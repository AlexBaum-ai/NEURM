export interface WorkExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  location: string | null;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface Skill {
  id: string;
  skillName: string;
  skillType: string;
  proficiency: number;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  url: string | null;
  githubUrl: string | null;
  technologies: string[];
  startDate: string;
  endDate: string | null;
}

export interface JobPreferences {
  rolesInterested: string[];
  jobTypes: string[];
  workLocations: string[];
  preferredLocations: string[];
  openToRelocation: boolean;
  salaryExpectationMin: number | null;
  salaryExpectationMax: number | null;
  salaryCurrency: string | null;
  desiredStartDate: string | null;
  availability: string | null;
  companyPreferences: {
    companySize: string[];
    industries: string[];
    workCulture: string[];
    benefits: string[];
  } | null;
  visibleToRecruiters: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: 'user' | 'admin' | 'moderator';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  profile: {
    displayName: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    huggingfaceUrl: string | null;
    pronouns: string | null;
    availabilityStatus: 'not_looking' | 'open' | 'actively_looking';
    yearsExperience: number | null;
    resumeUrl: string | null;
    coverImageUrl: string | null;
  };
  workExperiences?: WorkExperience[];
  educations?: Education[];
  skills?: Skill[];
  portfolioProjects?: PortfolioProject[];
  jobPreferences?: JobPreferences;
  phone?: string | null;
}

export interface ProfileCompletenessResult {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: {
    field: string;
    label: string;
    importance: 'required' | 'recommended' | 'optional';
  }[];
}
