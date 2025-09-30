/**
 * Purpose: Control Panel component for game controls and difficulty selection
 * Scope: Game control buttons (start, pause, reset) and difficulty selector
 * Overview: Provides user interface controls for managing game state transitions.
 *     Includes start/pause/resume/reset buttons with appropriate state-based visibility,
 *     difficulty selector, and game instructions display. Handles loading and error states.
 * Dependencies: React, racing types
 * Exports: ControlPanel component, ControlPanelProps interface
 * Props/Interfaces: Game state, control callbacks, loading/error states, difficulty
 * State/Behavior: Conditionally renders controls based on game state
 */

import type { ReactElement } from 'react';
import { GameState } from '../../types/racing.types';
import styles from './ControlPanel.module.css';

// Type definitions
export interface ControlPanelProps {
  gameState: GameState;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isLoading?: boolean;
  error?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard';
  onDifficultyChange?: (difficulty: 'easy' | 'medium' | 'hard') => void;
  className?: string;
}

/**
 * ControlPanel component for game controls
 *
 * @param props - Component props
 * @returns Rendered control panel
 */
export function ControlPanel({
  gameState,
  onStart,
  onPause,
  onReset,
  isLoading = false,
  error = null,
  difficulty = 'medium',
  onDifficultyChange,
  className = '',
}: ControlPanelProps): ReactElement {
  const containerClasses = [styles.controlPanel, className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className={styles.controlsSection}>
        <div className={styles.gameButtons}>
          {gameState === GameState.MENU && (
            <button
              onClick={onStart}
              className={`${styles.button} ${styles.startButton}`}
              disabled={isLoading || !!error}
              type="button"
              aria-label="Start racing game"
            >
              {isLoading ? 'Loading Track...' : 'Start Racing'}
            </button>
          )}

          {gameState === GameState.RACING && (
            <button
              onClick={onPause}
              className={`${styles.button} ${styles.pauseButton}`}
              type="button"
              aria-label="Pause game"
            >
              Pause Game
            </button>
          )}

          {gameState === GameState.PAUSED && (
            <>
              <button
                onClick={onPause}
                className={`${styles.button} ${styles.resumeButton}`}
                type="button"
                aria-label="Resume game"
              >
                Resume Game
              </button>
              <button
                onClick={onReset}
                className={`${styles.button} ${styles.resetButton}`}
                type="button"
                aria-label="Reset game"
              >
                Reset Game
              </button>
            </>
          )}

          {(gameState === GameState.RACING || gameState === GameState.PAUSED) && (
            <button
              onClick={onReset}
              className={`${styles.button} ${styles.resetButton}`}
              type="button"
              aria-label="Reset game"
            >
              Reset Game
            </button>
          )}
        </div>

        {error && (
          <div className={styles.error} role="alert">
            <span className={styles.errorIcon}>❌</span>
            <span className={styles.errorText}>Error: {error}</span>
          </div>
        )}
      </div>

      {gameState === GameState.MENU && onDifficultyChange && (
        <div className={styles.difficultySection}>
          <label htmlFor="difficulty-select" className={styles.difficultyLabel}>
            Difficulty:
          </label>
          <select
            id="difficulty-select"
            value={difficulty}
            onChange={(e) =>
              onDifficultyChange(e.target.value as 'easy' | 'medium' | 'hard')
            }
            className={styles.difficultySelect}
            disabled={isLoading}
            aria-label="Select game difficulty"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      )}

      <div className={styles.instructions}>
        <h4 className={styles.instructionsTitle}>Controls:</h4>
        <ul className={styles.instructionsList}>
          <li>
            <strong>Mouse:</strong> Move to steer the car
          </li>
          <li>
            <strong>Left Click:</strong> Accelerate
          </li>
          <li>
            <strong>Right Click:</strong> Brake
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ControlPanel;
