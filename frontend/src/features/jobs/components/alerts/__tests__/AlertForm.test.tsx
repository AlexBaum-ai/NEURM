import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AlertForm } from '../AlertForm';

describe('AlertForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  it('renders the form with all fields', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/keywords/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/include remote jobs only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email frequency/i)).toBeInTheDocument();
  });

  it('shows job type badges', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('Part-time')).toBeInTheDocument();
    expect(screen.getByText('Freelance')).toBeInTheDocument();
    expect(screen.getByText('Internship')).toBeInTheDocument();
  });

  it('shows experience level badges', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Junior')).toBeInTheDocument();
    expect(screen.getByText('Mid-Level')).toBeInTheDocument();
    expect(screen.getByText('Senior')).toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Principal')).toBeInTheDocument();
  });

  it('shows common model options', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('GPT-4')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('Llama')).toBeInTheDocument();
  });

  it('allows entering keywords', async () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const keywordInput = screen.getAllByPlaceholderText(/e.g., machine learning/i)[0];
    const addButton = screen.getAllByRole('button', { name: '' })[0]; // Plus icon button

    fireEvent.change(keywordInput, { target: { value: 'Python' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      const badges = screen.getAllByText('Python');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('pre-fills form with initial data', () => {
    const initialData = {
      keywords: ['Python', 'Machine Learning'],
      location: 'San Francisco',
      remote: true,
      emailFrequency: 'weekly' as const,
    };

    render(
      <AlertForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Python')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByDisplayValue('San Francisco')).toBeInTheDocument();
    expect(screen.getByLabelText(/include remote jobs only/i)).toBeChecked();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows correct button text based on initial data', () => {
    const { rerender } = render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: /create alert/i })).toBeInTheDocument();

    rerender(
      <AlertForm
        initialData={{ keywords: ['test'] }}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('button', { name: /update alert/i })).toBeInTheDocument();
  });

  it('disables submit button when submitting', () => {
    render(
      <AlertForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /saving/i });
    expect(submitButton).toBeDisabled();
  });
});
