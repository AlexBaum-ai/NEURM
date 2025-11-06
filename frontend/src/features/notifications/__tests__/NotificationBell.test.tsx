import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
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
    readAt: null,
    createdAt: new Date().toISOString(),
    data: { articleId: 'article-1' },
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

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification bell icon', () => {
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 0 });

    renderWithProviders(<NotificationBell />);

    expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
  });

  it('should display unread count badge', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 5 });

    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    renderWithProviders(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('should open dropdown when bell is clicked', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 2 });

    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    renderWithProviders(<NotificationBell />);

    const bellIcon = screen.getByLabelText(/notifications/i);
    fireEvent.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByText('New Reply')).toBeInTheDocument();
      expect(screen.getByText('Trending Article')).toBeInTheDocument();
    });
  });

  it('should display "No notifications" when empty', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 0 });

    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    renderWithProviders(<NotificationBell />);

    const bellIcon = screen.getByLabelText(/notifications/i);
    fireEvent.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
    });
  });

  it('should mark notification as read when clicked', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 2 });

    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const mockMarkAsRead = vi.mocked(notificationsApi.markAsRead);
    mockMarkAsRead.mockResolvedValue({
      ...mockNotifications[0],
      readAt: new Date().toISOString(),
    });

    renderWithProviders(<NotificationBell />);

    const bellIcon = screen.getByLabelText(/notifications/i);
    fireEvent.click(bellIcon);

    await waitFor(() => {
      const notification = screen.getByText('New Reply');
      fireEvent.click(notification.closest('div')!);
    });

    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('should update unread count after marking as read', async () => {
    vi.mocked(notificationsApi.getUnreadCount)
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 1 });

    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    vi.mocked(notificationsApi.markAsRead).mockResolvedValue({
      ...mockNotifications[0],
      readAt: new Date().toISOString(),
    });

    renderWithProviders(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    const bellIcon = screen.getByLabelText(/notifications/i);
    fireEvent.click(bellIcon);

    await waitFor(() => {
      const notification = screen.getByText('New Reply');
      fireEvent.click(notification.closest('div')!);
    });

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('should show "Mark all as read" button', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 2 });

    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    renderWithProviders(<NotificationBell />);

    const bellIcon = screen.getByLabelText(/notifications/i);
    fireEvent.click(bellIcon);

    await waitFor(() => {
      expect(screen.getByText(/mark all as read/i)).toBeInTheDocument();
    });
  });

  it('should mark all notifications as read', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 2 });

    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const mockMarkAllAsRead = vi.mocked(notificationsApi.markAllAsRead);
    mockMarkAllAsRead.mockResolvedValue({ count: 2 });

    renderWithProviders(<NotificationBell />);

    const bellIcon = screen.getByLabelText(/notifications/i);
    fireEvent.click(bellIcon);

    await waitFor(() => {
      const markAllButton = screen.getByText(/mark all as read/i);
      fireEvent.click(markAllButton);
    });

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('should poll for new notifications', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 0 });

    const mockGetNotifications = vi.mocked(notificationsApi.getNotifications);
    mockGetNotifications.mockResolvedValue({
      notifications: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    renderWithProviders(<NotificationBell />);

    // Wait for polling to occur (30s interval)
    await waitFor(
      () => {
        expect(mockGetNotifications).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 }
    );
  });
});
