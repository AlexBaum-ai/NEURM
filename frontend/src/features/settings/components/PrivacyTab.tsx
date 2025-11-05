import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';
import { useToast } from '@/hooks/useToast';
import { getPrivacySettings, updatePrivacySettings } from '../api/settingsApi';
import type { ProfilePrivacySettings, VisibilityLevel } from '@/features/user/types';

const VISIBILITY_OPTIONS: Array<{ value: VisibilityLevel; label: string; description: string }> = [
  { value: 'public', label: 'Public', description: 'Visible to everyone' },
  { value: 'community', label: 'Community', description: 'Visible to logged-in users' },
  { value: 'recruiters', label: 'Recruiters', description: 'Visible to verified recruiters only' },
  { value: 'private', label: 'Private', description: 'Only visible to you' },
];

const PRIVACY_SECTIONS = [
  { key: 'bio', label: 'Bio & About', description: 'Your bio, headline, and about section' },
  {
    key: 'workExperience',
    label: 'Work Experience',
    description: 'Your employment history and experience',
  },
  { key: 'education', label: 'Education', description: 'Your educational background' },
  { key: 'portfolio', label: 'Portfolio', description: 'Your portfolio projects and work samples' },
  { key: 'skills', label: 'Skills', description: 'Your skills and expertise' },
  {
    key: 'contact',
    label: 'Contact Information',
    description: 'Your email and social media links',
  },
] as const;

const PrivacyTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: privacySettings, isLoading } = useQuery({
    queryKey: ['privacySettings'],
    queryFn: getPrivacySettings,
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: updatePrivacySettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['privacySettings'], data);
      toast.success('Privacy settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update privacy settings');
    },
  });

  const handleVisibilityChange = (section: keyof ProfilePrivacySettings, value: VisibilityLevel) => {
    if (!privacySettings) return;

    updatePrivacyMutation.mutate({
      [section]: value,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Control who can see different sections of your profile. Changes are saved automatically.
          </p>

          <div className="space-y-6">
            {PRIVACY_SECTIONS.map((section) => (
              <div key={section.key} className="border-b border-gray-200 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {section.label}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {section.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VISIBILITY_OPTIONS.map((option) => {
                    const isSelected =
                      privacySettings?.[section.key as keyof ProfilePrivacySettings] ===
                      option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleVisibilityChange(
                            section.key as keyof ProfilePrivacySettings,
                            option.value
                          )
                        }
                        disabled={updatePrivacyMutation.isPending}
                        className={`
                          relative px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        title={option.description}
                      >
                        {option.label}
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <strong className="text-gray-900 dark:text-white">Public:</strong> Anyone can view
              this information, including search engines.
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Community:</strong> Only registered
              and logged-in Neurmatic users can view this.
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Recruiters:</strong> Only verified
              recruiters with active accounts can view this.
            </div>
            <div>
              <strong className="text-gray-900 dark:text-white">Private:</strong> Only you can view
              this information.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyTab;
