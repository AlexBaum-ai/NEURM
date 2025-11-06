/**
 * Consent Preferences Modal
 * Detailed modal for customizing cookie consent preferences
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/common/Modal/Modal';
import { Button } from '@/components/common/Button/Button';
import type { ConsentPreferences } from '@/types/gdpr';
import { getCurrentConsent } from './CookieConsentBanner';

interface ConsentPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: ConsentPreferences) => void;
}

interface ConsentCategoryInfo {
  id: keyof ConsentPreferences;
  title: string;
  description: string;
  required: boolean;
  examples: string[];
}

const CONSENT_CATEGORIES: ConsentCategoryInfo[] = [
  {
    id: 'necessary',
    title: 'Necessary Cookies',
    description:
      'These cookies are essential for the website to function properly. They enable core functionality such as security, authentication, and network management. These cookies cannot be disabled.',
    required: true,
    examples: ['Authentication', 'Security', 'Session management', 'Load balancing'],
  },
  {
    id: 'functional',
    title: 'Functional Cookies',
    description:
      'These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.',
    required: false,
    examples: ['Language preferences', 'Theme selection', 'UI preferences', 'Font size'],
  },
  {
    id: 'analytics',
    title: 'Analytics Cookies',
    description:
      'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
    required: false,
    examples: ['Page views', 'User behavior', 'Traffic sources', 'Performance metrics'],
  },
  {
    id: 'marketing',
    title: 'Marketing Cookies',
    description:
      'These cookies are used to track visitors across websites to display relevant and personalized advertisements.',
    required: false,
    examples: ['Ad targeting', 'Campaign tracking', 'Social media integration', 'Retargeting'],
  },
];

export const ConsentPreferencesModal: React.FC<ConsentPreferencesModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Load existing preferences if available
    const existing = getCurrentConsent();
    if (existing) {
      setPreferences(existing);
    }
  }, []);

  const handleToggle = (category: keyof ConsentPreferences) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies

    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    onSave(allAccepted);
  };

  const handleRejectAll = () => {
    const allRejected: ConsentPreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    onSave(allRejected);
  };

  const handleSave = () => {
    onSave(preferences);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cookie Preferences"
      size="lg"
    >
      <div className="space-y-6">
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We use cookies to enhance your experience on our platform. You can choose which types of
          cookies to allow. For more information, please read our{' '}
          <Link
            to="/cookies"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cookie Policy
          </Link>
          .
        </p>

        {/* Categories */}
        <div className="space-y-4">
          {CONSENT_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {category.title}
                    </h3>
                    {category.required && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.examples.map((example) => (
                      <span
                        key={example}
                        className="text-xs px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="flex-shrink-0">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences[category.id]}
                    aria-label={`Toggle ${category.title}`}
                    disabled={category.required}
                    onClick={() => handleToggle(category.id)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                      dark:focus:ring-offset-gray-900
                      ${
                        preferences[category.id]
                          ? 'bg-primary-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }
                      ${category.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${preferences[category.id] ? 'translate-x-6' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="md"
              onClick={handleRejectAll}
              className="w-full sm:w-auto"
            >
              Reject All
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleAcceptAll}
              className="w-full sm:w-auto"
            >
              Accept All
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              className="w-full sm:w-auto"
            >
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
