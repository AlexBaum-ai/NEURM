import React, { useState, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useApplications, useWithdrawApplication, useExportApplications } from '../hooks/useApplications';
import { StatusSummaryCards } from '../components/applications/StatusSummaryCards';
import { ApplicationCard } from '../components/applications/ApplicationCard';
import { ApplicationDetail } from '../components/applications/ApplicationDetail';
import { ApplicationEmptyState } from '../components/applications/ApplicationEmptyState';
import type { Application, ApplicationFilterType } from '../types';
import { toast } from 'react-hot-toast';

const ApplicationsPageContent: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<ApplicationFilterType>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data } = useApplications(activeFilter);
  const withdrawMutation = useWithdrawApplication();
  const exportMutation = useExportApplications();

  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedApplication(null);
  };

  const handleWithdraw = async (applicationId: string) => {
    try {
      await withdrawMutation.mutateAsync(applicationId);
      toast.success('Application withdrawn successfully');
      handleCloseDetail();
    } catch (error: any) {
      toast.error(error.message || 'Failed to withdraw application');
    }
  };

  const handleExport = async () => {
    try {
      await exportMutation.mutateAsync();
      toast.success('Applications exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export applications');
    }
  };

  const tabs: Array<{ label: string; value: ApplicationFilterType; count?: number }> = [
    { label: 'All', value: 'all', count: data.stats.totalApplied },
    { label: 'Active', value: 'active', count: data.stats.inProgress },
    { label: 'Interviews', value: 'interviews', count: data.stats.interviews },
    { label: 'Offers', value: 'offers', count: data.stats.offers },
    { label: 'Rejected', value: 'rejected', count: data.stats.rejected },
    { label: 'Withdrawn', value: 'withdrawn', count: data.stats.withdrawn },
  ];

  return (
    <>
      <Helmet>
        <title>My Applications - Neurmatic</title>
        <meta name="description" content="Track and manage your job applications" />
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track and manage all your job applications in one place
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending || data.applications.length === 0}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {exportMutation.isPending ? 'Exporting...' : 'Export'}
          </button>
        </div>

        {/* Summary Cards */}
        <StatusSummaryCards stats={data.stats} />

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${
                    activeFilter === tab.value
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs
                      ${
                        activeFilter === tab.value
                          ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Applications List */}
        {data.applications.length === 0 ? (
          <ApplicationEmptyState filter={activeFilter} />
        ) : (
          <div className="space-y-4">
            {data.applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onClick={handleApplicationClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Application Detail Drawer */}
      <ApplicationDetail
        application={selectedApplication}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onWithdraw={handleWithdraw}
        isWithdrawing={withdrawMutation.isPending}
      />
    </>
  );
};

export const ApplicationsPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ApplicationsPageContent />
    </Suspense>
  );
};

export default ApplicationsPage;
