import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DifficultyLevel } from '../types';

interface DifficultyFilterProps {
  value?: DifficultyLevel;
  onChange: (difficulty: DifficultyLevel | undefined) => void;
  className?: string;
}

interface DifficultyOption {
  value: DifficultyLevel;
  label: string;
  description: string;
  color: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: 'BEGINNER',
    label: 'Beginner',
    description: 'No prior knowledge required',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  },
  {
    value: 'INTERMEDIATE',
    label: 'Intermediate',
    description: 'Basic understanding needed',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  {
    value: 'ADVANCED',
    label: 'Advanced',
    description: 'Solid foundation required',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  },
  {
    value: 'EXPERT',
    label: 'Expert',
    description: 'Deep technical knowledge',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
];

export const DifficultyFilter: React.FC<DifficultyFilterProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cn('w-full', className)}>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Difficulty Level
      </label>

      <div className="space-y-2">
        {/* All levels option */}
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={cn(
            'flex w-full items-center rounded-lg border p-3 text-left transition-colors',
            !value
              ? 'border-primary-500 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
              : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
          )}
        >
          <div
            className={cn(
              'mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
              !value
                ? 'border-primary-600 bg-primary-600'
                : 'border-gray-300 dark:border-gray-600'
            )}
          >
            {!value && <Check className="h-3 w-3 text-white" />}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">All Levels</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Show articles of any difficulty
            </div>
          </div>
        </button>

        {/* Individual difficulty options */}
        {DIFFICULTY_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(isSelected ? undefined : option.value)}
              className={cn(
                'flex w-full items-center rounded-lg border p-3 text-left transition-colors',
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/20'
                  : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
              )}
            >
              <div
                className={cn(
                  'mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                  isSelected
                    ? 'border-primary-600 bg-primary-600'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                  <span className={cn('rounded px-2 py-0.5 text-xs font-medium', option.color)}>
                    {option.value}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {option.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultyFilter;
