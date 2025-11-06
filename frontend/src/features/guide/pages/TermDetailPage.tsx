import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useGlossaryTerm, useIncrementTermView } from '../hooks/useGlossary';
import { useToast } from '@/hooks/useToast';

const TermDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: term } = useGlossaryTerm(slug!);
  const incrementView = useIncrementTermView(slug!);
  const { showSuccess } = useToast();
  const [copied, setCopied] = useState(false);

  // Increment view count on mount
  useEffect(() => {
    incrementView.mutate();
  }, [slug]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/guide/glossary/${term.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showSuccess('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <>
      <Helmet>
        <title>{term.term} | LLM Glossary | Neurmatic</title>
        <meta name="description" content={term.briefDefinition} />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container-custom py-8">
          {/* Breadcrumbs */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/guide/glossary" className="hover:text-primary-600 dark:hover:text-primary-400">
                  Glossary
                </Link>
              </li>
              <li>
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li className="text-gray-900 dark:text-white font-medium">{term.term}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <main className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                {/* Header */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                      {term.term}
                    </h1>
                    <span className="flex-shrink-0 px-3 py-1 text-sm font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300">
                      {term.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      {term.viewCount.toLocaleString()} views
                    </span>
                    <span>•</span>
                    <span>Updated {formatDate(term.updatedAt)}</span>
                  </div>
                </div>

                {/* Definition */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Definition
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {term.definition}
                  </p>
                </div>

                {/* Examples */}
                {term.examples && term.examples.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Examples
                    </h2>
                    <div className="space-y-4">
                      {term.examples.map((example, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                        >
                          <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">
                            {example}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Terms */}
                {term.relatedTerms && term.relatedTerms.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Related Terms
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {term.relatedTerms.map(relatedTerm => (
                        <Link
                          key={relatedTerm.id}
                          to={`/guide/glossary/${relatedTerm.slug}`}
                          className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all duration-200"
                        >
                          <div className="font-medium text-gray-900 dark:text-white mb-1">
                            {relatedTerm.term}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {relatedTerm.briefDefinition}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                {/* Copy Link Button */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <button
                    onClick={handleCopyLink}
                    className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy Term Link
                      </>
                    )}
                  </button>
                </div>

                {/* Back to Glossary */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <Link
                    to="/guide/glossary"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Back to Glossary
                  </Link>
                </div>

                {/* Term Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
                    Term Info
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-600 dark:text-gray-400">Category</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">{term.category}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 dark:text-gray-400">Views</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">
                        {term.viewCount.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 dark:text-gray-400">Last Updated</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">
                        {formatDate(term.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermDetailPage;
