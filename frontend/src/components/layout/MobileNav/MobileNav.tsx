import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cross2Icon } from '@radix-ui/react-icons';
import { Button } from '@/components/common/Button/Button';
import LanguageSwitcher from '@/components/common/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/common/ThemeToggle/ThemeToggle';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const MobileNav: React.FC = () => {
  const { t } = useTranslation('common');
  const { mobileMenuOpen, setMobileMenuOpen, openAuthModal } = useUIStore();
  const { isAuthenticated } = useAuthStore();

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/news', label: t('nav.news') },
    { to: '/forum', label: t('nav.forum') },
    { to: '/jobs', label: t('nav.jobs') },
    { to: '/guide', label: t('nav.guide') },
  ];

  const closeMenu = React.useCallback(() => {
    setMobileMenuOpen(false);
  }, [setMobileMenuOpen]);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  if (!mobileMenuOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* Slide-out menu */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-950 md:hidden',
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <Cross2Icon className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-lg px-4 py-3 text-base font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Language
                </span>
                <LanguageSwitcher />
              </div>
            </div>
          </nav>

          {/* Footer Actions */}
          {!isAuthenticated && (
            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    closeMenu();
                    openAuthModal('login');
                  }}
                >
                  Login
                </Button>
                <Button
                  onClick={() => {
                    closeMenu();
                    openAuthModal('register');
                  }}
                >
                  Sign Up
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileNav;
