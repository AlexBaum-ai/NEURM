/**
 * Performance monitoring utilities for Core Web Vitals and custom metrics
 */

// Core Web Vitals thresholds
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 }, // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
  TTI: { good: 3900, needsImprovement: 7300 }, // Time to Interactive
};

export type MetricName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'TTI';

export interface PerformanceMetric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

/**
 * Get rating for a metric value
 */
export function getMetricRating(
  name: MetricName,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = WEB_VITALS_THRESHOLDS[name];

  if (value <= threshold.good) {
    return 'good';
  } else if (value <= threshold.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Report Web Vital metric to analytics
 */
export function reportWebVital(metric: PerformanceMetric): void {
  // Send to analytics service (Google Analytics, Sentry, etc.)
  if (import.meta.env.PROD) {
    console.log('[Performance]', metric);

    // Example: Send to Google Analytics
    // if (window.gtag) {
    //   window.gtag('event', metric.name, {
    //     value: Math.round(metric.value),
    //     metric_rating: metric.rating,
    //     metric_delta: metric.delta,
    //     metric_id: metric.id,
    //   });
    // }

    // Example: Send to Sentry
    // if (window.Sentry) {
    //   window.Sentry.captureMessage(`${metric.name}: ${metric.value}`, {
    //     level: 'info',
    //     tags: {
    //       metric: metric.name,
    //       rating: metric.rating,
    //     },
    //   });
    // }
  }
}

/**
 * Measure Largest Contentful Paint (LCP)
 */
export function measureLCP(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime: number;
        loadTime: number;
      };

      const value = lastEntry.renderTime || lastEntry.loadTime;
      const metric: PerformanceMetric = {
        name: 'LCP',
        value: value,
        rating: getMetricRating('LCP', value),
      };

      callback(metric);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    console.error('Error measuring LCP:', error);
  }
}

/**
 * Measure First Input Delay (FID)
 */
export function measureFID(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstInput = entries[0] as PerformanceEventTiming;

      const value = firstInput.processingStart - firstInput.startTime;
      const metric: PerformanceMetric = {
        name: 'FID',
        value: value,
        rating: getMetricRating('FID', value),
      };

      callback(metric);
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    console.error('Error measuring FID:', error);
  }
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
export function measureCLS(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsEntries.push(entry);
          clsValue += (entry as any).value;
        }
      });

      const metric: PerformanceMetric = {
        name: 'CLS',
        value: clsValue,
        rating: getMetricRating('CLS', clsValue),
      };

      callback(metric);
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    console.error('Error measuring CLS:', error);
  }
}

/**
 * Measure First Contentful Paint (FCP)
 */
export function measureFCP(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries[0];

      const metric: PerformanceMetric = {
        name: 'FCP',
        value: fcpEntry.startTime,
        rating: getMetricRating('FCP', fcpEntry.startTime),
      };

      callback(metric);
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    console.error('Error measuring FCP:', error);
  }
}

/**
 * Measure Time to First Byte (TTFB)
 */
export function measureTTFB(): PerformanceMetric | null {
  if (!('performance' in window) || !performance.timing) return null;

  const navigationEntry = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming;

  if (!navigationEntry) return null;

  const value = navigationEntry.responseStart - navigationEntry.requestStart;

  return {
    name: 'TTFB',
    value: value,
    rating: getMetricRating('TTFB', value),
  };
}

/**
 * Initialize Web Vitals monitoring
 */
export function initPerformanceMonitoring(): void {
  if (import.meta.env.DEV) {
    console.log('[Performance] Monitoring initialized');
  }

  // Measure and report Core Web Vitals
  measureLCP(reportWebVital);
  measureFID(reportWebVital);
  measureCLS(reportWebVital);
  measureFCP(reportWebVital);

  // Measure TTFB on load
  if (document.readyState === 'complete') {
    const ttfb = measureTTFB();
    if (ttfb) reportWebVital(ttfb);
  } else {
    window.addEventListener('load', () => {
      const ttfb = measureTTFB();
      if (ttfb) reportWebVital(ttfb);
    });
  }
}

/**
 * Custom performance mark
 */
export function mark(name: string): void {
  if ('performance' in window && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure time between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if ('performance' in window && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measures = performance.getEntriesByName(name, 'measure');
      return measures.length > 0 ? measures[0].duration : null;
    } catch (error) {
      console.error('Error measuring performance:', error);
      return null;
    }
  }
  return null;
}

/**
 * Clear performance marks and measures
 */
export function clearMarks(name?: string): void {
  if ('performance' in window) {
    if (name) {
      performance.clearMarks(name);
      performance.clearMeasures(name);
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

/**
 * Get resource timing information
 */
export function getResourceTiming(): PerformanceResourceTiming[] {
  if ('performance' in window && performance.getEntriesByType) {
    return performance.getEntriesByType(
      'resource'
    ) as PerformanceResourceTiming[];
  }
  return [];
}

/**
 * Get navigation timing information
 */
export function getNavigationTiming(): PerformanceNavigationTiming | null {
  if ('performance' in window && performance.getEntriesByType) {
    const entries = performance.getEntriesByType('navigation');
    return entries.length > 0
      ? (entries[0] as PerformanceNavigationTiming)
      : null;
  }
  return null;
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const navigation = getNavigationTiming();
  if (!navigation) return;

  console.group('⚡ Performance Summary');
  console.log(
    'DNS Lookup:',
    `${Math.round(navigation.domainLookupEnd - navigation.domainLookupStart)}ms`
  );
  console.log(
    'TCP Connection:',
    `${Math.round(navigation.connectEnd - navigation.connectStart)}ms`
  );
  console.log(
    'Request Time:',
    `${Math.round(navigation.responseStart - navigation.requestStart)}ms`
  );
  console.log(
    'Response Time:',
    `${Math.round(navigation.responseEnd - navigation.responseStart)}ms`
  );
  console.log(
    'DOM Processing:',
    `${Math.round(navigation.domComplete - navigation.domInteractive)}ms`
  );
  console.log(
    'Load Complete:',
    `${Math.round(navigation.loadEventEnd - navigation.loadEventStart)}ms`
  );
  console.groupEnd();
}
