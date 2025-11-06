import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AlertsPanel from '../AlertsPanel';
import type { Alert } from '../../types';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AlertsPanel', () => {
  const mockAlerts: Alert[] = [
    {
      id: '1',
      type: 'error',
      title: 'High Error Rate',
      message: 'API error rate exceeded 5%',
      count: 25,
      timestamp: new Date().toISOString(),
      actionUrl: '/admin/logs',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Storage Warning',
      message: 'Database storage at 85%',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '3',
      type: 'info',
      title: 'System Update',
      message: 'Scheduled maintenance in 24 hours',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  it('renders alerts panel with alerts', () => {
    renderWithRouter(<AlertsPanel alerts={mockAlerts} />);

    expect(screen.getByText('Alerts & Notifications')).toBeInTheDocument();
    expect(screen.getByText('3 alerts')).toBeInTheDocument();
    expect(screen.getByText('High Error Rate')).toBeInTheDocument();
    expect(screen.getByText('Storage Warning')).toBeInTheDocument();
    expect(screen.getByText('System Update')).toBeInTheDocument();
  });

  it('displays alert count when present', () => {
    renderWithRouter(<AlertsPanel alerts={mockAlerts} />);

    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays alert messages correctly', () => {
    renderWithRouter(<AlertsPanel alerts={mockAlerts} />);

    expect(screen.getByText('API error rate exceeded 5%')).toBeInTheDocument();
    expect(screen.getByText('Database storage at 85%')).toBeInTheDocument();
    expect(screen.getByText('Scheduled maintenance in 24 hours')).toBeInTheDocument();
  });

  it('shows empty state when no alerts', () => {
    renderWithRouter(<AlertsPanel alerts={[]} />);

    expect(screen.getByText('No alerts at this time')).toBeInTheDocument();
    expect(screen.getByText('All systems operating normally')).toBeInTheDocument();
  });

  it('renders action links when actionUrl is provided', () => {
    renderWithRouter(<AlertsPanel alerts={mockAlerts} />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('displays relative timestamps', () => {
    renderWithRouter(<AlertsPanel alerts={mockAlerts} />);

    const timestamps = screen.getAllByText(/ago$/);
    expect(timestamps.length).toBe(3);
  });

  it('applies correct styling for different alert types', () => {
    const { container } = renderWithRouter(<AlertsPanel alerts={mockAlerts} />);

    // Check that different colored borders exist for different alert types
    const alertElements = container.querySelectorAll('[class*="border-l-"]');
    expect(alertElements.length).toBe(3);
  });
});
