import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityFeed from '../ActivityFeed';
import type { Activity } from '../../types';

describe('ActivityFeed', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'user',
      title: 'New user registered',
      description: 'john.doe joined the platform',
      timestamp: new Date().toISOString(),
      user: {
        id: '1',
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
      },
    },
    {
      id: '2',
      type: 'content',
      title: 'New article published',
      description: 'Introduction to GPT-4',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'report',
      title: 'Content reported',
      description: 'Spam detected in forum post',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  it('renders activity feed with activities', () => {
    render(<ActivityFeed activities={mockActivities} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('New user registered')).toBeInTheDocument();
    expect(screen.getByText('john.doe joined the platform')).toBeInTheDocument();
    expect(screen.getByText('New article published')).toBeInTheDocument();
    expect(screen.getByText('Content reported')).toBeInTheDocument();
  });

  it('displays user information when available', () => {
    render(<ActivityFeed activities={mockActivities} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe')).toBeInTheDocument();
  });

  it('displays relative timestamps', () => {
    render(<ActivityFeed activities={mockActivities} />);

    // The exact text will vary, but should contain "ago"
    const timestamps = screen.getAllByText(/ago$/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('shows empty state when no activities', () => {
    render(<ActivityFeed activities={[]} />);

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders correct icons for different activity types', () => {
    const { container } = render(<ActivityFeed activities={mockActivities} />);

    // Check that icons are rendered (they have specific classes)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});
