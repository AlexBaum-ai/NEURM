import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import EndorseButton from '../components/candidates/EndorseButton';
import * as endorsementsApi from '../api/endorsementsApi';

// Mock the API
vi.mock('../api/endorsementsApi');

// Mock useAuth hook
const mockCurrentUser = { id: 'current-user', username: 'currentuser' };
vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockCurrentUser, isAuthenticated: true }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EndorseButton', () => {
  const mockSkill = {
    id: 'skill-1',
    skillName: 'Prompt Engineering',
    proficiency: 4,
    endorsementCount: 5,
  };

  const mockProfileUsername = 'testuser';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render "+ Endorse" button when not endorsed', async () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: false,
    });

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    await waitFor(() => {
      expect(screen.getByText('+ Endorse')).toBeInTheDocument();
    });
  });

  it('should render "Endorsed" button when already endorsed', async () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: true,
    });

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    await waitFor(() => {
      expect(screen.getByText('Endorsed')).toBeInTheDocument();
    });
  });

  it('should not render button on own profile', () => {
    const { container } = renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername="currentuser" />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should endorse skill when clicking "+ Endorse"', async () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: false,
    });

    const mockEndorse = vi.mocked(endorsementsApi.endorseSkill);
    mockEndorse.mockResolvedValue({
      id: 'endorsement-1',
      userId: mockCurrentUser.id,
      profileId: 'profile-1',
      skillId: mockSkill.id,
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    await waitFor(() => {
      const endorseButton = screen.getByText('+ Endorse');
      fireEvent.click(endorseButton);
    });

    expect(mockEndorse).toHaveBeenCalledWith(mockProfileUsername, mockSkill.id);

    await waitFor(() => {
      expect(screen.getByText('Endorsed')).toBeInTheDocument();
    });
  });

  it('should unendorse skill when clicking "Endorsed"', async () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: true,
    });

    const mockUnendorse = vi.mocked(endorsementsApi.unendorseSkill);
    mockUnendorse.mockResolvedValue(undefined);

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    await waitFor(() => {
      const endorsedButton = screen.getByText('Endorsed');
      fireEvent.click(endorsedButton);
    });

    expect(mockUnendorse).toHaveBeenCalledWith(mockProfileUsername, mockSkill.id);

    await waitFor(() => {
      expect(screen.getByText('+ Endorse')).toBeInTheDocument();
    });
  });

  it('should show success message after endorsement', async () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: false,
    });

    vi.mocked(endorsementsApi.endorseSkill).mockResolvedValue({
      id: 'endorsement-1',
      userId: mockCurrentUser.id,
      profileId: 'profile-1',
      skillId: mockSkill.id,
      createdAt: new Date().toISOString(),
    });

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    await waitFor(() => {
      const endorseButton = screen.getByText('+ Endorse');
      fireEvent.click(endorseButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/endorsed successfully/i)).toBeInTheDocument();
    });
  });

  it('should use optimistic updates', async () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: false,
    });

    // Simulate slow API response
    vi.mocked(endorsementsApi.endorseSkill).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    await waitFor(() => {
      const endorseButton = screen.getByText('+ Endorse');
      fireEvent.click(endorseButton);
    });

    // Button should change immediately (optimistic update)
    expect(screen.getByText('Endorsed')).toBeInTheDocument();
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: false,
    });

    vi.mocked(endorsementsApi.endorseSkill).mockRejectedValue(
      new Error('Failed to endorse')
    );

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    await waitFor(() => {
      const endorseButton = screen.getByText('+ Endorse');
      fireEvent.click(endorseButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/failed to endorse/i)).toBeInTheDocument();
    });

    // Button should revert to original state
    expect(screen.getByText('+ Endorse')).toBeInTheDocument();
  });

  it('should display endorsement count', () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: false,
    });

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should be clickable to show endorsers list', async () => {
    vi.mocked(endorsementsApi.checkEndorsement).mockResolvedValue({
      endorsed: false,
    });

    vi.mocked(endorsementsApi.getEndorsers).mockResolvedValue({
      endorsements: [
        {
          id: 'endorsement-1',
          username: 'user1',
          displayName: 'User One',
          avatarUrl: null,
          headline: 'AI Engineer',
          createdAt: new Date().toISOString(),
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    });

    renderWithProviders(
      <EndorseButton skill={mockSkill} profileUsername={mockProfileUsername} />
    );

    await waitFor(() => {
      const countButton = screen.getByText('5');
      fireEvent.click(countButton);
    });

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
    });
  });
});
