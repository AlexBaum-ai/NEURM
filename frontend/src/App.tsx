import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/reactQuery';
import { AppRouter } from '@/routes';
import { ToastProvider } from '@/components/common/Toast/ToastProvider';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import '@/styles/accessibility.css';

const App = () => {
  // Enable keyboard navigation detection
  useKeyboardNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ToastProvider>
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ToastProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
