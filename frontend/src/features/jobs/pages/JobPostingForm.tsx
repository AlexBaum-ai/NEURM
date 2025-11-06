import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Eye, Send } from 'lucide-react';
import { useToast } from '@/components/common/Toast/ToastProvider';
import Button from '@/components/common/Button/Button';
import { Card } from '@/components/common/Card/Card';
import StepIndicator from '../components/StepIndicator';
import BasicInfoStep from '../components/BasicInfoStep';
import RequirementsStep from '../components/RequirementsStep';
import TechStackStep from '../components/TechStackStep';
import DetailsStep from '../components/DetailsStep';
import PreviewModal from '../components/PreviewModal';
import {
  jobFormSchema,
  type JobFormValues,
} from '../utils/validation';
import { jobsApi } from '../api/jobsApi';

const STEPS = [
  { number: 1, title: 'Basic Info', description: 'Title & description' },
  { number: 2, title: 'Requirements', description: 'Skills & experience' },
  { number: 3, title: 'Tech Stack', description: 'LLMs & tools' },
  { number: 4, title: 'Details', description: 'Compensation & location' }
];

const JobPostingForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const duplicateSlug = searchParams.get('duplicate');

  // Initialize form with default values
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    getValues,
    trigger
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      description: '',
      employmentType: 'full_time',
      positionsAvailable: 1,
      experienceLevel: 'mid',
      requirements: '',
      skills: [],
      metadata: {
        primaryLlms: [],
        frameworks: [],
        vectorDatabases: [],
        infrastructure: [],
        programmingLanguages: [],
        useCaseType: '',
        modelStrategy: ''
      },
      location: '',
      remoteType: 'remote',
      salaryCurrency: 'USD',
      salaryIsPublic: false,
      hasVisaSponsorship: false,
      screeningQuestions: [],
      status: 'draft'
    },
    mode: 'onChange'
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const loadDraft = () => {
      try {
        const draftKey = 'job_posting_draft';
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          reset(draft);
          setLastSaved(new Date(draft._savedAt));
          showToast('Draft restored from previous session', 'info');
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    };

    loadDraft();
  }, [reset, showToast]);

  // Load duplicate job if specified
  useEffect(() => {
    const loadDuplicateJob = async () => {
      if (!duplicateSlug) return;

      try {
        const response = await jobsApi.duplicateJob(duplicateSlug);
        if (response.success && response.data) {
          reset(response.data as any);
          showToast('Job duplicated successfully', 'success');
        }
      } catch (error) {
        console.error('Failed to duplicate job:', error);
        showToast('Failed to load job for duplication', 'error');
      }
    };

    loadDuplicateJob();
  }, [duplicateSlug, reset, showToast]);

  // Auto-save to localStorage every 60 seconds
  useEffect(() => {
    const autoSave = setInterval(() => {
      const currentValues = getValues();
      const draftKey = 'job_posting_draft';

      try {
        const draftData = {
          ...currentValues,
          _savedAt: new Date().toISOString()
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        setLastSaved(new Date());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(autoSave);
  }, [getValues]);

  // Manual save draft
  const handleSaveDraft = useCallback(() => {
    const currentValues = getValues();
    const draftKey = 'job_posting_draft';

    try {
      const draftData = {
        ...currentValues,
        status: 'draft',
        _savedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setLastSaved(new Date());
      showToast('Draft saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save draft:', error);
      showToast('Failed to save draft', 'error');
    }
  }, [getValues, showToast]);

  // Validate current step
  const validateStep = async (step: number): Promise<boolean> => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = await trigger(['title', 'description', 'employmentType', 'positionsAvailable']);
        break;
      case 2:
        isValid = await trigger(['experienceLevel', 'requirements', 'skills']);
        break;
      case 3:
        isValid = await trigger(['metadata']);
        break;
      case 4:
        isValid = await trigger([
          'location',
          'remoteType',
          'salaryCurrency',
          'salaryIsPublic',
          'hasVisaSponsorship',
          'screeningQuestions'
        ]);
        break;
      default:
        isValid = true;
    }

    if (!isValid) {
      showToast('Please fix validation errors before proceeding', 'error');
    }

    return isValid;
  };

  // Navigation handlers
  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit form
  const onSubmit = async (data: JobFormValues) => {
    setIsSubmitting(true);

    try {
      // Set status to active for publish
      const submitData = { ...data, status: 'active' as const };

      const response = await jobsApi.createJob(submitData);

      if (response.success) {
        // Clear draft from localStorage
        localStorage.removeItem('job_posting_draft');

        showToast('Job posting published successfully!', 'success');
        navigate(`/jobs/${response.data.slug}`);
      }
    } catch (error: any) {
      console.error('Failed to publish job:', error);
      showToast(
        error.response?.data?.error?.message || 'Failed to publish job posting',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save as draft and submit
  const handleSaveAsDraft = async () => {
    setIsSubmitting(true);

    try {
      const data = getValues();
      const draftData = { ...data, status: 'draft' as const };

      const response = await jobsApi.createJob(draftData);

      if (response.success) {
        localStorage.removeItem('job_posting_draft');
        showToast('Job saved as draft', 'success');
        navigate('/jobs/drafts');
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      showToast(
        error.response?.data?.error?.message || 'Failed to save draft',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    const commonProps = { register, errors, watch, setValue };

    switch (currentStep) {
      case 1:
        return <BasicInfoStep {...commonProps} />;
      case 2:
        return <RequirementsStep {...commonProps} />;
      case 3:
        return <TechStackStep watch={watch} setValue={setValue} errors={errors} />;
      case 4:
        return <DetailsStep {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="container-custom py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Post a New Job
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create a detailed job posting to attract qualified LLM engineers
        </p>

        {lastSaved && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} steps={STEPS} />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="p-6 md:p-8 mt-8">
          {renderStep()}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button type="button" variant="secondary" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Publishing...' : 'Publish Job'}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        data={getValues()}
      />
    </div>
  );
};

export default JobPostingForm;
