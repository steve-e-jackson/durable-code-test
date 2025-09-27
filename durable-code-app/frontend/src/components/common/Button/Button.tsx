/**
 * Purpose: Reusable button component with multiple variants, sizes, and loading states
 * Scope: UI components across the application for user interactions and form submissions
 * Overview: Provides a fully accessible button component with support for different visual variants
 *     (primary, secondary, danger, ghost, link), multiple sizes, loading states with spinner,
 *     and full-width layouts. Implements proper accessibility attributes and keyboard navigation.
 *     Handles all standard button interactions while providing consistent styling through CSS modules.
 *     The component is memoized for performance optimization and includes proper TypeScript typing.
 * Dependencies: React, CSS modules for styling, ButtonProps interface from types file
 * Exports: Button component as named export with React.memo optimization
 * Props/Interfaces: ButtonProps extending HTMLButtonElement with variant, size, isLoading, fullWidth options
 * State/Behavior: No internal state, controlled component with loading state management and disabled handling
 */
import React from 'react';
import styles from './Button.module.css';
import type { ButtonProps } from './Button.types';

export const Button = React.memo<ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    fullWidth = false,
    disabled = false,
    className = '',
    ...rest
  }) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      isLoading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button className={classNames} disabled={disabled || isLoading} {...rest}>
        {isLoading && <span className={styles.spinner} />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
