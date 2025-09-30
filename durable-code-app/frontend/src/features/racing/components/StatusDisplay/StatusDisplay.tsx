/**
 * Purpose: Status Display component for real-time game information
 * Scope: Display current speed, position, and game state indicators
 * Overview: Shows real-time game statistics during gameplay including car speed,
 *     position coordinates, and game state (paused indicator). Updates continuously
 *     during racing to provide player feedback. Hides during menu state.
 * Dependencies: React, racing types (CarState, GameState)
 * Exports: StatusDisplay component, StatusDisplayProps interface
 * Props/Interfaces: Game state, car state with speed and position data
 * State/Behavior: Conditionally displays based on game state, formats numbers
 */

import type { ReactElement } from 'react';
import { type CarState, GameState } from '../../types/racing.types';
import styles from './StatusDisplay.module.css';

// Type definitions
export interface StatusDisplayProps {
  gameState: GameState;
  carState: CarState;
  className?: string;
}

/**
 * StatusDisplay component for showing game stats
 *
 * @param props - Component props
 * @returns Rendered status display or null if not racing
 */
export function StatusDisplay({
  gameState,
  carState,
  className = '',
}: StatusDisplayProps): ReactElement | null {
  // Only show during racing or paused states
  if (gameState !== GameState.RACING && gameState !== GameState.PAUSED) {
    return null;
  }

  const containerClasses = [styles.statusDisplay, className].filter(Boolean).join(' ');

  // Format speed (convert physics velocity to km/h-like value)
  const displaySpeed = Math.round(carState.speed * 10);

  // Format position to whole numbers
  const displayX = Math.round(carState.x);
  const displayY = Math.round(carState.y);

  return (
    <div className={containerClasses}>
      <div className={styles.statsContainer}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Speed:</span>
          <span className={styles.statValue}>{displaySpeed} km/h</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>Position:</span>
          <span className={styles.statValue}>
            ({displayX}, {displayY})
          </span>
        </div>
      </div>

      {gameState === GameState.PAUSED && (
        <div className={styles.pausedIndicator} role="status" aria-live="polite">
          <span className={styles.pausedIcon}>⏸</span>
          <span className={styles.pausedText}>PAUSED</span>
        </div>
      )}
    </div>
  );
}

export default StatusDisplay;
