import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card/Card';
import type { FunnelStage } from '../../types';
import { ChevronDown } from 'lucide-react';

interface FunnelChartProps {
  data: FunnelStage[];
  title?: string;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  data,
  title = 'Conversion Funnel',
}) => {
  // Colors for each stage
  const colors = [
    'bg-blue-500',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-indigo-700',
    'bg-purple-700',
    'bg-purple-800',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((stage, index) => (
            <div key={stage.stage} className="space-y-1">
              <div className="relative">
                <div
                  className={`${colors[index % colors.length]} text-white rounded-lg py-4 px-6 transition-all hover:opacity-90`}
                  style={{
                    width: `${stage.percentage}%`,
                    minWidth: '40%',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{stage.stage}</span>
                    <div className="text-right">
                      <div className="font-bold">{stage.count.toLocaleString()}</div>
                      <div className="text-xs opacity-90">{stage.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
              {index < data.length - 1 && (
                <div className="flex justify-center">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
        {data.length > 1 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm font-semibold mb-2">Conversion Rates</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.slice(0, -1).map((stage, index) => {
                const nextStage = data[index + 1];
                const conversionRate = ((nextStage.count / stage.count) * 100).toFixed(1);
                return (
                  <div key={`conversion-${index}`} className="text-gray-600 dark:text-gray-400">
                    {stage.stage} → {nextStage.stage}: <strong>{conversionRate}%</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
