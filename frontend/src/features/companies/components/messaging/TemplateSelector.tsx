import React from 'react';
import { FileText } from 'lucide-react';
import type { MessageTemplate } from '../../types';

interface TemplateSelectorProps {
  templates: MessageTemplate[];
  selectedTemplateId: string | null;
  onSelect: (template: MessageTemplate | null) => void;
  disabled?: boolean;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelect,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '') {
      onSelect(null);
    } else {
      const template = templates.find((t) => t.id === value);
      if (template) {
        onSelect(template);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="template-selector"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <FileText className="w-4 h-4 inline mr-2" />
        Message Template
      </label>

      <select
        id="template-selector"
        value={selectedTemplateId || ''}
        onChange={handleChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select a template (optional)</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>

      {selectedTemplateId && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Template selected. You can edit the subject and body below before sending.
        </p>
      )}
    </div>
  );
};
