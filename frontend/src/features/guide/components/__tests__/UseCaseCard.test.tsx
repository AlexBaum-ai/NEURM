import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UseCaseCard from '../UseCaseCard';
import type { UseCase } from '../../types';

const mockUseCase: UseCase = {
  id: 1,
  slug: 'customer-support-chatbot',
  title: 'AI-Powered Customer Support Chatbot',
  summary: 'Reduced support tickets by 60% using GPT-4 and RAG',
  category: 'Customer Support',
  industry: 'SaaS',
  status: 'published',
  featured: false,
  techStack: ['GPT-4', 'LangChain', 'Pinecone', 'React'],
  hasCode: true,
  hasRoiData: true,
  implementationType: 'RAG',
  companySize: 'medium',
  viewCount: 1250,
  commentCount: 45,
  publishedAt: '2024-01-15T00:00:00Z',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  author: {
    id: 1,
    username: 'john_doe',
    displayName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
  company: {
    id: 1,
    name: 'TechCorp',
    slug: 'techcorp',
    logoUrl: 'https://example.com/logo.png',
  },
  metrics: {
    ticketReduction: '60%',
    responseTim: '< 2s',
    satisfactionScore: '4.8/5',
  },
};

describe('UseCaseCard', () => {
  const renderCard = (useCase: UseCase = mockUseCase) => {
    return render(
      <BrowserRouter>
        <UseCaseCard useCase={useCase} />
      </BrowserRouter>
    );
  };

  it('renders use case title', () => {
    renderCard();
    expect(screen.getByText('AI-Powered Customer Support Chatbot')).toBeInTheDocument();
  });

  it('renders summary text', () => {
    renderCard();
    expect(screen.getByText('Reduced support tickets by 60% using GPT-4 and RAG')).toBeInTheDocument();
  });

  it('displays category badge', () => {
    renderCard();
    expect(screen.getByText('Customer Support')).toBeInTheDocument();
  });

  it('displays industry badge', () => {
    renderCard();
    expect(screen.getByText('SaaS')).toBeInTheDocument();
  });

  it('shows tech stack badges', () => {
    renderCard();
    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('LangChain')).toBeInTheDocument();
    expect(screen.getByText('Pinecone')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('displays company name and logo', () => {
    renderCard();
    expect(screen.getByText('TechCorp')).toBeInTheDocument();
    const logo = screen.getByAltText('TechCorp');
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('shows author information', () => {
    renderCard();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays view count', () => {
    renderCard();
    expect(screen.getByText(/1,250|1250/)).toBeInTheDocument();
  });

  it('displays comment count', () => {
    renderCard();
    expect(screen.getByText(/45/)).toBeInTheDocument();
  });

  it('shows "Code Available" indicator when hasCode is true', () => {
    renderCard();
    expect(screen.getByText(/Code|code/i)).toBeInTheDocument();
  });

  it('shows "ROI Data" indicator when hasRoiData is true', () => {
    renderCard();
    expect(screen.getByText(/ROI|Metrics/i)).toBeInTheDocument();
  });

  it('displays implementation type', () => {
    renderCard();
    expect(screen.getByText('RAG')).toBeInTheDocument();
  });

  it('links to use case detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/guide/use-cases/customer-support-chatbot');
  });

  it('displays featured badge when use case is featured', () => {
    const featuredUseCase = { ...mockUseCase, featured: true };
    renderCard(featuredUseCase);
    expect(screen.getByText(/Featured|featured/i)).toBeInTheDocument();
  });

  it('formats published date correctly', () => {
    renderCard();
    // Should display relative or formatted date
    const dateElement = screen.getByText(/Jan|January|2024/i);
    expect(dateElement).toBeInTheDocument();
  });

  it('displays metrics when available', () => {
    renderCard();
    // Check for any metric values
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalUseCase: UseCase = {
      ...mockUseCase,
      company: undefined,
      metrics: undefined,
      hasCode: false,
      hasRoiData: false,
    };

    expect(() => renderCard(minimalUseCase)).not.toThrow();
  });
});
