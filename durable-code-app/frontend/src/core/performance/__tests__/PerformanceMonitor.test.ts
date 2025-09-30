/**
 * Purpose: Comprehensive test suite for PerformanceMonitor class
 * Scope: Singleton pattern, metrics collection, threshold monitoring, alerts, and lifecycle
 * Overview: Tests PerformanceMonitor functionality including metric recording, FPS tracking,
 *     memory monitoring, threshold checking, event handling, and performance history
 * Dependencies: Vitest, PerformanceMonitor
 * Exports: Test suite for PerformanceMonitor
 * Implementation: Unit tests with mocked Performance API and timers
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerformanceMonitor, type PerformanceThresholds } from '../PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Reset singleton between tests by accessing private instance
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
    // Stop monitoring if started
    if (monitor) {
      monitor.stopMonitoring();
    }

    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = PerformanceMonitor.getInstance();
      const instance2 = PerformanceMonitor.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should use default thresholds when not provided', () => {
      monitor = PerformanceMonitor.getInstance();

      const metrics = monitor.getCurrentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.fps).toBeGreaterThanOrEqual(0);
    });

    it('should use custom thresholds when provided', () => {
      const customThresholds: PerformanceThresholds = {
        minFps: 30,
        maxRenderTime: 33,
        maxMemoryMB: 200,
      };

      monitor = PerformanceMonitor.getInstance(customThresholds);

      // Custom thresholds should be used (can't directly test private property,
      // but we can verify it doesn't throw and accepts the parameter)
      expect(monitor).toBeDefined();
    });

    it('should ignore thresholds on subsequent getInstance calls', () => {
      const thresholds1 = { minFps: 30, maxRenderTime: 33, maxMemoryMB: 200 };
      const instance1 = PerformanceMonitor.getInstance(thresholds1);

      const thresholds2 = { minFps: 50, maxRenderTime: 16, maxMemoryMB: 100 };
      const instance2 = PerformanceMonitor.getInstance(thresholds2);

      // Should be same instance, thresholds2 ignored
      expect(instance1).toBe(instance2);
    });
  });

  describe('Monitoring Lifecycle', () => {
    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
    });

    it('should start monitoring', () => {
      monitor.startMonitoring();

      // Should set up interval for metrics collection
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('should stop monitoring', () => {
      monitor.startMonitoring();
      const timerCount = vi.getTimerCount();
      expect(timerCount).toBeGreaterThan(0);

      monitor.stopMonitoring();

      // Timers should be cleared
      expect(vi.getTimerCount()).toBeLessThanOrEqual(timerCount);
    });

    it('should not start monitoring twice', () => {
      monitor.startMonitoring();
      const timerCount = vi.getTimerCount();

      monitor.startMonitoring();

      // Should not create additional timers
      expect(vi.getTimerCount()).toBe(timerCount);
    });

    it('should collect metrics periodically when monitoring', () => {
      monitor.startMonitoring();

      // Initially no metrics
      expect(monitor.getMetricsHistory()).toHaveLength(0);

      // Advance time by 1 second (metrics collected every second)
      vi.advanceTimersByTime(1000);

      // Should have collected metrics
      expect(monitor.getMetricsHistory().length).toBeGreaterThan(0);
    });

    it('should stop collecting metrics after stopping', () => {
      monitor.startMonitoring();

      vi.advanceTimersByTime(1000);
      const metricsCount = monitor.getMetricsHistory().length;

      monitor.stopMonitoring();

      vi.advanceTimersByTime(1000);

      // Should not collect more metrics
      expect(monitor.getMetricsHistory().length).toBe(metricsCount);
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
    });

    it('should record custom metrics', () => {
      monitor.recordMetric('TestComponent', 15.5);

      const history = monitor.getMetricsHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toMatchObject({
        renderTime: 15.5,
        componentName: 'TestComponent',
      });
    });

    it('should track FPS in metrics', () => {
      monitor.recordMetric('TestComponent', 10);

      const history = monitor.getMetricsHistory();
      expect(history[0].fps).toBeGreaterThanOrEqual(0);
    });

    it('should track memory usage in metrics', () => {
      // Mock memory API
      Object.defineProperty(performance, 'memory', {
        value: { usedJSHeapSize: 50 * 1024 * 1024 }, // 50MB
        configurable: true,
      });

      monitor.recordMetric('TestComponent', 10);

      const history = monitor.getMetricsHistory();
      expect(history[0].memoryUsage).toBeGreaterThan(0);
    });

    it('should handle missing memory API gracefully', () => {
      // Temporarily remove memory property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalMemory = (performance as any).memory;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (performance as any).memory;

      monitor.recordMetric('TestComponent', 10);

      const history = monitor.getMetricsHistory();
      expect(history[0].memoryUsage).toBe(0);

      // Restore memory property if it existed
      if (originalMemory !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (performance as any).memory = originalMemory;
      }
    });

    it('should limit metrics history to 100 entries', () => {
      for (let i = 0; i < 150; i++) {
        monitor.recordMetric(`Component${i}`, 10);
      }

      const history = monitor.getMetricsHistory();
      expect(history).toHaveLength(100);
    });

    it('should keep most recent metrics when limiting', () => {
      for (let i = 0; i < 150; i++) {
        monitor.recordMetric(`Component${i}`, i);
      }

      const history = monitor.getMetricsHistory();
      // Should have metrics from Component50 to Component149
      expect(history[0].componentName).toBe('Component50');
      expect(history[history.length - 1].componentName).toBe('Component149');
    });
  });

  describe('Current Metrics', () => {
    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
    });

    it('should return current metrics', () => {
      const metrics = monitor.getCurrentMetrics();

      expect(metrics).toMatchObject({
        fps: expect.any(Number),
        renderTime: 0,
        memoryUsage: expect.any(Number),
        timestamp: expect.any(Number),
      });
    });

    it('should not affect metrics history', () => {
      monitor.getCurrentMetrics();
      monitor.getCurrentMetrics();
      monitor.getCurrentMetrics();

      expect(monitor.getMetricsHistory()).toHaveLength(0);
    });
  });

  describe('Performance Alerts', () => {
    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance({
        minFps: 55,
        maxRenderTime: 16.67,
        maxMemoryMB: 100,
      });
    });

    it('should emit FPS warning alert when below threshold', () => {
      const onAlert = vi.fn();
      monitor.onPerformanceAlert(onAlert);

      // Mock low FPS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(monitor as any, 'getCurrentFPS').mockReturnValue(30);

      monitor.recordMetric('TestComponent', 10);

      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fps',
          severity: 'warning',
          message: expect.stringContaining('Low FPS detected'),
        }),
      );
    });

    it('should emit FPS critical alert when very low', () => {
      const onAlert = vi.fn();
      monitor.onPerformanceAlert(onAlert);

      // Mock very low FPS (less than half threshold)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(monitor as any, 'getCurrentFPS').mockReturnValue(20);

      monitor.recordMetric('TestComponent', 10);

      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fps',
          severity: 'critical',
        }),
      );
    });

    it('should emit render time warning alert', () => {
      const onAlert = vi.fn();
      monitor.onPerformanceAlert(onAlert);

      // Render time above threshold (16.67ms)
      monitor.recordMetric('TestComponent', 25);

      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'render',
          severity: 'warning',
          message: expect.stringContaining('Slow render detected'),
        }),
      );
    });

    it('should emit render time critical alert', () => {
      const onAlert = vi.fn();
      monitor.onPerformanceAlert(onAlert);

      // Render time way above threshold (> 2x threshold)
      monitor.recordMetric('TestComponent', 50);

      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'render',
          severity: 'critical',
        }),
      );
    });

    it('should emit memory warning alert', () => {
      const onAlert = vi.fn();
      monitor.onPerformanceAlert(onAlert);

      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: { usedJSHeapSize: 120 * 1024 * 1024 }, // 120MB (above 100MB threshold)
        configurable: true,
      });

      monitor.recordMetric('TestComponent', 10);

      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'memory',
          severity: 'warning',
          message: expect.stringContaining('High memory usage'),
        }),
      );
    });

    it('should emit memory critical alert', () => {
      const onAlert = vi.fn();
      monitor.onPerformanceAlert(onAlert);

      // Mock very high memory usage (> 1.5x threshold)
      Object.defineProperty(performance, 'memory', {
        value: { usedJSHeapSize: 200 * 1024 * 1024 }, // 200MB
        configurable: true,
      });

      monitor.recordMetric('TestComponent', 10);

      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'memory',
          severity: 'critical',
        }),
      );
    });
  });

  describe('Event Handlers', () => {
    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
    });

    it('should register event handlers', () => {
      const handler = vi.fn();
      const cleanup = monitor.onPerformanceAlert(handler);

      expect(cleanup).toBeInstanceOf(Function);
    });

    it('should call all registered handlers on alert', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      monitor.onPerformanceAlert(handler1);
      monitor.onPerformanceAlert(handler2);

      // Trigger an alert
      monitor.recordMetric('TestComponent', 50); // High render time

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove handler on cleanup', () => {
      const handler = vi.fn();
      const cleanup = monitor.onPerformanceAlert(handler);

      // Remove handler
      cleanup();

      // Trigger alert
      monitor.recordMetric('TestComponent', 50);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle errors in event handlers gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const throwingHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      monitor.onPerformanceAlert(throwingHandler);
      monitor.onPerformanceAlert(normalHandler);

      // Should not throw, both handlers should be called
      monitor.recordMetric('TestComponent', 50);

      expect(throwingHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in performance alert handler'),
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Threshold Updates', () => {
    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance({
        minFps: 55,
        maxRenderTime: 16.67,
        maxMemoryMB: 100,
      });
    });

    it('should update thresholds', () => {
      const onAlert = vi.fn();
      monitor.onPerformanceAlert(onAlert);

      // Update thresholds to be more lenient
      monitor.updateThresholds({
        minFps: 30,
        maxRenderTime: 50,
      });

      // Low FPS but above new threshold
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(monitor as any, 'getCurrentFPS').mockReturnValue(40);
      monitor.recordMetric('TestComponent', 10);

      // Should not trigger alert
      expect(onAlert).not.toHaveBeenCalled();
    });

    it('should merge threshold updates', () => {
      monitor.updateThresholds({ minFps: 30 });

      // Other thresholds should remain unchanged
      // We can verify this by checking if alerts still trigger for other thresholds
      const onAlert = vi.fn();
      monitor.onPerformanceAlert(onAlert);

      monitor.recordMetric('TestComponent', 50); // High render time

      expect(onAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'render',
        }),
      );
    });
  });

  describe('Performance Summary', () => {
    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
    });

    it('should return zero summary when no metrics', () => {
      const summary = monitor.getPerformanceSummary();

      expect(summary).toEqual({
        avgFps: 0,
        avgRenderTime: 0,
        avgMemory: 0,
        alerts: 0,
      });
    });

    it('should calculate average FPS', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(monitor as any, 'getCurrentFPS')
        .mockReturnValueOnce(60)
        .mockReturnValueOnce(55)
        .mockReturnValueOnce(58);

      monitor.recordMetric('Component1', 10);
      monitor.recordMetric('Component2', 10);
      monitor.recordMetric('Component3', 10);

      const summary = monitor.getPerformanceSummary();
      expect(summary.avgFps).toBeCloseTo(57.7, 1);
    });

    it('should calculate average render time', () => {
      monitor.recordMetric('Component1', 10);
      monitor.recordMetric('Component2', 20);
      monitor.recordMetric('Component3', 15);

      const summary = monitor.getPerformanceSummary();
      expect(summary.avgRenderTime).toBe(15);
    });

    it('should calculate average memory usage', () => {
      Object.defineProperty(performance, 'memory', {
        value: { usedJSHeapSize: 50 * 1024 * 1024 },
        configurable: true,
        writable: true,
      });

      monitor.recordMetric('Component1', 10);
      monitor.recordMetric('Component2', 10);

      const summary = monitor.getPerformanceSummary();
      expect(summary.avgMemory).toBeGreaterThan(0);
    });

    it('should round averages appropriately', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(monitor as any, 'getCurrentFPS').mockReturnValue(57.777);
      monitor.recordMetric('Component1', 12.345);

      const summary = monitor.getPerformanceSummary();

      // FPS rounded to 1 decimal
      expect(summary.avgFps).toBe(57.8);
      // Render time rounded to 2 decimals
      expect(summary.avgRenderTime).toBe(12.35);
    });
  });

  describe('Metrics History', () => {
    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance();
    });

    it('should return copy of metrics history', () => {
      monitor.recordMetric('Component1', 10);

      const history1 = monitor.getMetricsHistory();
      const history2 = monitor.getMetricsHistory();

      // Should be equal but not same reference
      expect(history1).toEqual(history2);
      expect(history1).not.toBe(history2);
    });

    it('should not allow external modification of history', () => {
      monitor.recordMetric('Component1', 10);

      const history = monitor.getMetricsHistory();
      history.push({
        fps: 100,
        renderTime: 5,
        memoryUsage: 50,
        timestamp: Date.now(),
        componentName: 'Fake',
      });

      // Original history should be unchanged
      expect(monitor.getMetricsHistory()).toHaveLength(1);
    });
  });
});
