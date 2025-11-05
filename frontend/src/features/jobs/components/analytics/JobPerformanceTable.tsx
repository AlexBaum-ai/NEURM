import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import type { JobPerformance } from '../../types';
import { ChevronUp, ChevronDown, Eye } from 'lucide-react';

interface JobPerformanceTableProps {
  data: JobPerformance[];
  onRowClick?: (jobId: string) => void;
  title?: string;
}

type SortField = keyof JobPerformance;
type SortDirection = 'asc' | 'desc';

export const JobPerformanceTable: React.FC<JobPerformanceTableProps> = ({
  data,
  onRowClick,
  title = 'Job Performance',
}) => {
  const [sortField, setSortField] = useState<SortField>('applications');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const aNum = Number(aValue);
      const bNum = Number(bValue);
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [data, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th
                  className="text-left py-3 px-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('jobTitle')}
                >
                  Job Title
                  <SortIcon field="jobTitle" />
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('views')}
                >
                  Views
                  <SortIcon field="views" />
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('applications')}
                >
                  Applications
                  <SortIcon field="applications" />
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('conversionRate')}
                >
                  Conversion
                  <SortIcon field="conversionRate" />
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('avgMatchScore')}
                >
                  Avg Match
                  <SortIcon field="avgMatchScore" />
                </th>
                <th
                  className="text-right py-3 px-4 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => handleSort('hired')}
                >
                  Hired
                  <SortIcon field="hired" />
                </th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.map((job) => (
                <tr
                  key={job.jobId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{job.jobTitle}</td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {job.views.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    {job.applications.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-semibold ${
                        job.conversionRate > 5
                          ? 'text-green-600 dark:text-green-400'
                          : job.conversionRate > 2
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {job.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`font-semibold ${
                        job.avgMatchScore >= 80
                          ? 'text-green-600 dark:text-green-400'
                          : job.avgMatchScore >= 60
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {job.avgMatchScore.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                    {job.hired}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onRowClick?.(job.jobId)}
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                      title="View detailed analytics"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="text-xs">Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedData.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No job data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
