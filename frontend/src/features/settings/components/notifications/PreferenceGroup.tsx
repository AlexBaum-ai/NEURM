import React from 'react';
import type {
  NotificationTypeConfig,
  NotificationPreference,
  DeliveryChannel,
  NotificationFrequency,
} from '../../types/notifications.types';
import { FREQUENCY_OPTIONS } from '../../constants/notificationConfig';

interface PreferenceGroupProps {
  config: NotificationTypeConfig;
  preference: NotificationPreference | undefined;
  onChange: (preference: NotificationPreference) => void;
}

const PreferenceGroup: React.FC<PreferenceGroupProps> = ({ config, preference, onChange }) => {
  const currentPreference: NotificationPreference = preference || {
    notificationType: config.type,
    channel: 'in_app',
    frequency: config.defaultFrequency,
    enabled: config.defaultEnabled,
  };

  const handleToggle = () => {
    onChange({
      ...currentPreference,
      enabled: !currentPreference.enabled,
    });
  };

  const handleChannelToggle = (channel: DeliveryChannel) => {
    onChange({
      ...currentPreference,
      channel,
    });
  };

  const handleFrequencyChange = (frequency: NotificationFrequency) => {
    onChange({
      ...currentPreference,
      frequency,
      enabled: frequency !== 'off',
    });
  };

  const channels: Array<{ value: DeliveryChannel; label: string; icon: string }> = [
    { value: 'in_app', label: 'In-app', icon: '🔔' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'push', label: 'Push', icon: '📱' },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 py-6 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={currentPreference.enabled}
                onChange={handleToggle}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-primary-600 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer"
              />
              <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                {config.label}
              </span>
            </label>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 ml-8">{config.description}</p>

          {/* Channels and Frequency */}
          {currentPreference.enabled && (
            <div className="ml-8 space-y-4">
              {/* Delivery Channels */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Delivery Channels
                </label>
                <div className="flex flex-wrap gap-2">
                  {channels.map((channel) => (
                    <button
                      key={channel.value}
                      onClick={() => handleChannelToggle(channel.value)}
                      className={`
                        inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${
                          currentPreference.channel === channel.value
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 border-2 border-primary-500'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <span>{channel.icon}</span>
                      <span>{channel.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frequency Selector */}
              <div>
                <label
                  htmlFor={`frequency-${config.type}`}
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Frequency
                </label>
                <select
                  id={`frequency-${config.type}`}
                  value={currentPreference.frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value as NotificationFrequency)}
                  className="block w-full max-w-xs px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferenceGroup;
