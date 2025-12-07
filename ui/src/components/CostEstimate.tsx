import React from 'react';
import type { CostEstimate as CostEstimateType } from '../types';

interface CostEstimateProps {
  estimate: CostEstimateType;
}

export function CostEstimate({ estimate }: CostEstimateProps) {
  const items = [
    { label: 'LLM', cost: estimate.llm, color: 'bg-blue-500' },
    {
      label: `Images (${estimate.breakdown.imageCount})`,
      cost: estimate.images,
      color: 'bg-purple-500',
    },
    {
      label: `Videos (${estimate.breakdown.videoCount})`,
      cost: estimate.videos,
      color: 'bg-green-500',
    },
    { label: 'Compile', cost: estimate.compile, color: 'bg-orange-500' },
  ];

  // Calculate percentages for bar chart
  const total = estimate.total;
  const percentages = items.map((item) => ({
    ...item,
    percentage: total > 0 ? (item.cost / total) * 100 : 0,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cost Estimate
      </h3>

      {/* Cost Breakdown */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ${item.cost.toFixed(2)}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
          <span className="text-base font-semibold text-gray-900 dark:text-white">Total</span>
          <span className="text-base font-bold text-gray-900 dark:text-white">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Cost Breakdown</div>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {percentages.map((item) => (
            <div
              key={item.label}
              className={`${item.color} flex items-center justify-center text-xs text-white font-medium`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.label}: ${item.percentage.toFixed(1)}%`}
            >
              {item.percentage > 10 && `${item.percentage.toFixed(0)}%`}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Details */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estimate.breakdown.imageCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Images</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estimate.breakdown.videoCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Videos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {estimate.breakdown.totalDuration}s
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
          </div>
        </div>
      </div>
    </div>
  );
}
