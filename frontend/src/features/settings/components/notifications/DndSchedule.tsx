import React from 'react';
import type { DndSchedule as DndScheduleType } from '../../types/notifications.types';
import { DAYS_OF_WEEK } from '../../constants/notificationConfig';

interface DndScheduleProps {
  schedule: DndScheduleType;
  onChange: (schedule: DndScheduleType) => void;
}

const DndSchedule: React.FC<DndScheduleProps> = ({ schedule, onChange }) => {
  const handleToggle = () => {
    onChange({
      ...schedule,
      enabled: !schedule.enabled,
    });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    onChange({
      ...schedule,
      [field]: value,
    });
  };

  const handleDayToggle = (day: number) => {
    const newDays = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day].sort();

    onChange({
      ...schedule,
      days: newDays,
    });
  };

  const handleTimezoneChange = (timezone: string) => {
    onChange({
      ...schedule,
      timezone,
    });
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Do Not Disturb Schedule
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Pause notifications during specific times
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={schedule.enabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {schedule.enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-primary-200 dark:border-primary-800">
          {/* Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="dnd-start-time"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Start Time
              </label>
              <input
                id="dnd-start-time"
                type="time"
                value={schedule.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="dnd-end-time"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                End Time
              </label>
              <input
                id="dnd-end-time"
                type="time"
                value={schedule.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Active Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle(day.value)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      schedule.days.includes(day.value)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <span className="hidden sm:inline">{day.label}</span>
                  <span className="sm:hidden">{day.short}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {schedule.days.length === 0 && 'Select at least one day'}
              {schedule.days.length === 7 && 'Every day'}
              {schedule.days.length > 0 && schedule.days.length < 7 && (
                <>
                  {schedule.days
                    .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.short)
                    .join(', ')}
                </>
              )}
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="dnd-timezone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Timezone
            </label>
            <select
              id="dnd-timezone"
              value={schedule.timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Europe/Amsterdam">Amsterdam (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="Australia/Sydney">Sydney (AEST)</option>
            </select>
          </div>

          {/* Summary */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="font-medium">Active:</span> {schedule.startTime} - {schedule.endTime}{' '}
              {schedule.timezone}
              {schedule.days.length > 0 && (
                <>
                  {' '}
                  on{' '}
                  {schedule.days.length === 7
                    ? 'all days'
                    : schedule.days
                        .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.label)
                        .join(', ')}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DndSchedule;
