import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageUploadButton } from '../ImageUploadButton';

describe('ImageUploadButton', () => {
  it('renders upload button with default text', () => {
    const onImageSelect = vi.fn();
    render(<ImageUploadButton onImageSelect={onImageSelect} />);

    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('shows custom button text when provided', () => {
    const onImageSelect = vi.fn();
    render(
      <ImageUploadButton onImageSelect={onImageSelect} buttonText="Upload Avatar" />
    );

    expect(screen.getByText('Upload Avatar')).toBeInTheDocument();
  });

  it('validates file type', async () => {
    const onImageSelect = vi.fn();
    render(<ImageUploadButton onImageSelect={onImageSelect} />);

    const button = screen.getByText('Upload Image');
    const input = button.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    Object.defineProperty(input, 'files', {
      value: [invalidFile],
      writable: false,
    });

    fireEvent.change(input);

    expect(screen.getByText(/Invalid file format/i)).toBeInTheDocument();
    expect(onImageSelect).not.toHaveBeenCalled();
  });

  it('validates file size', async () => {
    const onImageSelect = vi.fn();
    render(<ImageUploadButton onImageSelect={onImageSelect} maxSize={1} />);

    const button = screen.getByText('Upload Image');
    const input = button.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    // Create file larger than 1MB
    const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });

    fireEvent.change(input);

    expect(screen.getByText(/File size exceeds/i)).toBeInTheDocument();
    expect(onImageSelect).not.toHaveBeenCalled();
  });

  it('calls onImageSelect with valid file', () => {
    const onImageSelect = vi.fn();
    render(<ImageUploadButton onImageSelect={onImageSelect} />);

    const button = screen.getByText('Upload Image');
    const input = button.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    Object.defineProperty(input, 'files', {
      value: [validFile],
      writable: false,
    });

    fireEvent.change(input);

    expect(onImageSelect).toHaveBeenCalledWith(validFile);
  });

  it('shows loading state when isLoading is true', () => {
    const onImageSelect = vi.fn();
    render(<ImageUploadButton onImageSelect={onImageSelect} isLoading={true} />);

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    const onImageSelect = vi.fn();
    render(<ImageUploadButton onImageSelect={onImageSelect} disabled={true} />);

    const button = screen.getByText('Upload Image');
    expect(button).toBeDisabled();
  });
});
