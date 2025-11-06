/**
 * ContentTypeBadge Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContentTypeBadge from './ContentTypeBadge';

describe('ContentTypeBadge', () => {
  it('renders article badge', () => {
    render(<ContentTypeBadge type="article" />);
    expect(screen.getByText('Article')).toBeInTheDocument();
  });

  it('renders topic badge', () => {
    render(<ContentTypeBadge type="topic" />);
    expect(screen.getByText('Topic')).toBeInTheDocument();
  });

  it('renders reply badge', () => {
    render(<ContentTypeBadge type="reply" />);
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('renders job badge', () => {
    render(<ContentTypeBadge type="job" />);
    expect(screen.getByText('Job')).toBeInTheDocument();
  });
});
