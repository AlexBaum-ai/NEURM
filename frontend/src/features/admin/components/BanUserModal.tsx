import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldX, X } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Label } from '@/components/forms/Label';
import { Textarea } from '@/components/forms/Textarea';
import toast from 'react-hot-toast';
import type { AdminUser, BanUserPayload } from '../types';

const banSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  notifyUser: z.boolean(),
  confirmUsername: z.string(),
});

type BanFormData = z.infer<typeof banSchema>;

interface BanUserModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onBan: (payload: BanUserPayload) => Promise<void>;
}

export const BanUserModal: React.FC<BanUserModalProps> = ({ user, isOpen, onClose, onBan }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<BanFormData>({
    resolver: zodResolver(banSchema),
    defaultValues: {
      reason: '',
      notifyUser: true,
      confirmUsername: '',
    },
  });

  const confirmUsername = watch('confirmUsername');
  const isConfirmed = confirmUsername === user.username;

  const onSubmit = async (data: BanFormData) => {
    if (!isConfirmed) {
      toast.error('Username confirmation does not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: BanUserPayload = {
        userId: user.id,
        reason: data.reason,
        notifyUser: data.notifyUser,
      };

      await onBan(payload);
      toast.success('User banned successfully');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to ban user');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <ShieldX className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Ban User Permanently
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
              WARNING: This is a permanent action!
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              You are about to permanently ban <strong>{user.displayName}</strong> ({user.email}).
              This will:
            </p>
            <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
              <li>Immediately revoke all access to the platform</li>
              <li>Hide all their content from public view</li>
              <li>Prevent them from creating new accounts with this email</li>
            </ul>
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              {...register('reason')}
              rows={4}
              placeholder="Explain why this user is being permanently banned..."
              className="mt-1"
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmUsername">
              Type <strong>{user.username}</strong> to confirm
            </Label>
            <Input
              type="text"
              id="confirmUsername"
              {...register('confirmUsername')}
              placeholder={user.username}
              className="mt-1"
            />
            {confirmUsername && !isConfirmed && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">Username does not match</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              id="notifyUser"
              {...register('notifyUser')}
              className="w-4 h-4"
            />
            <Label htmlFor="notifyUser" className="font-normal">
              Send notification email to user
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !isConfirmed}
            >
              {isSubmitting ? 'Banning...' : 'Ban User Permanently'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BanUserModal;
