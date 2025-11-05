import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Loader2, Upload, ExternalLink, Github, Star } from 'lucide-react';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { useToast } from '@/components/common/Toast/ToastProvider';
import {
  portfolioProjectSchema,
  PortfolioProjectFormData,
  PortfolioProject,
} from '../../types';
import {
  useCreatePortfolioProject,
  useUpdatePortfolioProject,
  useDeletePortfolioProject,
  useUploadPortfolioImage,
} from '../../hooks/useProfile';

interface PortfolioFormProps {
  projects: PortfolioProject[];
  onSuccess?: () => void;
  onDirty?: () => void;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ projects, onSuccess, onDirty }) => {
  const { showSuccess, showError } = useToast();
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreatePortfolioProject();
  const updateMutation = useUpdatePortfolioProject();
  const deleteMutation = useDeletePortfolioProject();
  const uploadImageMutation = useUploadPortfolioImage();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<PortfolioProjectFormData>({
    resolver: zodResolver(portfolioProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      techStack: [],
      projectUrl: '',
      githubUrl: '',
      demoUrl: '',
      isFeatured: false,
    },
  });

  const techStack = watch('techStack');
  const isFeatured = watch('isFeatured');

  useEffect(() => {
    if (isDirty && onDirty) {
      onDirty();
    }
  }, [isDirty, onDirty]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      const thumbnailUrl = await uploadImageMutation.mutateAsync(file);
      setValue('thumbnailUrl', thumbnailUrl, { shouldDirty: true });
      showSuccess('Image uploaded successfully');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to upload image');
      setThumbnailPreview(null);
    }
  };

  const onSubmit = async (data: PortfolioProjectFormData & { thumbnailUrl?: string }) => {
    try {
      if (editingProject) {
        await updateMutation.mutateAsync({ id: editingProject.id, data });
        showSuccess('Project updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        showSuccess('Project added successfully');
      }

      reset();
      setEditingProject(null);
      setIsAdding(false);
      setThumbnailPreview(null);
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to save project');
    }
  };

  const handleEdit = (project: PortfolioProject) => {
    setEditingProject(project);
    setIsAdding(true);
    setValue('title', project.title);
    setValue('description', project.description);
    setValue('techStack', project.techStack);
    setValue('projectUrl', project.projectUrl || '');
    setValue('githubUrl', project.githubUrl || '');
    setValue('demoUrl', project.demoUrl || '');
    setValue('isFeatured', project.isFeatured);
    if (project.thumbnailUrl) {
      setThumbnailPreview(project.thumbnailUrl);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteMutation.mutateAsync(projectId);
      showSuccess('Project deleted successfully');
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete project');
    }
  };

  const handleCancel = () => {
    reset();
    setEditingProject(null);
    setIsAdding(false);
    setThumbnailPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Existing Projects */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Portfolio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects
              .sort((a, b) => b.displayOrder - a.displayOrder)
              .map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  {project.thumbnailUrl && (
                    <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                      <img
                        src={project.thumbnailUrl}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      {project.isFeatured && (
                        <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Featured
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {project.title}
                    </h4>
                    <div
                      className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: project.description }}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.techStack.slice(0, 3).map((tech, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400">
                          +{project.techStack.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-2">
                        {project.demoUrl && (
                          <a
                            href={project.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            title="Live Demo"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            title="GitHub"
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(project)}
                          disabled={isAdding}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
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
          Add Project
        </Button>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {editingProject ? 'Edit Project' : 'Add Project'}
          </h3>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Thumbnail
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-primary-500 transition-colors"
            >
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="max-h-48 mx-auto rounded"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setThumbnailPreview(null);
                      setValue('thumbnailUrl', undefined, { shouldDirty: true });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="py-8">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload thumbnail (max 5MB)
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <Input
            label="Project Title"
            {...register('title')}
            error={errors.title?.message}
            placeholder="e.g., AI-Powered Chat Application"
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                label="Description"
                value={field.value || ''}
                onChange={field.onChange}
                error={errors.description?.message}
                placeholder="Describe your project..."
                maxLength={1000}
              />
            )}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tech Stack (comma-separated)
            </label>
            <Input
              {...register('techStack')}
              placeholder="e.g., React, Node.js, OpenAI API"
              onChange={(e) => {
                const value = e.target.value;
                setValue(
                  'techStack',
                  value ? value.split(',').map((t) => t.trim()) : [],
                  { shouldDirty: true }
                );
              }}
              defaultValue={techStack?.join(', ')}
              error={errors.techStack?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Project URL"
              type="url"
              {...register('projectUrl')}
              error={errors.projectUrl?.message}
              placeholder="https://project.com"
            />

            <Input
              label="GitHub URL"
              type="url"
              {...register('githubUrl')}
              error={errors.githubUrl?.message}
              placeholder="https://github.com/..."
            />

            <Input
              label="Demo URL"
              type="url"
              {...register('demoUrl')}
              error={errors.demoUrl?.message}
              placeholder="https://demo.com"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              {...register('isFeatured')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isFeatured" className="text-sm text-gray-700 dark:text-gray-300">
              Mark as featured project
            </label>
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
              {editingProject ? 'Update Project' : 'Add Project'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PortfolioForm;
