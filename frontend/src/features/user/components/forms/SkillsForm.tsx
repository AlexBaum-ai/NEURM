import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, Star } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import { useToast } from '@/components/common/Toast/ToastProvider';
import { skillSchema } from '../../types';
import type { SkillFormData, UserSkill } from '../../types';
import { useCreateSkill, useUpdateSkill, useDeleteSkill } from '../../hooks/useProfile';

interface SkillsFormProps {
  skills: UserSkill[];
  onSuccess?: () => void;
  onDirty?: () => void;
}

const SkillsForm: React.FC<SkillsFormProps> = ({ skills, onSuccess, onDirty }) => {
  const { showSuccess, showError } = useToast();
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const createSkillMutation = useCreateSkill();
  const updateSkillMutation = useUpdateSkill();
  const deleteSkillMutation = useDeleteSkill();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: '',
      category: '',
      proficiency: 3,
    },
  });

  const proficiency = watch('proficiency');

  useEffect(() => {
    if (isDirty && onDirty) {
      onDirty();
    }
  }, [isDirty, onDirty]);

  const onSubmit = async (data: SkillFormData) => {
    try {
      if (editingSkill) {
        await updateSkillMutation.mutateAsync({ id: editingSkill.id, data });
        showSuccess('Skill updated successfully');
      } else {
        await createSkillMutation.mutateAsync(data);
        showSuccess('Skill added successfully');
      }

      reset();
      setEditingSkill(null);
      setIsAdding(false);
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save skill');
    }
  };

  const handleEdit = (skill: UserSkill) => {
    setEditingSkill(skill);
    setIsAdding(true);
    setValue('name', skill.name);
    setValue('category', skill.category);
    setValue('proficiency', skill.proficiency);
  };

  const handleDelete = async (skillId: string) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;

    try {
      await deleteSkillMutation.mutateAsync(skillId);
      showSuccess('Skill deleted successfully');
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete skill');
    }
  };

  const handleCancel = () => {
    reset();
    setEditingSkill(null);
    setIsAdding(false);
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= count
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Existing Skills */}
      {skills.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Skills
          </h3>
          <div className="space-y-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {skill.name}
                    </h4>
                    <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                      {skill.category}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {renderStars(skill.proficiency)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      ({skill.proficiency}/5)
                    </span>
                    {skill.endorsementCount !== undefined && skill.endorsementCount > 0 && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        • {skill.endorsementCount} endorsements
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(skill)}
                    disabled={isAdding}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(skill.id)}
                    disabled={deleteSkillMutation.isPending}
                  >
                    {deleteSkillMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
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
          Add Skill
        </Button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editingSkill ? 'Edit Skill' : 'Add New Skill'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Skill Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="e.g., Prompt Engineering"
            />

            <Input
              label="Category"
              {...register('category')}
              error={errors.category?.message}
              placeholder="e.g., AI/ML"
            />
          </div>

          {/* Proficiency Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Proficiency Level
            </label>
            <div className="space-y-3">
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[proficiency]}
                onValueChange={(value) => setValue('proficiency', value[0], { shouldDirty: true })}
                max={5}
                min={1}
                step={1}
              >
                <Slider.Track className="bg-gray-200 dark:bg-gray-700 relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-primary-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white dark:bg-gray-200 border-2 border-primary-500 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2" />
              </Slider.Root>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {proficiency}/5
                </span>
                {renderStars(proficiency)}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSkillMutation.isPending || updateSkillMutation.isPending}
              className="flex-1"
            >
              {(createSkillMutation.isPending || updateSkillMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingSkill ? 'Update Skill' : 'Add Skill'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SkillsForm;
