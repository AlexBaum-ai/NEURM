import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { DateRange, DateRangeFilter } from '../../types';

interface DateRangeSelectorProps {
  value: DateRangeFilter | undefined;
  onChange: (filter: DateRangeFilter) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ value, onChange }) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const presetRanges: Array<{ label: string; value: DateRange }> = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
  ];

  const handlePresetChange = (range: DateRange) => {
    setShowCustom(false);
    onChange({ range });
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({
        range: 'custom',
        startDate: customStart,
        endDate: customEnd,
      });
      setShowCustom(false);
    }
  };

  const currentLabel = value
    ? value.range === 'custom'
      ? `${value.startDate} to ${value.endDate}`
      : presetRanges.find((r) => r.value === value.range)?.label || 'Last 30 days'
    : 'Last 30 days';

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <select
          value={value?.range || '30'}
          onChange={(e) => {
            const selectedValue = e.target.value as DateRange;
            if (selectedValue === 'custom') {
              setShowCustom(true);
            } else {
              handlePresetChange(selectedValue);
            }
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {presetRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
          <option value="custom">Custom range...</option>
        </select>
      </div>

      {showCustom && (
        <div className="absolute top-full mt-2 right-0 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 w-80">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Apply
              </button>
              <button
                onClick={() => setShowCustom(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
