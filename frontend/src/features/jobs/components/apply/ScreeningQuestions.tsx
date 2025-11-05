import React from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import Textarea from '@/components/forms/Textarea';
import type { ApplicationFormData } from './types';

interface ScreeningQuestionsProps {
  questions: Array<{ question: string }>;
  control: Control<ApplicationFormData>;
}

export const ScreeningQuestions: React.FC<ScreeningQuestionsProps> = ({ questions, control }) => {
  const { fields } = useFieldArray({
    control,
    name: 'screeningAnswers',
  });

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Screening Questions
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Please answer the following questions from the employer:
        </p>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {index + 1}. {questions[index]?.question}
            <span className="text-accent-600 ml-1">*</span>
          </label>
          <Textarea
            placeholder="Your answer..."
            rows={4}
            className="w-full"
            {...control.register(`screeningAnswers.${index}.answer`)}
          />
        </div>
      ))}
    </div>
  );
};

export default ScreeningQuestions;
