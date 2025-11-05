/**
 * Analytics utility functions
 */

import type { StoredAnalyticsState } from '../types/analytics';

const STORAGE_KEY_PREFIX = 'neurmatic_analytics_';
const WORDS_PER_MINUTE = 200; // Average reading speed

/**
 * Check if user has enabled Do Not Track
 */
export const isDoNotTrackEnabled = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
  return dnt === '1' || dnt === 'yes';
};

/**
 * Calculate estimated reading time from word count
 */
export const calculateReadingTime = (wordCount: number): number => {
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
};

/**
 * Calculate word count from HTML content
 */
export const getWordCount = (htmlContent: string): number => {
  // Remove HTML tags
  const text = htmlContent.replace(/<[^>]*>/g, ' ');
  // Remove extra whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim();
  // Count words
  return cleanText.split(' ').filter(word => word.length > 0).length;
};

/**
 * Generate a unique session ID
 */
export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Save analytics state to localStorage
 */
export const saveAnalyticsState = (articleId: string, state: StoredAnalyticsState): void => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${articleId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save analytics state:', error);
  }
};

/**
 * Load analytics state from localStorage
 */
export const loadAnalyticsState = (articleId: string): StoredAnalyticsState | null => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${articleId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const state = JSON.parse(stored) as StoredAnalyticsState;

    // Validate the state is for the same article
    if (state.articleId !== articleId) return null;

    // Check if state is too old (more than 1 hour)
    const now = Date.now();
    if (now - state.lastActiveTime > 3600000) {
      // Clear old state
      localStorage.removeItem(key);
      return null;
    }

    return state;
  } catch (error) {
    console.warn('Failed to load analytics state:', error);
    return null;
  }
};

/**
 * Clear analytics state from localStorage
 */
export const clearAnalyticsState = (articleId: string): void => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${articleId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear analytics state:', error);
  }
};

/**
 * Calculate scroll depth percentage
 */
export const calculateScrollDepth = (): number => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  const trackLength = documentHeight - windowHeight;
  const scrollPercentage = (scrollTop / trackLength) * 100;

  return Math.min(Math.max(Math.round(scrollPercentage), 0), 100);
};

/**
 * Calculate reading progress based on content visibility
 */
export const calculateReadingProgress = (contentElement: HTMLElement | null): number => {
  if (!contentElement) return 0;

  const rect = contentElement.getBoundingClientRect();
  const contentHeight = contentElement.scrollHeight;
  const viewportHeight = window.innerHeight;

  // Calculate how much of the content has been scrolled past
  const contentTop = rect.top;
  const scrolledPast = Math.max(0, -contentTop);

  // Reading progress is based on how much content has been viewed
  const progress = (scrolledPast / (contentHeight - viewportHeight)) * 100;

  return Math.min(Math.max(Math.round(progress), 0), 100);
};

/**
 * Debounce function for rate-limiting calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for rate-limiting calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Format duration in seconds to human-readable string
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) return `${minutes}m`;
  return `${minutes}m ${remainingSeconds}s`;
};
