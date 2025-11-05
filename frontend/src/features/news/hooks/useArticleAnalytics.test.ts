/**
 * Tests for useArticleAnalytics hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useArticleAnalytics } from './useArticleAnalytics';
import { analyticsApi } from '../api/analyticsApi';
import * as analyticsUtils from '../utils/analyticsUtils';

// Mock the analytics API
vi.mock('../api/analyticsApi', () => ({
  analyticsApi: {
    trackArticleView: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock analytics utilities
vi.mock('../utils/analyticsUtils', () => ({
  isDoNotTrackEnabled: vi.fn().mockReturnValue(false),
  generateSessionId: vi.fn().mockReturnValue('test-session-id'),
  saveAnalyticsState: vi.fn(),
  loadAnalyticsState: vi.fn().mockReturnValue(null),
  clearAnalyticsState: vi.fn(),
  calculateScrollDepth: vi.fn().mockReturnValue(0),
  throttle: vi.fn((fn) => fn),
}));

describe('useArticleAnalytics', () => {
  const mockContentRef = {
    current: document.createElement('div'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize analytics tracking', () => {
    const { result } = renderHook(() =>
      useArticleAnalytics({
        articleId: 'test-article-id',
        contentRef: mockContentRef,
        enabled: true,
      })
    );

    expect(result.current.getCurrentState).toBeDefined();
  });

  it('should not track when Do Not Track is enabled', () => {
    vi.mocked(analyticsUtils.isDoNotTrackEnabled).mockReturnValue(true);

    const { result } = renderHook(() =>
      useArticleAnalytics({
        articleId: 'test-article-id',
        contentRef: mockContentRef,
        enabled: true,
      })
    );

    const state = result.current.getCurrentState();
    expect(state.isTracking).toBe(false);
  });

  it('should not track when disabled', () => {
    const { result } = renderHook(() =>
      useArticleAnalytics({
        articleId: 'test-article-id',
        contentRef: mockContentRef,
        enabled: false,
      })
    );

    const state = result.current.getCurrentState();
    expect(state.isTracking).toBe(false);
  });

  it('should track initial view after minimum duration', async () => {
    renderHook(() =>
      useArticleAnalytics({
        articleId: 'test-article-id',
        contentRef: mockContentRef,
        enabled: true,
      })
    );

    // Fast-forward past minimum view duration (3 seconds)
    vi.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(analyticsApi.trackArticleView).toHaveBeenCalled();
    });
  });

  it('should return current tracking state', () => {
    const { result } = renderHook(() =>
      useArticleAnalytics({
        articleId: 'test-article-id',
        contentRef: mockContentRef,
        enabled: true,
      })
    );

    const state = result.current.getCurrentState();

    expect(state).toHaveProperty('viewDuration');
    expect(state).toHaveProperty('scrollDepth');
    expect(state).toHaveProperty('isTracking');
    expect(typeof state.viewDuration).toBe('number');
    expect(typeof state.scrollDepth).toBe('number');
    expect(typeof state.isTracking).toBe('boolean');
  });

  it('should send analytics on unmount', async () => {
    const { unmount } = renderHook(() =>
      useArticleAnalytics({
        articleId: 'test-article-id',
        contentRef: mockContentRef,
        enabled: true,
      })
    );

    // Fast-forward to accumulate some time
    vi.advanceTimersByTime(5000);

    unmount();

    await waitFor(() => {
      expect(analyticsApi.trackArticleView).toHaveBeenCalled();
    });
  });

  it('should setup IntersectionObserver when content ref is available', () => {
    const observeMock = vi.fn();
    const disconnectMock = vi.fn();

    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: observeMock,
      disconnect: disconnectMock,
      unobserve: vi.fn(),
      takeRecords: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: [],
    }));

    const { unmount } = renderHook(() =>
      useArticleAnalytics({
        articleId: 'test-article-id',
        contentRef: mockContentRef,
        enabled: true,
      })
    );

    expect(global.IntersectionObserver).toHaveBeenCalled();
    expect(observeMock).toHaveBeenCalledWith(mockContentRef.current);

    unmount();
    expect(disconnectMock).toHaveBeenCalled();
  });

  it('should load saved state on initialization', () => {
    const savedState = {
      articleId: 'test-article-id',
      startTime: Date.now() - 10000,
      lastActiveTime: Date.now(),
      totalActiveTime: 5000,
      maxScrollDepth: 50,
      sessionId: 'saved-session-id',
    };

    vi.mocked(analyticsUtils.loadAnalyticsState).mockReturnValue(savedState);

    const { result } = renderHook(() =>
      useArticleAnalytics({
        articleId: 'test-article-id',
        contentRef: mockContentRef,
        enabled: true,
      })
    );

    const state = result.current.getCurrentState();
    expect(state.scrollDepth).toBe(50);
  });
});
