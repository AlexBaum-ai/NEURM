import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry } from '@/lib/sentry';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import '@/styles/globals.css';
import '@/lib/i18n';
import App from './App.tsx';

// Initialize Sentry FIRST before any other code
initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
