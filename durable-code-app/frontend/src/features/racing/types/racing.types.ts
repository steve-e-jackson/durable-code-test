/**
 * Purpose: Type definitions for racing game feature
 * Scope: All racing game related types and interfaces
 * Overview: Central type definitions for track data, car state, game state, and API responses
 * Dependencies: None (pure TypeScript types)
 * Exports: All racing game types
 * Implementation: TypeScript interfaces and enums
 */

// API Response Types (matching backend)
export interface Point2D {
  x: number;
  y: number;
}

export interface TrackBoundary {
  inner: Point2D[];
  outer: Point2D[];
}

export interface Track {
  width: number;
  height: number;
  boundaries: TrackBoundary;
  start_position: Point2D;
  track_width: number;
}

export interface TrackGenerationParams {
  difficulty: 'easy' | 'medium' | 'hard';
  seed?: number;
  width: number;
  height: number;
}

// Game State Types
export enum GameState {
  MENU = 'menu',
  LOADING = 'loading',
  RACING = 'racing',
  PAUSED = 'paused',
  FINISHED = 'finished',
}

export interface CarState {
  x: number;
  y: number;
  angle: number;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
  speed: number;
}

export interface InputState {
  mouseX: number;
  mouseY: number;
  leftMouseDown: boolean;
  rightMouseDown: boolean;
  keys: Set<string>;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  targetFPS: number;
  enablePhysicsDebug: boolean;
}

// Physics and Rendering Types
export interface RenderOptions {
  showDebugInfo: boolean;
  showPhysicsBodies: boolean;
  showTrackBoundaries: boolean;
  backgroundColor: string;
}

export interface PhysicsWorld {
  engine: Matter.Engine;
  car: Matter.Body;
  walls: Matter.Body[];
}

// Hook Return Types
export interface UseRacingGameReturn {
  // Game state
  gameState: GameState;
  track: Track | null;
  carState: CarState;
  inputState: InputState;

  // Game actions
  startGame: () => void;
  pauseGame: () => void;
  resetGame: () => void;

  // Loading states
  isLoadingTrack: boolean;
  trackError: string | null;

  // Canvas ref for rendering
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

// Error Types
export interface RacingGameError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Configuration Types
export interface DefaultGameConfig {
  readonly CANVAS_WIDTH: number;
  readonly CANVAS_HEIGHT: number;
  readonly TARGET_FPS: number;
  readonly PHYSICS_TIMESTEP: number;
}
