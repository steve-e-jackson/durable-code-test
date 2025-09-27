/**
 * Purpose: Reusable loading spinner component with customizable styling for async operations
 * Scope: UI components across the application for indicating loading states and async operations
 * Overview: Provides an accessible loading spinner with multiple size variants and color themes that
 *     integrate with the design system. Handles loading states for API calls, data fetching, and other
 *     asynchronous operations with proper ARIA labeling and screen reader support. Includes visual
 *     indication through CSS animations and semantic markup with role="status" for accessibility
 *     compliance. The component supports reduced motion preferences for accessibility.
 * Dependencies: React, CSS modules for styling and animations, LoadingSpinnerProps interface from types
 * Exports: LoadingSpinner component as named export with React.memo optimization
 * Props/Interfaces: LoadingSpinnerProps extending HTMLDivElement with size, variant, and label options
 * State/Behavior: No internal state, purely presentational component with CSS-based animations
 */
import React from 'react';
import styles from './LoadingSpinner.module.css';
import type { LoadingSpinnerProps } from './LoadingSpinner.types';

export const LoadingSpinner = React.memo<LoadingSpinnerProps>(
  ({
    size = 'medium',
    variant = 'primary',
    className = '',
    label = 'Loading...',
    ...rest
  }) => {
    const classNames = [styles.spinner, styles[size], styles[variant], className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={classNames} role="status" aria-label={label} {...rest}>
        <div className={styles.circle} />
        <span className={styles.visuallyHidden}>{label}</span>
      </div>
    );
  },
);

LoadingSpinner.displayName = 'LoadingSpinner';
