import * as React from 'react';

/**
 * Hook to track keyboard navigation and apply appropriate focus styles
 *
 * Detects when user is navigating with keyboard (Tab key) vs mouse
 * and adds/removes body class accordingly
 *
 * @example
 * ```tsx
 * function App() {
 *   useKeyboardNavigation();
 *   return <div>...</div>;
 * }
 * ```
 */
export const useKeyboardNavigation = (): void => {
  React.useEffect(() => {
    let isTabbing = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && !isTabbing) {
        isTabbing = true;
        document.body.classList.add('user-is-tabbing');
      }
    };

    const handleMouseDown = () => {
      if (isTabbing) {
        isTabbing = false;
        document.body.classList.remove('user-is-tabbing');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      document.body.classList.remove('user-is-tabbing');
    };
  }, []);
};
