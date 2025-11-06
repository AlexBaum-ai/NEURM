/**
 * UserActionsDropdown Component Unit Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import UserActionsDropdown from '../UserActionsDropdown';
import type { User } from '../../types';

// Mock hooks
const mockOnSuspend = vi.fn();
const mockOnBan = vi.fn();
const mockOnDelete = vi.fn();
const mockOnVerify = vi.fn();
const mockOnChangeRole = vi.fn();

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  role: 'USER',
  status: 'ACTIVE',
  isEmailVerified: false,
  createdAt: new Date('2025-01-01'),
  lastLoginAt: new Date('2025-01-15'),
};

describe('UserActionsDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render actions dropdown button', () => {
    render(
      <UserActionsDropdown
        user={mockUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    expect(button).toBeInTheDocument();
  });

  it('should open dropdown menu on click', async () => {
    render(
      <UserActionsDropdown
        user={mockUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/suspend/i)).toBeInTheDocument();
      expect(screen.getByText(/ban/i)).toBeInTheDocument();
      expect(screen.getByText(/delete/i)).toBeInTheDocument();
    });
  });

  it('should call onSuspend when suspend action is clicked', async () => {
    render(
      <UserActionsDropdown
        user={mockUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(button);

    const suspendButton = await screen.findByText(/suspend/i);
    fireEvent.click(suspendButton);

    expect(mockOnSuspend).toHaveBeenCalledWith(mockUser);
  });

  it('should call onBan when ban action is clicked', async () => {
    render(
      <UserActionsDropdown
        user={mockUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(button);

    const banButton = await screen.findByText(/ban/i);
    fireEvent.click(banButton);

    expect(mockOnBan).toHaveBeenCalledWith(mockUser);
  });

  it('should call onDelete when delete action is clicked', async () => {
    render(
      <UserActionsDropdown
        user={mockUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(button);

    const deleteButton = await screen.findByText(/delete/i);
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockUser);
  });

  it('should show verify email option for unverified users', async () => {
    render(
      <UserActionsDropdown
        user={mockUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(button);

    const verifyButton = await screen.findByText(/verify email/i);
    expect(verifyButton).toBeInTheDocument();

    fireEvent.click(verifyButton);
    expect(mockOnVerify).toHaveBeenCalledWith(mockUser);
  });

  it('should not show verify email option for verified users', async () => {
    const verifiedUser = { ...mockUser, isEmailVerified: true };

    render(
      <UserActionsDropdown
        user={verifiedUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/verify email/i)).not.toBeInTheDocument();
    });
  });

  it('should disable destructive actions for SUSPENDED users', async () => {
    const suspendedUser = { ...mockUser, status: 'SUSPENDED' };

    render(
      <UserActionsDropdown
        user={suspendedUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(button);

    const suspendButton = await screen.findByText(/suspend/i);
    expect(suspendButton).toHaveAttribute('aria-disabled', 'true');
  });

  it('should disable all actions for BANNED users', async () => {
    const bannedUser = { ...mockUser, status: 'BANNED' };

    render(
      <UserActionsDropdown
        user={bannedUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(button);

    await waitFor(() => {
      const banButton = screen.getByText(/ban/i);
      expect(banButton).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('should have proper accessibility attributes', () => {
    render(
      <UserActionsDropdown
        user={mockUser}
        onSuspend={mockOnSuspend}
        onBan={mockOnBan}
        onDelete={mockOnDelete}
        onVerify={mockOnVerify}
        onChangeRole={mockOnChangeRole}
      />
    );

    const button = screen.getByRole('button', { name: /actions/i });
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
