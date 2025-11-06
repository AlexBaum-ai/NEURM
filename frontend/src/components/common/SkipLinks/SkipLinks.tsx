import * as React from 'react';
import { useTranslation } from 'react-i18next';

interface SkipLink {
  id: string;
  label: string;
  target: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

/**
 * SkipLinks Component
 *
 * Provides keyboard users with shortcuts to main content areas,
 * bypassing repetitive navigation elements.
 *
 * WCAG 2.1 Success Criterion 2.4.1 (Level A) - Bypass Blocks
 *
 * @example
 * ```tsx
 * <SkipLinks />
 * ```
 */
const SkipLinks: React.FC<SkipLinksProps> = ({ links }) => {
  const { t } = useTranslation('common');

  const defaultLinks: SkipLink[] = [
    {
      id: 'skip-to-main',
      label: t('accessibility.skipToMain', 'Skip to main content'),
      target: '#main-content',
    },
    {
      id: 'skip-to-nav',
      label: t('accessibility.skipToNav', 'Skip to navigation'),
      target: '#main-navigation',
    },
    {
      id: 'skip-to-search',
      label: t('accessibility.skipToSearch', 'Skip to search'),
      target: '#search',
    },
  ];

  const skipLinks = links || defaultLinks;

  const handleSkipClick = (event: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    event.preventDefault();
    const element = document.querySelector(target) as HTMLElement;

    if (element) {
      // Set tabindex to make element focusable
      const originalTabIndex = element.getAttribute('tabindex');
      element.setAttribute('tabindex', '-1');

      // Focus the element
      element.focus();

      // Scroll into view
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Restore original tabindex after focus
      setTimeout(() => {
        if (originalTabIndex === null) {
          element.removeAttribute('tabindex');
        } else {
          element.setAttribute('tabindex', originalTabIndex);
        }
      }, 100);
    }
  };

  return (
    <nav aria-label={t('accessibility.skipLinks', 'Skip links')}>
      <ul className="skip-links-container">
        {skipLinks.map((link) => (
          <li key={link.id}>
            <a
              href={link.target}
              className="skip-link"
              onClick={(e) => handleSkipClick(e, link.target)}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SkipLinks;
