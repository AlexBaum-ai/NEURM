import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MatchBadge } from '../MatchBadge';

describe('MatchBadge', () => {
  it('should render match score correctly', () => {
    render(<MatchBadge matchScore={85} />);
    expect(screen.getByText('85% Match')).toBeInTheDocument();
  });

  it('should apply green color for high match (>80%)', () => {
    const { container } = render(<MatchBadge matchScore={85} />);
    const badge = container.querySelector('[class*="bg-green"]');
    expect(badge).toBeInTheDocument();
  });

  it('should apply yellow color for medium match (60-80%)', () => {
    const { container } = render(<MatchBadge matchScore={70} />);
    const badge = container.querySelector('[class*="bg-yellow"]');
    expect(badge).toBeInTheDocument();
  });

  it('should apply gray color for low match (<60%)', () => {
    const { container } = render(<MatchBadge matchScore={50} />);
    const badge = container.querySelector('[class*="bg-gray"]');
    expect(badge).toBeInTheDocument();
  });

  it('should render tooltip when showTooltip is true', () => {
    const { container } = render(
      <MatchBadge
        matchScore={85}
        showTooltip={true}
        tooltipText="This is a tooltip"
      />
    );
    const tooltip = container.querySelector('[class*="group"]');
    expect(tooltip).toBeInTheDocument();
  });

  it('should not render tooltip when showTooltip is false', () => {
    const { container } = render(
      <MatchBadge
        matchScore={85}
        showTooltip={false}
        tooltipText="This is a tooltip"
      />
    );
    const tooltip = container.querySelector('[class*="group"]');
    expect(tooltip).not.toBeInTheDocument();
  });
});
