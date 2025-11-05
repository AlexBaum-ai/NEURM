import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { resetPassword } from '../api/authApi';
import { resetPasswordSchema, type ResetPasswordFormData } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isSuccess, setIsSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('root', { message: 'Invalid or missing reset token' });
      setHasError(true);
      return;
    }

    try {
      await resetPassword(token, data.password);
      setIsSuccess(true);

      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Failed to reset password';
      setError('root', { message });

      // Check if token is expired/invalid
      if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid')) {
        setHasError(true);
      }
    }
  };

  // Show error state if no token or if reset failed with expired/invalid token
  if (!token || hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Reset Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Invalid or Expired Link
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                {errors.root?.message || 'This password reset link is invalid or has expired.'}
              </p>
              <div className="space-y-3 w-full">
                <Link to="/forgot-password" className="block w-full">
                  <Button variant="default" className="w-full">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link to="/" className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  Return to Home
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Password Reset Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Password Reset Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Redirecting to home page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your new password below. Make sure it's strong and secure.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && !hasError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  {errors.root.message}
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                New Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                error={errors.password?.message}
                {...register('password')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Confirm New Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Back to Home
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
