import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModelVersions } from '../ModelVersions';
import * as useModelsHook from '../../hooks/useModels';

// Mock data
const mockVersionsData = {
  model: {
    id: 1,
    name: 'GPT-4',
    slug: 'gpt-4',
  },
  versions: [
    {
      id: 1,
      version: 'gpt-4-turbo-2024-04-09',
      releasedAt: '2024-04-09T00:00:00Z',
      isLatest: true,
      changelog: 'Latest release with improved performance',
      features: ['Enhanced reasoning', 'Faster response time'],
      improvements: ['Better accuracy', 'Reduced hallucinations'],
    },
    {
      id: 2,
      version: 'gpt-4-0613',
      releasedAt: '2023-06-13T00:00:00Z',
      isLatest: false,
      changelog: 'Initial GPT-4 release',
      features: ['Advanced reasoning'],
      improvements: [],
    },
  ],
};

describe('ModelVersions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (modelSlug: string) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ModelVersions modelSlug={modelSlug} />
      </QueryClientProvider>
    );
  };

  it('renders loading state initially', () => {
    vi.spyOn(useModelsHook, 'useModelVersions').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    renderComponent('gpt-4');

    expect(screen.getByText('Version History')).toBeInTheDocument();
    // Check for skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state when no versions available', () => {
    vi.spyOn(useModelsHook, 'useModelVersions').mockReturnValue({
      data: { versions: [] },
      isLoading: false,
      error: null,
    } as any);

    renderComponent('gpt-4');

    expect(screen.getByText('No version history available')).toBeInTheDocument();
  });

  it('renders version selector dropdown with latest version selected', async () => {
    vi.spyOn(useModelsHook, 'useModelVersions').mockReturnValue({
      data: mockVersionsData,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('gpt-4');

    await waitFor(() => {
      expect(screen.getByText('gpt-4-turbo-2024-04-09')).toBeInTheDocument();
    });

    // Check for "Latest" badge
    const latestBadges = screen.getAllByText('(Latest)');
    expect(latestBadges.length).toBeGreaterThan(0);
  });

  it('displays selected version details', async () => {
    vi.spyOn(useModelsHook, 'useModelVersions').mockReturnValue({
      data: mockVersionsData,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('gpt-4');

    await waitFor(() => {
      expect(screen.getByText('Latest release with improved performance')).toBeInTheDocument();
    });

    // Check for features section
    expect(screen.getByText('✨ New Features')).toBeInTheDocument();
    expect(screen.getByText('Enhanced reasoning')).toBeInTheDocument();
    expect(screen.getByText('Faster response time')).toBeInTheDocument();

    // Check for improvements section
    expect(screen.getByText('🔧 Improvements')).toBeInTheDocument();
    expect(screen.getByText('Better accuracy')).toBeInTheDocument();
  });

  it('renders release timeline with all versions', async () => {
    vi.spyOn(useModelsHook, 'useModelVersions').mockReturnValue({
      data: mockVersionsData,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('gpt-4');

    await waitFor(() => {
      expect(screen.getByText('Release Timeline')).toBeInTheDocument();
    });

    // Check that both versions are displayed in timeline
    const version1 = screen.getAllByText('gpt-4-turbo-2024-04-09');
    const version2 = screen.getAllByText('gpt-4-0613');

    expect(version1.length).toBeGreaterThan(0);
    expect(version2.length).toBeGreaterThan(0);
  });

  it('shows feature and improvement counts in timeline', async () => {
    vi.spyOn(useModelsHook, 'useModelVersions').mockReturnValue({
      data: mockVersionsData,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('gpt-4');

    await waitFor(() => {
      expect(screen.getByText(/2 new features/)).toBeInTheDocument();
      expect(screen.getByText(/2 improvements/)).toBeInTheDocument();
    });
  });

  it('formats release dates correctly', async () => {
    vi.spyOn(useModelsHook, 'useModelVersions').mockReturnValue({
      data: mockVersionsData,
      isLoading: false,
      error: null,
    } as any);

    renderComponent('gpt-4');

    await waitFor(() => {
      // Should display date in readable format (e.g., "April 9, 2024")
      const dateText = screen.getByText(/April 9, 2024/);
      expect(dateText).toBeInTheDocument();
    });
  });
});
