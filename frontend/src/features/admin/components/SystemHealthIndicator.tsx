import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { Activity, Clock, Database, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { SystemHealth } from '../types';

interface SystemHealthIndicatorProps {
  health: SystemHealth;
}

const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({ health }) => {
  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      case 'critical':
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusIcon = (status: SystemHealth['status']) => {
    const className = `h-6 w-6 ${getStatusColor(status)}`;
    switch (status) {
      case 'healthy':
        return <CheckCircle className={className} />;
      case 'warning':
        return <AlertTriangle className={className} />;
      case 'critical':
        return <XCircle className={className} />;
    }
  };

  const getStatusBgColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-900/20';
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20';
    }
  };

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Status */}
          <div
            className={`p-4 rounded-lg ${getStatusBgColor(health.status)} flex items-center justify-between`}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(health.status)}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  System Status
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {health.status}
                </p>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  API Response Time
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {health.apiResponseTime}ms
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {(health.errorRate * 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Database Size</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatBytes(health.databaseSize)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthIndicator;
