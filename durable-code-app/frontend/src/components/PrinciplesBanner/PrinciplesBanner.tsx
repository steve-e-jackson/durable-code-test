/**
 * Purpose: Fixed banner displaying numbered principle blocks
 * Scope: Banner UI with clickable principle numbers
 * Overview: Bottom-fixed banner with numbered circles that open modals
 * Dependencies: React, principles config, PrinciplePopup
 * Exports: PrinciplesBanner component
 * Props/Interfaces: No props
 * Implementation: Fixed position banner with state management for popup
 */

import { type ReactElement, useState } from 'react';
import { principles } from '../../config/principles.config';
import type { Principle } from '../../config/principles.config';
import { PrinciplePopup } from './PrinciplePopup';
import styles from './PrinciplesBanner.module.css';

export function PrinciplesBanner(): ReactElement {
  const [selectedPrinciple, setSelectedPrinciple] = useState<Principle | null>(null);

  const handlePrincipleClick = (principle: Principle): void => {
    setSelectedPrinciple(principle);
  };

  const handleClose = (): void => {
    setSelectedPrinciple(null);
  };

  return (
    <>
      <div className={styles.banner}>
        <div className={styles.bannerContent}>
          {principles.map((principle) => (
            <button
              key={principle.number}
              className={styles.principleBlock}
              onClick={() => {
                handlePrincipleClick(principle);
              }}
              aria-label={`View principle ${principle.number}: ${principle.title}`}
            >
              <span className={styles.principleNumber}>{principle.number}</span>
              <span className={styles.principleTitle}>{principle.title}</span>
            </button>
          ))}
        </div>
      </div>
      <PrinciplePopup principle={selectedPrinciple} onClose={handleClose} />
    </>
  );
}
