import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { Save, Eye, Edit, Send } from 'lucide-react';
import { TopicTypeSelector } from './TopicTypeSelector';
import { CategoryDropdown } from './CategoryDropdown';
import { MarkdownEditor } from './MarkdownEditor';
import { ImageUploader } from './ImageUploader';
import { TagInput } from './TagInput';
import { PollBuilder } from './PollBuilder';
import { TopicPreview } from './TopicPreview';
import type { ForumCategory, TopicType } from '../types';

// Form validation schema
const topicFormSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(50000, 'Content must be less than 50,000 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  type: z.enum(['discussion', 'question', 'showcase', 'tutorial', 'announcement', 'paper'], {
    errorMap: () => ({ message: 'Please select a topic type' }),
  }),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').default([]),
  images: z.array(z.any()).max(5, 'Maximum 5 images allowed').default([]),
  poll: z
    .object({
      question: z.string().min(5).max(255),
      options: z.array(z.object({ text: z.string(), votes: z.number() })).min(2).max(10),
      multipleChoice: z.boolean(),
      expiresAt: z.string().optional(),
    })
    .nullable()
    .optional(),
});

type TopicFormData = z.infer<typeof topicFormSchema>;

interface TopicComposerProps {
  categories: ForumCategory[];
  onSubmit: (data: TopicFormData, isDraft: boolean) => Promise<void>;
  onSaveDraft?: (data: Partial<TopicFormData>) => void;
  initialData?: Partial<TopicFormData>;
  isSubmitting?: boolean;
}

export const TopicComposer: React.FC<TopicComposerProps> = ({
  categories,
  onSubmit,
  onSaveDraft,
  initialData,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();
  const [isPreview, setIsPreview] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TopicFormData>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      content: initialData?.content || '',
      categoryId: initialData?.categoryId || '',
      type: (initialData?.type as TopicType) || 'discussion',
      tags: initialData?.tags || [],
      images: initialData?.images || [],
      poll: initialData?.poll || null,
    },
  });

  const formValues = watch();

  // Auto-save to localStorage every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      const draft = {
        ...formValues,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('topic_draft', JSON.stringify(draft));
      setLastSaved(new Date());
      onSaveDraft?.(formValues);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [formValues, onSaveDraft]);

  // Load draft from localStorage on mount
  React.useEffect(() => {
    const savedDraft = localStorage.getItem('topic_draft');
    if (savedDraft && !initialData) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.savedAt) {
          const savedTime = new Date(draft.savedAt);
          const now = new Date();
          const hoursSinceSave = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60);

          // Only restore if saved within last 24 hours
          if (hoursSinceSave < 24) {
            setValue('title', draft.title || '');
            setValue('content', draft.content || '');
            setValue('categoryId', draft.categoryId || '');
            setValue('type', draft.type || 'discussion');
            setValue('tags', draft.tags || []);
            setValue('poll', draft.poll || null);
            setLastSaved(savedTime);
          } else {
            localStorage.removeItem('topic_draft');
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
        localStorage.removeItem('topic_draft');
      }
    }
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: TopicFormData) => {
    await onSubmit(data, false);
    localStorage.removeItem('topic_draft');
  };

  const handleSaveDraft = async () => {
    await onSubmit(formValues, true);
    localStorage.removeItem('topic_draft');
  };

  const getCategoryName = (categoryId: string): string => {
    const findCategory = (cats: ForumCategory[]): string | undefined => {
      for (const cat of cats) {
        if (cat.id === categoryId) return cat.name;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findCategory(categories) || '';
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create New Topic
        </h1>
        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? (
              <>
                <Edit className="h-4 w-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {isPreview ? (
        // Preview Mode
        <TopicPreview
          title={formValues.title}
          content={formValues.content}
          type={formValues.type}
          category={getCategoryName(formValues.categoryId)}
          tags={formValues.tags}
          images={formValues.images}
          poll={formValues.poll}
        />
      ) : (
        // Edit Mode
        <div className="space-y-6">
          {/* Topic Type */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TopicTypeSelector
                value={field.value}
                onChange={field.onChange}
                error={errors.type?.message}
              />
            )}
          />

          {/* Category */}
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <CategoryDropdown
                categories={categories}
                value={field.value}
                onChange={field.onChange}
                error={errors.categoryId?.message}
              />
            )}
          />

          {/* Title */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <div>
                <Input
                  {...field}
                  label="Title"
                  placeholder="What's your topic about?"
                  error={errors.title?.message}
                  maxLength={200}
                  required
                />
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {field.value.length}/200 characters
                </p>
              </div>
            )}
          />

          {/* Content */}
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <MarkdownEditor
                value={field.value}
                onChange={field.onChange}
                error={errors.content?.message}
              />
            )}
          />

          {/* Images */}
          <Controller
            name="images"
            control={control}
            render={({ field }) => (
              <ImageUploader
                images={field.value}
                onChange={field.onChange}
                error={errors.images?.message}
              />
            )}
          />

          {/* Tags */}
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <TagInput
                tags={field.value}
                onChange={field.onChange}
                error={errors.tags?.message}
                suggestions={['llm', 'gpt', 'prompt-engineering', 'rag', 'fine-tuning', 'embeddings']}
              />
            )}
          />

          {/* Poll */}
          <Controller
            name="poll"
            control={control}
            render={({ field }) => (
              <PollBuilder
                poll={field.value || null}
                onChange={field.onChange}
                error={errors.poll?.message}
              />
            )}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-300 pt-6 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4" />
            Save as Draft
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? 'Publishing...' : 'Publish Topic'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TopicComposer;
