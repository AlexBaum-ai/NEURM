/**
 * Lazy loading utilities for components and resources
 */

import { lazy, type ComponentType } from 'react';

/**
 * Retry function for failed lazy imports
 */
export function retry<T>(
  fn: () => Promise<T>,
  retriesLeft = 3,
  interval = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn()
      .then(resolve)
      .catch((error) => {
        setTimeout(() => {
          if (retriesLeft === 1) {
            reject(error);
            return;
          }

          // Retry with exponential backoff
          retry(fn, retriesLeft - 1, interval * 2).then(resolve, reject);
        }, interval);
      });
  });
}

/**
 * Lazy load component with retry logic
 *
 * @example
 * const Dashboard = lazyWithRetry(() => import('./features/dashboard/pages/Dashboard'));
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 3
): React.LazyExoticComponent<T> {
  return lazy(() => retry(componentImport, retriesLeft));
}

/**
 * Preload a lazy component
 *
 * @example
 * const Dashboard = lazyWithRetry(() => import('./features/dashboard/pages/Dashboard'));
 * preloadComponent(Dashboard);
 */
export function preloadComponent(
  component: React.LazyExoticComponent<any>
): void {
  const preloadable = component as any;
  if (preloadable._payload && preloadable._payload._result === null) {
    // Component hasn't been loaded yet, trigger the import
    preloadable._init(preloadable._payload);
  }
}

/**
 * Intersection Observer based lazy loader for images and components
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null;
  private elementsMap = new Map<Element, () => void>();

  constructor(options?: IntersectionObserverInit) {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px',
          threshold: 0.01,
          ...options,
        }
      );
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const callback = this.elementsMap.get(entry.target);
        if (callback) {
          callback();
          this.unobserve(entry.target);
        }
      }
    });
  }

  public observe(element: Element, callback: () => void): void {
    if (!this.observer) {
      // Fallback: execute immediately if IntersectionObserver is not supported
      callback();
      return;
    }

    this.elementsMap.set(element, callback);
    this.observer.observe(element);
  }

  public unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.elementsMap.delete(element);
  }

  public disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.elementsMap.clear();
  }
}

/**
 * Singleton lazy loader instance
 */
export const lazyLoader = new LazyLoader();

/**
 * Prefetch a resource
 */
export function prefetch(url: string, as: string = 'fetch'): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = as;
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Preload a resource (higher priority than prefetch)
 */
export function preload(
  url: string,
  as: string = 'fetch',
  type?: string
): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;
  if (type) {
    link.type = type;
  }
  document.head.appendChild(link);
}

/**
 * Preconnect to an origin
 */
export function preconnect(url: string, crossorigin = false): void {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  if (crossorigin) {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

/**
 * DNS prefetch for an origin
 */
export function dnsPrefetch(url: string): void {
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = url;
  document.head.appendChild(link);
}
