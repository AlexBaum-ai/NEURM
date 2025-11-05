import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchExplanation } from '../MatchExplanation';

describe('MatchExplanation', () => {
  const mockReasons = [
    'Your skills match the required LLM expertise',
    'Location preference aligns with the job',
    'Experience level is a perfect fit',
  ];

  it('should render all provided reasons', () => {
    render(
      <MatchExplanation
        topReasons={mockReasons}
        matchScore={85}
      />
    );

    mockReasons.forEach((reason) => {
      expect(screen.getByText(reason)).toBeInTheDocument();
    });
  });

  it('should display match score in the title', () => {
    render(
      <MatchExplanation
        topReasons={mockReasons}
        matchScore={85}
      />
    );

    expect(screen.getByText(/Why this is a 85% match/i)).toBeInTheDocument();
  });

  it('should only show top 3 reasons even if more are provided', () => {
    const manyReasons = [
      'Reason 1',
      'Reason 2',
      'Reason 3',
      'Reason 4',
      'Reason 5',
    ];

    render(
      <MatchExplanation
        topReasons={manyReasons}
        matchScore={90}
      />
    );

    expect(screen.getByText('Reason 1')).toBeInTheDocument();
    expect(screen.getByText('Reason 2')).toBeInTheDocument();
    expect(screen.getByText('Reason 3')).toBeInTheDocument();
    expect(screen.queryByText('Reason 4')).not.toBeInTheDocument();
    expect(screen.queryByText('Reason 5')).not.toBeInTheDocument();
  });

  it('should render null when no reasons provided', () => {
    const { container } = render(
      <MatchExplanation
        topReasons={[]}
        matchScore={85}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should display last updated date when provided', () => {
    const lastUpdated = '2025-01-15T12:00:00Z';
    render(
      <MatchExplanation
        topReasons={mockReasons}
        matchScore={85}
        lastUpdated={lastUpdated}
      />
    );

    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });
});
