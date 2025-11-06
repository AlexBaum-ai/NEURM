import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import type { DashboardWidget } from '../types';
import { WIDGET_METADATA } from '../utils/widgetConfigs';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidget[];
  onSave: (widgets: DashboardWidget[]) => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onSave,
}) => {
  const [localWidgets, setLocalWidgets] = useState(widgets);

  if (!isOpen) return null;

  const handleToggleWidget = (widgetId: string) => {
    setLocalWidgets((prev) =>
      prev.map((w) => (w.id === widgetId ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleSave = () => {
    onSave(localWidgets);
    onClose();
  };

  const handleCancel = () => {
    setLocalWidgets(widgets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleCancel}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Customize Dashboard
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Toggle widgets on or off to customize your dashboard. You can also drag and
              drop widgets to reorder them.
            </p>

            <div className="space-y-3">
              {localWidgets.map((widget) => {
                const metadata = WIDGET_METADATA[widget.type];
                return (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {metadata.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {metadata.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleWidget(widget.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        widget.enabled
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {widget.enabled ? (
                        <>
                          <Eye className="w-4 h-4" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hidden
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
