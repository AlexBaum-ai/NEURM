import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Label } from '@/components/forms/Label';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import toast from 'react-hot-toast';
import type { AdminUser, SuspendUserPayload } from '../types';

const suspendSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  duration: z.string(),
  notifyUser: z.boolean(),
});

type SuspendFormData = z.infer<typeof suspendSchema>;

interface SuspendUserModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: (payload: SuspendUserPayload) => Promise<void>;
}

const durationOptions = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: 'indefinite', label: 'Indefinite' },
];

export const SuspendUserModal: React.FC<SuspendUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuspend,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SuspendFormData>({
    resolver: zodResolver(suspendSchema),
    defaultValues: {
      reason: '',
      duration: '7',
      notifyUser: true,
    },
  });

  const onSubmit = async (data: SuspendFormData) => {
    setIsSubmitting(true);
    try {
      const payload: SuspendUserPayload = {
        userId: user.id,
        reason: data.reason,
        duration: data.duration === 'indefinite' ? undefined : parseInt(data.duration),
        notifyUser: data.notifyUser,
      };

      await onSuspend(payload);
      toast.success('User suspended successfully');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to suspend user');
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
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Suspend User</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              You are about to suspend <strong>{user.displayName}</strong> ({user.email}).
              They will not be able to log in during the suspension period.
            </p>
          </div>

          <div>
            <Label htmlFor="duration">Duration</Label>
            <Select id="duration" {...register('duration')} className="mt-1">
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              {...register('reason')}
              rows={4}
              placeholder="Explain why this user is being suspended..."
              className="mt-1"
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reason.message}</p>
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
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? 'Suspending...' : 'Suspend User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuspendUserModal;
