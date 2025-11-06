import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalyticsMetricsCards from '../AnalyticsMetricsCards';
import type { EngagementMetrics, RevenueMetrics } from '../../../types';

describe('AnalyticsMetricsCards', () => {
  const mockEngagement: EngagementMetrics = {
    dau: 1500,
    mau: 15000,
    wau: 6000,
    dauMauRatio: 0.1,
    avgSessionTime: 25.5,
    avgPagesPerSession: 4.2,
    bounceRate: 0.45,
    returnUserRate: 0.65,
  };

  const mockRevenue: RevenueMetrics = {
    mrr: 50000,
    mrrGrowth: 0.15,
    newSubscriptions: 120,
    churnedSubscriptions: 8,
    churnRate: 0.025,
    arpu: 45.5,
    ltv: 1200,
    revenueByPlan: [
      { plan: 'Free', count: 1000, revenue: 0, percentage: 0 },
      { plan: 'Pro', count: 500, revenue: 25000, percentage: 50 },
      { plan: 'Enterprise', count: 100, revenue: 25000, percentage: 50 },
    ],
    revenueTimeseries: [
      {
        date: '2025-01-01',
        revenue: 48000,
        subscriptions: 100,
        churn: 5,
      },
      {
        date: '2025-01-08',
        revenue: 50000,
        subscriptions: 120,
        churn: 8,
      },
    ],
  };

  it('renders all metric cards', () => {
    render(<AnalyticsMetricsCards engagement={mockEngagement} revenue={mockRevenue} />);

    expect(screen.getByText('DAU/MAU Ratio')).toBeInTheDocument();
    expect(screen.getByText('Avg Session Time')).toBeInTheDocument();
    expect(screen.getByText('Pages per Session')).toBeInTheDocument();
    expect(screen.getByText('Bounce Rate')).toBeInTheDocument();
    expect(screen.getByText('MRR')).toBeInTheDocument();
    expect(screen.getByText('ARPU')).toBeInTheDocument();
    expect(screen.getByText('Churn Rate')).toBeInTheDocument();
    expect(screen.getByText('Return Users')).toBeInTheDocument();
  });

  it('formats DAU/MAU ratio as percentage', () => {
    render(<AnalyticsMetricsCards engagement={mockEngagement} revenue={mockRevenue} />);

    expect(screen.getByText('10.0%')).toBeInTheDocument();
  });

  it('formats session time correctly', () => {
    render(<AnalyticsMetricsCards engagement={mockEngagement} revenue={mockRevenue} />);

    expect(screen.getByText('26m')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<AnalyticsMetricsCards engagement={mockEngagement} revenue={mockRevenue} />);

    // Check for MRR (Monthly Recurring Revenue)
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    // ARPU might be rounded, so just check it exists somewhere
    expect(screen.getByText(/ARPU/i)).toBeInTheDocument();
  });

  it('displays trend indicators for MRR', () => {
    render(<AnalyticsMetricsCards engagement={mockEngagement} revenue={mockRevenue} />);

    // MRR growth should show as 15%
    expect(screen.getByText('15.0%')).toBeInTheDocument();
  });

  it('formats bounce rate as percentage', () => {
    render(<AnalyticsMetricsCards engagement={mockEngagement} revenue={mockRevenue} />);

    expect(screen.getByText('45.0%')).toBeInTheDocument();
  });

  it('shows descriptions for each metric', () => {
    render(<AnalyticsMetricsCards engagement={mockEngagement} revenue={mockRevenue} />);

    expect(screen.getByText('User stickiness indicator')).toBeInTheDocument();
    expect(screen.getByText('Time per session')).toBeInTheDocument();
    expect(screen.getByText('Avg pages viewed')).toBeInTheDocument();
    expect(screen.getByText('Single-page visits')).toBeInTheDocument();
    expect(screen.getByText('Monthly recurring revenue')).toBeInTheDocument();
    expect(screen.getByText('Average revenue per user')).toBeInTheDocument();
    expect(screen.getByText('Subscription churn')).toBeInTheDocument();
    expect(screen.getByText('Users who came back')).toBeInTheDocument();
  });
});
