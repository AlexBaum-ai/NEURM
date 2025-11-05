/**
 * EmptyCategories Component
 * Displays when no categories are available
 */

import React from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { Card } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';

interface EmptyCategoriesProps {
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export const EmptyCategories: React.FC<EmptyCategoriesProps> = ({
  canCreate = false,
  onCreateClick,
}) => {
  return (
    <Card className="py-12 px-6">
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-600" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Categories Yet
        </h3>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {canCreate
            ? 'Get started by creating your first forum category.'
            : 'Forum categories will appear here once they are created.'}
        </p>

        {/* Action Button (for admins) */}
        {canCreate && onCreateClick && (
          <Button onClick={onCreateClick} className="inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create First Category
          </Button>
        )}
      </div>
    </Card>
  );
};

export default EmptyCategories;
