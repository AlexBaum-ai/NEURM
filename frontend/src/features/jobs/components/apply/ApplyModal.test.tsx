import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ApplyModal from './ApplyModal';
import type { JobDetail } from '../../types';

// Mock the hooks
vi.mock('@/features/profile/hooks/useProfile', () => ({
  useProfile: vi.fn(),
  useProfileCompleteness: vi.fn(),
}));

vi.mock('../../hooks/useJobs', () => ({
  useApplyJob: vi.fn(),
}));

const mockJob: JobDetail = {
  id: '1',
  title: 'Senior LLM Engineer',
  slug: 'senior-llm-engineer',
  company: {
    id: '1',
    companyName: 'AI Corp',
    slug: 'ai-corp',
    logoUrl: null,
    location: 'San Francisco, CA',
  },
  locationType: 'remote',
  location: 'San Francisco, CA',
  experienceLevel: 'senior',
  employmentType: 'full_time',
  salaryMin: 150000,
  salaryMax: 200000,
  salaryCurrency: 'USD',
  salaryIsPublic: true,
  primaryLlms: ['GPT-4', 'Claude'],
  frameworks: ['LangChain', 'LlamaIndex'],
  hasVisaSponsorship: false,
  isFeatured: false,
  applicationCount: 10,
  viewCount: 100,
  publishedAt: '2025-01-01T00:00:00Z',
  description: 'Test description',
  requirements: 'Test requirements',
  responsibilities: 'Test responsibilities',
  benefits: 'Test benefits',
  positionsAvailable: 1,
  applicationDeadline: null,
  vectorDatabases: [],
  infrastructure: [],
  programmingLanguages: ['Python', 'TypeScript'],
  useCaseType: 'Conversational AI',
  modelStrategy: 'hybrid',
  skills: [],
  interviewProcess: null,
  screeningQuestions: [
    { question: 'Why do you want to work here?' },
    { question: 'What is your experience with LLMs?' },
  ],
  companyId: '1',
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ApplyModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders modal when open', async () => {
    const { useProfile, useProfileCompleteness } = await import(
      '@/features/profile/hooks/useProfile'
    );
    const { useApplyJob } = await import('../../hooks/useJobs');

    vi.mocked(useProfile).mockReturnValue({
      data: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
        role: 'user',
        emailVerified: true,
        twoFactorEnabled: false,
        profile: {
          displayName: 'John Doe',
          headline: 'LLM Engineer',
          bio: 'Experienced engineer',
          location: 'San Francisco',
          website: null,
          githubUrl: null,
          linkedinUrl: null,
          twitterUrl: null,
          huggingfaceUrl: null,
          pronouns: null,
          availabilityStatus: 'actively_looking',
          yearsExperience: 5,
          resumeUrl: 'https://example.com/resume.pdf',
          coverImageUrl: null,
        },
        phone: '+1234567890',
      },
      isLoading: false,
    } as any);

    vi.mocked(useProfileCompleteness).mockReturnValue({
      isComplete: true,
      completionPercentage: 100,
      missingFields: [],
    });

    vi.mocked(useApplyJob).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const onClose = vi.fn();

    render(<ApplyModal job={mockJob} isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Apply for Senior LLM Engineer/i)).toBeInTheDocument();
    });
  });

  it('shows sign in prompt for unauthenticated users', async () => {
    const { useProfile, useProfileCompleteness } = await import(
      '@/features/profile/hooks/useProfile'
    );

    vi.mocked(useProfile).mockReturnValue({
      data: null,
      isLoading: false,
    } as any);

    vi.mocked(useProfileCompleteness).mockReturnValue({
      isComplete: false,
      completionPercentage: 0,
      missingFields: [],
    });

    const onClose = vi.fn();

    render(<ApplyModal job={mockJob} isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Sign In Required/i)).toBeInTheDocument();
    });
  });

  it('shows profile completeness warning for incomplete profiles', async () => {
    const { useProfile, useProfileCompleteness } = await import(
      '@/features/profile/hooks/useProfile'
    );
    const { useApplyJob } = await import('../../hooks/useJobs');

    vi.mocked(useProfile).mockReturnValue({
      data: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: null,
        lastName: null,
        avatar: null,
        role: 'user',
        emailVerified: true,
        twoFactorEnabled: false,
        profile: {
          displayName: 'testuser',
          headline: null,
          bio: null,
          location: null,
          website: null,
          githubUrl: null,
          linkedinUrl: null,
          twitterUrl: null,
          huggingfaceUrl: null,
          pronouns: null,
          availabilityStatus: 'actively_looking',
          yearsExperience: null,
          resumeUrl: null,
          coverImageUrl: null,
        },
      },
      isLoading: false,
    } as any);

    vi.mocked(useProfileCompleteness).mockReturnValue({
      isComplete: false,
      completionPercentage: 30,
      missingFields: [
        { field: 'name', label: 'Full Name', importance: 'required' },
        { field: 'resume', label: 'Resume/CV', importance: 'required' },
      ],
    });

    vi.mocked(useApplyJob).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const onClose = vi.fn();

    render(<ApplyModal job={mockJob} isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Profile Incomplete - Cannot Apply/i)).toBeInTheDocument();
    });
  });

  it('saves draft to localStorage', async () => {
    const { useProfile, useProfileCompleteness } = await import(
      '@/features/profile/hooks/useProfile'
    );
    const { useApplyJob } = await import('../../hooks/useJobs');

    vi.mocked(useProfile).mockReturnValue({
      data: {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
        role: 'user',
        emailVerified: true,
        twoFactorEnabled: false,
        profile: {
          displayName: 'John Doe',
          headline: 'LLM Engineer',
          bio: 'Experienced engineer',
          location: 'San Francisco',
          website: null,
          githubUrl: null,
          linkedinUrl: null,
          twitterUrl: null,
          huggingfaceUrl: null,
          pronouns: null,
          availabilityStatus: 'actively_looking',
          yearsExperience: 5,
          resumeUrl: 'https://example.com/resume.pdf',
          coverImageUrl: null,
        },
        phone: '+1234567890',
      },
      isLoading: false,
    } as any);

    vi.mocked(useProfileCompleteness).mockReturnValue({
      isComplete: true,
      completionPercentage: 100,
      missingFields: [],
    });

    vi.mocked(useApplyJob).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const onClose = vi.fn();

    render(<ApplyModal job={mockJob} isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/Apply for Senior LLM Engineer/i)).toBeInTheDocument();
    });

    // Type in cover letter
    const coverLetterTextarea = screen.getByPlaceholderText(
      /Introduce yourself and explain why you're a great fit/i
    );
    fireEvent.change(coverLetterTextarea, { target: { value: 'Test cover letter' } });

    // Click save draft
    const saveDraftButton = screen.getByText(/Save Draft/i);
    fireEvent.click(saveDraftButton);

    await waitFor(() => {
      const drafts = localStorage.getItem('job_application_drafts');
      expect(drafts).toBeTruthy();
      const parsed = JSON.parse(drafts!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].jobSlug).toBe(mockJob.slug);
      expect(parsed[0].coverLetter).toBe('Test cover letter');
    });
  });
});
