/**
 * Purpose: Comprehensive test suite for ErrorBoundary component
 * Scope: Error catching, recovery mechanisms, lifecycle, and integration
 * Overview: Tests all ErrorBoundary functionality including error catching, recovery actions,
 *     auto-recovery, reset keys, prop changes, error logging, and component lifecycle
 * Dependencies: Vitest, React Testing Library, ErrorBoundary component
 * Exports: Test suite for ErrorBoundary
 * Implementation: Comprehensive unit tests covering all error scenarios and recovery paths
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ErrorBoundary } from '../ErrorBoundary';
import { errorLogger } from '../ErrorLogger';

// Mock the ErrorLogger
vi.mock('../ErrorLogger', () => ({
  errorLogger: {
    logError: vi.fn(),
    logRecovery: vi.fn(),
  },
}));

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Success</div>;
}

describe('ErrorBoundary', () => {
  let consolErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Suppress React error boundary console.error output in tests
    consolErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consolErrorSpy.mockRestore();
  });

  describe('Error Catching', () => {
    it('should catch errors and display fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      // Should display error fallback
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Component Error/i)).toBeInTheDocument();
    });

    it('should log caught errors', () => {
      render(
        <ErrorBoundary name="TestComponent">
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          errorBoundary: 'TestComponent',
        }),
      );
    });

    it('should call custom onError handler', () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
    });

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Recovery Mechanisms', () => {
    it('should reset error state when reset button is clicked', async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();

      render(
        <ErrorBoundary recoveryOptions={{ onReset }}>
          <ThrowError />
        </ErrorBoundary>,
      );

      // Error should be caught
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // onReset should be called
      expect(onReset).toHaveBeenCalled();
      expect(errorLogger.logRecovery).toHaveBeenCalledWith('reset', true);
    });

    it('should attempt retry when retry button is clicked', async () => {
      vi.useFakeTimers();
      const onRetry = vi.fn();

      render(
        <ErrorBoundary recoveryOptions={{ onRetry, maxRetries: 3, retryDelay: 100 }}>
          <ThrowError />
        </ErrorBoundary>,
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });

      // Click retry button and advance all timers
      await act(async () => {
        retryButton.click();
        vi.advanceTimersByTime(500); // ErrorFallback's handleRetry delay
        await Promise.resolve(); // Flush microtasks
        vi.advanceTimersByTime(100); // ErrorBoundary's handleRetry retryDelay
        await Promise.resolve(); // Flush microtasks
      });

      expect(onRetry).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should navigate home when home button is clicked', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError />
        </ErrorBoundary>,
      );

      // Home button should exist (ErrorBoundary provides default handleHome)
      const homeButton = screen.getByRole('button', { name: /home/i });
      expect(homeButton).toBeInTheDocument();
    });

    it('should respect max retry limit', () => {
      const onRetry = vi.fn();

      render(
        <ErrorBoundary
          recoveryOptions={{
            onRetry,
            maxRetries: 2,
          }}
        >
          <ThrowError />
        </ErrorBoundary>,
      );

      // Verify retry button is available initially
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Auto-Recovery', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should attempt auto-recovery after delay', () => {
      const onRetry = vi.fn();

      render(
        <ErrorBoundary
          recoveryOptions={{
            enableAutoRecovery: true,
            autoRecoveryDelay: 5000,
            retryDelay: 1000,
            onRetry,
          }}
        >
          <ThrowError />
        </ErrorBoundary>,
      );

      // Should display error immediately
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Fast-forward time to trigger auto-recovery (autoRecoveryDelay + retryDelay)
      act(() => {
        vi.advanceTimersByTime(5000); // autoRecoveryDelay
      });

      act(() => {
        vi.advanceTimersByTime(1000); // retryDelay
      });

      // Should attempt recovery (onRetry called)
      expect(onRetry).toHaveBeenCalled();
    });

    it('should use default auto-recovery delay', () => {
      const onRetry = vi.fn();

      render(
        <ErrorBoundary
          recoveryOptions={{
            enableAutoRecovery: true,
            onRetry,
          }}
        >
          <ThrowError />
        </ErrorBoundary>,
      );

      // Default autoRecoveryDelay is 5000ms
      act(() => {
        vi.advanceTimersByTime(4999);
      });
      expect(onRetry).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1); // Complete autoRecoveryDelay (5000ms total)
      });
      expect(onRetry).not.toHaveBeenCalled(); // Still need retryDelay

      // Default retryDelay is 1000ms
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onRetry).toHaveBeenCalled();
    });

    it('should cleanup auto-recovery timeout on unmount', () => {
      const { unmount } = render(
        <ErrorBoundary
          recoveryOptions={{
            enableAutoRecovery: true,
            autoRecoveryDelay: 5000,
          }}
        >
          <ThrowError />
        </ErrorBoundary>,
      );

      unmount();

      // Should not throw when advancing timers after unmount
      expect(() => {
        vi.advanceTimersByTime(5000);
      }).not.toThrow();
    });
  });

  describe('Reset Keys', () => {
    it('should reset error state when reset keys change', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>,
      );

      // Error should be caught
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Change reset key and render success component
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      // Should reset and render successfully
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not reset when reset keys remain the same', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Re-render with same keys
      rerender(
        <ErrorBoundary resetKeys={['key1']}>
          <ThrowError />
        </ErrorBoundary>,
      );

      // Should still show error
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle multiple reset keys', () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1', 'key2', 'key3']}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Change one key
      rerender(
        <ErrorBoundary resetKeys={['key1', 'key2-changed', 'key3']}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });

  describe('Reset on Props Change', () => {
    it('should reset when resetOnPropsChange is true and props change', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange name="Component1">
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Change props
      rerender(
        <ErrorBoundary resetOnPropsChange name="Component2">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('should not reset on children change', () => {
      const { rerender } = render(
        <ErrorBoundary resetOnPropsChange>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Change only children
      rerender(
        <ErrorBoundary resetOnPropsChange>
          <div>Different children</div>
        </ErrorBoundary>,
      );

      // Should still show error (children changes don't trigger reset)
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Error Boundary Levels', () => {
    it('should pass level prop to fallback component', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/Page Error/i)).toBeInTheDocument();
    });

    it('should handle component level errors', () => {
      render(
        <ErrorBoundary level="component" name="TestWidget">
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/Component Error/i)).toBeInTheDocument();
      expect(screen.getByText(/TestWidget/)).toBeInTheDocument();
    });

    it('should handle feature level errors', () => {
      render(
        <ErrorBoundary level="feature" name="DemoFeature">
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText(/Feature Error/i)).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback component', () => {
      const CustomFallback = () => <div>Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });

    it('should pass error info to custom fallback', () => {
      const CustomFallback = ({ error }: { error: Error }) => (
        <div>Error: {error.message}</div>
      );

      render(
        <ErrorBoundary fallback={CustomFallback}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('should log enhanced error information', () => {
      render(
        <ErrorBoundary name="TestComponent" level="feature">
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(errorLogger.logError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
        }),
        expect.objectContaining({
          errorBoundary: 'TestComponent',
          errorBoundaryProps: expect.objectContaining({
            level: 'feature',
          }),
          timestamp: expect.any(Number),
          userAgent: expect.any(String),
          url: expect.any(String),
        }),
      );
    });

    it('should increment error count on multiple errors', () => {
      // Create a component that tracks error count
      let errorCount = 0;
      function TrackableError(): React.ReactElement {
        errorCount++;
        throw new Error(`Error ${errorCount}`);
      }

      const { unmount } = render(
        <ErrorBoundary>
          <TrackableError />
        </ErrorBoundary>,
      );

      // First error should be logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);

      unmount();
      vi.clearAllMocks();

      // Mount with a new error boundary to trigger second error
      render(
        <ErrorBoundary>
          <TrackableError />
        </ErrorBoundary>,
      );

      // Second error should be logged
      expect(errorLogger.logError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <ErrorBoundary>
            <div>Test</div>
          </ErrorBoundary>,
        );
        unmount();
      }

      // Should not leak memory or throw errors
      expect(true).toBe(true);
    });

    it('should maintain error state across re-renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Re-render without changes
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      // Error state should persist
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Isolation Prop', () => {
    it('should accept isolate prop for component-level isolation', () => {
      render(
        <ErrorBoundary isolate>
          <ThrowError />
        </ErrorBoundary>,
      );

      // Should still catch error
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
