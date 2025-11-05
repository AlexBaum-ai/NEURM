import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchBreakdown } from '../MatchBreakdown';
import type { MatchFactor } from '../../../types';

describe('MatchBreakdown', () => {
  const mockFactors: MatchFactor[] = [
    {
      name: 'Skills Match',
      score: 90,
      weight: 30,
      details: 'Your LLM skills align perfectly',
    },
    {
      name: 'Experience Level',
      score: 75,
      weight: 25,
      details: 'Your experience is a good fit',
    },
    {
      name: 'Location',
      score: 50,
      weight: 20,
      details: 'Remote preference partially matches',
    },
  ];

  it('should display overall match score', () => {
    render(
      <MatchBreakdown
        factors={mockFactors}
        matchScore={85}
      />
    );

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText(/Overall Match:/i)).toBeInTheDocument();
  });

  it('should render all factor names', () => {
    render(
      <MatchBreakdown
        factors={mockFactors}
        matchScore={85}
      />
    );

    mockFactors.forEach((factor) => {
      expect(screen.getAllByText(factor.name)[0]).toBeInTheDocument();
    });
  });

  it('should display factor scores', () => {
    render(
      <MatchBreakdown
        factors={mockFactors}
        matchScore={85}
      />
    );

    expect(screen.getAllByText('90%')[0]).toBeInTheDocument();
    expect(screen.getAllByText('75%')[0]).toBeInTheDocument();
    expect(screen.getAllByText('50%')[0]).toBeInTheDocument();
  });

  it('should render factor details when provided', () => {
    render(
      <MatchBreakdown
        factors={mockFactors}
        matchScore={85}
      />
    );

    mockFactors.forEach((factor) => {
      if (factor.details) {
        expect(screen.getByText(factor.details)).toBeInTheDocument();
      }
    });
  });

  it('should render null when no factors provided', () => {
    const { container } = render(
      <MatchBreakdown
        factors={[]}
        matchScore={85}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render color legend', () => {
    render(
      <MatchBreakdown
        factors={mockFactors}
        matchScore={85}
      />
    );

    expect(screen.getByText(/Excellent \(80%\+\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Good \(60-80%\)/i)).toBeInTheDocument();
  });
});
