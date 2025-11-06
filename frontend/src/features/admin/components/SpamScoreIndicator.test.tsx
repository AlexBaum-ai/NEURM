/**
 * SpamScoreIndicator Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SpamScoreIndicator from './SpamScoreIndicator';

describe('SpamScoreIndicator', () => {
  it('renders spam score with label', () => {
    render(<SpamScoreIndicator score={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders without label when showLabel is false', () => {
    render(<SpamScoreIndicator score={75} showLabel={false} />);
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<SpamScoreIndicator score={50} size="sm" />);
    expect(screen.getByText('50%')).toBeInTheDocument();

    rerender(<SpamScoreIndicator score={50} size="lg" />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays correct percentage', () => {
    render(<SpamScoreIndicator score={23.7} />);
    expect(screen.getByText('24%')).toBeInTheDocument(); // Rounded
  });
});
