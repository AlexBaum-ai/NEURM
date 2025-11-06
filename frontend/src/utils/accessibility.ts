/**
 * Accessibility Utilities
 *
 * Helper functions for accessibility testing and enhancements
 */

/**
 * Check if an element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ];

  return (
    focusableSelectors.some((selector) => element.matches(selector)) &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0 &&
    !element.hasAttribute('hidden') &&
    !element.hasAttribute('aria-hidden')
  );
};

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    isFocusable
  );
};

/**
 * Check color contrast ratio
 * Returns true if contrast meets WCAG AA requirements
 */
export const meetsContrastRequirements = (
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Calculate relative luminance of a color
 */
export const getRelativeLuminance = (color: string): number => {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Generate a unique ID for accessibility attributes
 */
export const generateA11yId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void => {
  const announcer = document.getElementById(`aria-announcer-${priority}`);
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }
};

/**
 * Check if element has accessible name
 */
export const hasAccessibleName = (element: HTMLElement): boolean => {
  // Check for aria-label
  if (element.hasAttribute('aria-label')) {
    return !!element.getAttribute('aria-label')?.trim();
  }

  // Check for aria-labelledby
  if (element.hasAttribute('aria-labelledby')) {
    const labelId = element.getAttribute('aria-labelledby');
    if (labelId) {
      const labelElement = document.getElementById(labelId);
      return !!labelElement?.textContent?.trim();
    }
  }

  // Check for associated label (for form inputs)
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      return !!label?.textContent?.trim();
    }
  }

  // Check for text content
  return !!element.textContent?.trim();
};

/**
 * Check if element is keyboard accessible
 */
export const isKeyboardAccessible = (element: HTMLElement): boolean => {
  // Interactive elements should be focusable
  const interactiveRoles = [
    'button',
    'link',
    'checkbox',
    'radio',
    'textbox',
    'combobox',
    'listbox',
    'menuitem',
    'tab',
  ];

  const role = element.getAttribute('role');
  const isInteractive = role && interactiveRoles.includes(role);

  if (isInteractive) {
    const tabindex = element.getAttribute('tabindex');
    return tabindex !== '-1' && isFocusable(element);
  }

  // Non-interactive elements don't need to be focusable
  return true;
};

/**
 * Validate ARIA attributes
 */
export const validateAriaAttributes = (element: HTMLElement): string[] => {
  const errors: string[] = [];

  // Check for invalid ARIA roles
  const role = element.getAttribute('role');
  if (role && !isValidAriaRole(role)) {
    errors.push(`Invalid ARIA role: ${role}`);
  }

  // Check for required ARIA properties
  if (role === 'button' && element.hasAttribute('aria-pressed')) {
    const pressed = element.getAttribute('aria-pressed');
    if (pressed !== 'true' && pressed !== 'false' && pressed !== 'mixed') {
      errors.push('aria-pressed must be "true", "false", or "mixed"');
    }
  }

  return errors;
};

/**
 * Check if ARIA role is valid
 */
const isValidAriaRole = (role: string): boolean => {
  const validRoles = [
    'alert',
    'alertdialog',
    'application',
    'article',
    'banner',
    'button',
    'checkbox',
    'columnheader',
    'combobox',
    'complementary',
    'contentinfo',
    'definition',
    'dialog',
    'directory',
    'document',
    'feed',
    'figure',
    'form',
    'grid',
    'gridcell',
    'group',
    'heading',
    'img',
    'link',
    'list',
    'listbox',
    'listitem',
    'log',
    'main',
    'marquee',
    'math',
    'menu',
    'menubar',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'navigation',
    'none',
    'note',
    'option',
    'presentation',
    'progressbar',
    'radio',
    'radiogroup',
    'region',
    'row',
    'rowgroup',
    'rowheader',
    'scrollbar',
    'search',
    'searchbox',
    'separator',
    'slider',
    'spinbutton',
    'status',
    'switch',
    'tab',
    'table',
    'tablist',
    'tabpanel',
    'term',
    'textbox',
    'timer',
    'toolbar',
    'tooltip',
    'tree',
    'treegrid',
    'treeitem',
  ];

  return validRoles.includes(role);
};

/**
 * Get accessibility tree for an element (useful for debugging)
 */
export const getAccessibilityTree = (element: HTMLElement): object => {
  return {
    role: element.getAttribute('role') || element.tagName.toLowerCase(),
    name: getAccessibleName(element),
    description: element.getAttribute('aria-describedby'),
    states: {
      disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
      expanded: element.getAttribute('aria-expanded'),
      selected: element.getAttribute('aria-selected'),
      checked: element.getAttribute('aria-checked'),
    },
    focusable: isFocusable(element),
    children: Array.from(element.children).map((child) =>
      getAccessibilityTree(child as HTMLElement)
    ),
  };
};

/**
 * Get accessible name of an element
 */
const getAccessibleName = (element: HTMLElement): string => {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // Check aria-labelledby
  const labelledby = element.getAttribute('aria-labelledby');
  if (labelledby) {
    const labelElement = document.getElementById(labelledby);
    if (labelElement) return labelElement.textContent || '';
  }

  // Check associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent || '';
  }

  // Fall back to text content
  return element.textContent || '';
};
