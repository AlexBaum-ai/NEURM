import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { Card } from '@/components/common/Card/Card';

interface MatchExplanationProps {
  topReasons: string[];
  matchScore: number;
  lastUpdated?: string;
}

export const MatchExplanation: React.FC<MatchExplanationProps> = ({
  topReasons,
  matchScore,
  lastUpdated,
}) => {
  if (topReasons.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-4">
        <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Why this is a {matchScore}% match
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on your profile, skills, and preferences
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {topReasons.slice(0, 3).map((reason, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
          >
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-800 dark:text-gray-200">{reason}</p>
          </div>
        ))}
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Last updated: {new Date(lastUpdated).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
};

export default MatchExplanation;
