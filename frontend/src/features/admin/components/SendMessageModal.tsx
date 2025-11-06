import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, X } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Label } from '@/components/forms/Label';
import { Textarea } from '@/components/forms/Textarea';
import toast from 'react-hot-toast';
import type { AdminUser, SendMessagePayload } from '../types';

const messageSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface SendMessageModalProps {
  user: AdminUser;
  isOpen: boolean;
  onClose: () => void;
  onSend: (payload: SendMessagePayload) => Promise<void>;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  user,
  isOpen,
  onClose,
  onSend,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: MessageFormData) => {
    setIsSubmitting(true);
    try {
      const payload: SendMessagePayload = {
        userId: user.id,
        subject: data.subject,
        message: data.message,
      };

      await onSend(payload);
      toast.success('Message sent successfully');
      reset();
      onClose();
    } catch (error) {
      toast.error('Failed to send message');
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
            <Mail className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Send Message</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Sending message to <strong>{user.displayName}</strong> ({user.email})
            </p>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              type="text"
              id="subject"
              {...register('subject')}
              placeholder="Message subject..."
              className="mt-1"
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              {...register('message')}
              rows={6}
              placeholder="Write your message..."
              className="mt-1"
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendMessageModal;
