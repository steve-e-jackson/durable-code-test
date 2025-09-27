/**
 * Purpose: Reusable tab component for implementing tabbed navigation interfaces
 * Scope: UI components across the application for tabbed navigation and content switching
 * Overview: Provides an accessible tab component with proper ARIA attributes for tab navigation
 *     patterns. Supports multiple visual variants (default, underline, pill) and active state
 *     management. Implements WAI-ARIA guidelines with role="tab" and aria-selected attributes
 *     for screen reader compatibility. The component handles keyboard navigation and focus
 *     management as part of larger tab panel implementations.
 * Dependencies: React, CSS modules for styling, TabProps interface from types file
 * Exports: Tab component as named export with React.memo optimization
 * Props/Interfaces: TabProps extending HTMLButtonElement with isActive, variant, and className options
 * State/Behavior: No internal state, controlled component with active state and click handling
 */
import React from 'react';
import styles from './Tab.module.css';
import type { TabProps } from './Tab.types';

export const Tab = React.memo<TabProps>(
  ({ children, isActive = false, variant = 'default', className = '', ...rest }) => {
    const classNames = [
      styles.tab,
      styles[variant],
      isActive && styles.active,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        className={classNames}
        type="button"
        role="tab"
        aria-selected={isActive}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Tab.displayName = 'Tab';
