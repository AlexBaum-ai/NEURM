/**
 * RevisionDiff component - displays side-by-side comparison of revisions
 */

import React, { useMemo } from 'react';
import * as Diff from 'diff';
import { AlertCircle } from 'lucide-react';
import type { ArticleRevision } from '../types';

interface RevisionDiffProps {
  oldRevision: ArticleRevision;
  newRevision: ArticleRevision;
  field?: 'title' | 'content' | 'summary';
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber?: number;
}

const RevisionDiff: React.FC<RevisionDiffProps> = ({
  oldRevision,
  newRevision,
  field = 'content',
}) => {
  const diffs = useMemo(() => {
    const oldText = String(oldRevision[field] || '');
    const newText = String(newRevision[field] || '');

    const changes = Diff.diffLines(oldText, newText);
    const lines: DiffLine[] = [];

    changes.forEach((change) => {
      const content = change.value;
      const lineCount = content.split('\n').filter((line) => line.length > 0).length;

      if (change.added) {
        for (let i = 0; i < lineCount; i++) {
          lines.push({
            type: 'added',
            content: content.split('\n')[i] || '',
          });
        }
      } else if (change.removed) {
        for (let i = 0; i < lineCount; i++) {
          lines.push({
            type: 'removed',
            content: content.split('\n')[i] || '',
          });
        }
      } else {
        for (let i = 0; i < lineCount; i++) {
          lines.push({
            type: 'unchanged',
            content: content.split('\n')[i] || '',
          });
        }
      }
    });

    return lines;
  }, [oldRevision, newRevision, field]);

  const hasChanges = diffs.some((line) => line.type !== 'unchanged');

  if (!hasChanges) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>No changes detected in {field}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b dark:border-gray-700">
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Revision #{oldRevision.revisionNumber}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {oldRevision.createdBy.username}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Revision #{newRevision.revisionNumber}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {newRevision.createdBy.username}
          </div>
        </div>
      </div>

      {/* Side-by-side diff view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Old version (removals) */}
        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 border-b dark:border-gray-700">
            <span className="text-sm font-medium text-red-800 dark:text-red-300">
              Old Version (Removals)
            </span>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto bg-white dark:bg-gray-900">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {diffs
                .filter((line) => line.type === 'removed' || line.type === 'unchanged')
                .map((line, index) => (
                  <div
                    key={index}
                    className={`
                      ${line.type === 'removed' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : 'text-gray-700 dark:text-gray-300'}
                      px-2 py-1
                    `}
                  >
                    {line.type === 'removed' && (
                      <span className="text-red-600 dark:text-red-400 mr-2">-</span>
                    )}
                    {line.content}
                  </div>
                ))}
            </pre>
          </div>
        </div>

        {/* New version (additions) */}
        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 border-b dark:border-gray-700">
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              New Version (Additions)
            </span>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto bg-white dark:bg-gray-900">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {diffs
                .filter((line) => line.type === 'added' || line.type === 'unchanged')
                .map((line, index) => (
                  <div
                    key={index}
                    className={`
                      ${line.type === 'added' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'text-gray-700 dark:text-gray-300'}
                      px-2 py-1
                    `}
                  >
                    {line.type === 'added' && (
                      <span className="text-green-600 dark:text-green-400 mr-2">+</span>
                    )}
                    {line.content}
                  </div>
                ))}
            </pre>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 pt-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Removed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Added</span>
        </div>
      </div>
    </div>
  );
};

export default RevisionDiff;
