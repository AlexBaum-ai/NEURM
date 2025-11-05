import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/common/Modal/Modal';
import { useProfile, useProfileCompleteness } from '@/features/profile/hooks/useProfile';
import { useApplyJob } from '../../hooks/useJobs';
import type { JobDetail } from '../../types';
import type { ApplicationFormData, ApplicationDraft } from './types';
import ApplicationForm from './ApplicationForm';
import ProfileCompletenessCheck from './ProfileCompletenessCheck';
import ApplicationSuccess from './ApplicationSuccess';

interface ApplyModalProps {
  job: JobDetail;
  isOpen: boolean;
  onClose: () => void;
}

const DRAFT_STORAGE_KEY = 'job_application_drafts';

export const ApplyModal: React.FC<ApplyModalProps> = ({ job, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const completeness = useProfileCompleteness();
  const applyMutation = useApplyJob();

  const [showSuccess, setShowSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Load draft from localStorage
  const loadDraft = (): Partial<ApplicationFormData> | undefined => {
    try {
      const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!draftsJson) return undefined;

      const drafts: ApplicationDraft[] = JSON.parse(draftsJson);
      const draft = drafts.find((d) => d.jobSlug === job.slug);

      if (draft) {
        return {
          coverLetter: draft.coverLetter,
          screeningAnswers: draft.screeningAnswers,
        };
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return undefined;
  };

  const [initialData] = useState<Partial<ApplicationFormData> | undefined>(loadDraft);

  // Save draft to localStorage
  const saveDraft = (data: ApplicationFormData) => {
    try {
      const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY);
      let drafts: ApplicationDraft[] = draftsJson ? JSON.parse(draftsJson) : [];

      // Remove existing draft for this job
      drafts = drafts.filter((d) => d.jobSlug !== job.slug);

      // Add new draft
      drafts.push({
        jobSlug: job.slug,
        coverLetter: data.coverLetter,
        screeningAnswers: data.screeningAnswers,
        savedAt: new Date().toISOString(),
      });

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  // Clear draft from localStorage
  const clearDraft = () => {
    try {
      const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!draftsJson) return;

      let drafts: ApplicationDraft[] = JSON.parse(draftsJson);
      drafts = drafts.filter((d) => d.jobSlug !== job.slug);

      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: ApplicationFormData) => {
    if (!profile) return;

    try {
      const response = await applyMutation.mutateAsync({
        slug: job.slug,
        data: {
          coverLetter: data.coverLetter,
          resumeUrl: profile.profile.resumeUrl || undefined,
          screeningAnswers: data.screeningAnswers.length > 0 ? data.screeningAnswers : undefined,
        },
      });

      // Clear draft on successful submission
      clearDraft();

      // Show success state
      setShowSuccess(true);
      setApplicationId(response.message); // Assuming the response contains an ID or tracking info
    } catch (error: any) {
      // Error handling is done by the mutation
      console.error('Application submission failed:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (showSuccess) {
      // Redirect to applications page after success
      navigate('/applications');
    }
    onClose();
  };

  // Reset success state when modal reopens
  useEffect(() => {
    if (!isOpen) {
      setShowSuccess(false);
      setApplicationId(null);
    }
  }, [isOpen]);

  if (isLoadingProfile) {
    return (
      <Modal open={isOpen} onOpenChange={handleClose}>
        <ModalContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </ModalContent>
      </Modal>
    );
  }

  if (!profile) {
    return (
      <Modal open={isOpen} onOpenChange={handleClose}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Sign In Required</ModalTitle>
            <ModalDescription>
              Please sign in to apply for this position.
            </ModalDescription>
          </ModalHeader>
          <div className="py-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
            >
              Sign In
            </button>
          </div>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>
            {showSuccess ? 'Application Submitted!' : `Apply for ${job.title}`}
          </ModalTitle>
          <ModalDescription>
            {showSuccess
              ? 'Your application has been successfully submitted.'
              : `${job.company.companyName} • ${job.location}`}
          </ModalDescription>
        </ModalHeader>

        <div className="py-4">
          {showSuccess ? (
            <ApplicationSuccess
              job={job}
              onViewApplications={() => {
                handleClose();
                navigate('/applications');
              }}
              onClose={handleClose}
            />
          ) : (
            <div className="space-y-6">
              {/* Profile Completeness Check */}
              <ProfileCompletenessCheck completeness={completeness} />

              {/* Application Form */}
              {completeness.isComplete ? (
                <ApplicationForm
                  profile={profile}
                  screeningQuestions={job.screeningQuestions}
                  initialData={initialData}
                  onSubmit={handleSubmit}
                  isSubmitting={applyMutation.isPending}
                  onCancel={handleClose}
                  onDraftSave={saveDraft}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Complete your profile to apply for this position.
                  </p>
                  <button
                    onClick={() => navigate('/profile/edit')}
                    className="bg-primary-600 text-white py-2 px-6 rounded-md hover:bg-primary-700"
                  >
                    Complete Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
};

export default ApplyModal;
