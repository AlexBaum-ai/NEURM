import React, { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { useModels } from '../hooks/useModels';
import { POPULAR_COMPARISONS } from '../hooks/useModelComparison';
import type { Model } from '../types';

interface ComparisonSelectorProps {
  selectedModels: Model[];
  onAddModel: (model: Model) => void;
  onRemoveModel: (modelId: number) => void;
  onClearAll: () => void;
  canAddMore: boolean;
  canCompare: boolean;
}

export const ComparisonSelector: React.FC<ComparisonSelectorProps> = ({
  selectedModels,
  onAddModel,
  onRemoveModel,
  onClearAll,
  canAddMore,
  canCompare,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { data } = useModels({ search: searchQuery });
  const availableModels = data?.models.filter(
    (model) => !selectedModels.some((selected) => selected.id === model.id)
  ) || [];

  const handleSelectModel = (model: Model) => {
    onAddModel(model);
    setShowSearch(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Selected Models */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Selected Models ({selectedModels.length}/5)</CardTitle>
            {selectedModels.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedModels.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              Select 2-5 models to compare
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-900 dark:text-primary-100"
                >
                  <span className="font-medium">{model.name}</span>
                  <button
                    onClick={() => onRemoveModel(model.id)}
                    className="hover:text-red-600 transition-colors"
                    aria-label={`Remove ${model.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Model Button */}
      {canAddMore && !showSearch && (
        <Button
          onClick={() => setShowSearch(true)}
          className="w-full"
          variant="outline"
        >
          <Plus size={16} className="mr-2" />
          Add Model to Compare
        </Button>
      )}

      {/* Model Search */}
      {showSearch && canAddMore && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Available Models */}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableModels.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No models found
                </p>
              ) : (
                availableModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {model.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {model.provider.name}
                        </p>
                      </div>
                      <Plus size={20} className="text-primary-600" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Comparisons */}
      {selectedModels.length === 0 && !showSearch && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {POPULAR_COMPARISONS.map((comparison, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {comparison.name}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compare Button */}
      {canCompare && (
        <Button
          className="w-full"
          size="lg"
          disabled={!canCompare}
        >
          Compare {selectedModels.length} Models
        </Button>
      )}

      {/* Info Message */}
      {selectedModels.length === 1 && (
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          Add at least one more model to start comparison
        </p>
      )}
    </div>
  );
};

export default ComparisonSelector;
