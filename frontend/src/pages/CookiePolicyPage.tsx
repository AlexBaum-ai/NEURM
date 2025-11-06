/**
 * Cookie Policy Page
 * Displays the platform's cookie policy with dynamic content from backend
 * Also includes a button to manage cookie preferences
 */

import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLegalDocument } from '@/hooks/useGDPR';
import { ConsentPreferencesModal } from '@/components/common/CookieConsent/ConsentPreferencesModal';
import { Button } from '@/components/common/Button/Button';
import ReactMarkdown from 'react-markdown';
import type { ConsentPreferences } from '@/types/gdpr';

const CookiePolicyPage: React.FC = () => {
  const { data: document, isLoading, error } = useLegalDocument('cookies');
  const [showPreferences, setShowPreferences] = useState(false);

  const handleSavePreferences = (preferences: ConsentPreferences) => {
    // Save preferences via the modal's built-in functionality
    setShowPreferences(false);

    // Show success message
    const message = document.createElement('div');
    message.className =
      'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
    message.textContent = 'Cookie preferences updated successfully';
    document.body.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
            <div className="space-y-3 mt-8">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Error Loading Cookie Policy
            </h2>
            <p className="text-red-700 dark:text-red-300">
              We're sorry, but we couldn't load the cookie policy at this time. Please try again
              later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  const effectiveDate = new Date(document.effectiveDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Helmet>
        <title>Cookie Policy - Neurmatic</title>
        <meta
          name="description"
          content="Learn about how Neurmatic uses cookies and how you can manage your cookie preferences."
        />
      </Helmet>

      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header with Manage Preferences Button */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Cookie Policy
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Version {document.version}</span>
                  <span>•</span>
                  <span>Effective Date: {effectiveDate}</span>
                  <span>•</span>
                  <span>Last Updated: {new Date(document.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowPreferences(true)}
                className="flex-shrink-0"
              >
                Manage Preferences
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => (
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2" {...props} />
                ),
                p: ({ ...props }) => (
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700 dark:text-gray-300" {...props} />
                ),
                li: ({ ...props }) => (
                  <li className="ml-4" {...props} />
                ),
                a: ({ ...props }) => (
                  <a
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                    {...props}
                  />
                ),
                strong: ({ ...props }) => (
                  <strong className="font-semibold text-gray-900 dark:text-white" {...props} />
                ),
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
                  </div>
                ),
                thead: ({ ...props }) => (
                  <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
                ),
                th: ({ ...props }) => (
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    {...props}
                  />
                ),
                td: ({ ...props }) => (
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300" {...props} />
                ),
              }}
            >
              {document.content}
            </ReactMarkdown>
          </div>

          {/* Manage Preferences CTA */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Manage Your Cookie Preferences
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                You have control over which cookies we use. Click the button below to customize your
                cookie preferences at any time.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowPreferences(true)}
              >
                Manage Cookie Preferences
              </Button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Questions About Cookies?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about our use of cookies, please contact us:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:privacy@neurmatic.com"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  privacy@neurmatic.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Consent Preferences Modal */}
      {showPreferences && (
        <ConsentPreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          onSave={handleSavePreferences}
        />
      )}
    </>
  );
};

export default CookiePolicyPage;
