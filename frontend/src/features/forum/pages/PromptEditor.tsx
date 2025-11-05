import React, { Suspense, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Label } from '@/components/forms/Label';
import { Card } from '@/components/common/Card/Card';
import { usePrompt, useCreatePrompt, useUpdatePrompt } from '../hooks/usePrompts';
import {
  PROMPT_CATEGORIES,
  PROMPT_USE_CASES,
  LLM_MODELS,
  type CreatePromptDto,
  type PromptTemplate,
} from '../types/prompt';

const promptSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  content: z.string().min(50, 'Prompt content must be at least 50 characters'),
  category: z.string().min(1, 'Category is required'),
  useCase: z.string().min(1, 'Use case is required'),
  model: z.string().optional(),
  isPublic: z.boolean().default(true),
  // Template fields
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(100000).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().optional(),
});

type PromptFormData = z.infer<typeof promptSchema>;

const PromptEditorContent: React.FC<{ isEdit: boolean }> = ({ isEdit }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAdvanced, setShowAdvanced] = useState(false);

  let promptData;
  if (isEdit && id) {
    const result = usePrompt(id);
    promptData = result.data;
  }

  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt(id || '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PromptFormData>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '',
      useCase: '',
      model: '',
      isPublic: true,
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      systemPrompt: '',
      userPrompt: '',
    },
  });

  useEffect(() => {
    if (isEdit && promptData) {
      const prompt = promptData.prompt;
      const template = prompt.templateJson || {};

      reset({
        title: prompt.title,
        content: prompt.content,
        category: prompt.category,
        useCase: prompt.useCase,
        model: prompt.model || '',
        isPublic: prompt.isPublic,
        temperature: template.temperature,
        maxTokens: template.maxTokens,
        topP: template.topP,
        frequencyPenalty: template.frequencyPenalty,
        presencePenalty: template.presencePenalty,
        systemPrompt: template.systemPrompt,
        userPrompt: template.userPrompt,
      });

      // Show advanced if any template fields are set
      if (Object.keys(template).length > 0) {
        setShowAdvanced(true);
      }
    }
  }, [isEdit, promptData, reset]);

  const onSubmit = async (data: PromptFormData) => {
    const templateJson: PromptTemplate = {};

    // Only include template fields if they have values
    if (showAdvanced) {
      if (data.temperature !== undefined) templateJson.temperature = data.temperature;
      if (data.maxTokens !== undefined) templateJson.maxTokens = data.maxTokens;
      if (data.topP !== undefined) templateJson.topP = data.topP;
      if (data.frequencyPenalty !== undefined)
        templateJson.frequencyPenalty = data.frequencyPenalty;
      if (data.presencePenalty !== undefined)
        templateJson.presencePenalty = data.presencePenalty;
      if (data.systemPrompt) templateJson.systemPrompt = data.systemPrompt;
      if (data.userPrompt) templateJson.userPrompt = data.userPrompt;
    }

    const promptData: CreatePromptDto = {
      title: data.title,
      content: data.content,
      category: data.category as any,
      useCase: data.useCase as any,
      model: data.model || undefined,
      isPublic: data.isPublic,
      templateJson: Object.keys(templateJson).length > 0 ? templateJson : undefined,
    };

    try {
      if (isEdit && id) {
        await updatePrompt.mutateAsync(promptData);
        navigate(`/forum/prompts/${id}`);
      } else {
        const result = await createPrompt.mutateAsync(promptData);
        navigate(`/forum/prompts/${result.prompt.id}`);
      }
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  return (
    <div className="container-custom py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to={isEdit && id ? `/forum/prompts/${id}` : '/forum/prompts'}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit Prompt' : 'Create New Prompt'}
        </h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="e.g., Advanced Code Review Prompt for GPT-4"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">
                Prompt Content <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                {...register('content')}
                rows={10}
                placeholder="Enter your prompt here. You can use variables like {input}, {context}, etc."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Tip: Use clear instructions and provide examples for better results
              </p>
            </div>

            {/* Category & Use Case */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select id="category" {...register('category')}>
                  <option value="">Select category</option>
                  {PROMPT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="useCase">
                  Use Case <span className="text-red-500">*</span>
                </Label>
                <Select id="useCase" {...register('useCase')}>
                  <option value="">Select use case</option>
                  {PROMPT_USE_CASES.map((uc) => (
                    <option key={uc.value} value={uc.value}>
                      {uc.label}
                    </option>
                  ))}
                </Select>
                {errors.useCase && (
                  <p className="mt-1 text-sm text-red-600">{errors.useCase.message}</p>
                )}
              </div>
            </div>

            {/* Model */}
            <div>
              <Label htmlFor="model">Recommended Model (optional)</Label>
              <Select id="model" {...register('model')}>
                <option value="">Any model</option>
                {LLM_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </Select>
            </div>

            {/* Public/Private */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                {...register('isPublic')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <Label htmlFor="isPublic" className="mb-0">
                Make this prompt public (visible to all users)
              </Label>
            </div>
          </div>
        </Card>

        {/* Advanced Template Configuration */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Template Configuration (Optional)
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4">
              {/* Model Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature (0-2)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    {...register('temperature', { valueAsNumber: true })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Controls randomness. Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="100000"
                    {...register('maxTokens', { valueAsNumber: true })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum length of the response
                  </p>
                </div>

                <div>
                  <Label htmlFor="topP">Top P (0-1)</Label>
                  <Input
                    id="topP"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    {...register('topP', { valueAsNumber: true })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Nucleus sampling threshold
                  </p>
                </div>

                <div>
                  <Label htmlFor="frequencyPenalty">Frequency Penalty (-2 to 2)</Label>
                  <Input
                    id="frequencyPenalty"
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    {...register('frequencyPenalty', { valueAsNumber: true })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Reduces repetition of tokens
                  </p>
                </div>

                <div>
                  <Label htmlFor="presencePenalty">Presence Penalty (-2 to 2)</Label>
                  <Input
                    id="presencePenalty"
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    {...register('presencePenalty', { valueAsNumber: true })}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Encourages new topics
                  </p>
                </div>
              </div>

              {/* System & User Prompts */}
              <div>
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  {...register('systemPrompt')}
                  rows={3}
                  placeholder="System instructions (e.g., 'You are a helpful coding assistant...')"
                />
              </div>

              <div>
                <Label htmlFor="userPrompt">User Prompt Template</Label>
                <Textarea
                  id="userPrompt"
                  {...register('userPrompt')}
                  rows={3}
                  placeholder="User message template with variables (e.g., 'Review this code: {code}')"
                />
              </div>
            </div>
          )}
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link to={isEdit && id ? `/forum/prompts/${id}` : '/forum/prompts'}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Prompt' : 'Create Prompt'}
          </Button>
        </div>
      </form>
    </div>
  );
};

const PromptEditor: React.FC<{ isEdit?: boolean }> = ({ isEdit = false }) => {
  return (
    <Suspense
      fallback={
        <div className="container-custom py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      }
    >
      <PromptEditorContent isEdit={isEdit} />
    </Suspense>
  );
};

export default PromptEditor;
