import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Input } from '@/components/common/Input/Input';
import { Button } from '@/components/common/Button/Button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/common/Modal/Modal';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/authStore';
import { deleteAccount, requestDataExport, getDataExportStatus } from '../api/settingsApi';
import { deleteAccountSchema } from '../types';
import type { DeleteAccountFormData } from '../types';

const DangerZoneTab: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');

  // Data export status
  const { data: exportStatus, refetch: refetchExportStatus } = useQuery({
    queryKey: ['dataExport'],
    queryFn: getDataExportStatus,
    refetchInterval: (query) => {
      // Poll every 5 seconds if processing
      return query.state.data?.status === 'processing' ? 5000 : false;
    },
  });

  const requestExportMutation = useMutation({
    mutationFn: requestDataExport,
    onSuccess: () => {
      toast.success('Data export requested. You will receive an email when your data is ready.');
      refetchExportStatus();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request data export');
    },
  });

  // Delete account form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: ({ password, captcha }: { password: string; captcha: string }) =>
      deleteAccount(password, captcha),
    onSuccess: () => {
      toast.success('Account deleted successfully');
      logout();
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    },
  });

  const onSubmitDelete = (data: DeleteAccountFormData) => {
    deleteAccountMutation.mutate({
      password: data.password,
      captcha: data.captcha,
    });
  };

  // Simple CAPTCHA generator (in production, use reCAPTCHA or similar)
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [captchaCode] = useState(generateCaptcha());

  const renderExportStatus = () => {
    if (!exportStatus) {
      return (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No data export has been requested yet.
        </p>
      );
    }

    switch (exportStatus.status) {
      case 'pending':
        return (
          <div className="text-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              Export requested on {new Date(exportStatus.requestedAt).toLocaleDateString()}
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              Your export is queued and will be processed soon.
            </p>
          </div>
        );
      case 'processing':
        return (
          <div className="text-sm">
            <p className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
              Processing your data export...
            </p>
          </div>
        );
      case 'completed':
        return (
          <div className="text-sm space-y-2">
            <p className="text-green-600 dark:text-green-400">
              Your data export is ready!
            </p>
            {exportStatus.downloadUrl && (
              <a
                href={exportStatus.downloadUrl}
                download
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Download Export
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
            )}
            {exportStatus.expiresAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Expires on {new Date(exportStatus.expiresAt).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      case 'failed':
        return (
          <p className="text-sm text-accent-600 dark:text-accent-400">
            Export failed. Please try again or contact support.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download a copy of your personal data, including your profile, posts, comments, and
              other activity on Neurmatic.
            </p>

            {renderExportStatus()}

            <Button
              onClick={() => requestExportMutation.mutate()}
              disabled={
                requestExportMutation.isPending ||
                exportStatus?.status === 'pending' ||
                exportStatus?.status === 'processing'
              }
            >
              {requestExportMutation.isPending
                ? 'Requesting...'
                : exportStatus?.status === 'pending' || exportStatus?.status === 'processing'
                  ? 'Export In Progress'
                  : 'Request Data Export'}
            </Button>

            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>• The export will be in JSON format</p>
              <p>• Processing may take up to 24 hours</p>
              <p>• You will receive an email when it's ready</p>
              <p>• The download link expires after 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-accent-300 dark:border-accent-800">
        <CardHeader className="bg-accent-50 dark:bg-accent-900/20">
          <CardTitle className="text-accent-900 dark:text-accent-100">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permanently delete your Neurmatic account and all associated data. This action
                cannot be undone.
              </p>
            </div>

            <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-accent-900 dark:text-accent-100 mb-2">
                What will be deleted:
              </h4>
              <ul className="text-sm text-accent-800 dark:text-accent-200 space-y-1">
                <li>• Your profile and account information</li>
                <li>• All your posts, comments, and replies</li>
                <li>• Your job applications and saved jobs</li>
                <li>• Your badges, reputation, and achievements</li>
                <li>• All bookmarks and saved content</li>
                <li>• Your message history</li>
              </ul>
            </div>

            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Modal */}
      <Modal open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle className="text-accent-600 dark:text-accent-400">
              Delete Account
            </ModalTitle>
            <ModalDescription>
              This action is permanent and cannot be undone. All your data will be deleted.
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleSubmit(onSubmitDelete)} className="space-y-4">
            <div className="p-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-lg">
              <p className="text-sm text-accent-900 dark:text-accent-100 font-semibold mb-2">
                Before you go:
              </p>
              <ul className="text-sm text-accent-800 dark:text-accent-200 space-y-1">
                <li>• Consider exporting your data first</li>
                <li>• Cancel any active subscriptions</li>
                <li>• This will affect your reputation and contributions</li>
              </ul>
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type DELETE to confirm
              </label>
              <Input
                type="text"
                placeholder="Type DELETE"
                error={errors.confirmText?.message}
                {...register('confirmText')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CAPTCHA Verification
              </label>
              <div className="mb-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-center font-mono text-lg tracking-wider">
                {captchaCode}
              </div>
              <Input
                type="text"
                placeholder="Enter the code above"
                error={errors.captcha?.message}
                value={captchaValue}
                onChange={(e) => {
                  setCaptchaValue(e.target.value);
                  setValue('captcha', e.target.value === captchaCode ? captchaCode : '');
                }}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteAccountMutation.isPending}
                className="flex-1"
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DangerZoneTab;
