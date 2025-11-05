import React, { useState, Suspense, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { KanbanBoard } from '../components/ats/KanbanBoard';
import { ListView } from '../components/ats/ListView';
import { FiltersBar } from '../components/ats/FiltersBar';
import { ApplicantDetailPanel } from '../components/ats/ApplicantDetailPanel';
import {
  useCompanyApplications,
  useUpdateApplicationStatus,
  useRateApplicant,
  useAddApplicationNote,
  useShareApplication,
} from '../hooks/useATS';
import type { ATSApplicant, ATSFilters, ATSStatus } from '../types';
import toast from 'react-hot-toast';

type ViewMode = 'kanban' | 'list';

const ATSDashboardContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<ATSFilters>({});
  const [selectedApplicant, setSelectedApplicant] = useState<ATSApplicant | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Fetch applications with real-time polling (60s)
  const { data } = useCompanyApplications(filters);

  // Mutations
  const updateStatusMutation = useUpdateApplicationStatus();
  const rateApplicantMutation = useRateApplicant();
  const addNoteMutation = useAddApplicationNote();
  const shareApplicationMutation = useShareApplication();

  // Handle applicant click
  const handleApplicantClick = useCallback((applicant: ATSApplicant) => {
    setSelectedApplicant(applicant);
    setIsDetailOpen(true);
  }, []);

  // Handle close detail panel
  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedApplicant(null);
  }, []);

  // Handle status change (from Kanban drag-drop or detail panel)
  const handleStatusChange = useCallback(
    async (applicantId: string, newStatus: ATSStatus, note?: string) => {
      try {
        await updateStatusMutation.mutateAsync({
          id: applicantId,
          data: { status: newStatus, note },
        });
        toast.success('Status updated successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to update status');
        throw error;
      }
    },
    [updateStatusMutation]
  );

  // Handle rating change
  const handleRatingChange = useCallback(
    async (rating: number) => {
      if (!selectedApplicant) return;
      try {
        await rateApplicantMutation.mutateAsync({
          id: selectedApplicant.id,
          data: { rating },
        });
      } catch (error: any) {
        throw error;
      }
    },
    [selectedApplicant, rateApplicantMutation]
  );

  // Handle add note
  const handleAddNote = useCallback(
    async (note: string) => {
      if (!selectedApplicant) return;
      try {
        await addNoteMutation.mutateAsync({
          id: selectedApplicant.id,
          data: { note },
        });
      } catch (error: any) {
        throw error;
      }
    },
    [selectedApplicant, addNoteMutation]
  );

  // Handle share
  const handleShare = useCallback(
    async (userIds: string[]) => {
      if (!selectedApplicant) return;
      try {
        await shareApplicationMutation.mutateAsync({
          id: selectedApplicant.id,
          data: { userIds },
        });
        toast.success('Application shared successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to share application');
        throw error;
      }
    },
    [selectedApplicant, shareApplicationMutation]
  );

  // Extract unique jobs for filter dropdown
  const uniqueJobs = Array.from(
    new Map(data.applicants.map((app) => [app.job.id, app.job])).values()
  );

  return (
    <>
      <Helmet>
        <title>Applicant Tracking System - Neurmatic</title>
        <meta
          name="description"
          content="Manage and track job applicants with our comprehensive ATS dashboard"
        />
      </Helmet>

      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Applicant Tracking System
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your candidates through the hiring pipeline
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`
                px-4 py-2 rounded-md flex items-center gap-2 transition-colors
                ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                px-4 py-2 rounded-md flex items-center gap-2 transition-colors
                ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.stats.submitted}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Submitted</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {data.stats.screening}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Screening</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.stats.interview}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Interview</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.stats.offer}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Offer</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {data.stats.hired}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Hired</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FiltersBar filters={filters} onFiltersChange={setFilters} jobs={uniqueJobs} />
        </div>

        {/* Main Content - Kanban or List View */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            applicants={data.applicants}
            onApplicantClick={handleApplicantClick}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <ListView applicants={data.applicants} onApplicantClick={handleApplicantClick} />
          </div>
        )}

        {/* Empty State */}
        {data.applicants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No applicants found matching your filters
            </p>
            <Button variant="outline" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <ApplicantDetailPanel
        applicant={selectedApplicant}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onStatusChange={async (status, note) => {
          if (selectedApplicant) {
            await handleStatusChange(selectedApplicant.id, status, note);
          }
        }}
        onRatingChange={handleRatingChange}
        onAddNote={handleAddNote}
        onShare={handleShare}
        isLoading={
          updateStatusMutation.isPending ||
          rateApplicantMutation.isPending ||
          addNoteMutation.isPending ||
          shareApplicationMutation.isPending
        }
      />
    </>
  );
};

export const ATSDashboard: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      }
    >
      <ATSDashboardContent />
    </Suspense>
  );
};

export default ATSDashboard;
