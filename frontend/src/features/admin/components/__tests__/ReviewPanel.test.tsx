/**
 * ReviewPanel Component Unit Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import ReviewPanel from '../ReviewPanel';
import type { ContentItem } from '../../types';

const mockOnApprove = vi.fn();
const mockOnReject = vi.fn();
const mockOnHide = vi.fn();
const mockOnDelete = vi.fn();
const mockOnClose = vi.fn();

const mockContentItem: ContentItem = {
  id: 'content-123',
  type: 'ARTICLE',
  title: 'Test Article',
  content: 'This is test content for moderation.',
  author: {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
  },
  status: 'PENDING',
  spamScore: 25,
  reports: [
    {
      id: 'report-1',
      reason: 'Spam content',
      reportedBy: {
        id: 'user-456',
        username: 'reporter1',
      },
      createdAt: new Date('2025-01-15'),
    },
  ],
  createdAt: new Date('2025-01-10'),
};

describe('ReviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render content details', () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText(/test content for moderation/i)).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should display spam score with color coding', () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const spamScore = screen.getByTestId('spam-score');
    expect(spamScore).toBeInTheDocument();
    expect(spamScore).toHaveTextContent('25');
  });

  it('should display reports when available', () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/spam content/i)).toBeInTheDocument();
    expect(screen.getByText('reporter1')).toBeInTheDocument();
  });

  it('should call onApprove when approve button is clicked', async () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const approveButton = screen.getByRole('button', { name: /approve/i });
    fireEvent.click(approveButton);

    expect(mockOnApprove).toHaveBeenCalledWith(mockContentItem);
  });

  it('should call onReject with reason when reject button is clicked', async () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    fireEvent.click(rejectButton);

    // Should open reject reason modal
    const reasonInput = await screen.findByPlaceholderText(/reason for rejection/i);
    fireEvent.change(reasonInput, { target: { value: 'Spam content' } });

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith(mockContentItem, 'Spam content');
    });
  });

  it('should call onHide when hide button is clicked', () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const hideButton = screen.getByRole('button', { name: /hide/i });
    fireEvent.click(hideButton);

    expect(mockOnHide).toHaveBeenCalledWith(mockContentItem);
  });

  it('should require confirmation for delete action', async () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Should show confirmation dialog
    const confirmDialog = await screen.findByText(/are you sure/i);
    expect(confirmDialog).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(mockContentItem);
    });
  });

  it('should sanitize HTML content for safe display', () => {
    const contentWithHTML = {
      ...mockContentItem,
      content: '<script>alert("xss")</script><p>Safe content</p>',
    };

    render(
      <ReviewPanel
        content={contentWithHTML}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    // Script tags should be removed
    expect(screen.queryByText(/alert/i)).not.toBeInTheDocument();

    // Safe HTML should be preserved
    expect(screen.getByText(/safe content/i)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={false}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should display content type badge', () => {
    render(
      <ReviewPanel
        content={mockContentItem}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const typeBadge = screen.getByTestId('content-type-badge');
    expect(typeBadge).toHaveTextContent('ARTICLE');
  });

  it('should highlight high spam score content', () => {
    const highSpamContent = {
      ...mockContentItem,
      spamScore: 85,
    };

    render(
      <ReviewPanel
        content={highSpamContent}
        isOpen={true}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        onHide={mockOnHide}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    const spamScore = screen.getByTestId('spam-score');
    expect(spamScore).toHaveClass('text-red-600'); // High spam score styling
  });
});
