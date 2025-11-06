import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export const EventsWidget: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
        Events Coming Soon
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
        We're working on bringing you community events, webinars, and meetups.
        Stay tuned!
      </p>
      <div className="mt-4 inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Clock className="w-3 h-3" />
        <span>Available in a future update</span>
      </div>
    </div>
  );
};
