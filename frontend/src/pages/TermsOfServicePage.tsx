/**
 * Terms of Service Page
 * Displays the platform's terms of service with dynamic content from backend
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLegalDocument } from '@/hooks/useGDPR';
import ReactMarkdown from 'react-markdown';

const TermsOfServicePage: React.FC = () => {
  const { data: document, isLoading, error } = useLegalDocument('terms');

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
              Error Loading Terms of Service
            </h2>
            <p className="text-red-700 dark:text-red-300">
              We're sorry, but we couldn't load the terms of service at this time. Please try again
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
        <title>Terms of Service - Neurmatic</title>
        <meta
          name="description"
          content="Neurmatic's terms of service govern your use of our platform and services."
        />
      </Helmet>

      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Version {document.version}</span>
              <span>•</span>
              <span>Effective Date: {effectiveDate}</span>
              <span>•</span>
              <span>Last Updated: {new Date(document.updatedAt).toLocaleDateString()}</span>
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
              }}
            >
              {document.content}
            </ReactMarkdown>
          </div>

          {/* Contact Information */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Questions?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have any questions about these terms, please contact us:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:legal@neurmatic.com"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  legal@neurmatic.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfServicePage;
