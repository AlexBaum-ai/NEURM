import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSentry } from '@/lib/sentry';
import { initPerformanceMonitoring } from '@/utils/performance';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import '@/styles/globals.css';
import '@/lib/i18n';
import App from './App.tsx';

// Initialize Sentry FIRST before any other code
initSentry();

// Initialize performance monitoring for Core Web Vitals
initPerformanceMonitoring();

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
