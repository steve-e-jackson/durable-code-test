/**
 * Purpose: Reusable card component for displaying content in structured containers
 * Scope: UI components across the application for content organization and visual grouping
 * Overview: Provides a flexible card component with multiple variants (default, feature, stat, principle)
 *     for organizing content in visually distinct containers. Supports optional icons, titles, badges,
 *     and clickable interactions with proper semantic markup. Integrates with the design system for
 *     consistent spacing, shadows, and visual hierarchy. The component handles various content layouts
 *     and provides accessibility features for interactive cards. Supports customizable styling through
 *     CSS modules and className overrides.
 * Dependencies: React, CSS modules for styling, CardProps interface from types file
 * Exports: Card component as named export with React.memo optimization
 * Props/Interfaces: CardProps extending HTMLDivElement with variant, icon, title, badge, and clickable options
 * State/Behavior: No internal state, controlled component with optional click handling and visual feedback
 */
import React from 'react';
import styles from './Card.module.css';
import type { CardProps } from './Card.types';

export const Card = React.memo<CardProps>(
  ({
    children,
    variant = 'default',
    icon,
    title,
    badge,
    clickable = false,
    className = '',
    ...rest
  }) => {
    const classNames = [
      styles.card,
      styles[variant],
      clickable && styles.clickable,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={classNames} {...rest}>
        {icon && <div className={styles.icon}>{icon}</div>}
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.content}>{children}</div>
        {badge && <div className={styles.badge}>{badge}</div>}
      </div>
    );
  },
);

Card.displayName = 'Card';
