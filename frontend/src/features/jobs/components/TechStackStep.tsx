import React, { useState } from 'react';
import type { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select } from '@/components/forms/Select';
import Button from '@/components/common/Button/Button';
import type { JobFormValues } from '../utils/validation';

interface TechStackStepProps {
  watch: UseFormWatch<JobFormValues>;
  setValue: UseFormSetValue<JobFormValues>;
  errors: FieldErrors<JobFormValues>;
}

const LLM_MODELS = [
  'GPT-4', 'GPT-4 Turbo', 'GPT-3.5', 'Claude 3 Opus', 'Claude 3 Sonnet',
  'Claude 3 Haiku', 'Gemini Pro', 'Gemini Ultra', 'LLaMA 2', 'LLaMA 3',
  'Mistral', 'Mixtral', 'PaLM 2', 'Command', 'Cohere'
];

const FRAMEWORKS = [
  'LangChain', 'LlamaIndex', 'Haystack', 'Semantic Kernel',
  'AutoGPT', 'CrewAI', 'Guidance', 'LMQL', 'DSPy'
];

const VECTOR_DATABASES = [
  'Pinecone', 'Weaviate', 'Qdrant', 'Milvus', 'Chroma',
  'FAISS', 'pgvector', 'Vespa'
];

const CLOUD_PLATFORMS = [
  'AWS', 'Google Cloud', 'Azure', 'Cloudflare',
  'Vercel', 'Hugging Face', 'Replicate'
];

const PROGRAMMING_LANGUAGES = [
  'Python', 'TypeScript', 'JavaScript', 'Go', 'Java',
  'Rust', 'C++', 'C#', 'Ruby', 'PHP'
];

const USE_CASE_TYPES = [
  { value: 'conversational_ai', label: 'Conversational AI' },
  { value: 'content_generation', label: 'Content Generation' },
  { value: 'code_generation', label: 'Code Generation' },
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'research_summarization', label: 'Research & Summarization' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'education_training', label: 'Education & Training' },
  { value: 'creative_writing', label: 'Creative Writing' },
  { value: 'translation', label: 'Translation' },
  { value: 'other', label: 'Other' }
];

const MODEL_STRATEGIES = [
  { value: 'single', label: 'Single Model' },
  { value: 'hybrid', label: 'Hybrid (Multiple Models)' },
  { value: 'ensemble', label: 'Ensemble' },
  { value: 'fine_tuned', label: 'Fine-Tuned Model' }
];

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  error?: string;
  required?: boolean;
  maxItems?: number;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
  error,
  required,
  maxItems
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredOptions = options.filter(
    (opt) =>
      !selected.includes(opt) &&
      opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleAdd = (value: string) => {
    if (!selected.includes(value) && (!maxItems || selected.length < maxItems)) {
      onChange([...selected, value]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="hover:text-primary-900 dark:hover:text-primary-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input with autocomplete */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Type to search or add..."
          disabled={maxItems ? selected.length >= maxItems : false}
          className={cn(
            'w-full px-3 py-2 border rounded-md',
            'bg-white dark:bg-gray-800',
            'border-gray-300 dark:border-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            error && 'border-red-500',
            maxItems && selected.length >= maxItems && 'opacity-50 cursor-not-allowed'
          )}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && inputValue && filteredOptions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleAdd(option)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {maxItems && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {selected.length}/{maxItems} selected
        </p>
      )}

      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};

const TechStackStep: React.FC<TechStackStepProps> = ({ watch, setValue, errors }) => {
  const metadata = watch('metadata') || {
    primaryLlms: [],
    frameworks: [],
    vectorDatabases: [],
    infrastructure: [],
    programmingLanguages: [],
    useCaseType: '',
    modelStrategy: ''
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Tech Stack & Tools
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Specify the LLM technologies and tools candidates will work with
        </p>
      </div>

      {/* Primary LLMs */}
      <MultiSelect
        label="Primary LLM Models"
        options={LLM_MODELS}
        selected={metadata.primaryLlms}
        onChange={(values) => setValue('metadata.primaryLlms', values)}
        error={errors.metadata?.primaryLlms?.message}
        required
        maxItems={10}
      />

      {/* Frameworks */}
      <MultiSelect
        label="Frameworks & Libraries"
        options={FRAMEWORKS}
        selected={metadata.frameworks}
        onChange={(values) => setValue('metadata.frameworks', values)}
        error={errors.metadata?.frameworks?.message}
        maxItems={10}
      />

      {/* Vector Databases */}
      <MultiSelect
        label="Vector Databases"
        options={VECTOR_DATABASES}
        selected={metadata.vectorDatabases}
        onChange={(values) => setValue('metadata.vectorDatabases', values)}
        error={errors.metadata?.vectorDatabases?.message}
        maxItems={5}
      />

      {/* Cloud Platforms */}
      <MultiSelect
        label="Cloud & Infrastructure"
        options={CLOUD_PLATFORMS}
        selected={metadata.infrastructure}
        onChange={(values) => setValue('metadata.infrastructure', values)}
        error={errors.metadata?.infrastructure?.message}
        maxItems={5}
      />

      {/* Programming Languages */}
      <MultiSelect
        label="Programming Languages"
        options={PROGRAMMING_LANGUAGES}
        selected={metadata.programmingLanguages}
        onChange={(values) => setValue('metadata.programmingLanguages', values)}
        error={errors.metadata?.programmingLanguages?.message}
        required
        maxItems={10}
      />

      {/* Use Case & Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Primary Use Case"
          value={metadata.useCaseType || ''}
          onChange={(e) => setValue('metadata.useCaseType', e.target.value)}
          options={USE_CASE_TYPES}
        />

        <Select
          label="Model Strategy"
          value={metadata.modelStrategy || ''}
          onChange={(e) => setValue('metadata.modelStrategy', e.target.value)}
          options={MODEL_STRATEGIES}
        />
      </div>

      {/* Help Text */}
      <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4">
        <p className="text-sm text-purple-800 dark:text-purple-300">
          <strong>Why Tech Stack Matters:</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-purple-700 dark:text-purple-400 list-disc list-inside">
          <li>Helps candidates assess if they have relevant experience</li>
          <li>Enables better job matching based on technical skills</li>
          <li>Sets clear expectations about the tech environment</li>
          <li>Makes your job more discoverable in filtered searches</li>
        </ul>
      </div>
    </div>
  );
};

export default TechStackStep;
