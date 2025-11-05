import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  get2FASettings,
  enable2FA,
  verify2FA,
  disable2FA,
  regenerate2FABackupCodes,
} from '../api/settingsApi';
import { enable2FASchema, disable2FASchema } from '../types';
import type { Enable2FAFormData, Disable2FAFormData } from '../types';

const SecurityTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  const { data: twoFactorSettings, isLoading } = useQuery({
    queryKey: ['2faSettings'],
    queryFn: get2FASettings,
  });

  // Enable 2FA form
  const {
    register: registerEnable,
    handleSubmit: handleSubmitEnable,
    formState: { errors: enableErrors },
    reset: resetEnable,
  } = useForm<Enable2FAFormData>({
    resolver: zodResolver(enable2FASchema),
  });

  // Disable 2FA form
  const {
    register: registerDisable,
    handleSubmit: handleSubmitDisable,
    formState: { errors: disableErrors },
    reset: resetDisable,
  } = useForm<Disable2FAFormData>({
    resolver: zodResolver(disable2FASchema),
  });

  const enable2FAMutation = useMutation({
    mutationFn: enable2FA,
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowEnableModal(true);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enable 2FA');
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: verify2FA,
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      queryClient.invalidateQueries({ queryKey: ['2faSettings'] });
      toast.success('Two-factor authentication enabled successfully');
      resetEnable();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    },
  });

  const disable2FAMutation = useMutation({
    mutationFn: ({ password, code }: { password: string; code: string }) =>
      disable2FA(password, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2faSettings'] });
      setShowDisableModal(false);
      toast.success('Two-factor authentication disabled');
      resetDisable();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    },
  });

  const regenerateCodesMutation = useMutation({
    mutationFn: regenerate2FABackupCodes,
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      toast.success('Backup codes regenerated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to regenerate backup codes');
    },
  });

  const onSubmitEnable = (data: Enable2FAFormData) => {
    verify2FAMutation.mutate(data.code);
  };

  const onSubmitDisable = (data: Disable2FAFormData) => {
    disable2FAMutation.mutate({
      password: data.password,
      code: data.code,
    });
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'neurmatic-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add an extra layer of security to your account by requiring a verification code in
                  addition to your password.
                </p>
                {twoFactorSettings?.enabled && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    Enabled via {twoFactorSettings.method === 'totp' ? 'Authenticator App' : 'SMS'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {!twoFactorSettings?.enabled ? (
                <Button onClick={() => enable2FAMutation.mutate()} disabled={enable2FAMutation.isPending}>
                  {enable2FAMutation.isPending ? 'Setting up...' : 'Enable 2FA'}
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowDisableModal(true)}>
                    Disable 2FA
                  </Button>
                  <Button variant="outline" onClick={() => regenerateCodesMutation.mutate()}>
                    Regenerate Backup Codes
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Security Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
              <span>Use a strong, unique password that you don't use elsewhere</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
              <span>Enable two-factor authentication for enhanced security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
              <span>Regularly review your active sessions and revoke suspicious ones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 dark:text-primary-400 mt-0.5">•</span>
              <span>Keep your backup codes in a secure location</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Enable 2FA Modal */}
      <Modal open={showEnableModal} onOpenChange={setShowEnableModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Enable Two-Factor Authentication</ModalTitle>
            <ModalDescription>
              {!showBackupCodes
                ? 'Scan the QR code with your authenticator app'
                : 'Save your backup codes'}
            </ModalDescription>
          </ModalHeader>

          {!showBackupCodes ? (
            <form onSubmit={handleSubmitEnable(onSubmitEnable)} className="space-y-4">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg flex justify-center">
                  {qrCode && <img src={qrCode} alt="QR Code" className="w-48 h-48" />}
                </div>

                <div className="text-sm">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Or enter this code manually:
                  </p>
                  <code className="block p-3 bg-gray-100 dark:bg-gray-800 rounded text-center font-mono">
                    {secret}
                  </code>
                </div>

                <Input
                  label="Verification Code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  error={enableErrors.code?.message}
                  {...registerEnable('code')}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEnableModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={verify2FAMutation.isPending} className="flex-1">
                  {verify2FAMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save these backup codes in a secure location. You can use them to access your account
                if you lose access to your authenticator app.
              </p>

              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="text-center">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                  Download Codes
                </Button>
                <Button
                  onClick={() => {
                    setShowBackupCodes(false);
                    setShowEnableModal(false);
                  }}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal open={showDisableModal} onOpenChange={setShowDisableModal}>
        <ModalContent className="max-w-md">
          <ModalHeader>
            <ModalTitle>Disable Two-Factor Authentication</ModalTitle>
            <ModalDescription>
              Enter your password and a verification code to disable 2FA
            </ModalDescription>
          </ModalHeader>

          <form onSubmit={handleSubmitDisable(onSubmitDisable)} className="space-y-4">
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              error={disableErrors.password?.message}
              {...registerDisable('password')}
            />

            <Input
              label="Verification Code"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              error={disableErrors.code?.message}
              {...registerDisable('code')}
            />

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDisableModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={disable2FAMutation.isPending}
                className="flex-1"
              >
                {disable2FAMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
              </Button>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SecurityTab;
