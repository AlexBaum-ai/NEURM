import * as React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GitHubLogoIcon, TwitterLogoIcon, LinkedInLogoIcon } from '@radix-ui/react-icons';

const Footer: React.FC = () => {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: t('nav.news'), to: '/news' },
      { label: t('nav.forum'), to: '/forum' },
      { label: t('nav.jobs'), to: '/jobs' },
      { label: t('nav.guide'), to: '/guide' },
    ],
    company: [
      { label: t('nav.about'), to: '/about' },
      { label: t('nav.contact'), to: '/contact' },
      { label: t('footer.privacy'), to: '/privacy' },
      { label: t('footer.terms'), to: '/terms' },
      { label: 'Cookie Policy', to: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: GitHubLogoIcon, href: 'https://github.com', label: 'GitHub' },
    { icon: TwitterLogoIcon, href: 'https://twitter.com', label: 'Twitter' },
    { icon: LinkedInLogoIcon, href: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
                N
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {t('appName')}
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
              The premier community platform for LLM enthusiasts, developers, and professionals.
              Connect, learn, and grow together.
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t('footer.followUs')}
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            © {currentYear} Neurmatic. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
