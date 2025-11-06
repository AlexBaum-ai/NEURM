import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, GraduationCap } from 'lucide-react';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { useToast } from '@/components/common/Toast/ToastProvider';
import { educationSchema } from '../../types';
import type { EducationFormData, Education } from '../../types';
import {
  useCreateEducation,
  useUpdateEducation,
  useDeleteEducation,
} from '../../hooks/useProfile';

interface EducationFormProps {
  educations: Education[];
  onSuccess?: () => void;
  onDirty?: () => void;
}

const EducationForm: React.FC<EducationFormProps> = ({ educations, onSuccess, onDirty }) => {
  const { showSuccess, showError } = useToast();
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const createMutation = useCreateEducation();
  const updateMutation = useUpdateEducation();
  const deleteMutation = useDeleteEducation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<EducationFormData>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isDirty && onDirty) {
      onDirty();
    }
  }, [isDirty, onDirty]);

  const onSubmit = async (data: EducationFormData) => {
    try {
      if (editingEducation) {
        await updateMutation.mutateAsync({ id: editingEducation.id, data });
        showSuccess('Education updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        showSuccess('Education added successfully');
      }

      reset();
      setEditingEducation(null);
      setIsAdding(false);
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save education');
    }
  };

  const handleEdit = (education: Education) => {
    setEditingEducation(education);
    setIsAdding(true);
    setValue('institution', education.institution);
    setValue('degree', education.degree);
    setValue('fieldOfStudy', education.fieldOfStudy);
    setValue('startDate', education.startDate.split('T')[0]);
    setValue('endDate', education.endDate ? education.endDate.split('T')[0] : '');
    setValue('description', education.description || '');
  };

  const handleDelete = async (educationId: string) => {
    if (!window.confirm('Are you sure you want to delete this education entry?')) return;

    try {
      await deleteMutation.mutateAsync(educationId);
      showSuccess('Education deleted successfully');
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete education');
    }
  };

  const handleCancel = () => {
    reset();
    setEditingEducation(null);
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
      {/* Existing Education */}
      {educations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Education</h3>
          <div className="space-y-4">
            {educations
              .sort((a, b) => b.displayOrder - a.displayOrder)
              .map((edu) => (
                <div
                  key={edu.id}
                  className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {edu.degree}
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300">{edu.institution}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {edu.fieldOfStudy} •{' '}
                          {formatDate(edu.startDate)} -{' '}
                          {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(edu)}
                          disabled={isAdding}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(edu.id)}
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
                    {edu.description && (
                      <div
                        className="mt-2 text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: edu.description }}
                      />
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
          Add Education
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editingEducation ? 'Edit Education' : 'Add Education'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Institution"
              {...register('institution')}
              error={errors.institution?.message}
              placeholder="e.g., Stanford University"
            />

            <Input
              label="Degree"
              {...register('degree')}
              error={errors.degree?.message}
              placeholder="e.g., Bachelor of Science"
            />
          </div>

          <Input
            label="Field of Study"
            {...register('fieldOfStudy')}
            error={errors.fieldOfStudy?.message}
            placeholder="e.g., Computer Science"
          />

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
            />
          </div>

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Description (Optional)"
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.description?.message}
                placeholder="Add details about your studies, achievements, or activities..."
                maxLength={1000}
              />
            )}
          />

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
              {editingEducation ? 'Update Education' : 'Add Education'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default EducationForm;
