import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricsCards from '../MetricsCards';
import type { DashboardMetrics } from '../../types';

describe('MetricsCards', () => {
  const mockMetrics: DashboardMetrics['keyMetrics'] = {
    dau: 1250,
    mau: 35000,
    wau: 8500,
    mrr: 125000,
    arpu: 45.5,
    nps: 72,
    retentionRate: 0.85,
  };

  const mockQuickStats: DashboardMetrics['quickStats'] = {
    totalUsers: 50000,
    totalArticles: 1250,
    totalTopics: 3400,
    totalJobs: 450,
    totalApplications: 8900,
  };

  const mockRealTimeStats: DashboardMetrics['realTimeStats'] = {
    usersOnline: 342,
    postsPerHour: 28,
    applicationsToday: 156,
  };

  it('renders real-time stats correctly', () => {
    render(
      <MetricsCards
        metrics={mockMetrics}
        quickStats={mockQuickStats}
        realTimeStats={mockRealTimeStats}
      />
    );

    expect(screen.getByText('Users Online')).toBeInTheDocument();
    expect(screen.getByText('342')).toBeInTheDocument();
    expect(screen.getByText('Posts per Hour')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('renders key metrics correctly', () => {
    render(
      <MetricsCards
        metrics={mockMetrics}
        quickStats={mockQuickStats}
        realTimeStats={mockRealTimeStats}
      />
    );

    expect(screen.getByText('DAU (Daily Active Users)')).toBeInTheDocument();
    expect(screen.getAllByText('1.3K').length).toBeGreaterThan(0);
    expect(screen.getByText('MAU (Monthly Active)')).toBeInTheDocument();
    expect(screen.getByText('35.0K')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(
      <MetricsCards
        metrics={mockMetrics}
        quickStats={mockQuickStats}
        realTimeStats={mockRealTimeStats}
      />
    );

    expect(screen.getByText('$125,000')).toBeInTheDocument();
  });

  it('formats percentage correctly', () => {
    render(
      <MetricsCards
        metrics={mockMetrics}
        quickStats={mockQuickStats}
        realTimeStats={mockRealTimeStats}
      />
    );

    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('renders quick stats correctly', () => {
    render(
      <MetricsCards
        metrics={mockMetrics}
        quickStats={mockQuickStats}
        realTimeStats={mockRealTimeStats}
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('50.0K')).toBeInTheDocument();
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getAllByText('1.3K').length).toBeGreaterThan(0);
  });
});
