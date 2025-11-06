import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook that returns a throttled value
 *
 * @param value - The value to throttle
 * @param interval - The throttle interval in milliseconds
 * @returns The throttled value
 *
 * @example
 * const [scrollPosition, setScrollPosition] = useState(0);
 * const throttledScrollPosition = useThrottle(scrollPosition, 100);
 *
 * useEffect(() => {
 *   // Update UI with throttledScrollPosition
 * }, [throttledScrollPosition]);
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Hook that returns a throttled callback function
 *
 * @param callback - The function to throttle
 * @param interval - The throttle interval in milliseconds
 * @returns The throttled callback
 *
 * @example
 * const handleScroll = useThrottledCallback(() => {
 *   // Handle scroll
 * }, 100);
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval: number = 500
): (...args: Parameters<T>) => void {
  const lastRan = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= interval) {
        callbackRef.current(...args);
        lastRan.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            callbackRef.current(...args);
            lastRan.current = Date.now();
          },
          interval - (now - lastRan.current)
        );
      }
    },
    [interval]
  );
}

export default useThrottle;
