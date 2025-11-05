import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import type { ModelPricing as PricingType } from '../types';

interface ModelPricingProps {
  pricing?: PricingType;
}

export const ModelPricing: React.FC<ModelPricingProps> = ({ pricing }) => {
  if (!pricing || (!pricing.inputCost && !pricing.outputCost)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            Pricing information not available
          </p>
        </CardContent>
      </Card>
    );
  }

  const currency = pricing.currency || 'USD';
  const unit = pricing.unit || '1M tokens';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Type
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Cost
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Per
                </th>
              </tr>
            </thead>
            <tbody>
              {pricing.inputCost !== undefined && (
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    Input
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                    ${pricing.inputCost.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                    {unit}
                  </td>
                </tr>
              )}
              {pricing.outputCost !== undefined && (
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    Output
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                    ${pricing.outputCost.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                    {unit}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pricing Example */}
        {pricing.inputCost !== undefined && pricing.outputCost !== undefined && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Example Cost Calculation
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              For 1M input tokens and 500K output tokens:
              <br />
              <span className="font-mono">
                ${pricing.inputCost.toFixed(2)} + ${(pricing.outputCost * 0.5).toFixed(2)} =
                ${(pricing.inputCost + pricing.outputCost * 0.5).toFixed(2)}
              </span>
            </p>
          </div>
        )}

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          * Prices shown in {currency}. Actual costs may vary. Check provider's official pricing for the most up-to-date information.
        </p>
      </CardContent>
    </Card>
  );
};

export default ModelPricing;
