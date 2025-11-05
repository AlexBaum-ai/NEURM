import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Input from '@/components/common/Input/Input';
import Button from '@/components/common/Button/Button';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { useToast } from '@/components/common/Toast/ToastProvider';
import { profileUpdateSchema, ProfileUpdateFormData, UserProfile } from '../../types';
import { useUpdateProfile } from '../../hooks/useProfile';

interface BasicInfoFormProps {
  profile: UserProfile;
  onSuccess?: () => void;
  onDirty?: () => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ profile, onSuccess, onDirty }) => {
  const { showSuccess, showError } = useToast();
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      displayName: profile.displayName || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      socialLinks: {
        twitter: profile.socialLinks?.twitter || '',
        linkedin: profile.socialLinks?.linkedin || '',
        github: profile.socialLinks?.github || '',
      },
    },
  });

  // Notify parent of dirty state
  useEffect(() => {
    if (isDirty && onDirty) {
      onDirty();
    }
  }, [isDirty, onDirty]);

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      showSuccess('Profile updated successfully');
      reset(data); // Reset form with new values
      onSuccess?.();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Display Name"
          {...register('displayName')}
          error={errors.displayName?.message}
          placeholder="Your display name"
        />

        <Input
          label="Location"
          {...register('location')}
          error={errors.location?.message}
          placeholder="City, Country"
        />
      </div>

      <Input
        label="Headline"
        {...register('headline')}
        error={errors.headline?.message}
        placeholder="e.g., AI/ML Engineer | Prompt Engineering Specialist"
        maxLength={200}
      />

      <Controller
        name="bio"
        control={control}
        render={({ field }) => (
          <RichTextEditor
            label="Bio"
            value={field.value || ''}
            onChange={field.onChange}
            error={errors.bio?.message}
            placeholder="Tell us about yourself..."
            maxLength={2000}
          />
        )}
      />

      <Input
        label="Website"
        type="url"
        {...register('website')}
        error={errors.website?.message}
        placeholder="https://yourwebsite.com"
      />

      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Social Links
        </h3>

        <Input
          label="Twitter"
          type="url"
          {...register('socialLinks.twitter')}
          error={errors.socialLinks?.twitter?.message}
          placeholder="https://twitter.com/username"
        />

        <Input
          label="LinkedIn"
          type="url"
          {...register('socialLinks.linkedin')}
          error={errors.socialLinks?.linkedin?.message}
          placeholder="https://linkedin.com/in/username"
        />

        <Input
          label="GitHub"
          type="url"
          {...register('socialLinks.github')}
          error={errors.socialLinks?.github?.message}
          placeholder="https://github.com/username"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={!isDirty || isSubmitting}
        >
          Reset
        </Button>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default BasicInfoForm;
