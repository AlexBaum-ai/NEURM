import React from 'react';
import { useGlossaryAlphabet } from '../hooks/useGlossary';

interface AlphabetNavProps {
  onLetterClick: (letter: string) => void;
  activeLetter?: string;
}

const AlphabetNav: React.FC<AlphabetNavProps> = ({ onLetterClick, activeLetter }) => {
  const { data: alphabetData } = useGlossaryAlphabet();

  // Create a map for quick lookup
  const letterMap = new Map(alphabetData.map(item => [item.letter, item.count]));

  // Generate all letters A-Z
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const handleLetterClick = (letter: string, hasTerms: boolean) => {
    if (hasTerms) {
      onLetterClick(letter);
      // Smooth scroll to the letter section
      const element = document.getElementById(`letter-${letter}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <nav
      className="sticky top-16 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 shadow-sm"
      aria-label="Alphabet navigation"
    >
      <div className="container-custom">
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          {allLetters.map(letter => {
            const count = letterMap.get(letter) || 0;
            const hasTerms = count > 0;
            const isActive = activeLetter === letter;

            return (
              <button
                key={letter}
                onClick={() => handleLetterClick(letter, hasTerms)}
                disabled={!hasTerms}
                className={`
                  w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-md text-sm sm:text-base font-semibold
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md scale-110'
                      : hasTerms
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-400'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }
                `}
                aria-label={hasTerms ? `View ${count} term${count !== 1 ? 's' : ''} starting with ${letter}` : `No terms starting with ${letter}`}
                title={hasTerms ? `${count} term${count !== 1 ? 's' : ''}` : 'No terms'}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default AlphabetNav;
