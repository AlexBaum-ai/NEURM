import React, { useState } from 'react';
import { useCompanyAnalytics, useExportAnalyticsPDF } from '../hooks/useAnalytics';
import {
  MetricCard,
  ApplicationsChart,
  FunnelChart,
  ExperienceLevelChart,
  TrafficSourcesChart,
  JobPerformanceTable,
  DateRangeSelector,
} from '../components/analytics';
import { Briefcase, Users, TrendingUp, Clock, Download, AlertCircle } from 'lucide-react';
import type { DateRangeFilter, JobAnalytics } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';

// TODO: Replace with actual companyId from auth context or route params
const MOCK_COMPANY_ID = '1';

export const AnalyticsDashboardPage: React.FC = () => {
  const [_selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const {
    data: analytics,
    dateFilter,
    setDateFilter,
  } = useCompanyAnalytics(MOCK_COMPANY_ID, { range: '30' });

  const exportPDF = useExportAnalyticsPDF();

  const handleExportPDF = () => {
    exportPDF.mutate(
      { companyId: MOCK_COMPANY_ID, dateFilter },
      {
        onSuccess: () => {
          alert('Analytics exported successfully!');
        },
        onError: () => {
          alert('Failed to export analytics. Please try again.');
        },
      }
    );
  };

  const handleJobRowClick = (jobId: string) => {
    setSelectedJobId(jobId);
    // In a real implementation, this would navigate to a detailed job analytics view
    // or open a modal with detailed job-specific analytics
    alert(`Viewing detailed analytics for job ID: ${jobId}`);
  };

  return (
    <div className="container-custom py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your recruitment performance and insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateFilter} onChange={setDateFilter} />
          <Button
            onClick={handleExportPDF}
            disabled={exportPDF.isPending}
            className="inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {exportPDF.isPending ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Jobs"
          value={analytics.summary.totalJobs}
          icon={Briefcase}
          tooltip="Total number of active job postings"
        />
        <MetricCard
          title="Total Applications"
          value={analytics.summary.totalApplications.toLocaleString()}
          icon={Users}
          tooltip="Total applications received across all jobs"
        />
        <MetricCard
          title="Avg Match Score"
          value={`${analytics.summary.avgMatchScore.toFixed(1)}%`}
          icon={TrendingUp}
          description="Quality of candidate matches"
          tooltip="Average match score of all applicants"
        />
        <MetricCard
          title="Avg Time to Hire"
          value={`${analytics.summary.avgTimeToHire} days`}
          icon={Clock}
          tooltip="Average time from application to hire"
        />
      </div>

      {/* Applications Over Time Chart */}
      <ApplicationsChart data={analytics.timeSeries} />

      {/* Two-column layout for funnel and pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart data={analytics.funnel} />
        <ExperienceLevelChart data={analytics.experienceLevel} />
      </div>

      {/* Traffic Sources Chart */}
      <TrafficSourcesChart data={analytics.trafficSources} />

      {/* Job Performance Table */}
      <JobPerformanceTable data={analytics.jobPerformance} onRowClick={handleJobRowClick} />

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Analytics Tips
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>
                  • <strong>Conversion Rate:</strong> Higher is better. Target 5%+ for quality job
                  postings
                </li>
                <li>
                  • <strong>Match Score:</strong> Scores above 80% indicate excellent candidate-job
                  alignment
                </li>
                <li>
                  • <strong>Time to Hire:</strong> Industry average is 30-45 days. Monitor trends
                  to optimize
                </li>
                <li>
                  • Click on any job in the performance table to view detailed analytics for that
                  position
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboardPage;
