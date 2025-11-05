import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from '@/components/layout/Layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card/Card';

// Lazy load auth pages
const EmailVerification = lazy(() => import('@/features/auth/pages/EmailVerification'));
const ForgotPassword = lazy(() => import('@/features/auth/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/features/auth/pages/ResetPassword'));

// Lazy load user pages
const ProfilePage = lazy(() => import('@/features/user/pages/ProfilePage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));

// Lazy load news pages
const NewsHomePage = lazy(() => import('@/features/news/pages/NewsHomePage'));
const ArticleDetailPage = lazy(() => import('@/features/news/pages/ArticleDetailPage').then(m => ({ default: m.ArticleDetailPage })));
const BookmarksPage = lazy(() => import('@/features/bookmarks/pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Placeholder home page component
const HomePage = () => {

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Neurmatic - LLM Community Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Foundation setup completed successfully!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sprint 0 Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-primary-600 dark:text-primary-400">
                  Frontend Foundation ✓
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ React 18+ with TypeScript</li>
                  <li>✓ Vite build tool</li>
                  <li>✓ React Router v6</li>
                  <li>✓ Path Aliases configured</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary-600 dark:text-primary-400">
                  Styling & UI ✓
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ Tailwind CSS configured</li>
                  <li>✓ Dark mode support</li>
                  <li>✓ Base components (Button, Input, Card, Modal)</li>
                  <li>✓ Responsive layouts</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary-600 dark:text-primary-400">
                  State Management ✓
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ TanStack Query v5</li>
                  <li>✓ Zustand stores (Auth, UI)</li>
                  <li>✓ API client with error handling</li>
                  <li>✓ Persistence middleware</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-primary-600 dark:text-primary-400">
                  Internationalization ✓
                </h3>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ react-i18next configured</li>
                  <li>✓ English & Dutch translations</li>
                  <li>✓ Language switcher</li>
                  <li>✓ Browser detection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ComingSoonPage = ({ title }: { title: string }) => (
  <div className="container-custom py-12">
    <Card className="max-w-2xl mx-auto text-center">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 dark:text-gray-400">Coming Soon</p>
      </CardContent>
    </Card>
  </div>
);

// Router configuration
const router = createBrowserRouter([
  // Auth routes (no layout)
  {
    path: '/verify',
    element: (
      <Suspense fallback={<PageLoader />}>
        <EmailVerification />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ForgotPassword />
      </Suspense>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ResetPassword />
      </Suspense>
    ),
  },
  // Main app routes (with layout)
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'news',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NewsHomePage />
          </Suspense>
        ),
      },
      {
        path: 'news/:slug',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ArticleDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'bookmarks',
        element: (
          <Suspense fallback={<PageLoader />}>
            <BookmarksPage />
          </Suspense>
        ),
      },
      {
        path: 'forum',
        element: <ComingSoonPage title="Forum" />,
      },
      {
        path: 'jobs',
        element: <ComingSoonPage title="Jobs" />,
      },
      {
        path: 'guide',
        element: <ComingSoonPage title="LLM Guide" />,
      },
      {
        path: 'profile/:username',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default router;
