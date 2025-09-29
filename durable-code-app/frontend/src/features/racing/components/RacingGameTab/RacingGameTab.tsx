/**
 * Purpose: Racing Game demo with Matter.js physics
 * Scope: Complete racing game implementation with physics and rendering
 * Overview: Interactive racing game with car physics, track rendering, and mouse controls
 * Dependencies: React, useRacingGame hook, Matter.js physics
 * Exports: RacingGameTab component
 * Implementation: Canvas-based racing game with real physics simulation
 */

import type { ReactElement } from 'react';
import { useRacingGame } from '../../hooks/useRacingGame';
import { GameState } from '../../types/racing.types';
import styles from './RacingGameTab.module.css';

export function RacingGameTab(): ReactElement {
  const {
    gameState,
    carState,
    startGame,
    pauseGame,
    resetGame,
    isLoadingTrack,
    trackError,
    canvasRef,
    onMouseMove,
    onMouseDown,
    onMouseUp,
  } = useRacingGame();

  const renderControls = () => {
    return (
      <div className={styles.controls}>
        <div className={styles.gameButtons}>
          {gameState === GameState.MENU && (
            <button
              onClick={startGame}
              className={styles.startButton}
              disabled={isLoadingTrack || !!trackError}
            >
              {isLoadingTrack ? 'Loading Track...' : 'Start Racing'}
            </button>
          )}

          {gameState === GameState.RACING && (
            <button onClick={pauseGame} className={styles.pauseButton}>
              Pause Game
            </button>
          )}

          {gameState === GameState.PAUSED && (
            <>
              <button onClick={pauseGame} className={styles.resumeButton}>
                Resume Game
              </button>
              <button onClick={resetGame} className={styles.resetButton}>
                Reset Game
              </button>
            </>
          )}

          {(gameState === GameState.RACING || gameState === GameState.PAUSED) && (
            <button onClick={resetGame} className={styles.resetButton}>
              Reset Game
            </button>
          )}
        </div>

        {trackError && (
          <div className={styles.error}>
            <span>❌</span>
            <span>Error loading track: {trackError}</span>
          </div>
        )}
      </div>
    );
  };

  const renderInstructions = () => {
    return (
      <div className={styles.instructions}>
        <h4>Controls:</h4>
        <ul>
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
    );
  };

  const renderGameInfo = () => {
    if (gameState === GameState.RACING || gameState === GameState.PAUSED) {
      return (
        <div className={styles.gameInfo}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Speed:</span>
            <span className={styles.statValue}>
              {Math.round(carState.speed * 10)} km/h
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Position:</span>
            <span className={styles.statValue}>
              ({Math.round(carState.x)}, {Math.round(carState.y)})
            </span>
          </div>
          {gameState === GameState.PAUSED && (
            <div className={styles.pausedIndicator}>PAUSED</div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>🏎️</div>
        <h2 className={styles.title}>Racing Game Demo</h2>
        <p className={styles.subtitle}>
          Physics-based racing with Matter.js - PR2 Basic Implementation
        </p>
      </div>

      {renderControls()}

      <div className={styles.gameArea}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={styles.gameCanvas}
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          style={{
            border: gameState === GameState.MENU ? '2px dashed #ccc' : '2px solid #333',
            backgroundColor: gameState === GameState.MENU ? '#f5f5f5' : '#90EE90',
          }}
        />

        {gameState === GameState.MENU && !isLoadingTrack && !trackError && (
          <div className={styles.canvasOverlay}>
            <p>Click "Start Racing" to begin!</p>
          </div>
        )}

        {renderGameInfo()}
      </div>

      {renderInstructions()}

      <div className={styles.techInfo}>
        <h4>Technical Implementation (PR2):</h4>
        <ul>
          <li>✅ Matter.js physics engine integration</li>
          <li>✅ Backend track generation API</li>
          <li>✅ Mouse-following car controls</li>
          <li>✅ Real-time canvas rendering</li>
          <li>✅ Collision detection with track boundaries</li>
          <li>✅ 60 FPS game loop</li>
        </ul>
      </div>
    </div>
  );
}
