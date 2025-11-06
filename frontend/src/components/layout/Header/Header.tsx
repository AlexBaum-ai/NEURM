import * as React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HamburgerMenuIcon, PersonIcon, GearIcon, ExitIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/common/Button/Button';
import LanguageSwitcher from '@/components/common/LanguageSwitcher/LanguageSwitcher';
import ThemeToggle from '@/components/common/ThemeToggle/ThemeToggle';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/features/auth';
import { GlobalSearchBar } from '@/features/search';

const Header: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const {
    toggleMobileMenu,
    authModalOpen,
    authModalView,
    openAuthModal,
    closeAuthModal,
  } = useUIStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/news', label: t('nav.news') },
    { to: '/forum', label: t('nav.forum') },
    { to: '/jobs', label: t('nav.jobs') },
    { to: '/guide', label: t('nav.guide') },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-800 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60',
        isScrolled && 'shadow-sm'
      )}
    >
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
                N
              </div>
              <span className="hidden sm:inline text-xl font-bold text-gray-900 dark:text-white">
                {t('appName')}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-medium transition-colors hover:text-primary-600 dark:hover:text-primary-400',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Search Bar - Desktop/Tablet */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <GlobalSearchBar
              placeholder="Search..."
              showVoiceSearch={false}
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <ThemeToggle />
            <LanguageSwitcher className="hidden sm:block" />

            {isAuthenticated ? (
              <div className="relative user-menu-container">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-label="User menu"
                  className="relative"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <PersonIcon className="h-5 w-5" />
                  )}
                </Button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.username}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>

                    <Link
                      to={`/profile/${user?.username}`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <PersonIcon className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <GearIcon className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>

                    <div className="border-t border-gray-200 dark:border-gray-800 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-accent-600 dark:text-accent-400 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                    >
                      <ExitIcon className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openAuthModal('login')}>
                  Login
                </Button>
                <Button size="sm" onClick={() => openAuthModal('register')}>
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <HamburgerMenuIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
        defaultView={authModalView}
        redirectTo="/dashboard"
      />
    </header>
  );
};

export default Header;
