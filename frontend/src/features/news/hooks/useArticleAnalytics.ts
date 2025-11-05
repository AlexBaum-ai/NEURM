/**
 * useArticleAnalytics Hook
 *
 * Comprehensive analytics tracking for article engagement:
 * - View tracking on mount
 * - Active time tracking (only when tab is visible)
 * - Scroll depth measurement using IntersectionObserver
 * - Reading progress calculation
 * - Debounced analytics submission (max once per 30 seconds)
 * - localStorage persistence for page refresh handling
 * - Privacy-compliant (respects Do Not Track)
 */

import { useEffect, useRef, useCallback } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import {
  isDoNotTrackEnabled,
  generateSessionId,
  saveAnalyticsState,
  loadAnalyticsState,
  clearAnalyticsState,
  calculateScrollDepth,
  throttle,
} from '../utils/analyticsUtils';
import type { StoredAnalyticsState } from '../types/analytics';

interface UseArticleAnalyticsOptions {
  articleId: string;
  contentRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
}

const ANALYTICS_DEBOUNCE_MS = 30000; // 30 seconds
const SCROLL_THROTTLE_MS = 1000; // 1 second
const MIN_VIEW_DURATION = 3; // Minimum 3 seconds to count as a view

export const useArticleAnalytics = ({
  articleId,
  contentRef,
  enabled = true,
}: UseArticleAnalyticsOptions) => {
  // Tracking state
  const sessionIdRef = useRef<string>(generateSessionId());
  const startTimeRef = useRef<number>(Date.now());
  const lastActiveTimeRef = useRef<number>(Date.now());
  const totalActiveTimeRef = useRef<number>(0);
  const maxScrollDepthRef = useRef<number>(0);
  const hasTrackedInitialViewRef = useRef<boolean>(false);
  const lastSentTimeRef = useRef<number>(0);
  const isPageVisibleRef = useRef<boolean>(!document.hidden);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  /**
   * Check if analytics should be enabled
   */
  const shouldTrack = useCallback((): boolean => {
    return enabled && !isDoNotTrackEnabled();
  }, [enabled]);

  /**
   * Calculate current active time
   */
  const getActiveTime = useCallback((): number => {
    const now = Date.now();
    const sessionTime = isPageVisibleRef.current
      ? totalActiveTimeRef.current + (now - lastActiveTimeRef.current)
      : totalActiveTimeRef.current;

    return Math.floor(sessionTime / 1000); // Convert to seconds
  }, []);

  /**
   * Save current state to localStorage
   */
  const saveState = useCallback(() => {
    if (!shouldTrack()) return;

    const state: StoredAnalyticsState = {
      articleId,
      startTime: startTimeRef.current,
      lastActiveTime: lastActiveTimeRef.current,
      totalActiveTime: totalActiveTimeRef.current,
      maxScrollDepth: maxScrollDepthRef.current,
      sessionId: sessionIdRef.current,
    };

    saveAnalyticsState(articleId, state);
  }, [articleId, shouldTrack]);

  /**
   * Send analytics data to backend
   */
  const sendAnalytics = useCallback(
    async (force: boolean = false) => {
      if (!shouldTrack()) return;

      const now = Date.now();
      const timeSinceLastSent = now - lastSentTimeRef.current;

      // Enforce debounce unless forced
      if (!force && timeSinceLastSent < ANALYTICS_DEBOUNCE_MS) {
        return;
      }

      const viewDuration = getActiveTime();

      // Don't send if view duration is too short (unless forced on unmount)
      if (!force && viewDuration < MIN_VIEW_DURATION) {
        return;
      }

      const scrollDepth = maxScrollDepthRef.current;
      const readingProgress = scrollDepth; // Simplified for now
      const completedReading = scrollDepth >= 90; // Consider 90% as completed

      try {
        await analyticsApi.trackArticleView(articleId, {
          viewDuration,
          scrollDepth,
          readingProgress,
          completedReading,
          timestamp: new Date().toISOString(),
        });

        lastSentTimeRef.current = now;

        // If reading is completed, clear the state
        if (completedReading) {
          clearAnalyticsState(articleId);
        } else {
          saveState();
        }
      } catch (error) {
        console.warn('Failed to send analytics:', error);
      }
    },
    [articleId, shouldTrack, getActiveTime, saveState]
  );

  /**
   * Update scroll depth
   */
  const updateScrollDepth = useCallback(() => {
    const currentDepth = calculateScrollDepth();
    if (currentDepth > maxScrollDepthRef.current) {
      maxScrollDepthRef.current = currentDepth;
      saveState();
    }
  }, [saveState]);

  /**
   * Throttled scroll handler
   */
  const handleScroll = useRef(
    throttle(() => {
      if (shouldTrack() && isPageVisibleRef.current) {
        updateScrollDepth();
      }
    }, SCROLL_THROTTLE_MS)
  ).current;

  /**
   * Handle visibility change (tab switching)
   */
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    const now = Date.now();

    if (isVisible && !isPageVisibleRef.current) {
      // Tab became visible - resume tracking
      lastActiveTimeRef.current = now;
      isPageVisibleRef.current = true;
    } else if (!isVisible && isPageVisibleRef.current) {
      // Tab became hidden - pause tracking
      totalActiveTimeRef.current += now - lastActiveTimeRef.current;
      isPageVisibleRef.current = false;
      saveState();
    }
  }, [saveState]);

  /**
   * Setup IntersectionObserver for content visibility tracking
   */
  useEffect(() => {
    if (!shouldTrack() || !contentRef.current) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          updateScrollDepth();
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: [0, 0.25, 0.5, 0.75, 1.0],
      rootMargin: '0px',
    });

    observer.observe(contentRef.current);
    intersectionObserverRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [shouldTrack, contentRef, updateScrollDepth]);

  /**
   * Main analytics tracking setup
   */
  useEffect(() => {
    if (!shouldTrack()) return;

    // Try to restore previous state
    const savedState = loadAnalyticsState(articleId);
    if (savedState) {
      totalActiveTimeRef.current = savedState.totalActiveTime;
      maxScrollDepthRef.current = savedState.maxScrollDepth;
      sessionIdRef.current = savedState.sessionId;
    }

    // Track initial view after MIN_VIEW_DURATION
    const initialViewTimeout = setTimeout(() => {
      if (!hasTrackedInitialViewRef.current) {
        hasTrackedInitialViewRef.current = true;
        sendAnalytics(true);
      }
    }, MIN_VIEW_DURATION * 1000);

    // Set up periodic analytics sending
    analyticsIntervalRef.current = setInterval(() => {
      sendAnalytics(false);
    }, ANALYTICS_DEBOUNCE_MS);

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Send analytics on unmount
    return () => {
      clearTimeout(initialViewTimeout);

      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current);
      }

      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Send final analytics on unmount
      sendAnalytics(true);
    };
  }, [articleId, shouldTrack, sendAnalytics, handleScroll, handleVisibilityChange]);

  return {
    // Expose current tracking state (useful for debugging)
    getCurrentState: () => ({
      viewDuration: getActiveTime(),
      scrollDepth: maxScrollDepthRef.current,
      isTracking: shouldTrack(),
    }),
  };
};
