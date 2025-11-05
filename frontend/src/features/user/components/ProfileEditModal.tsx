import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X } from 'lucide-react';
import BasicInfoForm from './forms/BasicInfoForm';
import ImagesForm from './forms/ImagesForm';
import SkillsForm from './forms/SkillsForm';
import WorkExperienceForm from './forms/WorkExperienceForm';
import EducationForm from './forms/EducationForm';
import PortfolioForm from './forms/PortfolioForm';
import { UserProfile } from '../types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  defaultTab?: string;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  profile,
  defaultTab = 'basic',
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirm) return;
    }
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl animate-scale-in overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
            <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Edit Profile
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                onClick={handleClose}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Tabs */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <Tabs.List className="flex border-b border-gray-200 dark:border-gray-700 px-6 overflow-x-auto">
              <Tabs.Trigger
                value="basic"
                className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 whitespace-nowrap"
              >
                Basic Info
              </Tabs.Trigger>
              <Tabs.Trigger
                value="images"
                className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 whitespace-nowrap"
              >
                Images
              </Tabs.Trigger>
              <Tabs.Trigger
                value="skills"
                className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 whitespace-nowrap"
              >
                Skills
              </Tabs.Trigger>
              <Tabs.Trigger
                value="experience"
                className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 whitespace-nowrap"
              >
                Work Experience
              </Tabs.Trigger>
              <Tabs.Trigger
                value="education"
                className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 whitespace-nowrap"
              >
                Education
              </Tabs.Trigger>
              <Tabs.Trigger
                value="portfolio"
                className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400 whitespace-nowrap"
              >
                Portfolio
              </Tabs.Trigger>
            </Tabs.List>

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <Tabs.Content value="basic" className="p-6 focus:outline-none">
                <BasicInfoForm
                  profile={profile}
                  onSuccess={() => setHasUnsavedChanges(false)}
                  onDirty={() => setHasUnsavedChanges(true)}
                />
              </Tabs.Content>

              <Tabs.Content value="images" className="p-6 focus:outline-none">
                <ImagesForm
                  profile={profile}
                  onSuccess={() => setHasUnsavedChanges(false)}
                  onDirty={() => setHasUnsavedChanges(true)}
                />
              </Tabs.Content>

              <Tabs.Content value="skills" className="p-6 focus:outline-none">
                <SkillsForm
                  skills={profile.skills}
                  onSuccess={() => setHasUnsavedChanges(false)}
                  onDirty={() => setHasUnsavedChanges(true)}
                />
              </Tabs.Content>

              <Tabs.Content value="experience" className="p-6 focus:outline-none">
                <WorkExperienceForm
                  experiences={profile.workExperience}
                  onSuccess={() => setHasUnsavedChanges(false)}
                  onDirty={() => setHasUnsavedChanges(true)}
                />
              </Tabs.Content>

              <Tabs.Content value="education" className="p-6 focus:outline-none">
                <EducationForm
                  educations={profile.education}
                  onSuccess={() => setHasUnsavedChanges(false)}
                  onDirty={() => setHasUnsavedChanges(true)}
                />
              </Tabs.Content>

              <Tabs.Content value="portfolio" className="p-6 focus:outline-none">
                <PortfolioForm
                  projects={profile.portfolio}
                  onSuccess={() => setHasUnsavedChanges(false)}
                  onDirty={() => setHasUnsavedChanges(true)}
                />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ProfileEditModal;
