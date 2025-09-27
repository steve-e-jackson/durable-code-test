/**
 * Purpose: Unit tests for WebSocket hook memory management and cleanup
 * Scope: Test component-specific listener tracking and memory leak prevention
 * Overview: Validates that the useWebSocket hook properly manages event listeners,
 *     cleans up on unmount, and prevents memory leaks through component tracking.
 *     Tests multiple mounting/unmounting scenarios and listener accumulation.
 * Dependencies: vitest, React Testing Library, useWebSocket hook
 * Exports: Test suite for useWebSocket memory management
 * Interfaces: vitest test functions and React hook testing utilities
 * Implementation: Unit tests with mocked WebSocket service
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWebSocket } from './useWebSocket';
import * as singleton from '../services/websocketSingleton';

// Mock WebSocket service
type EventCallback = (data?: unknown) => void;

class MockWebSocketService {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private componentListeners: Map<string, Map<string, Set<EventCallback>>> = new Map();

  isConnected = false;
  connectCalled = false;
  disconnectCalled = false;

  constructor() {
    // Initialize event listener maps
    const events = [
      'open',
      'close',
      'error',
      'data',
      'reconnecting',
      'reconnected',
      'maxReconnectAttemptsReached',
    ];
    events.forEach((event) => {
      this.listeners.set(event, new Set());
    });
  }

  async connect(_url?: string): Promise<void> {
    this.connectCalled = true;
    this.isConnected = true;
    return Promise.resolve();
  }

  disconnect(): void {
    this.disconnectCalled = true;
    this.isConnected = false;
  }

  send(_data: unknown): boolean {
    return this.isConnected;
  }

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  onForComponent(componentId: string, event: string, callback: EventCallback): void {
    // Add to global listeners
    this.on(event, callback);

    // Track component-specific listeners
    if (!this.componentListeners.has(componentId)) {
      this.componentListeners.set(componentId, new Map());
    }
    const componentEvents = this.componentListeners.get(componentId);
    if (!componentEvents) return;

    if (!componentEvents.has(event)) {
      componentEvents.set(event, new Set());
    }
    componentEvents.get(event)?.add(callback);
  }

  removeAllListenersForComponent(componentId: string): void {
    const componentEvents = this.componentListeners.get(componentId);
    if (componentEvents) {
      // Remove each listener from global listeners
      componentEvents.forEach((callbacks, event) => {
        const globalListeners = this.listeners.get(event);
        if (globalListeners) {
          callbacks.forEach((callback) => {
            globalListeners.delete(callback);
          });
        }
      });

      // Clear component's listener tracking
      this.componentListeners.delete(componentId);
    }
  }

  getListenerCount(): number {
    let count = 0;
    this.listeners.forEach((eventListeners) => {
      count += eventListeners.size;
    });
    return count;
  }

  getComponentCount(): number {
    return this.componentListeners.size;
  }

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((callback) => {
      callback(data);
    });
  }
}

describe('useWebSocket Memory Management', () => {
  let mockService: MockWebSocketService;

  beforeEach(() => {
    mockService = new MockWebSocketService();
    vi.spyOn(singleton, 'getWebSocketSingleton').mockReturnValue(mockService as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should clean up all listeners on unmount', () => {
    const { unmount } = renderHook(() => useWebSocket());

    // Verify initial listeners are added
    const initialCount = mockService.getListenerCount();
    expect(initialCount).toBeGreaterThan(0);
    expect(mockService.getComponentCount()).toBe(1);

    // Unmount the hook
    unmount();

    // All listeners should be cleaned up
    expect(mockService.getListenerCount()).toBe(0);
    expect(mockService.getComponentCount()).toBe(0);
  });

  it('should not accumulate listeners on multiple mounts/unmounts', () => {
    // Mount and unmount multiple times
    for (let i = 0; i < 5; i++) {
      const { unmount } = renderHook(() => useWebSocket());
      unmount();
    }

    // No listeners should be accumulated
    expect(mockService.getListenerCount()).toBe(0);
    expect(mockService.getComponentCount()).toBe(0);
  });

  it('should handle multiple components independently', () => {
    // Mount multiple components
    const hook1 = renderHook(() => useWebSocket());
    const hook2 = renderHook(() => useWebSocket());
    const hook3 = renderHook(() => useWebSocket());

    // Each component should be tracked separately
    expect(mockService.getComponentCount()).toBe(3);
    const totalListeners = mockService.getListenerCount();
    expect(totalListeners).toBeGreaterThan(0);

    // Unmount one component
    hook1.unmount();

    // Should have fewer listeners but other components intact
    expect(mockService.getComponentCount()).toBe(2);
    expect(mockService.getListenerCount()).toBeLessThan(totalListeners);
    expect(mockService.getListenerCount()).toBeGreaterThan(0);

    // Unmount remaining components
    hook2.unmount();
    hook3.unmount();

    // All listeners should be cleaned up
    expect(mockService.getListenerCount()).toBe(0);
    expect(mockService.getComponentCount()).toBe(0);
  });

  it('should not update state after unmount', async () => {
    const { result, unmount } = renderHook(() => useWebSocket());

    // Wait for initial connection attempt to complete
    await act(async () => {
      // Let the hook initialize
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Initial state (after connection attempt)
    expect(result.current.error).toBeNull();

    // Unmount the component
    unmount();

    // Try to emit events after unmount
    act(() => {
      mockService.emit('open');
      mockService.emit('error', new Error('Test error'));
      mockService.emit('data', { timestamp: Date.now(), values: [1, 2, 3] });
    });

    // State should not be updated (no errors thrown)
    // The callbacks should check mountedRef before updating state
    expect(result.current.error).toBeNull();
  });

  it('should handle rapid mount/unmount cycles', () => {
    const mountUnmountCycles = 20;
    const hooks: ReturnType<typeof renderHook>[] = [];

    // Rapidly mount components
    for (let i = 0; i < mountUnmountCycles; i++) {
      hooks.push(renderHook(() => useWebSocket()));
    }

    // Verify all components are tracked
    expect(mockService.getComponentCount()).toBe(mountUnmountCycles);

    // Rapidly unmount in reverse order
    for (let i = hooks.length - 1; i >= 0; i--) {
      hooks[i].unmount();
    }

    // All listeners should be cleaned up
    expect(mockService.getListenerCount()).toBe(0);
    expect(mockService.getComponentCount()).toBe(0);
  });

  it('should maintain correct state across remounts', async () => {
    // First mount
    const { result: result1, unmount: unmount1 } = renderHook(() => useWebSocket());

    // Wait for initial connection
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Simulate connection
    act(() => {
      mockService.emit('open');
    });

    expect(result1.current.isConnected).toBe(true);

    // Unmount first instance
    unmount1();

    // Reset service state to simulate fresh connection state
    mockService.isConnected = false;

    // Mount second instance
    const { result: result2 } = renderHook(() => useWebSocket());

    // Wait for initialization
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // New instance should have fresh state
    expect(result2.current.isConnected).toBe(true); // Because auto-connect succeeded

    // Simulate data reception
    act(() => {
      mockService.emit('data', { timestamp: Date.now(), values: [1, 2, 3] });
    });

    expect(result2.current.lastData).toBeTruthy();
    expect(result2.current.lastData?.values).toEqual([1, 2, 3]);
  });

  it('should handle connection errors without leaking listeners', () => {
    const { result, unmount } = renderHook(() => useWebSocket());

    // Simulate connection error
    act(() => {
      mockService.emit('error', new Error('Connection failed'));
    });

    expect(result.current.error?.message).toBe('Connection failed');

    // Unmount should still clean up properly
    unmount();

    expect(mockService.getListenerCount()).toBe(0);
    expect(mockService.getComponentCount()).toBe(0);
  });

  it('should track reconnection attempts correctly', () => {
    const { result, unmount } = renderHook(() => useWebSocket());

    // Simulate reconnection attempts
    act(() => {
      mockService.emit('reconnecting', { attempt: 1 });
    });

    expect(result.current.reconnectAttempts).toBe(1);
    expect(result.current.isConnecting).toBe(true);

    act(() => {
      mockService.emit('reconnecting', { attempt: 2 });
    });

    expect(result.current.reconnectAttempts).toBe(2);

    act(() => {
      mockService.emit('reconnected');
    });

    expect(result.current.reconnectAttempts).toBe(0);

    // Cleanup
    unmount();
    expect(mockService.getListenerCount()).toBe(0);
  });

  it('should prevent memory leaks with long-running connections', () => {
    const hooks: ReturnType<typeof renderHook>[] = [];

    // Simulate a scenario where components mount/unmount while maintaining connection
    for (let i = 0; i < 10; i++) {
      const hook = renderHook(() => useWebSocket());

      // Simulate some data flow
      act(() => {
        mockService.emit('data', { timestamp: Date.now(), values: [i] });
      });

      // Unmount half of them
      if (i % 2 === 0) {
        hook.unmount();
      } else {
        hooks.push(hook);
      }
    }

    // Check remaining components
    expect(mockService.getComponentCount()).toBe(hooks.length);

    // Clean up remaining
    hooks.forEach((hook) => hook.unmount());

    // All should be cleaned up
    expect(mockService.getListenerCount()).toBe(0);
    expect(mockService.getComponentCount()).toBe(0);
  });

  it('should generate unique component IDs', () => {
    // This test verifies that each hook instance gets a unique component ID
    // by checking that they can be independently cleaned up
    const hook1 = renderHook(() => useWebSocket());
    const hook2 = renderHook(() => useWebSocket());

    expect(mockService.getComponentCount()).toBe(2);

    // Each should have the same number of listeners
    const listenersPerComponent = mockService.getListenerCount() / 2;

    hook1.unmount();

    // Should have exactly half the listeners remaining
    expect(mockService.getListenerCount()).toBe(listenersPerComponent);
    expect(mockService.getComponentCount()).toBe(1);

    hook2.unmount();

    expect(mockService.getListenerCount()).toBe(0);
    expect(mockService.getComponentCount()).toBe(0);
  });
});
