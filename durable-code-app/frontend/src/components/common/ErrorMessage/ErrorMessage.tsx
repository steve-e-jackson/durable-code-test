/**
 * Purpose: Reusable error message component for displaying alerts and notifications
 * Scope: UI components across the application for error handling and user feedback
 * Overview: Provides an accessible error message component with multiple variants (error, warning, info)
 *     for communicating system states and user feedback. Implements proper ARIA attributes with role="alert"
 *     and aria-live="polite" for screen reader compatibility. Features optional dismiss functionality,
 *     contextual icons, and support for both message text and additional content. Integrates with the
 *     design system for consistent visual communication of different alert types and severity levels.
 * Dependencies: React, CSS modules for styling, ErrorMessageProps interface from types file
 * Exports: ErrorMessage component as named export with React.memo optimization
 * Props/Interfaces: ErrorMessageProps extending HTMLDivElement with message, title, variant, and onDismiss options
 * State/Behavior: No internal state, controlled component with optional dismiss callback handling
 */
import React from 'react';
import styles from './ErrorMessage.module.css';
import type { ErrorMessageProps } from './ErrorMessage.types';

export const ErrorMessage = React.memo<ErrorMessageProps>(
  ({
    message,
    title,
    variant = 'error',
    children,
    onDismiss,
    className = '',
    ...rest
  }) => {
    const classNames = [styles.errorMessage, styles[variant], className]
      .filter(Boolean)
      .join(' ');

    const getIcon = () => {
      switch (variant) {
        case 'error':
          return '❌';
        case 'warning':
          return '⚠️';
        case 'info':
          return 'ℹ️';
        default:
          return '❌';
      }
    };

    return (
      <div className={classNames} role="alert" aria-live="polite" {...rest}>
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.icon} role="img" aria-hidden="true">
              {getIcon()}
            </span>
            {title && <h4 className={styles.title}>{title}</h4>}
            {onDismiss && (
              <button
                className={styles.dismissButton}
                onClick={onDismiss}
                aria-label="Dismiss message"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
          <div className={styles.message}>{message}</div>
          {children && <div className={styles.children}>{children}</div>}
        </div>
      </div>
    );
  },
);

ErrorMessage.displayName = 'ErrorMessage';
