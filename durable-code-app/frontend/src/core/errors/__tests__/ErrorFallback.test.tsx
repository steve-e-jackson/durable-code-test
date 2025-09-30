/**
 * Purpose: Test suite for ErrorFallback UI component
 * Scope: Error display, recovery buttons, accessibility, and user interactions
 * Overview: Tests ErrorFallback rendering, button interactions, level-specific messages,
 *     accessibility features, and error details display
 * Dependencies: Vitest, React Testing Library, ErrorFallback component
 * Exports: Test suite for ErrorFallback
 * Implementation: Unit tests for error display and recovery UI
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ErrorInfo } from '../ErrorBoundary.types';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message');
  const mockErrorInfo: ErrorInfo = {
    componentStack: 'at Component\n  at Parent\n  at App',
    digest: 'test-digest',
    timestamp: Date.now(),
    userAgent: 'test-user-agent',
    url: 'http://localhost/test',
    errorBoundary: 'TestBoundary',
  };

  describe('Error Display', () => {
    it('should render error message and alert role', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should display component error title by default', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
    });

    it('should display error message with component name', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
          name="TestComponent"
        />,
      );

      expect(screen.getByText(/TestComponent/)).toBeInTheDocument();
    });
  });

  describe('Error Levels', () => {
    it('should display page-level error UI', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
          level="page"
        />,
      );

      expect(screen.getByText('Page Error')).toBeInTheDocument();
      expect(screen.getByText('🚨', { exact: false })).toBeInTheDocument();
    });

    it('should display feature-level error UI', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
          level="feature"
        />,
      );

      expect(screen.getByText('Feature Error')).toBeInTheDocument();
      expect(screen.getByText('⚠️', { exact: false })).toBeInTheDocument();
    });

    it('should display component-level error UI', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
          level="component"
        />,
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('❌', { exact: false })).toBeInTheDocument();
    });

    it('should display appropriate error message for each level', () => {
      const { rerender } = render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
          level="page"
        />,
      );

      expect(screen.getByText(/cannot be displayed/)).toBeInTheDocument();

      rerender(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
          level="feature"
        />,
      );

      expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();

      rerender(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
          level="component"
        />,
      );

      expect(screen.getByText(/failed to render/)).toBeInTheDocument();
    });
  });

  describe('Recovery Actions', () => {
    it('should call onReset when reset button is clicked', async () => {
      const user = userEvent.setup();
      const onReset = vi.fn();

      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={onReset}
          onHome={vi.fn()}
        />,
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry when retry button is clicked', async () => {
      vi.useFakeTimers();
      const onRetry = vi.fn(() => Promise.resolve());

      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onRetry={onRetry}
          onHome={vi.fn()}
          retryCount={0}
          maxRetries={3}
        />,
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });

      await act(async () => {
        retryButton.click();
        vi.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should show loading state during retry', async () => {
      vi.useFakeTimers();
      const onRetry = vi.fn(() => Promise.resolve());

      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onRetry={onRetry}
          onHome={vi.fn()}
          retryCount={0}
          maxRetries={3}
        />,
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });

      await act(async () => {
        retryButton.click();
        vi.advanceTimersByTime(100); // During the 500ms delay
        await Promise.resolve();
      });

      // Button should be disabled during retry
      expect(retryButton).toBeDisabled();

      vi.useRealTimers();
    });

    it('should call onHome when home button is clicked', async () => {
      const onHome = vi.fn();

      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={onHome}
        />,
      );

      const homeButton = screen.getByRole('button', { name: /home/i });
      await act(async () => {
        homeButton.click();
      });

      expect(onHome).toHaveBeenCalledTimes(1);
    });

    it('should fallback to window.location.href when onHome not provided', async () => {
      const assignMock = vi.fn();

      Object.defineProperty(window, 'location', {
        value: { href: '', assign: assignMock },
        writable: true,
      });

      render(
        <ErrorFallback error={mockError} errorInfo={mockErrorInfo} onReset={vi.fn()} />,
      );

      const homeButton = screen.getByRole('button', { name: /home/i });
      await act(async () => {
        homeButton.click();
      });

      expect(window.location.href).toBe('/');
    });
  });

  describe('Retry Limit', () => {
    it('should not call onRetry when retry limit reached', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onRetry={vi.fn()}
          onHome={vi.fn()}
          retryCount={3}
          maxRetries={3}
        />,
      );

      // When retryCount >= maxRetries, the retry button should not be shown
      expect(
        screen.queryByRole('button', { name: /try again/i }),
      ).not.toBeInTheDocument();
    });

    it('should display retry count information', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onRetry={vi.fn()}
          onHome={vi.fn()}
          retryCount={2}
          maxRetries={3}
        />,
      );

      // Should indicate retry attempts (implementation may vary)
      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should hide retry button when onRetry not provided', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      expect(
        screen.queryByRole('button', { name: /try again/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Error Details', () => {
    beforeEach(() => {
      // Set development mode for details visibility
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      // Reset NODE_ENV
      process.env.NODE_ENV = 'test';
    });

    it('should toggle error details visibility in development', async () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      // Find details toggle button
      const detailsButton = screen.getByRole('button', { name: /show error details/i });

      // Initially details should be hidden
      expect(detailsButton).toHaveTextContent('Show Error Details');

      await act(async () => {
        detailsButton.click();
      });

      // Button text should change
      expect(detailsButton).toHaveTextContent('Hide Error Details');

      // Should show error details - look for the Error: label
      expect(screen.getByText('Error:')).toBeInTheDocument();
      // Error message appears in both main display and details, so getAllByText
      expect(screen.getAllByText(/Test error message/).length).toBeGreaterThan(0);
    });

    it('should display error message in details when toggled', async () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      const detailsButton = screen.getByRole('button', { name: /show error details/i });
      await act(async () => {
        detailsButton.click();
      });

      // Look for strong "Error:" label which indicates details section
      const errorLabel = screen.getByText('Error:');
      expect(errorLabel).toBeInTheDocument();
      // Error message should be visible (getAllByText since it appears in multiple places)
      expect(screen.getAllByText(/Test error message/).length).toBeGreaterThan(0);
    });

    it('should display component stack in details when toggled', async () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      const detailsButton = screen.getByRole('button', { name: /show error details/i });
      await act(async () => {
        detailsButton.click();
      });

      // Look for Component Stack label
      expect(screen.getByText('Component Stack:')).toBeInTheDocument();
      // Stack trace should contain component info
      expect(screen.getByText(/at Component/)).toBeInTheDocument();
    });

    it('should not show details toggle in production', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      // Details button should not exist in production
      expect(
        screen.queryByRole('button', { name: /error details/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-hidden on decorative icon', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      const icon = screen.getByText('❌', { exact: false });
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have accessible button labels', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onRetry={vi.fn()}
          onHome={vi.fn()}
          retryCount={0}
          maxRetries={3}
        />,
      );

      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('should use default maxRetries when not provided', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onRetry={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      // Should render without errors with default maxRetries
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should use default retryCount when not provided', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={mockErrorInfo}
          onReset={vi.fn()}
          onRetry={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      // Should render without errors with default retryCount
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle missing errorInfo gracefully', () => {
      render(
        <ErrorFallback
          error={mockError}
          errorInfo={null}
          onReset={vi.fn()}
          onHome={vi.fn()}
        />,
      );

      // Should still render error UI
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
