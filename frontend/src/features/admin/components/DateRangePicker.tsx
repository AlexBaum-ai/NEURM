import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { DateRange } from '../types';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isCustom, setIsCustom] = useState(value.preset === 'custom');

  const presets = [
    { label: 'Today', value: 'today' as const },
    { label: 'Last 7 Days', value: '7days' as const },
    { label: 'Last 30 Days', value: '30days' as const },
    { label: 'Last 90 Days', value: '90days' as const },
    { label: 'Custom', value: 'custom' as const },
  ];

  const handlePresetChange = (preset: DateRange['preset']) => {
    if (preset === 'custom') {
      setIsCustom(true);
      return;
    }

    setIsCustom(false);
    const endDate = new Date().toISOString().split('T')[0];
    let startDate = endDate;

    const today = new Date();
    switch (preset) {
      case 'today':
        startDate = endDate;
        break;
      case '7days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
      case '30days':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
      case '90days':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
    }

    onChange({ startDate, endDate, preset });
  };

  const handleDateChange = (type: 'start' | 'end', date: string) => {
    const newRange = {
      ...value,
      [type === 'start' ? 'startDate' : 'endDate']: date,
      preset: 'custom' as const,
    };
    onChange(newRange);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">Date Range:</span>
      </div>

      <div className="flex items-center gap-2">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              value.preset === preset.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => handleDateChange('start', e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400">to</span>
          <input
            type="date"
            value={value.endDate}
            onChange={(e) => handleDateChange('end', e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
