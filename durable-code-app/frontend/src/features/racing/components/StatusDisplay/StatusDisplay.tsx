/**
 * Purpose: Status Display component for real-time game information
 * Scope: Display current speed, position, lap counter, timing, and game state indicators
 * Overview: Shows real-time game statistics during gameplay including car speed,
 *     lap number, current lap time, best lap time, and wrong-way warnings.
 *     Updates continuously during racing to provide player feedback.
 * Dependencies: React, racing types (CarState, GameState), timing utilities
 * Exports: StatusDisplay component, StatusDisplayProps interface
 * Props/Interfaces: Game state, car state, lap data, timing data
 * State/Behavior: Conditionally displays based on game state, formats numbers and times
 */

import type { ReactElement } from 'react';
import { type CarState, GameState } from '../../types/racing.types';
import { TimingSystem } from '../../utils/timing';
import styles from './StatusDisplay.module.css';

// Type definitions
export interface StatusDisplayProps {
  gameState: GameState;
  carState: CarState;
  currentLapNumber: number;
  currentLapTime: number;
  bestLapTime: number | null;
  wrongWayWarning: boolean;
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
  currentLapNumber,
  currentLapTime,
  bestLapTime,
  wrongWayWarning,
  className = '',
}: StatusDisplayProps): ReactElement | null {
  // Only show during racing or paused states
  if (gameState !== GameState.RACING && gameState !== GameState.PAUSED) {
    return null;
  }

  const containerClasses = [styles.statusDisplay, className].filter(Boolean).join(' ');

  // Format speed (convert physics velocity to km/h-like value)
  const displaySpeed = Math.round(carState.speed * 10);

  // Format lap times
  const currentTimeFormatted = TimingSystem.formatTime(currentLapTime);
  const bestTimeFormatted =
    bestLapTime !== null ? TimingSystem.formatTime(bestLapTime) : '--:--.---';

  return (
    <div className={containerClasses}>
      <div className={styles.statsContainer}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Lap:</span>
          <span className={styles.statValue}>{currentLapNumber}</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>Current Time:</span>
          <span className={styles.statValue}>{currentTimeFormatted}</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>Best Lap:</span>
          <span className={styles.statValue}>{bestTimeFormatted}</span>
        </div>

        <div className={styles.stat}>
          <span className={styles.statLabel}>Speed:</span>
          <span className={styles.statValue}>{displaySpeed} km/h</span>
        </div>
      </div>

      {wrongWayWarning && gameState === GameState.RACING && (
        <div className={styles.wrongWayIndicator} role="alert" aria-live="assertive">
          <span className={styles.wrongWayIcon}>⚠️</span>
          <span className={styles.wrongWayText}>WRONG WAY!</span>
        </div>
      )}

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
