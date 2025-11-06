import React from 'react';
import { Sparkles } from 'lucide-react';
import UseCaseCard from './UseCaseCard';
import { useFeaturedUseCases } from '../hooks/useUseCases';

const FeaturedUseCases: React.FC = () => {
  const { data, isLoading } = useFeaturedUseCases();

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Featured Use Cases
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Featured Use Cases</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.data.map((useCase) => (
          <UseCaseCard key={useCase.id} useCase={useCase} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedUseCases;
