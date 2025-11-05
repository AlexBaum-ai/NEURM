import React from 'react';
import { Search, FileText } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  showResetButton?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No articles found',
  description = "We couldn't find any articles matching your criteria. Try adjusting your filters or search terms.",
  onReset,
  showResetButton = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        {showResetButton ? (
          <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        ) : (
          <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>

      {showResetButton && onReset && (
        <Button onClick={onReset} variant="primary">
          Clear all filters
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
