import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import { useToast } from '@/hooks/useToast';
import { changeEmail, changePassword } from '../api/settingsApi';
import { changeEmailSchema, changePasswordSchema } from '../types';
import type { ChangeEmailFormData, ChangePasswordFormData } from '../types';

interface AccountTabProps {
  currentEmail: string;
}

const AccountTab: React.FC<AccountTabProps> = ({ currentEmail }) => {
  const { toast } = useToast();
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);

  // Email change form
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
    reset: resetEmail,
  } = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
  });

  const changeEmailMutation = useMutation({
    mutationFn: changeEmail,
    onSuccess: (data) => {
      toast.success(data.message || 'Verification email sent. Please check your inbox.');
      setEmailChangeRequested(true);
      resetEmail();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change email');
    },
  });

  const onSubmitEmail = (data: ChangeEmailFormData) => {
    changeEmailMutation.mutate(data);
  };

  // Password change form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      toast.success(data.message || 'Password changed successfully');
      resetPassword();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  const onSubmitPassword = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Change Email */}
      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Email
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">{currentEmail}</p>
            </div>

            {emailChangeRequested && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  A verification email has been sent to your new email address. Please verify within
                  24 hours.
                </p>
              </div>
            )}

            <Input
              label="New Email"
              type="email"
              placeholder="new@example.com"
              error={emailErrors.newEmail?.message}
              {...registerEmail('newEmail')}
            />

            <Input
              label="Current Password"
              type="password"
              placeholder="Enter your current password"
              error={emailErrors.password?.message}
              {...registerEmail('password')}
            />

            <Button
              type="submit"
              disabled={changeEmailMutation.isPending}
              className="w-full sm:w-auto"
            >
              {changeEmailMutation.isPending ? 'Sending...' : 'Change Email'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter your current password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Enter new password"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword')}
            />

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
                <li>Contains at least one special character</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="w-full sm:w-auto"
            >
              {changePasswordMutation.isPending ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountTab;
