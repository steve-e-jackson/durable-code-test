/**
 * Purpose: Modal popup displaying full principle details
 * Scope: Principle detail view with overlay
 * Overview: Accessible modal with principle content
 * Dependencies: React, principles config
 * Exports: PrinciplePopup component
 * Props/Interfaces: PrinciplePopupProps
 * Implementation: Modal with keyboard and click handlers
 */

import { type ReactElement, useEffect } from 'react';
import type { Principle } from '../../config/principles.config';
import styles from './PrinciplePopup.module.css';

export interface PrinciplePopupProps {
  principle: Principle | null;
  onClose: () => void;
}

export function PrinciplePopup({
  principle,
  onClose,
}: PrinciplePopupProps): ReactElement | null {
  useEffect(() => {
    if (!principle) return;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [principle, onClose]);

  if (!principle) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="principle-title"
    >
      <div className={styles.popup}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close principle details"
        >
          ×
        </button>

        <div className={styles.principleNumber}>{principle.number}</div>

        <h2 id="principle-title" className={styles.title}>
          {principle.title}
        </h2>

        <p className={styles.description}>{principle.description}</p>

        <div className={styles.examples}>
          {principle.examples.map((example) => (
            <span key={example} className={styles.exampleTag}>
              {example}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
