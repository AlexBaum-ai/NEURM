import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from '../ComparisonTable';
import type { Model } from '../../types';

const mockModels: Model[] = [
  {
    id: 1,
    name: 'GPT-4',
    slug: 'gpt-4',
    provider: 'OpenAI',
    category: 'Best Overall',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    inputPricePerMToken: 10,
    outputPricePerMToken: 30,
    capabilities: ['text', 'vision', 'function-calling'],
    releaseDate: '2023-03-14',
    status: 'active',
    bestFor: ['Complex reasoning', 'Code generation', 'Analysis'],
    notIdealFor: ['Real-time applications'],
    officialDocsUrl: 'https://platform.openai.com/docs',
  },
  {
    id: 2,
    name: 'Claude 3.5 Sonnet',
    slug: 'claude-3-5-sonnet',
    provider: 'Anthropic',
    category: 'Best Overall',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    inputPricePerMToken: 3,
    outputPricePerMToken: 15,
    capabilities: ['text', 'vision', 'function-calling'],
    releaseDate: '2024-06-20',
    status: 'active',
    bestFor: ['Long documents', 'Code generation', 'Analysis'],
    notIdealFor: ['Audio processing'],
    officialDocsUrl: 'https://docs.anthropic.com',
  },
  {
    id: 3,
    name: 'Gemini 1.5 Pro',
    slug: 'gemini-1-5-pro',
    provider: 'Google',
    category: 'Largest Context',
    contextWindow: 2000000,
    maxOutputTokens: 8192,
    inputPricePerMToken: 1.25,
    outputPricePerMToken: 5,
    capabilities: ['text', 'vision', 'audio', 'video'],
    releaseDate: '2024-02-15',
    status: 'active',
    bestFor: ['Massive context', 'Multimodal tasks', 'Video analysis'],
    notIdealFor: ['Low-latency applications'],
    officialDocsUrl: 'https://ai.google.dev/docs',
  },
];

describe('ComparisonTable', () => {
  it('renders all model names in header', () => {
    render(<ComparisonTable models={mockModels} />);

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
    expect(screen.getByText('Gemini 1.5 Pro')).toBeInTheDocument();
  });

  it('displays provider information', () => {
    render(<ComparisonTable models={mockModels} />);

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
  });

  it('shows context window sizes', () => {
    render(<ComparisonTable models={mockModels} />);

    expect(screen.getByText('128,000')).toBeInTheDocument();
    expect(screen.getByText('200,000')).toBeInTheDocument();
    expect(screen.getByText('2,000,000')).toBeInTheDocument();
  });

  it('displays pricing information', () => {
    render(<ComparisonTable models={mockModels} />);

    // Input prices
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$3.00')).toBeInTheDocument();
    expect(screen.getByText('$1.25')).toBeInTheDocument();

    // Output prices
    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('$15.00')).toBeInTheDocument();
    expect(screen.getByText('$5.00')).toBeInTheDocument();
  });

  it('renders capabilities for each model', () => {
    render(<ComparisonTable models={mockModels} />);

    // All models have text capability
    const textCaps = screen.getAllByText(/text/i);
    expect(textCaps.length).toBeGreaterThanOrEqual(3);

    // Only Gemini has video capability
    const videoCaps = screen.getAllByText(/video/i);
    expect(videoCaps.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Best For" use cases', () => {
    render(<ComparisonTable models={mockModels} />);

    expect(screen.getByText('Complex reasoning')).toBeInTheDocument();
    expect(screen.getByText('Long documents')).toBeInTheDocument();
    expect(screen.getByText('Massive context')).toBeInTheDocument();
  });

  it('shows "Not Ideal For" limitations', () => {
    render(<ComparisonTable models={mockModels} />);

    expect(screen.getByText('Real-time applications')).toBeInTheDocument();
    expect(screen.getByText('Audio processing')).toBeInTheDocument();
    expect(screen.getByText('Low-latency applications')).toBeInTheDocument();
  });

  it('highlights best values with green color', () => {
    const { container } = render(<ComparisonTable models={mockModels} />);

    // Gemini has the best (lowest) input price
    // Should be highlighted in green
    const greenElements = container.querySelectorAll('.text-green-600, .bg-green-50');
    expect(greenElements.length).toBeGreaterThan(0);
  });

  it('highlights worst values with red color', () => {
    const { container } = render(<ComparisonTable models={mockModels} />);

    // GPT-4 has the worst (highest) prices
    // Should be highlighted in red
    const redElements = container.querySelectorAll('.text-red-600, .bg-red-50');
    expect(redElements.length).toBeGreaterThan(0);
  });

  it('displays documentation links', () => {
    render(<ComparisonTable models={mockModels} />);

    const docLinks = screen.getAllByText(/Docs|Documentation/i);
    expect(docLinks.length).toBeGreaterThanOrEqual(3);
  });

  it('renders sticky header for model names', () => {
    const { container } = render(<ComparisonTable models={mockModels} />);

    const stickyHeaders = container.querySelectorAll('.sticky');
    expect(stickyHeaders.length).toBeGreaterThan(0);
  });

  it('handles two models correctly', () => {
    render(<ComparisonTable models={mockModels.slice(0, 2)} />);

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
    expect(screen.queryByText('Gemini 1.5 Pro')).not.toBeInTheDocument();
  });

  it('handles five models correctly', () => {
    const fiveModels = [
      ...mockModels,
      {
        id: 4,
        name: 'Llama 3.1',
        slug: 'llama-3-1',
        provider: 'Meta',
        category: 'Open Source',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputPricePerMToken: 0,
        outputPricePerMToken: 0,
        capabilities: ['text'],
        releaseDate: '2024-07-23',
        status: 'active',
        bestFor: ['Open source', 'Self-hosting'],
        notIdealFor: ['Multimodal tasks'],
        officialDocsUrl: 'https://llama.meta.com',
      },
      {
        id: 5,
        name: 'Mistral Large',
        slug: 'mistral-large',
        provider: 'Mistral AI',
        category: 'Cost-Effective',
        contextWindow: 128000,
        maxOutputTokens: 4096,
        inputPricePerMToken: 2,
        outputPricePerMToken: 6,
        capabilities: ['text', 'function-calling'],
        releaseDate: '2024-02-26',
        status: 'active',
        bestFor: ['Cost-effective', 'European data residency'],
        notIdealFor: ['Vision tasks'],
        officialDocsUrl: 'https://docs.mistral.ai',
      },
    ];

    render(<ComparisonTable models={fiveModels} />);

    expect(screen.getByText('Llama 3.1')).toBeInTheDocument();
    expect(screen.getByText('Mistral Large')).toBeInTheDocument();
  });
});
