import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  currentStep: number;
  steps: Step[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.number}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-primary-600 bg-primary-600 text-white',
                    isCurrent && 'border-primary-600 bg-white text-primary-600',
                    !isCompleted && !isCurrent && 'border-gray-300 bg-white text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isCurrent && 'text-primary-600',
                      !isCurrent && 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="hidden md:block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors',
                    isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Text */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Step {currentStep} of {steps.length}
      </div>
    </div>
  );
};

export default StepIndicator;
