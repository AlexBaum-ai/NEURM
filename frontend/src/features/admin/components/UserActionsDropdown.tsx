import React, { useState } from 'react';
import {
  MoreVertical,
  Mail,
  MailCheck,
  MessageSquare,
  UserMinus,
  ShieldX,
  Trash2,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminUser } from '../types';
import {
  useVerifyUserEmail,
  useUnsuspendUser,
  useUnbanUser,
  useDeleteUser,
} from '../hooks/useAdminUsers';

interface UserActionsDropdownProps {
  user: AdminUser;
  onSuspend: () => void;
  onBan: () => void;
  onSendMessage: () => void;
}

export const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  user,
  onSuspend,
  onBan,
  onSendMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const verifyEmailMutation = useVerifyUserEmail();
  const unsuspendMutation = useUnsuspendUser();
  const unbanMutation = useUnbanUser();
  const deleteMutation = useDeleteUser();

  const handleVerifyEmail = async () => {
    try {
      await verifyEmailMutation.mutateAsync(user.id);
      toast.success('Email verified successfully');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to verify email');
      console.error(error);
    }
  };

  const handleUnsuspend = async () => {
    if (!confirm('Are you sure you want to remove the suspension from this user?')) {
      return;
    }

    try {
      await unsuspendMutation.mutateAsync(user.id);
      toast.success('User suspension removed');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to remove suspension');
      console.error(error);
    }
  };

  const handleUnban = async () => {
    if (!confirm('Are you sure you want to unban this user?')) {
      return;
    }

    try {
      await unbanMutation.mutateAsync(user.id);
      toast.success('User unbanned successfully');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to unban user');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    const username = prompt(
      `Type "${user.username}" to confirm deletion. This action cannot be undone.`
    );
    if (username !== user.username) {
      toast.error('Username confirmation does not match');
      return;
    }

    try {
      await deleteMutation.mutateAsync(user.id);
      toast.success('User deleted successfully');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="User actions"
      >
        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              {!user.emailVerified && (
                <button
                  onClick={handleVerifyEmail}
                  disabled={verifyEmailMutation.isPending}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <MailCheck className="w-4 h-4" />
                  Verify Email
                </button>
              )}

              <button
                onClick={() => {
                  onSendMessage();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Send Message
              </button>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              {user.status === 'suspended' ? (
                <button
                  onClick={handleUnsuspend}
                  disabled={unsuspendMutation.isPending}
                  className="w-full px-4 py-2 text-left text-sm text-green-700 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Remove Suspension
                </button>
              ) : user.status !== 'banned' ? (
                <button
                  onClick={() => {
                    onSuspend();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-yellow-700 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <UserMinus className="w-4 h-4" />
                  Suspend User
                </button>
              ) : null}

              {user.status === 'banned' ? (
                <button
                  onClick={handleUnban}
                  disabled={unbanMutation.isPending}
                  className="w-full px-4 py-2 text-left text-sm text-green-700 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  Unban User
                </button>
              ) : user.status !== 'suspended' ? (
                <button
                  onClick={() => {
                    onBan();
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <ShieldX className="w-4 h-4" />
                  Ban User
                </button>
              ) : null}

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full px-4 py-2 text-left text-sm text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserActionsDropdown;
