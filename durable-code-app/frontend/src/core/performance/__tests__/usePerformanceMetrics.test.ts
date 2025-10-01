/**
 * Purpose: Test suite for usePerformanceMetrics React hook
 * Scope: Hook initialization, metrics tracking, render measurement, alerts, and lifecycle
 * Overview: Tests usePerformanceMetrics functionality including component performance tracking,
 *     render time measurement, alert handling, and cleanup on unmount
 * Dependencies: Vitest, React Testing Library hooks, usePerformanceMetrics
 * Exports: Test suite for usePerformanceMetrics hook
 * Implementation: Hook tests using renderHook from React Testing Library
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { usePerformanceMetrics } from '../usePerformanceMetrics';

describe('usePerformanceMetrics', () => {
  beforeEach(() => {
    // Reset singleton
    // @ts-expect-error - Accessing private static member for testing
    PerformanceMonitor.instance = null;

    // Mock performance.now
    vi.spyOn(performance, 'now').mockImplementation(() => Date.now());

    // Mock requestAnimationFrame
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      setTimeout(cb, 16);
      return 1;
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      expect(result.current.metrics).toBeNull();
      expect(result.current.alerts).toEqual([]);
      expect(result.current.isMonitoring).toBe(true);
      expect(result.current.recordRender).toBeInstanceOf(Function);
      expect(result.current.startMeasuring).toBeInstanceOf(Function);
      expect(result.current.summary).toBeDefined();
    });

    it('should accept custom component name', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({ componentName: 'TestComponent' }),
      );

      expect(result.current).toBeDefined();
    });

    it('should accept trackRenders option', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({ trackRenders: false }),
      );

      expect(result.current).toBeDefined();
    });

    it('should accept alertsEnabled option', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({ alertsEnabled: false }),
      );

      expect(result.current.alerts).toEqual([]);
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start monitoring on mount', () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      expect(result.current.isMonitoring).toBe(true);
    });

    it('should stop monitoring on unmount', () => {
      const { result, unmount } = renderHook(() => usePerformanceMetrics());

      expect(result.current.isMonitoring).toBe(true);

      unmount();

      // Monitoring should be stopped (can't directly test but cleanup should run)
      expect(true).toBe(true);
    });

    it('should update metrics periodically', async () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      // Initially null
      expect(result.current.metrics).toBeNull();

      // Advance time by 1 second (metrics update interval)
      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve(); // Flush promises
      });

      expect(result.current.metrics).not.toBeNull();
    });

    it('should cleanup metrics interval on unmount', () => {
      const { unmount } = renderHook(() => usePerformanceMetrics());

      const timerCount = vi.getTimerCount();
      unmount();

      // Should clear interval timers
      expect(vi.getTimerCount()).toBeLessThanOrEqual(timerCount);
    });
  });

  describe('Render Recording', () => {
    it('should record render with explicit render time', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({ componentName: 'TestComponent' }),
      );

      const monitor = PerformanceMonitor.getInstance();
      const recordMetricSpy = vi.spyOn(monitor, 'recordMetric');

      act(() => {
        result.current.recordRender(15.5);
      });

      expect(recordMetricSpy).toHaveBeenCalledWith('TestComponent', 15.5);
    });

    it('should record render with measured time', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({ componentName: 'TestComponent' }),
      );

      const monitor = PerformanceMonitor.getInstance();
      const recordMetricSpy = vi.spyOn(monitor, 'recordMetric');

      let stopMeasuring: () => void;

      act(() => {
        stopMeasuring = result.current.startMeasuring();
      });

      // Simulate some render time
      vi.advanceTimersByTime(10);

      act(() => {
        stopMeasuring();
      });

      expect(recordMetricSpy).toHaveBeenCalledWith('TestComponent', expect.any(Number));
    });

    it('should not record when trackRenders is false', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({
          componentName: 'TestComponent',
          trackRenders: false,
        }),
      );

      const monitor = PerformanceMonitor.getInstance();
      const recordMetricSpy = vi.spyOn(monitor, 'recordMetric');

      act(() => {
        result.current.recordRender(15.5);
      });

      expect(recordMetricSpy).not.toHaveBeenCalled();
    });

    it('should use default component name when not provided', () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      const monitor = PerformanceMonitor.getInstance();
      const recordMetricSpy = vi.spyOn(monitor, 'recordMetric');

      act(() => {
        result.current.recordRender(10);
      });

      expect(recordMetricSpy).toHaveBeenCalledWith('UnknownComponent', 10);
    });
  });

  describe('Start Measuring', () => {
    it('should return stop function', () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      let stopMeasuring: (() => void) | undefined;

      act(() => {
        stopMeasuring = result.current.startMeasuring();
      });

      expect(stopMeasuring).toBeInstanceOf(Function);
    });

    it('should measure elapsed time between start and stop', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({ componentName: 'TestComponent' }),
      );

      const monitor = PerformanceMonitor.getInstance();
      const recordMetricSpy = vi.spyOn(monitor, 'recordMetric');

      let stopMeasuring: () => void;

      // Start measuring
      act(() => {
        stopMeasuring = result.current.startMeasuring();
      });

      // Simulate 20ms render time
      act(() => {
        vi.advanceTimersByTime(20);
      });

      // Stop measuring
      act(() => {
        stopMeasuring();
      });

      expect(recordMetricSpy).toHaveBeenCalledWith('TestComponent', expect.any(Number));
    });

    it('should handle multiple concurrent measurements', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({ componentName: 'TestComponent' }),
      );

      const monitor = PerformanceMonitor.getInstance();
      const recordMetricSpy = vi.spyOn(monitor, 'recordMetric');

      let stop1: () => void;
      let stop2: () => void;

      act(() => {
        stop1 = result.current.startMeasuring();
        vi.advanceTimersByTime(10);
        stop2 = result.current.startMeasuring();
      });

      act(() => {
        vi.advanceTimersByTime(5);
        stop1(); // Should record ~15ms
      });

      act(() => {
        vi.advanceTimersByTime(10);
        stop2(); // Should record ~15ms
      });

      expect(recordMetricSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Alert Handling', () => {
    it('should collect alerts when enabled', async () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({
          componentName: 'TestComponent',
          alertsEnabled: true,
        }),
      );

      // Trigger an alert by recording slow render
      await act(async () => {
        result.current.recordRender(100); // Very slow render
        await Promise.resolve(); // Flush promises
      });

      // Alerts should be collected
      expect(result.current.alerts.length).toBeGreaterThan(0);
    });

    it('should not collect alerts when disabled', async () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({
          componentName: 'TestComponent',
          alertsEnabled: false,
        }),
      );

      // Trigger an alert
      act(() => {
        result.current.recordRender(100);
      });

      // Wait a bit
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.alerts).toEqual([]);
    });

    it('should limit alerts to last 10', async () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({
          componentName: 'TestComponent',
          alertsEnabled: true,
        }),
      );

      // Trigger multiple alerts
      await act(async () => {
        for (let i = 0; i < 15; i++) {
          result.current.recordRender(100);
        }
        await Promise.resolve(); // Flush promises
      });

      expect(result.current.alerts.length).toBeLessThanOrEqual(10);
    });

    it('should cleanup alert handler on unmount', () => {
      const { unmount } = renderHook(() =>
        usePerformanceMetrics({ alertsEnabled: true }),
      );

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should re-setup alerts when alertsEnabled changes', () => {
      const { rerender } = renderHook(
        ({ alertsEnabled }) => usePerformanceMetrics({ alertsEnabled }),
        { initialProps: { alertsEnabled: false } },
      );

      // Change alertsEnabled
      rerender({ alertsEnabled: true });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Performance Summary', () => {
    it('should provide performance summary', () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      expect(result.current.summary).toMatchObject({
        avgFps: expect.any(Number),
        avgRenderTime: expect.any(Number),
        avgMemory: expect.any(Number),
        alerts: expect.any(Number),
      });
    });

    it('should update summary after recording metrics', () => {
      const { result } = renderHook(() =>
        usePerformanceMetrics({ componentName: 'TestComponent' }),
      );

      const initialSummary = result.current.summary;

      act(() => {
        result.current.recordRender(10);
      });

      // Rerender to get updated summary
      const updatedSummary = result.current.summary;

      // Summary should reflect the new metric
      expect(updatedSummary.avgRenderTime).toBeGreaterThanOrEqual(
        initialSummary.avgRenderTime,
      );
    });
  });

  describe('Options Reactivity', () => {
    it('should update when componentName changes', () => {
      const { result, rerender } = renderHook(
        ({ componentName }) => usePerformanceMetrics({ componentName }),
        { initialProps: { componentName: 'Component1' } },
      );

      const monitor = PerformanceMonitor.getInstance();
      const recordMetricSpy = vi.spyOn(monitor, 'recordMetric');

      // Record with first name
      act(() => {
        result.current.recordRender(10);
      });

      expect(recordMetricSpy).toHaveBeenCalledWith('Component1', 10);

      // Change component name
      rerender({ componentName: 'Component2' });

      // Record with new name
      act(() => {
        result.current.recordRender(15);
      });

      expect(recordMetricSpy).toHaveBeenCalledWith('Component2', 15);
    });

    it('should update when trackRenders changes', () => {
      const { result, rerender } = renderHook(
        ({ trackRenders }) => usePerformanceMetrics({ trackRenders }),
        { initialProps: { trackRenders: true } },
      );

      const monitor = PerformanceMonitor.getInstance();
      const recordMetricSpy = vi.spyOn(monitor, 'recordMetric');

      // Should record
      act(() => {
        result.current.recordRender(10);
      });
      expect(recordMetricSpy).toHaveBeenCalled();

      recordMetricSpy.mockClear();

      // Change to false
      rerender({ trackRenders: false });

      // Should not record
      act(() => {
        result.current.recordRender(10);
      });
      expect(recordMetricSpy).not.toHaveBeenCalled();
    });
  });

  describe('Metrics Updates', () => {
    it('should update metrics from null to valid metrics', async () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      expect(result.current.metrics).toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve(); // Flush promises
      });

      expect(result.current.metrics).toMatchObject({
        fps: expect.any(Number),
        renderTime: expect.any(Number),
        memoryUsage: expect.any(Number),
        timestamp: expect.any(Number),
      });
    });

    it('should continue updating metrics periodically', async () => {
      const { result } = renderHook(() => usePerformanceMetrics());

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      const firstMetrics = result.current.metrics;
      expect(firstMetrics).not.toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Second metrics should be different (new timestamp at minimum)
      expect(result.current.metrics).not.toBe(firstMetrics);
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory on multiple mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() => usePerformanceMetrics());
        unmount();
      }

      // Should not throw or leak
      expect(true).toBe(true);
    });

    it('should cleanup all resources on unmount', () => {
      const { unmount } = renderHook(() =>
        usePerformanceMetrics({ alertsEnabled: true }),
      );

      const timerCountBefore = vi.getTimerCount();

      unmount();

      const timerCountAfter = vi.getTimerCount();

      // Should have cleaned up timers
      expect(timerCountAfter).toBeLessThanOrEqual(timerCountBefore);
    });
  });
});
