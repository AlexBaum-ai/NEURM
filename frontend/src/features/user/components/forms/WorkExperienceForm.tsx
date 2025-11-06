import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, Briefcase } from 'lucide-react';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import Select from '@/components/forms/Select';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { useToast } from '@/components/common/Toast/ToastProvider';
import { workExperienceSchema } from '../../types';
import type { WorkExperienceFormData, WorkExperience } from '../../types';
import {
  useCreateWorkExperience,
  useUpdateWorkExperience,
  useDeleteWorkExperience,
} from '../../hooks/useProfile';

interface WorkExperienceFormProps {
  experiences: WorkExperience[];
  onSuccess?: () => void;
  onDirty?: () => void;
}

const employmentTypeOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
];

const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({
  experiences,
  onSuccess,
  onDirty,
}) => {
  const { showSuccess, showError } = useToast();
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const createMutation = useCreateWorkExperience();
  const updateMutation = useUpdateWorkExperience();
  const deleteMutation = useDeleteWorkExperience();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<WorkExperienceFormData>({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      employmentType: 'full_time',
      startDate: '',
      endDate: '',
      description: '',
      techStack: [],
      isCurrent: false,
    },
  });

  const isCurrent = watch('isCurrent');
  const techStack = watch('techStack');

  useEffect(() => {
    if (isDirty && onDirty) {
      onDirty();
    }
  }, [isDirty, onDirty]);

  const onSubmit = async (data: WorkExperienceFormData) => {
    try {
      if (editingExperience) {
        await updateMutation.mutateAsync({ id: editingExperience.id, data });
        showSuccess('Work experience updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        showSuccess('Work experience added successfully');
      }

      reset();
      setEditingExperience(null);
      setIsAdding(false);
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save work experience');
    }
  };

  const handleEdit = (experience: WorkExperience) => {
    setEditingExperience(experience);
    setIsAdding(true);
    setValue('title', experience.title);
    setValue('company', experience.company);
    setValue('location', experience.location || '');
    setValue('employmentType', experience.employmentType);
    setValue('startDate', experience.startDate.split('T')[0]);
    setValue('endDate', experience.endDate ? experience.endDate.split('T')[0] : '');
    setValue('description', experience.description || '');
    setValue('techStack', experience.techStack || []);
    setValue('isCurrent', experience.isCurrent || false);
  };

  const handleDelete = async (experienceId: string) => {
    if (!window.confirm('Are you sure you want to delete this work experience?')) return;

    try {
      await deleteMutation.mutateAsync(experienceId);
      showSuccess('Work experience deleted successfully');
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete work experience');
    }
  };

  const handleCancel = () => {
    reset();
    setEditingExperience(null);
    setIsAdding(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-6">
      {/* Existing Experiences */}
      {experiences.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Work Experience
          </h3>
          <div className="space-y-4">
            {experiences
              .sort((a, b) => b.displayOrder - a.displayOrder)
              .map((exp) => (
                <div
                  key={exp.id}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {exp.title}
                          {exp.isCurrent && (
                            <span className="ml-2 text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                              Current
                            </span>
                          )}
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300">{exp.company}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(exp.startDate)} -{' '}
                          {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                          {exp.location && ` • ${exp.location}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(exp)}
                          disabled={isAdding}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(exp.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {exp.description && (
                      <div
                        className="mt-2 text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: exp.description }}
                      />
                    )}
                    {exp.techStack && exp.techStack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {exp.techStack.map((tech, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {!isAdding ? (
        <Button onClick={() => setIsAdding(true)} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Work Experience
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editingExperience ? 'Edit Work Experience' : 'Add Work Experience'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Job Title"
              {...register('title')}
              error={errors.title?.message}
              placeholder="e.g., Senior Software Engineer"
            />

            <Input
              label="Company"
              {...register('company')}
              error={errors.company?.message}
              placeholder="e.g., OpenAI"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Location"
              {...register('location')}
              error={errors.location?.message}
              placeholder="e.g., San Francisco, CA"
            />

            <Select
              label="Employment Type"
              {...register('employmentType')}
              error={errors.employmentType?.message}
              options={employmentTypeOptions}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
            />

            <Input
              label="End Date"
              type="date"
              {...register('endDate')}
              error={errors.endDate?.message}
              disabled={isCurrent}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCurrent"
              {...register('isCurrent')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isCurrent" className="text-sm text-gray-700 dark:text-gray-300">
              I currently work here
            </label>
          </div>

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Description"
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.description?.message}
                placeholder="Describe your role and achievements..."
                maxLength={2000}
              />
            )}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tech Stack (comma-separated)
            </label>
            <Input
              {...register('techStack')}
              placeholder="e.g., React, TypeScript, Node.js"
              onChange={(e) => {
                const value = e.target.value;
                setValue(
                  'techStack',
                  value ? value.split(',').map((t) => t.trim()) : [],
                  { shouldDirty: true }
                );
              }}
              defaultValue={techStack?.join(', ')}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingExperience ? 'Update Experience' : 'Add Experience'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WorkExperienceForm;
