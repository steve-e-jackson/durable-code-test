/**
 * Purpose: Racing Game demo with Matter.js physics
 * Scope: Complete racing game implementation with physics and rendering
 * Overview: Interactive racing game with car physics, track rendering, and mouse controls.
 *     Refactored to use modular components (GameCanvas, ControlPanel, StatusDisplay) for
 *     better separation of concerns and maintainability. PR4 implementation.
 * Dependencies: React, useRacingGame hook, GameCanvas, ControlPanel, StatusDisplay
 * Exports: RacingGameTab component
 * Implementation: Component-based architecture with centralized game state management
 */

import type { ReactElement } from 'react';
import { useRacingGame } from '../../hooks/useRacingGame';
import { GameCanvas } from '../GameCanvas';
import { ControlPanel } from '../ControlPanel';
import { StatusDisplay } from '../StatusDisplay';
import { TrackControls } from '../TrackControls';
import { DEFAULT_TRACK_PARAMS } from '../../config/trackConfig';
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
    regenerateTrack,
    currentLapNumber,
    currentLapTime,
    bestLapTime,
    wrongWayWarning,
    onMouseMove,
    onMouseDown,
    onMouseUp,
  } = useRacingGame();

  const handleRegenerateTrack = () => {
    if (regenerateTrack) {
      regenerateTrack(DEFAULT_TRACK_PARAMS);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.icon}>🏎️</div>
        <h2 className={styles.title}>Racing Game Demo</h2>
        <p className={styles.subtitle}>
          Physics-based racing with Matter.js - PR6.1 Enhanced Track Generation
        </p>
      </div>

      <TrackControls
        onRegenerate={handleRegenerateTrack}
        isGenerating={isLoadingTrack}
      />

      <ControlPanel
        gameState={gameState}
        onStart={startGame}
        onPause={pauseGame}
        onReset={resetGame}
        isLoading={isLoadingTrack}
        error={trackError}
      />

      <div className={styles.gameArea}>
        <GameCanvas
          width={1200}
          height={900}
          gameState={gameState}
          canvasRef={canvasRef}
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        />

        <StatusDisplay
          gameState={gameState}
          carState={carState}
          currentLapNumber={currentLapNumber}
          currentLapTime={currentLapTime}
          bestLapTime={bestLapTime}
          wrongWayWarning={wrongWayWarning}
        />
      </div>

      <div className={styles.techInfo}>
        <h4>Technical Implementation (PR4 - UI &amp; Controls):</h4>
        <ul>
          <li>✅ Modular GameCanvas component</li>
          <li>✅ ControlPanel with state-based controls</li>
          <li>✅ StatusDisplay for real-time feedback</li>
          <li>✅ GameStateManager utility for state transitions</li>
          <li>✅ Improved component separation and reusability</li>
          <li>✅ Enhanced accessibility and responsive design</li>
        </ul>
        <h4>Previous Implementation (PR1-PR3):</h4>
        <ul>
          <li>✅ Navigation dropdown support (PR1)</li>
          <li>✅ Matter.js physics engine integration (PR2)</li>
          <li>✅ Backend track generation API (PR2)</li>
          <li>✅ Procedural track generation with curves (PR3)</li>
          <li>✅ Enhanced rendering and collision detection (PR3)</li>
        </ul>
      </div>
    </div>
  );
}
