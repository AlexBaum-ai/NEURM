import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/reactQuery';
import { AppRouter } from '@/routes';
import { ToastProvider } from '@/components/common/Toast/ToastProvider';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <ToastProvider>
          <AppRouter />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </ToastProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;
