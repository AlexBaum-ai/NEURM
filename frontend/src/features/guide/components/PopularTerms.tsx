import React from 'react';
import { Link } from 'react-router-dom';
import { usePopularTerms } from '../hooks/useGlossary';

interface PopularTermsProps {
  limit?: number;
}

const PopularTerms: React.FC<PopularTermsProps> = ({ limit = 10 }) => {
  const { data: popularTerms } = usePopularTerms(limit);

  if (!popularTerms || popularTerms.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wider flex items-center gap-2">
        <svg
          className="w-4 h-4 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        Popular Terms
      </h3>
      <div className="space-y-2">
        {popularTerms.map((term, index) => (
          <Link
            key={term.id}
            to={`/guide/glossary/${term.slug}`}
            className="block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {term.term}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                  {term.briefDefinition}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300">
                    {term.category}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
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
                    {term.viewCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PopularTerms;
