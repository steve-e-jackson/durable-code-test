/**
 * Purpose: Reusable badge component for displaying status indicators and labels
 * Scope: UI components across the application for status communication and visual categorization
 * Overview: Provides a flexible badge component with multiple visual variants (success, warning, error,
 *     info, neutral) and size options for consistent status indication throughout the application.
 *     Supports semantic HTML with proper accessibility attributes and customizable styling through
 *     CSS modules. The component handles text content and integrates with the design system for
 *     consistent visual communication of states, categories, and labels.
 * Dependencies: React, CSS modules for styling, BadgeProps interface from types file
 * Exports: Badge component as named export with React.memo optimization
 * Props/Interfaces: BadgeProps extending HTMLSpanElement with variant, size, and className options
 * State/Behavior: No internal state, purely presentational component with CSS-based styling
 */
import React from 'react';
import styles from './Badge.module.css';
import type { BadgeProps } from './Badge.types';

export const Badge = React.memo<BadgeProps>(
  ({ children, variant = 'neutral', size = 'medium', className = '', ...rest }) => {
    const classNames = [styles.badge, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ');

    return (
      <span className={classNames} {...rest}>
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
