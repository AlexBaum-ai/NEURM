import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bell, Plus, Edit, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import {
  useJobAlerts,
  useCreateJobAlert,
  useUpdateJobAlert,
  useDeleteJobAlert,
  useTestJobAlert,
} from '../hooks';
import { AlertForm } from '../components/alerts/AlertForm';
import { Card } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { Badge } from '@/components/common/Badge/Badge';
import { Modal } from '@/components/common/Modal/Modal';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import type { JobAlert, CreateAlertRequest } from '../types';
import { cn } from '@/lib/utils';

export const JobAlertsPage: React.FC = () => {
  const { data: alerts, isLoading, error } = useJobAlerts();
  const createAlertMutation = useCreateJobAlert();
  const updateAlertMutation = useUpdateJobAlert();
  const deleteAlertMutation = useDeleteJobAlert();
  const testAlertMutation = useTestJobAlert();

  const [isCreating, setIsCreating] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);

  const handleCreateAlert = async (data: CreateAlertRequest) => {
    try {
      await createAlertMutation.mutateAsync(data);
      toast.success('Alert created successfully!');
      setIsCreating(false);
    } catch (err) {
      toast.error('Failed to create alert. Please try again.');
    }
  };

  const handleUpdateAlert = async (data: CreateAlertRequest) => {
    if (!editingAlert) return;

    try {
      await updateAlertMutation.mutateAsync({ id: editingAlert.id, data });
      toast.success('Alert updated successfully!');
      setEditingAlert(null);
    } catch (err) {
      toast.error('Failed to update alert. Please try again.');
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await deleteAlertMutation.mutateAsync(id);
      toast.success('Alert deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete alert. Please try again.');
    }
  };

  const handleToggleActive = async (alert: JobAlert) => {
    try {
      await updateAlertMutation.mutateAsync({
        id: alert.id,
        data: { isActive: !alert.isActive },
      });
      toast.success(alert.isActive ? 'Alert paused' : 'Alert activated');
    } catch (err) {
      toast.error('Failed to update alert status');
    }
  };

  const handleTestAlert = async (id: string) => {
    try {
      const result = await testAlertMutation.mutateAsync(id);
      toast.success(result.message || 'Test email sent!');
    } catch (err) {
      toast.error('Failed to send test email');
    }
  };

  const emailFrequencyLabels = {
    instant: 'Instant',
    daily: 'Daily',
    weekly: 'Weekly',
  };

  return (
    <>
      <Helmet>
        <title>Job Alerts | Neurmatic</title>
        <meta
          name="description"
          content="Manage your job alerts and get notified about new opportunities."
        />
      </Helmet>

      <div className="container-custom py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Job Alerts
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Get notified when new jobs match your criteria
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Alert
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-8 text-center">
            <p className="text-accent-600 dark:text-accent-400 mb-4">
              Failed to load alerts. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && alerts?.length === 0 && (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Alerts Set Up
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create your first job alert to get notified when new opportunities match
              your preferences.
            </p>
            <Button onClick={() => setIsCreating(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Alert
            </Button>
          </Card>
        )}

        {/* Alerts List */}
        {!isLoading && !error && alerts && alerts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {alerts.map((alert) => (
              <Card key={alert.id} className={cn(!alert.isActive && 'opacity-60')}>
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {alert.isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {alert.isActive ? 'Active Alert' : 'Paused'}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {emailFrequencyLabels[alert.emailFrequency]}
                    </Badge>
                  </div>

                  {/* Criteria */}
                  <div className="space-y-3 mb-4">
                    {alert.keywords.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Keywords
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {alert.keywords.map((keyword) => (
                            <Badge key={keyword} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.location && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Location
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {alert.location}
                          {alert.remote && ' (Remote only)'}
                        </p>
                      </div>
                    )}

                    {alert.experienceLevels.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Experience Levels
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {alert.experienceLevels.map((level) => (
                            <Badge key={level} variant="secondary" className="text-xs">
                              {level}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.models.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Models
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {alert.models.map((model) => (
                            <Badge key={model} variant="tech" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(alert.salaryMin || alert.salaryMax) && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Salary Range
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {alert.salaryMin
                            ? `$${(alert.salaryMin / 1000).toFixed(0)}k`
                            : 'Any'}{' '}
                          -{' '}
                          {alert.salaryMax
                            ? `$${(alert.salaryMax / 1000).toFixed(0)}k`
                            : 'Any'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Last Sent */}
                  {alert.lastSent && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Last sent {formatDistanceToNow(new Date(alert.lastSent), { addSuffix: true })}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(alert)}
                      disabled={updateAlertMutation.isPending}
                    >
                      {alert.isActive ? 'Pause' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAlert(alert)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestAlert(alert.id)}
                      disabled={testAlertMutation.isPending}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                      disabled={deleteAlertMutation.isPending}
                      className="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create Job Alert"
      >
        <AlertForm
          onSubmit={handleCreateAlert}
          onCancel={() => setIsCreating(false)}
          isSubmitting={createAlertMutation.isPending}
        />
      </Modal>

      {/* Edit Alert Modal */}
      <Modal
        isOpen={!!editingAlert}
        onClose={() => setEditingAlert(null)}
        title="Edit Job Alert"
      >
        {editingAlert && (
          <AlertForm
            initialData={editingAlert}
            onSubmit={handleUpdateAlert}
            onCancel={() => setEditingAlert(null)}
            isSubmitting={updateAlertMutation.isPending}
          />
        )}
      </Modal>
    </>
  );
};

export default JobAlertsPage;
