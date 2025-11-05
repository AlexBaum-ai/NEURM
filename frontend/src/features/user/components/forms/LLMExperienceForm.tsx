import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, Star } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import type { LLMExperience, LLMExperienceFormData, LLMModel } from '../../types';
import { llmExperienceSchema } from '../../types';

interface LLMExperienceFormProps {
  initialData?: LLMExperience;
  onSubmit: (data: LLMExperienceFormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * LLMExperienceForm - Form for editing LLM experience
 *
 * Features:
 * - Add/edit/delete models with proficiency ratings
 * - Multi-select for frameworks, vector databases, cloud platforms
 * - Tags input for programming languages and use cases
 * - Autocomplete suggestions for common technologies
 */
export const LLMExperienceForm: React.FC<LLMExperienceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LLMExperienceFormData>({
    resolver: zodResolver(llmExperienceSchema),
    defaultValues: {
      models: initialData?.models || [],
      frameworks: initialData?.frameworks || [],
      vectorDatabases: initialData?.vectorDatabases || [],
      cloudPlatforms: initialData?.cloudPlatforms || [],
      programmingLanguages: initialData?.programmingLanguages || [],
      useCaseTypes: initialData?.useCaseTypes || [],
    },
  });

  const models = watch('models');

  // Predefined options for autocomplete
  const frameworkOptions = [
    'LangChain',
    'LlamaIndex',
    'Haystack',
    'Semantic Kernel',
    'AutoGPT',
    'LangGraph',
    'DSPy',
    'Guardrails AI',
  ];

  const vectorDbOptions = [
    'Pinecone',
    'Weaviate',
    'Chroma',
    'FAISS',
    'Qdrant',
    'Milvus',
    'PGVector',
    'Redis Vector',
  ];

  const cloudPlatformOptions = [
    'AWS Bedrock',
    'Azure OpenAI',
    'Google Vertex AI',
    'AWS SageMaker',
    'Hugging Face',
    'Replicate',
    'Together AI',
    'Anyscale',
  ];

  const languageOptions = [
    'Python',
    'TypeScript',
    'JavaScript',
    'Java',
    'Go',
    'Rust',
    'C#',
    'Swift',
    'Kotlin',
  ];

  const useCaseOptions = [
    'Chatbots',
    'RAG',
    'Agents',
    'Fine-tuning',
    'Embeddings',
    'Code Generation',
    'Content Generation',
    'Summarization',
    'Translation',
    'Search & Retrieval',
  ];

  const handleFormSubmit = async (data: LLMExperienceFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addModel = () => {
    const currentModels = watch('models');
    setValue('models', [
      ...currentModels,
      { name: '', provider: '', proficiency: 3, category: '' },
    ]);
  };

  const removeModel = (index: number) => {
    const currentModels = watch('models');
    setValue(
      'models',
      currentModels.filter((_, i) => i !== index)
    );
  };

  const updateModel = (index: number, field: keyof LLMModel, value: string | number) => {
    const currentModels = watch('models');
    const updatedModels = [...currentModels];
    updatedModels[index] = { ...updatedModels[index], [field]: value };
    setValue('models', updatedModels);
  };

  const renderStarRating = (index: number, proficiency: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => updateModel(index, 'proficiency', star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-5 h-5 ${
                star <= proficiency
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderTagInput = (
    label: string,
    fieldName: keyof LLMExperienceFormData,
    options: string[]
  ) => {
    const currentValues = watch(fieldName) as string[];

    const addTag = (tag: string) => {
      if (tag && !currentValues.includes(tag)) {
        setValue(fieldName, [...currentValues, tag] as never);
      }
    };

    const removeTag = (tag: string) => {
      setValue(
        fieldName,
        currentValues.filter((t) => t !== tag) as never
      );
    };

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {currentValues.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-primary-900 dark:hover:text-primary-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {options
            .filter((opt) => !currentValues.includes(opt))
            .map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => addTag(opt)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                + {opt}
              </button>
            ))}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Models Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            LLM Models & Proficiency
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addModel}>
            <Plus className="w-4 h-4" />
            Add Model
          </Button>
        </div>

        <div className="space-y-4">
          {models.map((model, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Model name (e.g., GPT-4)"
                    value={model.name}
                    onChange={(e) => updateModel(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Provider (e.g., OpenAI)"
                    value={model.provider}
                    onChange={(e) => updateModel(index, 'provider', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeModel(index)}
                  className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Category (optional)"
                  value={model.category || ''}
                  onChange={(e) => updateModel(index, 'category', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Proficiency
                  </label>
                  {renderStarRating(index, model.proficiency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frameworks */}
      {renderTagInput('Frameworks & Libraries', 'frameworks', frameworkOptions)}

      {/* Vector Databases */}
      {renderTagInput('Vector Databases', 'vectorDatabases', vectorDbOptions)}

      {/* Cloud Platforms */}
      {renderTagInput('Cloud Platforms', 'cloudPlatforms', cloudPlatformOptions)}

      {/* Programming Languages */}
      {renderTagInput('Programming Languages', 'programmingLanguages', languageOptions)}

      {/* Use Cases */}
      {renderTagInput('Use Case Types', 'useCaseTypes', useCaseOptions)}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">
            Please fix the errors above before submitting.
          </p>
        </div>
      )}
    </form>
  );
};

export default LLMExperienceForm;
