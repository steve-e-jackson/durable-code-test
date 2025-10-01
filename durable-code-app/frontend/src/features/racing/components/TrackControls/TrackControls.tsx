/**
 * Purpose: Track regeneration control component
 * Scope: Simple UI for regenerating tracks
 * Overview: Single button to regenerate track with configured parameters
 * Dependencies: React, CSS modules
 * Exports: TrackControls component
 * Implementation: Simple button component
 */

import type { ReactElement } from 'react';
import styles from './TrackControls.module.css';

interface TrackControlsProps {
  onRegenerate: () => void;
  isGenerating: boolean;
}

export function TrackControls({
  onRegenerate,
  isGenerating,
}: TrackControlsProps): ReactElement {
  return (
    <div className={styles.container}>
      <button
        className={styles.regenerateButton}
        onClick={onRegenerate}
        disabled={isGenerating}
        type="button"
      >
        {isGenerating ? '⏳ Generating...' : '🔄 Regenerate Track'}
      </button>
    </div>
  );
}
