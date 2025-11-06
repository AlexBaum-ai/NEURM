import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SystemHealthIndicator from '../SystemHealthIndicator';
import type { SystemHealth } from '../../types';

describe('SystemHealthIndicator', () => {
  const mockHealthySystem: SystemHealth = {
    apiResponseTime: 125,
    errorRate: 0.002,
    databaseSize: 5368709120, // 5GB in bytes
    status: 'healthy',
  };

  const mockWarningSystem: SystemHealth = {
    apiResponseTime: 450,
    errorRate: 0.035,
    databaseSize: 10737418240, // 10GB in bytes
    status: 'warning',
  };

  const mockCriticalSystem: SystemHealth = {
    apiResponseTime: 850,
    errorRate: 0.08,
    databaseSize: 21474836480, // 20GB in bytes
    status: 'critical',
  };

  it('renders system health with healthy status', () => {
    render(<SystemHealthIndicator health={mockHealthySystem} />);

    expect(screen.getByText('System Health')).toBeInTheDocument();
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  it('displays API response time correctly', () => {
    render(<SystemHealthIndicator health={mockHealthySystem} />);

    expect(screen.getByText('API Response Time')).toBeInTheDocument();
    expect(screen.getByText('125ms')).toBeInTheDocument();
  });

  it('displays error rate as percentage', () => {
    render(<SystemHealthIndicator health={mockHealthySystem} />);

    expect(screen.getByText('Error Rate')).toBeInTheDocument();
    expect(screen.getByText('0.20%')).toBeInTheDocument();
  });

  it('formats database size in GB', () => {
    render(<SystemHealthIndicator health={mockHealthySystem} />);

    expect(screen.getByText('Database Size')).toBeInTheDocument();
    expect(screen.getByText('5.00 GB')).toBeInTheDocument();
  });

  it('shows warning status correctly', () => {
    render(<SystemHealthIndicator health={mockWarningSystem} />);

    expect(screen.getByText('warning')).toBeInTheDocument();
    expect(screen.getByText('3.50%')).toBeInTheDocument();
  });

  it('shows critical status correctly', () => {
    render(<SystemHealthIndicator health={mockCriticalSystem} />);

    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('850ms')).toBeInTheDocument();
    expect(screen.getByText('8.00%')).toBeInTheDocument();
  });

  it('renders correct icons for different status levels', () => {
    const { container: healthyContainer } = render(
      <SystemHealthIndicator health={mockHealthySystem} />
    );
    const { container: warningContainer } = render(
      <SystemHealthIndicator health={mockWarningSystem} />
    );
    const { container: criticalContainer } = render(
      <SystemHealthIndicator health={mockCriticalSystem} />
    );

    expect(healthyContainer.querySelectorAll('svg').length).toBeGreaterThan(0);
    expect(warningContainer.querySelectorAll('svg').length).toBeGreaterThan(0);
    expect(criticalContainer.querySelectorAll('svg').length).toBeGreaterThan(0);
  });
});
