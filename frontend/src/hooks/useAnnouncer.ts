import * as React from 'react';

type AnnouncementPriority = 'polite' | 'assertive';

interface AnnouncerOptions {
  clearAfter?: number;
}

/**
 * Hook to announce messages to screen readers using ARIA live regions
 *
 * WCAG 2.1 Success Criterion 4.1.3 (Level AA) - Status Messages
 *
 * @example
 * ```tsx
 * const announce = useAnnouncer();
 *
 * const handleSubmit = () => {
 *   // ... form logic
 *   announce('Form submitted successfully', 'polite');
 * };
 * ```
 */
export const useAnnouncer = (options: AnnouncerOptions = {}) => {
  const { clearAfter = 5000 } = options;

  const announce = React.useCallback(
    (message: string, priority: AnnouncementPriority = 'polite') => {
      const announcer = getOrCreateAnnouncer(priority);

      // Clear previous message
      announcer.textContent = '';

      // Use setTimeout to ensure screen readers pick up the change
      setTimeout(() => {
        announcer.textContent = message;

        // Auto-clear after specified time
        if (clearAfter > 0) {
          setTimeout(() => {
            if (announcer.textContent === message) {
              announcer.textContent = '';
            }
          }, clearAfter);
        }
      }, 100);
    },
    [clearAfter]
  );

  return announce;
};

/**
 * Get or create an announcer element for the specified priority
 */
const getOrCreateAnnouncer = (priority: AnnouncementPriority): HTMLElement => {
  const id = `aria-announcer-${priority}`;
  let announcer = document.getElementById(id);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = id;
    announcer.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';

    document.body.appendChild(announcer);
  }

  return announcer;
};
