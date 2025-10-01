/**
 * Purpose: Game Canvas component for racing game rendering and mouse input
 * Scope: Canvas element with mouse tracking, input handling, and game rendering
 * Overview: Manages the main game canvas where racing gameplay occurs. Handles mouse events
 *     for car control (movement, acceleration, braking) and provides the rendering surface
 *     for the game loop. Integrates with the physics engine and rendering system.
 * Dependencies: React, racing types
 * Exports: GameCanvas component, GameCanvasProps interface
 * Props/Interfaces: Canvas dimensions, mouse event handlers, game state, canvas ref
 * State/Behavior: Tracks mouse position, handles click events, manages canvas context
 */

import type { ReactElement } from 'react';
import { useCallback, useEffect } from 'react';
import { GameState } from '../../types/racing.types';
import styles from './GameCanvas.module.css';

// Type definitions
export interface GameCanvasProps {
  width: number;
  height: number;
  gameState: GameState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMouseMove?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  className?: string;
}

/**
 * GameCanvas component for rendering racing game
 *
 * @param props - Component props
 * @returns Rendered canvas element
 */
export function GameCanvas({
  width,
  height,
  gameState,
  canvasRef,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  className = '',
}: GameCanvasProps): ReactElement {
  // Prevent context menu on right-click
  const handleContextMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
  }, []);

  // Setup canvas event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [canvasRef, handleContextMenu]);

  // Determine canvas style based on game state
  const canvasStyle = {
    border: gameState === GameState.MENU ? '2px dashed #ccc' : '2px solid #333',
    backgroundColor: gameState === GameState.MENU ? '#f5f5f5' : '#90EE90',
  };

  const containerClasses = [styles.canvasContainer, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={styles.gameCanvas}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        style={canvasStyle}
        aria-label="Racing game canvas"
        role="application"
      />

      {gameState === GameState.MENU && (
        <div className={styles.menuOverlay}>
          <p className={styles.overlayText}>Click &quot;Start Racing&quot; to begin!</p>
        </div>
      )}
    </div>
  );
}

export default GameCanvas;
