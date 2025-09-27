/**
 * Purpose: Reusable icon component for displaying emoji icons with accessibility support
 * Scope: UI components across the application for visual icons and decorative elements
 * Overview: Provides an accessible icon component that renders emoji characters with proper
 *     ARIA labeling for screen readers. Supports multiple size variants and maintains consistent
 *     styling through CSS modules. Implements semantic markup with role="img" and required
 *     aria-label for accessibility compliance. The component ensures emoji icons are properly
 *     announced by assistive technologies while providing visual consistency across the application.
 * Dependencies: React, CSS modules for styling, IconProps interface from types file
 * Exports: Icon component as named export with React.memo optimization
 * Props/Interfaces: IconProps extending HTMLSpanElement with emoji, label, size, and className options
 * State/Behavior: No internal state, purely presentational component with accessibility attributes
 */
import React from 'react';
import styles from './Icon.module.css';
import type { IconProps } from './Icon.types';

export const Icon = React.memo<IconProps>(
  ({ emoji, label, size = 'medium', className = '', ...rest }) => {
    const classNames = [styles.icon, styles[size], className].filter(Boolean).join(' ');

    return (
      <span className={classNames} role="img" aria-label={label} {...rest}>
        {emoji}
      </span>
    );
  },
);

Icon.displayName = 'Icon';
