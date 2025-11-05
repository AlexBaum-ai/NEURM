import React from 'react';
import { X, MapPin, Briefcase, Clock, DollarSign, Globe, Star } from 'lucide-react';
import Modal from '@/components/common/Modal/Modal';
import Button from '@/components/common/Button/Button';
import { cn } from '@/lib/utils';
import type { JobFormValues } from '../utils/validation';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Partial<JobFormValues>;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, data }) => {
  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!data.salaryIsPublic || (!min && !max)) return null;

    const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    }
    if (min) return `From ${symbol}${min.toLocaleString()}`;
    if (max) return `Up to ${symbol}${max.toLocaleString()}`;
    return null;
  };

  const renderStars = (level: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= level
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-none text-gray-300'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Job Posting Preview" size="large">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {data.title || 'Job Title'}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {data.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {data.location}
              </div>
            )}
            {data.remoteType && (
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {data.remoteType === 'remote' && 'Fully Remote'}
                {data.remoteType === 'hybrid' && 'Hybrid'}
                {data.remoteType === 'on_site' && 'On-Site'}
              </div>
            )}
            {data.employmentType && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {data.employmentType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
            )}
            {formatSalary(data.salaryMin, data.salaryMax, data.salaryCurrency) && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatSalary(data.salaryMin, data.salaryMax, data.salaryCurrency)}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {data.metadata?.primaryLlms?.map((model) => (
              <span
                key={model}
                className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium"
              >
                {model}
              </span>
            ))}
            {data.hasVisaSponsorship && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                Visa Sponsorship
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              About the Role
            </h2>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          </div>
        )}

        {/* Requirements */}
        {data.requirements && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Requirements
            </h2>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                {data.experienceLevel
                  ?.split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </span>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
              {data.requirements}
            </pre>
          </div>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Required Skills
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {skill.skillName}
                  </span>
                  {renderStars(skill.requiredLevel)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {data.metadata && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Tech Stack
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.metadata.frameworks && data.metadata.frameworks.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frameworks
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.metadata.frameworks.map((fw) => (
                      <span
                        key={fw}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {fw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.metadata.programmingLanguages && data.metadata.programmingLanguages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Languages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.metadata.programmingLanguages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.metadata.vectorDatabases && data.metadata.vectorDatabases.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vector Databases
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.metadata.vectorDatabases.map((db) => (
                      <span
                        key={db}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {db}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.metadata.infrastructure && data.metadata.infrastructure.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Infrastructure
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.metadata.infrastructure.map((infra) => (
                      <span
                        key={infra}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {infra}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {data.responsibilities && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Responsibilities
            </h2>
            <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
              {data.responsibilities}
            </pre>
          </div>
        )}

        {/* Benefits */}
        {data.benefits && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Benefits & Perks
            </h2>
            <pre className="whitespace-pre-wrap font-sans text-gray-700 dark:text-gray-300">
              {data.benefits}
            </pre>
          </div>
        )}

        {/* Screening Questions */}
        {data.screeningQuestions && data.screeningQuestions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              Screening Questions
            </h2>
            <div className="space-y-2">
              {data.screeningQuestions.map((q, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <p className="text-sm text-gray-900 dark:text-white">
                    {index + 1}. {q.question}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {q.required ? 'Required' : 'Optional'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PreviewModal;
