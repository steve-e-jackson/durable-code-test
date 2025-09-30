/**
 * Purpose: Custom render utilities for React Testing Library with app providers
 * Scope: Test utilities for rendering components with ErrorBoundary wrapper
 * Overview: Provides renderWithErrorBoundary helper for testing components within error boundary context
 * Dependencies: React Testing Library, ErrorBoundary component
 * Exports: renderWithErrorBoundary function for convenient testing
 * Implementation: Wraps RTL render with ErrorBoundary and optional custom error handlers
 */

import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { ErrorBoundary, type ErrorBoundaryProps } from '../core/errors';

/**
 * Extended render options that include ErrorBoundary configuration
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * ErrorBoundary props to customize error handling behavior in tests
   */
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>;
}

/**
 * Renders a component wrapped in ErrorBoundary for testing error scenarios
 *
 * @example
 * // Basic usage
 * const { getByText } = renderWithErrorBoundary(<MyComponent />);
 *
 * @example
 * // With custom error handler
 * const onError = vi.fn();
 * renderWithErrorBoundary(<MyComponent />, {
 *   errorBoundaryProps: { onError }
 * });
 *
 * @param ui - React element to render
 * @param options - Extended render options including ErrorBoundary configuration
 * @returns RTL render result
 */
export function renderWithErrorBoundary(
  ui: ReactElement,
  options?: ExtendedRenderOptions,
) {
  const { errorBoundaryProps, ...renderOptions } = options || {};

  function Wrapper({ children }: { children: ReactNode }) {
    return <ErrorBoundary {...errorBoundaryProps}>{children}</ErrorBoundary>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
