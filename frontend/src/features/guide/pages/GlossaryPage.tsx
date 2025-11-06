import React, { useState, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import AlphabetNav from '../components/AlphabetNav';
import GlossarySearchBar from '../components/GlossarySearchBar';
import CategoryFilter from '../components/CategoryFilter';
import PopularTerms from '../components/PopularTerms';
import GlossaryTermCard from '../components/GlossaryTermCard';
import { useGroupedGlossaryTerms } from '../hooks/useGlossary';
import type { GlossaryFilters } from '../types';

const GlossaryPage: React.FC = () => {
  const [filters, setFilters] = useState<GlossaryFilters>({});
  const [activeLetter, setActiveLetter] = useState<string>();
  const groupedTerms = useGroupedGlossaryTerms(filters);

  // Update active letter when scrolling
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-letter]');
      let currentLetter = '';

      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        // Check if section is in viewport (with some offset for the sticky header)
        if (rect.top <= 200 && rect.bottom >= 200) {
          currentLetter = section.getAttribute('data-letter') || '';
        }
      });

      if (currentLetter && currentLetter !== activeLetter) {
        setActiveLetter(currentLetter);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeLetter]);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
    setActiveLetter(undefined);
  };

  const handleCategoryChange = (category?: string) => {
    setFilters(prev => ({ ...prev, category }));
    setActiveLetter(undefined);
  };

  const handleLetterClick = (letter: string) => {
    setActiveLetter(letter);
    // Clear search when navigating by letter
    setFilters(prev => ({ ...prev, search: undefined }));
  };

  const hasResults = Object.keys(groupedTerms).length > 0;

  return (
    <>
      <Helmet>
        <title>LLM Glossary | Neurmatic</title>
        <meta
          name="description"
          content="Browse our comprehensive glossary of Large Language Model terms, concepts, and technical jargon. Learn the language of LLMs with clear definitions and examples."
        />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container-custom py-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              LLM Glossary
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              Your comprehensive guide to Large Language Model terminology. Explore terms, concepts, and technical jargon with clear definitions and examples.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-6">
          <div className="container-custom flex justify-center">
            <GlossarySearchBar onSearch={handleSearch} />
          </div>
        </div>

        {/* Alphabet Navigation */}
        <AlphabetNav onLetterClick={handleLetterClick} activeLetter={activeLetter} />

        {/* Main Content */}
        <div className="container-custom py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              <Suspense fallback={<div className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
                <CategoryFilter
                  selectedCategory={filters.category}
                  onCategoryChange={handleCategoryChange}
                />
              </Suspense>
              <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
                <PopularTerms limit={10} />
              </Suspense>
            </aside>

            {/* Terms List */}
            <main className="lg:col-span-3">
              {!hasResults && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No terms found</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                </div>
              )}

              {hasResults && (
                <div className="space-y-8">
                  {Object.entries(groupedTerms).map(([letter, terms]) => (
                    <section key={letter} id={`letter-${letter}`} data-letter={letter}>
                      <div className="sticky top-32 z-5 bg-gray-50 dark:bg-gray-900 py-2 mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-600 text-white">
                            {letter}
                          </span>
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            {terms.length} term{terms.length !== 1 ? 's' : ''}
                          </span>
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {terms.map(term => (
                          <GlossaryTermCard key={term.id} term={term} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlossaryPage;
