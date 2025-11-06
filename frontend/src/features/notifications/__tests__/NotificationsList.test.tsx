import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import NotificationsList from '../components/NotificationsList';
import * as notificationsApi from '../api/notificationsApi';

// Mock the API
vi.mock('../api/notificationsApi');

const mockNotifications = [
  {
    id: '1',
    type: 'forum_reply' as const,
    title: 'New Reply',
    message: 'Someone replied to your topic',
    readAt: null,
    createdAt: new Date().toISOString(),
    data: { topicId: 'topic-1' },
  },
  {
    id: '2',
    type: 'news_trending' as const,
    title: 'Trending Article',
    message: 'Your article is trending',
    readAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    data: { articleId: 'article-1' },
  },
  {
    id: '3',
    type: 'job_match' as const,
    title: 'New Job Match',
    message: 'A new job matches your profile',
    readAt: new Date(Date.now() - 86400000 * 8).toISOString(), // 8 days ago
    data: { jobId: 'job-1' },
  },
];

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

describe('NotificationsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notifications grouped by time', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderWithProviders(<NotificationsList />);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('This Week')).toBeInTheDocument();
      expect(screen.getByText('Earlier')).toBeInTheDocument();
    });
  });

  it('should filter notifications by type', async () => {
    const mockGetNotifications = vi.mocked(notificationsApi.getNotifications);
    mockGetNotifications.mockResolvedValue({
      notifications: [mockNotifications[0]],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderWithProviders(<NotificationsList />);

    await waitFor(() => {
      const filterButton = screen.getByText(/all/i);
      fireEvent.click(filterButton);
    });

    await waitFor(() => {
      const forumFilter = screen.getByText(/forum/i);
      fireEvent.click(forumFilter);
    });

    expect(mockGetNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'forum',
      })
    );
  });

  it('should filter unread notifications', async () => {
    const mockGetNotifications = vi.mocked(notificationsApi.getNotifications);
    mockGetNotifications.mockResolvedValue({
      notifications: [mockNotifications[0]],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    renderWithProviders(<NotificationsList />);

    await waitFor(() => {
      const unreadFilter = screen.getByText(/unread/i);
      fireEvent.click(unreadFilter);
    });

    expect(mockGetNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        unreadOnly: true,
      })
    );
  });

  it('should implement infinite scroll', async () => {
    const mockGetNotifications = vi.mocked(notificationsApi.getNotifications);

    // First page
    mockGetNotifications.mockResolvedValueOnce({
      notifications: mockNotifications,
      total: 30,
      page: 1,
      limit: 20,
      totalPages: 2,
    });

    // Second page
    mockGetNotifications.mockResolvedValueOnce({
      notifications: [
        {
          id: '4',
          type: 'social_follow' as const,
          title: 'New Follower',
          message: 'Someone followed you',
          readAt: null,
          createdAt: new Date().toISOString(),
          data: { followerId: 'user-1' },
        },
      ],
      total: 30,
      page: 2,
      limit: 20,
      totalPages: 2,
    });

    renderWithProviders(<NotificationsList />);

    await waitFor(() => {
      expect(screen.getByText('New Reply')).toBeInTheDocument();
    });

    // Simulate scrolling to bottom
    const scrollContainer = screen.getByTestId('notifications-list');
    fireEvent.scroll(scrollContainer, { target: { scrollY: 1000 } });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });
  });

  it('should delete notification', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 3,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const mockDeleteNotification = vi.mocked(notificationsApi.deleteNotification);
    mockDeleteNotification.mockResolvedValue(undefined);

    renderWithProviders(<NotificationsList />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      fireEvent.click(deleteButtons[0]);
    });

    expect(mockDeleteNotification).toHaveBeenCalledWith('1');
  });

  it('should show empty state when no notifications', async () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });

    renderWithProviders(<NotificationsList />);

    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    vi.mocked(notificationsApi.getNotifications).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<NotificationsList />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    vi.mocked(notificationsApi.getNotifications).mockRejectedValue(
      new Error('Failed to load notifications')
    );

    renderWithProviders(<NotificationsList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
