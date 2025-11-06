import React from 'react';
import { Link } from 'react-router-dom';
import type { GlossaryTerm } from '../types';

interface GlossaryTermCardProps {
  term: GlossaryTerm;
}

const GlossaryTermCard: React.FC<GlossaryTermCardProps> = ({ term }) => {
  return (
    <Link
      to={`/guide/glossary/${term.slug}`}
      className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
            {term.term}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {term.briefDefinition}
          </p>
        </div>
        <span
          className="flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300"
          title={`Category: ${term.category}`}
        >
          {term.category}
        </span>
      </div>
    </Link>
  );
};

export default GlossaryTermCard;
