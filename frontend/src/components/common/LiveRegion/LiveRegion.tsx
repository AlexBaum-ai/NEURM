import * as React from 'react';
import { cn } from '@/lib/utils';

interface LiveRegionProps {
  /** Content to be announced to screen readers */
  children: React.ReactNode;

  /** ARIA live region priority level */
  priority?: 'polite' | 'assertive' | 'off';

  /** Whether the entire region should be announced when changed */
  atomic?: boolean;

  /** What types of changes should be announced (can be space-separated) */
  relevant?:
    | 'additions'
    | 'removals'
    | 'text'
    | 'all'
    | 'additions text'
    | 'additions removals'
    | 'removals text'
    | 'removals additions'
    | 'text additions'
    | 'text removals';

  /** Role attribute */
  role?: 'status' | 'alert' | 'log' | 'timer';

  /** Additional CSS classes */
  className?: string;

  /** Whether to visually hide the content (screen reader only) */
  visuallyHidden?: boolean;
}

/**
 * LiveRegion Component
 *
 * Creates an ARIA live region for announcing dynamic content changes
 * to screen reader users.
 *
 * WCAG 2.1 Success Criterion 4.1.3 (Level AA) - Status Messages
 *
 * @example
 * ```tsx
 * // Polite announcement (doesn't interrupt)
 * <LiveRegion priority="polite" role="status">
 *   Form saved successfully
 * </LiveRegion>
 *
 * // Assertive announcement (interrupts current reading)
 * <LiveRegion priority="assertive" role="alert">
 *   Error: Please fix the following errors
 * </LiveRegion>
 * ```
 */
const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'additions text',
  role = 'status',
  className,
  visuallyHidden = false,
}) => {
  return (
    <div
      role={role}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn(visuallyHidden && 'sr-only', className)}
    >
      {children}
    </div>
  );
};

export default LiveRegion;
