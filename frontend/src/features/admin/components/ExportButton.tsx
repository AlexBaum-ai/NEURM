import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import type { ExportOptions, DateRange } from '../types';
import toast from 'react-hot-toast';

interface ExportButtonProps {
  dateRange?: DateRange;
}

const ExportButton: React.FC<ExportButtonProps> = ({ dateRange }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        dataType: 'metrics',
        dateRange,
      };

      const blob = await adminApi.exportMetrics(options);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-metrics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Dashboard exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export dashboard');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="h-4 w-4" />
        <span className="text-sm font-medium">Export CSV</span>
      </button>
      <button
        onClick={() => handleExport('pdf')}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="h-4 w-4" />
        <span className="text-sm font-medium">Export PDF</span>
      </button>
    </div>
  );
};

export default ExportButton;
