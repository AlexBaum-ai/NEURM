import React from 'react';
import { X, Users } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import type { Recipient } from '../../types';

interface RecipientListProps {
  recipients: Recipient[];
  onRemove: (id: string) => void;
}

export const RecipientList: React.FC<RecipientListProps> = ({ recipients, onRemove }) => {
  if (recipients.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400 mb-1">No recipients selected</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Select candidates from search results or lists to add them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Recipients ({recipients.length})
        </h3>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {recipients.map((recipient) => (
          <div
            key={recipient.id}
            className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {recipient.name}
                </p>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  @{recipient.username}
                </span>
              </div>

              {recipient.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {recipient.skills.slice(0, 3).map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                    >
                      {skill}
                    </span>
                  ))}
                  {recipient.skills.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{recipient.skills.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                {recipient.experience && <span>{recipient.experience}</span>}
                {recipient.location && (
                  <>
                    <span>•</span>
                    <span>{recipient.location}</span>
                  </>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(recipient.id)}
              className="flex-shrink-0"
              aria-label={`Remove ${recipient.name}`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
