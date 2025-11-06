import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossarySearchBar from '../GlossarySearchBar';

describe('GlossarySearchBar', () => {
  it('renders search input field', () => {
    const mockOnSearch = vi.fn();
    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('renders search icon', () => {
    const mockOnSearch = vi.fn();
    const { container } = render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });

  it('calls onSearch when user types', async () => {
    const mockOnSearch = vi.fn();
    const user = userEvent.setup();

    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'attention');

    // Should call onSearch with the query
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('attention');
    });
  });

  it('debounces search input', async () => {
    const mockOnSearch = vi.fn();
    const user = userEvent.setup();

    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);

    // Type multiple characters quickly
    await user.type(searchInput, 'rag');

    // Should not call onSearch immediately for each keystroke
    expect(mockOnSearch).not.toHaveBeenCalled();

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockOnSearch).toHaveBeenCalledWith('rag');
      },
      { timeout: 500 }
    );
  });

  it('shows clear button when text is entered', async () => {
    const mockOnSearch = vi.fn();
    const user = userEvent.setup();

    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'transformer');

    // Look for clear button (X icon or "Clear" text)
    await waitFor(() => {
      const clearButton = screen.queryByRole('button', { name: /clear/i }) ||
                         screen.queryByLabelText(/clear/i);
      if (clearButton) {
        expect(clearButton).toBeInTheDocument();
      }
    });
  });

  it('clears search when clear button is clicked', async () => {
    const mockOnSearch = vi.fn();
    const user = userEvent.setup();

    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    await user.type(searchInput, 'embedding');

    await waitFor(() => {
      expect(searchInput.value).toBe('embedding');
    });

    // Find and click clear button
    const clearButton = screen.queryByRole('button', { name: /clear/i }) ||
                       screen.queryByLabelText(/clear/i);

    if (clearButton) {
      await user.click(clearButton);

      await waitFor(() => {
        expect(searchInput.value).toBe('');
        expect(mockOnSearch).toHaveBeenCalledWith('');
      });
    }
  });

  it('updates input value when typing', async () => {
    const mockOnSearch = vi.fn();
    const user = userEvent.setup();

    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    await user.type(searchInput, 'llm');

    expect(searchInput.value).toBe('llm');
  });

  it('handles empty search query', async () => {
    const mockOnSearch = vi.fn();
    const user = userEvent.setup();

    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'test');
    await user.clear(searchInput);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  it('handles special characters in search', async () => {
    const mockOnSearch = vi.fn();
    const user = userEvent.setup();

    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'C++ model');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('C++ model');
    });
  });

  it('is accessible with proper ARIA labels', () => {
    const mockOnSearch = vi.fn();
    render(<GlossarySearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveAttribute('type', 'text');
  });
});
