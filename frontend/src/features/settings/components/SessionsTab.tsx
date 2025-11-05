import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/common/Modal/Modal';
import { useToast } from '@/hooks/useToast';
import { getActiveSessions, revokeSession, revokeAllSessions } from '../api/settingsApi';

const SessionsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);

  const {
    data: sessions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: getActiveSessions,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const revokeSessionMutation = useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      toast.success('Session revoked successfully');
      setSessionToRevoke(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revoke session');
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      toast.success('All other sessions revoked successfully');
      setShowRevokeAllModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revoke sessions');
    },
  });

  const formatLastActive = (lastActive: string) => {
    const date = new Date(lastActive);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const otherSessions = sessions?.filter((s) => !s.isCurrent) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Sessions</CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            These are the devices currently logged into your account. If you see an unfamiliar
            session, revoke it immediately and change your password.
          </p>

          <div className="space-y-4">
            {sessions?.map((session) => (
              <div
                key={session.id}
                className={`
                  p-4 rounded-lg border
                  ${
                    session.isCurrent
                      ? 'border-primary-300 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-800'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {session.deviceName}
                      </h3>
                      {session.isCurrent && (
                        <span className="text-xs px-2 py-0.5 bg-primary-600 text-white rounded-full">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        {session.browser} on {session.os}
                      </p>
                      <p>IP: {session.ipAddress}</p>
                      {session.location && <p>Location: {session.location}</p>}
                      <p className="text-xs">Last active: {formatLastActive(session.lastActive)}</p>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSessionToRevoke(session.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {otherSessions.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="destructive"
                onClick={() => setShowRevokeAllModal(true)}
                className="w-full sm:w-auto"
              >
                Revoke All Other Sessions
              </Button>
            </div>
          )}

          {sessions?.length === 1 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                This is your only active session.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              A session is created each time you log in to Neurmatic from a new device or browser.
            </p>
            <p>
              If you see a session you don't recognize, revoke it immediately and change your
              password to secure your account.
            </p>
            <p>
              Sessions will automatically expire after 30 days of inactivity, or when you log out.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Single Session Modal */}
      <Modal open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Revoke Session</ModalTitle>
            <ModalDescription>
              Are you sure you want to revoke this session? This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setSessionToRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => sessionToRevoke && revokeSessionMutation.mutate(sessionToRevoke)}
              disabled={revokeSessionMutation.isPending}
            >
              {revokeSessionMutation.isPending ? 'Revoking...' : 'Revoke Session'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Revoke All Sessions Modal */}
      <Modal open={showRevokeAllModal} onOpenChange={setShowRevokeAllModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Revoke All Other Sessions</ModalTitle>
            <ModalDescription>
              This will log you out of all other devices and browsers. Your current session will
              remain active.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowRevokeAllModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeAllMutation.mutate()}
              disabled={revokeAllMutation.isPending}
            >
              {revokeAllMutation.isPending ? 'Revoking...' : 'Revoke All Sessions'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SessionsTab;
