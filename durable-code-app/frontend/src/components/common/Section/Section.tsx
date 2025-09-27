/**
 * Purpose: Reusable section component for organizing content with semantic HTML structure
 * Scope: UI components across the application for content organization and document structure
 * Overview: Provides a semantic section component with optional titles and multiple visual variants
 *     (default, highlighted, bordered) for organizing page content. Implements proper HTML5 semantic
 *     structure with section elements and heading hierarchy. Supports customizable styling through
 *     CSS modules while maintaining accessibility standards. The component helps structure page
 *     content for better SEO, screen reader navigation, and visual organization.
 * Dependencies: React, CSS modules for styling, SectionProps interface from types file
 * Exports: Section component as named export with React.memo optimization
 * Props/Interfaces: SectionProps extending HTMLElement with title, variant, and className options
 * State/Behavior: No internal state, purely structural component with semantic HTML markup
 */
import React from 'react';
import styles from './Section.module.css';
import type { SectionProps } from './Section.types';

export const Section = React.memo<SectionProps>(
  ({ children, title, variant = 'default', className = '', ...rest }) => {
    const classNames = [styles.section, styles[variant], className]
      .filter(Boolean)
      .join(' ');

    return (
      <section className={classNames} {...rest}>
        {title && <h2 className={styles.title}>{title}</h2>}
        <div className={styles.content}>{children}</div>
      </section>
    );
  },
);

Section.displayName = 'Section';
