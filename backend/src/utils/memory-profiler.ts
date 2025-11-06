import logger from './logger';
import * as Sentry from '@sentry/node';

/**
 * Memory Profiling Utility
 * Detects memory leaks and monitors memory usage
 */

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  heapUsagePercent: number;
}

export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 100;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MEMORY_LEAK_THRESHOLD = 10; // MB growth per minute
  private readonly HIGH_MEMORY_THRESHOLD = 85; // Percent

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): MemorySnapshot {
    const memUsage = process.memoryUsage();

    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100,
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
      heapUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Start continuous memory monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      logger.warn('Memory monitoring already started');
      return;
    }

    logger.info('Starting memory monitoring');

    // Initial snapshot
    this.takeSnapshot();

    // Take snapshots at regular intervals
    this.monitoringInterval = setInterval(() => {
      const snapshot = this.takeSnapshot();

      // Check for memory leaks
      this.detectMemoryLeak();

      // Check for high memory usage
      if (snapshot.heapUsagePercent > this.HIGH_MEMORY_THRESHOLD) {
        logger.warn('High memory usage detected', {
          heapUsed: `${snapshot.heapUsed}MB`,
          heapTotal: `${snapshot.heapTotal}MB`,
          heapUsagePercent: `${snapshot.heapUsagePercent.toFixed(2)}%`,
        });

        Sentry.captureMessage('High memory usage detected', {
          level: 'warning',
          tags: { service: 'memory-profiler' },
          extra: snapshot,
        });
      }
    }, intervalMs);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Memory monitoring stopped');
    }
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeak(): boolean {
    if (this.snapshots.length < 10) {
      return false; // Not enough data
    }

    // Get recent snapshots (last 10)
    const recentSnapshots = this.snapshots.slice(-10);

    // Calculate memory growth rate (MB per minute)
    const firstSnapshot = recentSnapshots[0];
    const lastSnapshot = recentSnapshots[recentSnapshots.length - 1];

    const timeDiff = (lastSnapshot.timestamp.getTime() - firstSnapshot.timestamp.getTime()) / 1000 / 60; // minutes
    const memoryGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
    const growthRate = memoryGrowth / timeDiff; // MB per minute

    if (growthRate > this.MEMORY_LEAK_THRESHOLD) {
      logger.error('Potential memory leak detected', {
        growthRate: `${growthRate.toFixed(2)} MB/min`,
        currentHeapUsed: `${lastSnapshot.heapUsed}MB`,
        threshold: `${this.MEMORY_LEAK_THRESHOLD} MB/min`,
      });

      Sentry.captureMessage('Potential memory leak detected', {
        level: 'error',
        tags: { service: 'memory-profiler', memory_leak: 'true' },
        extra: {
          growthRate,
          firstSnapshot,
          lastSnapshot,
          recentSnapshots,
        },
      });

      return true;
    }

    return false;
  }

  /**
   * Get memory growth trend
   */
  getMemoryTrend(): {
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number; // MB per minute
  } {
    if (this.snapshots.length < 5) {
      return { trend: 'stable', growthRate: 0 };
    }

    const recentSnapshots = this.snapshots.slice(-5);
    const firstSnapshot = recentSnapshots[0];
    const lastSnapshot = recentSnapshots[recentSnapshots.length - 1];

    const timeDiff = (lastSnapshot.timestamp.getTime() - firstSnapshot.timestamp.getTime()) / 1000 / 60;
    const memoryGrowth = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
    const growthRate = memoryGrowth / timeDiff;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

    if (growthRate > 1) {
      trend = 'increasing';
    } else if (growthRate < -1) {
      trend = 'decreasing';
    }

    return { trend, growthRate };
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(): MemorySnapshot | null {
    return this.snapshots.length > 0
      ? this.snapshots[this.snapshots.length - 1]
      : null;
  }

  /**
   * Get memory statistics
   */
  getStatistics(): {
    current: MemorySnapshot | null;
    trend: ReturnType<typeof this.getMemoryTrend>;
    average: {
      heapUsed: number;
      heapUsagePercent: number;
    };
    peak: {
      heapUsed: number;
      timestamp: Date;
    };
  } {
    const current = this.getLatestSnapshot();
    const trend = this.getMemoryTrend();

    const avgHeapUsed =
      this.snapshots.length > 0
        ? this.snapshots.reduce((sum, s) => sum + s.heapUsed, 0) / this.snapshots.length
        : 0;

    const avgHeapUsagePercent =
      this.snapshots.length > 0
        ? this.snapshots.reduce((sum, s) => sum + s.heapUsagePercent, 0) / this.snapshots.length
        : 0;

    const peakSnapshot = this.snapshots.reduce(
      (max, s) => (s.heapUsed > max.heapUsed ? s : max),
      this.snapshots[0] || { heapUsed: 0, timestamp: new Date() }
    );

    return {
      current,
      trend,
      average: {
        heapUsed: Math.round(avgHeapUsed * 100) / 100,
        heapUsagePercent: Math.round(avgHeapUsagePercent * 100) / 100,
      },
      peak: {
        heapUsed: peakSnapshot.heapUsed,
        timestamp: peakSnapshot.timestamp,
      },
    };
  }

  /**
   * Force garbage collection (requires --expose-gc flag)
   */
  forceGarbageCollection(): void {
    if (global.gc) {
      const before = process.memoryUsage();
      global.gc();
      const after = process.memoryUsage();

      const freed = {
        heapUsed: Math.round((before.heapUsed - after.heapUsed) / 1024 / 1024 * 100) / 100,
        rss: Math.round((before.rss - after.rss) / 1024 / 1024 * 100) / 100,
      };

      logger.info('Garbage collection forced', {
        freedHeap: `${freed.heapUsed}MB`,
        freedRSS: `${freed.rss}MB`,
      });
    } else {
      logger.warn('Garbage collection not available (run with --expose-gc flag)');
    }
  }

  /**
   * Generate memory report
   */
  generateReport(): string {
    const stats = this.getStatistics();

    let report = '\n=== Memory Profiler Report ===\n\n';

    if (stats.current) {
      report += 'Current Memory Usage:\n';
      report += `  Heap Used: ${stats.current.heapUsed}MB\n`;
      report += `  Heap Total: ${stats.current.heapTotal}MB\n`;
      report += `  Heap Usage: ${stats.current.heapUsagePercent.toFixed(2)}%\n`;
      report += `  RSS: ${stats.current.rss}MB\n`;
      report += `  External: ${stats.current.external}MB\n`;
      report += '\n';
    }

    report += 'Memory Trend:\n';
    report += `  Trend: ${stats.trend.trend}\n`;
    report += `  Growth Rate: ${stats.trend.growthRate.toFixed(2)} MB/min\n`;
    report += '\n';

    report += 'Statistics:\n';
    report += `  Average Heap Used: ${stats.average.heapUsed}MB\n`;
    report += `  Average Heap Usage: ${stats.average.heapUsagePercent.toFixed(2)}%\n`;
    report += `  Peak Heap Used: ${stats.peak.heapUsed}MB at ${stats.peak.timestamp.toISOString()}\n`;
    report += '\n';

    report += `Total Snapshots: ${this.snapshots.length}\n`;

    if (this.monitoringInterval) {
      report += 'Monitoring: Active\n';
    } else {
      report += 'Monitoring: Inactive\n';
    }

    report += '\n==============================\n';

    return report;
  }

  /**
   * Reset profiler
   */
  reset(): void {
    this.snapshots = [];
    logger.info('Memory profiler reset');
  }
}

// Export singleton instance
export const memoryProfiler = new MemoryProfiler();

/**
 * Memory profiling middleware
 */
export function memoryProfilingMiddleware(
  req: any,
  res: any,
  next: any
): void {
  const startMemory = process.memoryUsage();

  res.on('finish', () => {
    const endMemory = process.memoryUsage();
    const memoryDiff = {
      heapUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 * 100) / 100, // KB
      external: Math.round((endMemory.external - startMemory.external) / 1024 * 100) / 100,
    };

    // Log if memory increase is significant (> 10MB)
    if (Math.abs(memoryDiff.heapUsed) > 10240) {
      logger.warn('Significant memory change detected', {
        endpoint: `${req.method} ${req.path}`,
        memoryChange: `${memoryDiff.heapUsed}KB`,
      });
    }
  });

  next();
}

export default MemoryProfiler;
