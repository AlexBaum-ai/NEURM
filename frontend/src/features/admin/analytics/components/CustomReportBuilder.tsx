import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import { Settings, Download, Calendar, BarChart3, LineChart, PieChart, AreaChart } from 'lucide-react';
import { useExportAnalytics } from '@/features/admin/hooks/useAnalytics';
import DateRangePicker from '@/features/admin/components/DateRangePicker';
import type { DateRange } from '@/features/admin/types';

const CustomReportBuilder: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    preset: '30days',
  });

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'user_growth',
    'engagement',
    'revenue',
  ]);

  const [includeCharts, setIncludeCharts] = useState(true);

  const exportMutation = useExportAnalytics();

  const availableMetrics = [
    { id: 'user_growth', label: 'User Growth', icon: LineChart, color: 'blue' },
    { id: 'engagement', label: 'Engagement', icon: BarChart3, color: 'green' },
    { id: 'revenue', label: 'Revenue', icon: AreaChart, color: 'purple' },
    { id: 'content', label: 'Content Performance', icon: PieChart, color: 'orange' },
    { id: 'traffic', label: 'Traffic Sources', icon: PieChart, color: 'indigo' },
    { id: 'retention', label: 'Retention', icon: LineChart, color: 'pink' },
  ];

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId)
        ? prev.filter((id) => id !== metricId)
        : [...prev, metricId]
    );
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    exportMutation.mutate({
      format,
      metrics: selectedMetrics,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      includeCharts: format === 'pdf' ? includeCharts : undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-primary-600" />
          <CardTitle>Custom Report Builder</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <Calendar className="h-4 w-4 inline mr-2" />
            Date Range
          </label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Metrics Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Metrics
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableMetrics.map((metric) => {
              const Icon = metric.icon;
              const isSelected = selectedMetrics.includes(metric.id);

              return (
                <button
                  key={metric.id}
                  onClick={() => toggleMetric(metric.id)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? `border-${metric.color}-500 bg-${metric.color}-50 dark:bg-${metric.color}-900/20`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? `bg-${metric.color}-100 dark:bg-${metric.color}-900/30`
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected
                          ? `text-${metric.color}-600 dark:text-${metric.color}-400`
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <div
                      className={`text-sm font-medium ${
                        isSelected
                          ? `text-${metric.color}-900 dark:text-${metric.color}-100`
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {metric.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCharts}
              onChange={(e) => setIncludeCharts(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Include charts in PDF export
            </span>
          </label>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleExport('csv')}
            disabled={exportMutation.isPending || selectedMetrics.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Download className="h-4 w-4" />
            Export as CSV
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportMutation.isPending || selectedMetrics.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Download className="h-4 w-4" />
            Export as PDF
          </button>
        </div>

        {selectedMetrics.length === 0 && (
          <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            Please select at least one metric to generate a report.
          </div>
        )}

        {exportMutation.isPending && (
          <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            Generating report... Please wait.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomReportBuilder;
