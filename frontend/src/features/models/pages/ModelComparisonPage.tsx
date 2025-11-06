import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Card } from '@/components/common/Card/Card';
import { ComparisonSelector } from '../components/ComparisonSelector';
import { ComparisonTable } from '../components/ComparisonTable';
import { ComparisonExportMenu } from '../components/ComparisonExportMenu';
import { useModelComparison, useSaveComparison } from '../hooks/useModelComparison';
import type { Model } from '../types';

const ModelComparisonContent: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  const saveComparison = useSaveComparison();

  // Get model IDs from URL
  const modelIdsParam = searchParams.get('ids');
  const modelIds = modelIdsParam ? modelIdsParam.split(',') : [];

  // Fetch comparison data if we have model IDs
  const { data: comparisonData } = useModelComparison(modelIds);

  // Update selected models when comparison data is loaded
  useEffect(() => {
    if (comparisonData?.models) {
      setSelectedModels(comparisonData.models);
    }
  }, [comparisonData]);

  const handleAddModel = (model: Model) => {
    const newModels = [...selectedModels, model];
    setSelectedModels(newModels);
    updateUrlParams(newModels);
  };

  const handleRemoveModel = (modelId: number) => {
    const newModels = selectedModels.filter((m) => m.id !== modelId);
    setSelectedModels(newModels);
    updateUrlParams(newModels);
  };

  const handleClearAll = () => {
    setSelectedModels([]);
    setSearchParams({});
  };

  const updateUrlParams = (models: Model[]) => {
    if (models.length >= 2) {
      const ids = models.map((m) => m.id).join(',');
      setSearchParams({ ids });
    } else {
      setSearchParams({});
    }
  };

  const handleSaveComparison = async () => {
    if (selectedModels.length < 2) return;

    try {
      const comparisonName = selectedModels.map((m) => m.name).join(' vs ');
      await saveComparison.mutateAsync({
        name: comparisonName,
        modelIds: selectedModels.map((m) => m.id),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save comparison:', error);
      alert('Failed to save comparison. Please try again.');
    }
  };

  const canAddMore = selectedModels.length < 5;
  const canCompare = selectedModels.length >= 2 && selectedModels.length <= 5;

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/models')}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Models
        </Button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Compare Models
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Select 2-5 models to compare their specifications, pricing, and benchmarks
            </p>
          </div>

          {canCompare && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveComparison}
                disabled={saveComparison.isPending || isSaved}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck size={16} className="mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Bookmark size={16} className="mr-2" />
                    Save
                  </>
                )}
              </Button>
              <ComparisonExportMenu models={selectedModels} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar - Model Selector */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-4">
            <ComparisonSelector
              selectedModels={selectedModels}
              onAddModel={handleAddModel}
              onRemoveModel={handleRemoveModel}
              onClearAll={handleClearAll}
              canAddMore={canAddMore}
              canCompare={canCompare}
            />
          </div>
        </div>

        {/* Main Content - Comparison Table */}
        <div className="lg:col-span-9">
          {selectedModels.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Start Comparing Models
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Select at least 2 models from the sidebar to begin your comparison.
                  You can compare up to 5 models side-by-side.
                </p>
              </div>
            </Card>
          ) : selectedModels.length === 1 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">➕</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add One More Model
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You've selected 1 model. Add at least one more to start comparing.
                </p>
              </div>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <ComparisonTable models={selectedModels} />
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      {canCompare && (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Tips for Comparison
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Green highlights indicate better values, red indicates worse values</li>
                <li>• Hover over feature names with info icons for more details</li>
                <li>• Export your comparison as PDF or PNG to share with your team</li>
                <li>• Save comparisons for quick access later</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Loading fallback
const ComparisonPageLoader = () => (
  <div className="container-custom py-8">
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="lg:col-span-9">
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

export const ModelComparisonPage: React.FC = () => {
  return (
    <Suspense fallback={<ComparisonPageLoader />}>
      <ModelComparisonContent />
    </Suspense>
  );
};

export default ModelComparisonPage;
