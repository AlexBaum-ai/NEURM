import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GlossaryTermCard from '../GlossaryTermCard';
import type { GlossaryTerm } from '../../types';

const mockTerm: GlossaryTerm = {
  id: 1,
  slug: 'attention-mechanism',
  term: 'Attention Mechanism',
  definition: 'A neural network technique that allows models to focus on specific parts of the input when processing information.',
  briefDefinition: 'A technique that helps models focus on relevant parts of input data.',
  category: 'Architecture',
  examples: [],
  relatedTerms: [],
  viewCount: 150,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('GlossaryTermCard', () => {
  it('renders term name', () => {
    render(
      <BrowserRouter>
        <GlossaryTermCard term={mockTerm} />
      </BrowserRouter>
    );

    expect(screen.getByText('Attention Mechanism')).toBeInTheDocument();
  });

  it('renders brief definition', () => {
    render(
      <BrowserRouter>
        <GlossaryTermCard term={mockTerm} />
      </BrowserRouter>
    );

    expect(screen.getByText('A technique that helps models focus on relevant parts of input data.')).toBeInTheDocument();
  });

  it('renders category badge', () => {
    render(
      <BrowserRouter>
        <GlossaryTermCard term={mockTerm} />
      </BrowserRouter>
    );

    expect(screen.getByText('Architecture')).toBeInTheDocument();
  });

  it('links to term detail page', () => {
    render(
      <BrowserRouter>
        <GlossaryTermCard term={mockTerm} />
      </BrowserRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/guide/glossary/attention-mechanism');
  });
});
