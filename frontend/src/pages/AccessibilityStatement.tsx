import * as React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

/**
 * Accessibility Statement Page
 *
 * Documents the platform's commitment to accessibility and provides
 * information about WCAG 2.1 compliance.
 */
const AccessibilityStatement: React.FC = () => {
  const { t } = useTranslation('common');
  const lastUpdated = '2025-11-06';

  return (
    <>
      <Helmet>
        <title>Accessibility Statement | Neurmatic</title>
        <meta
          name="description"
          content="Neurmatic's commitment to web accessibility and WCAG 2.1 AA compliance"
        />
      </Helmet>

      <div className="container-custom py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Accessibility Statement
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Our Commitment
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                Neurmatic is committed to ensuring digital accessibility for people with
                disabilities. We are continually improving the user experience for everyone and
                applying the relevant accessibility standards to ensure we provide equal access to
                all of our users.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Conformance Status
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                The Web Content Accessibility Guidelines (WCAG) defines requirements for designers
                and developers to improve accessibility for people with disabilities. It defines
                three levels of conformance: Level A, Level AA, and Level AAA.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>Neurmatic is fully conformant with WCAG 2.1 Level AA.</strong> Fully
                conformant means that the content fully conforms to the accessibility standard
                without any exceptions.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Accessibility Features
              </h2>
              <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Keyboard Navigation:</strong> All functionality is available using a
                  keyboard. Logical tab order and visible focus indicators.
                </li>
                <li>
                  <strong>Screen Reader Support:</strong> Compatible with major screen readers
                  including NVDA, JAWS, and VoiceOver.
                </li>
                <li>
                  <strong>Skip Links:</strong> Skip navigation links to jump directly to main
                  content, navigation, or search.
                </li>
                <li>
                  <strong>Color Contrast:</strong> All text and UI components meet WCAG contrast
                  requirements (4.5:1 for text, 3:1 for UI components).
                </li>
                <li>
                  <strong>Alternative Text:</strong> All images, icons, and visual elements have
                  descriptive alternative text.
                </li>
                <li>
                  <strong>Form Labels:</strong> All form inputs have associated labels and
                  descriptive error messages.
                </li>
                <li>
                  <strong>Semantic HTML:</strong> Proper HTML structure with semantic elements for
                  better understanding.
                </li>
                <li>
                  <strong>ARIA Labels:</strong> ARIA attributes used appropriately to enhance
                  accessibility.
                </li>
                <li>
                  <strong>Responsive Design:</strong> Fully responsive design that works on all
                  devices and screen sizes.
                </li>
                <li>
                  <strong>Dark Mode:</strong> High contrast dark mode option available.
                </li>
                <li>
                  <strong>Reduced Motion:</strong> Respects user's motion preferences.
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Keyboard Shortcuts
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700"
                      >
                        Shortcut
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700"
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                          Tab
                        </kbd>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        Navigate forward through interactive elements
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                          Shift + Tab
                        </kbd>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        Navigate backward through interactive elements
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                          Enter
                        </kbd>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        Activate links and buttons
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                          Escape
                        </kbd>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        Close modals and dialogs
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                          Arrow Keys
                        </kbd>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        Navigate within menus, tabs, and lists
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700">
                          /
                        </kbd>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        Focus search bar (when available)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Technical Specifications
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Accessibility of Neurmatic relies on the following technologies to work with the
                particular combination of web browser and any assistive technologies or plugins
                installed on your computer:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>HTML5</li>
                <li>WAI-ARIA 1.2</li>
                <li>CSS3</li>
                <li>JavaScript</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                These technologies are relied upon for conformance with the accessibility standards
                used.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Assistive Technologies Tested
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Neurmatic has been tested with the following assistive technologies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>NVDA (Windows)</li>
                <li>JAWS (Windows)</li>
                <li>VoiceOver (macOS and iOS)</li>
                <li>TalkBack (Android)</li>
                <li>Keyboard-only navigation</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Known Limitations
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                While we strive for full accessibility, there may be some limitations:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  Third-party embedded content may not fully meet accessibility standards. We are
                  working with providers to improve this.
                </li>
                <li>
                  PDF documents uploaded by users may not be accessible. We encourage users to
                  upload accessible documents.
                </li>
                <li>
                  Some complex data visualizations may have limited screen reader support, but we
                  provide text alternatives where possible.
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Feedback and Contact
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                We welcome your feedback on the accessibility of Neurmatic. Please let us know if
                you encounter accessibility barriers:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  Email:{' '}
                  <a
                    href="mailto:accessibility@neurmatic.com"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  >
                    accessibility@neurmatic.com
                  </a>
                </li>
                <li>
                  Contact Form:{' '}
                  <Link
                    to="/contact"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-4">
                We try to respond to feedback within 5 business days.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Assessment Approach
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Neurmatic assessed the accessibility of this website by the following approaches:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Self-evaluation using automated tools (Axe DevTools, WAVE)</li>
                <li>Manual testing with screen readers and keyboard navigation</li>
                <li>User testing with individuals who have disabilities</li>
                <li>Ongoing monitoring and regular accessibility audits</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Formal Complaints
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                If you are not satisfied with our response to your accessibility feedback, you may
                file a formal complaint by contacting our accessibility team at{' '}
                <a
                  href="mailto:accessibility@neurmatic.com"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                >
                  accessibility@neurmatic.com
                </a>
                . We will investigate and respond within 10 business days.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                External Resources
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <a
                    href="https://www.w3.org/WAI/WCAG21/quickref/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  >
                    WCAG 2.1 Quick Reference
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.w3.org/WAI/ARIA/apg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  >
                    ARIA Authoring Practices Guide
                  </a>
                </li>
                <li>
                  <a
                    href="https://webaim.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  >
                    WebAIM - Web Accessibility Resources
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccessibilityStatement;
