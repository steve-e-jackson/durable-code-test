/**
 * Purpose: Racing game hook for state management and game loop
 * Scope: Complete racing game state and physics management
 * Overview: Manages game state, physics engine, track loading, and rendering loop
 * Dependencies: React, Matter.js, racing types, physics setup
 * Exports: useRacingGame hook
 * Implementation: React hook with Matter.js integration and game loop
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import {
  CarState,
  GameState,
  InputState,
  PhysicsWorld,
  Track,
  UseRacingGameReturn,
} from '../types/racing.types';
import {
  applyCarForces,
  createCar,
  createPhysicsEngine,
  createTrackWalls,
  getCarState,
} from '../physics/setup';

// Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TARGET_FPS = 60;
const PHYSICS_TIMESTEP = 1000 / TARGET_FPS;

// Initial states
const initialCarState: CarState = {
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT - 100,
  angle: 0,
  velocityX: 0,
  velocityY: 0,
  angularVelocity: 0,
  speed: 0,
};

const initialInputState: InputState = {
  mouseX: 0,
  mouseY: 0,
  leftMouseDown: false,
  rightMouseDown: false,
  keys: new Set(),
};

/**
 * Racing game hook for managing game state and physics
 *
 * @returns Racing game state and control functions
 */
export function useRacingGame(): UseRacingGameReturn {
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [track, setTrack] = useState<Track | null>(null);
  const [carState, setCarState] = useState<CarState>(initialCarState);
  const [inputState, setInputState] = useState<InputState>(initialInputState);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Refs for physics and rendering
  const physicsWorldRef = useRef<PhysicsWorld | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Track loading function
  const loadTrack = useCallback(async () => {
    setIsLoadingTrack(true);
    setTrackError(null);

    try {
      const response = await fetch('/api/racing/track/simple');
      if (!response.ok) {
        throw new Error(`Failed to load track: ${response.statusText}`);
      }

      const trackData: Track = await response.json();
      setTrack(trackData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTrackError(errorMessage);
      console.error('Failed to load track:', error);
    } finally {
      setIsLoadingTrack(false);
    }
  }, []);

  // Initialize physics world
  const initializePhysicsWorld = useCallback((trackData: Track) => {
    if (!trackData) return null;

    const engine = createPhysicsEngine();
    const car = createCar(trackData.start_position.x, trackData.start_position.y);

    // Create walls from track boundaries
    const outerWalls = createTrackWalls(trackData.boundaries.outer);
    const innerWalls = createTrackWalls(trackData.boundaries.inner);
    const walls = [...outerWalls, ...innerWalls];

    // Add bodies to the world
    Matter.World.add(engine.world, [car, ...walls]);

    return { engine, car, walls };
  }, []);

  // Game loop
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!physicsWorldRef.current || gameState !== GameState.RACING) {
        return;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Update physics (fixed timestep for consistency)
      if (deltaTime >= PHYSICS_TIMESTEP) {
        const { engine, car } = physicsWorldRef.current;

        // Apply forces based on input
        applyCarForces(
          car,
          inputState.mouseX,
          inputState.mouseY,
          inputState.leftMouseDown,
          inputState.rightMouseDown,
        );

        // Update physics engine
        Matter.Engine.update(engine, PHYSICS_TIMESTEP);

        // Update car state
        setCarState(getCarState(car));
      }

      // Render if canvas is available
      if (canvasRef.current && track) {
        renderGame(canvasRef.current, physicsWorldRef.current, track);
      }

      // Continue game loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    },
    [gameState, inputState, track, renderGame],
  );

  // Rendering function
  const renderGame = useCallback(
    (canvas: HTMLCanvasElement, world: PhysicsWorld, trackData: Track) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = '#90EE90'; // Light green background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw track boundaries
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 3;

      // Draw outer boundary
      ctx.beginPath();
      trackData.boundaries.outer.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.stroke();

      // Draw inner boundary
      ctx.beginPath();
      trackData.boundaries.inner.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.closePath();
      ctx.stroke();

      // Draw car
      const { car } = world;
      ctx.save();
      ctx.translate(car.position.x, car.position.y);
      ctx.rotate(car.angle);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-15, -10, 30, 20); // Car rectangle
      ctx.restore();

      // Draw car direction indicator (small triangle)
      ctx.save();
      ctx.translate(car.position.x, car.position.y);
      ctx.rotate(car.angle);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(5, -5);
      ctx.lineTo(5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    [],
  );

  // Mouse event handlers
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    setInputState((prev) => ({
      ...prev,
      mouseX,
      mouseY,
    }));
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const isLeftClick = event.button === 0;
    const isRightClick = event.button === 2;

    setInputState((prev) => ({
      ...prev,
      leftMouseDown: isLeftClick ? true : prev.leftMouseDown,
      rightMouseDown: isRightClick ? true : prev.rightMouseDown,
    }));
  }, []);

  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const isLeftClick = event.button === 0;
    const isRightClick = event.button === 2;

    setInputState((prev) => ({
      ...prev,
      leftMouseDown: isLeftClick ? false : prev.leftMouseDown,
      rightMouseDown: isRightClick ? false : prev.rightMouseDown,
    }));
  }, []);

  // Game control functions
  const startGame = useCallback(async () => {
    if (!track) {
      await loadTrack();
      return;
    }

    const world = initializePhysicsWorld(track);
    if (!world) {
      console.error('Failed to initialize physics world');
      return;
    }

    physicsWorldRef.current = world;
    setGameState(GameState.RACING);
    setCarState(getCarState(world.car));

    // Start game loop
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [track, loadTrack, initializePhysicsWorld, gameLoop]);

  const pauseGame = useCallback(() => {
    setGameState((prev) =>
      prev === GameState.RACING ? GameState.PAUSED : GameState.RACING,
    );
  }, []);

  const resetGame = useCallback(() => {
    // Stop game loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reset state
    setGameState(GameState.MENU);
    setCarState(initialCarState);
    setInputState(initialInputState);
    physicsWorldRef.current = null;
  }, []);

  // Load track on mount
  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  // Setup canvas event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent context menu on right click
    const preventContextMenu = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', preventContextMenu);

    return () => {
      canvas.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    gameState,
    track,
    carState,
    inputState,
    startGame,
    pauseGame,
    resetGame,
    isLoadingTrack,
    trackError,
    canvasRef,
    // Canvas event handlers
    onMouseMove: handleMouseMove,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
  } as UseRacingGameReturn & {
    onMouseMove: (event: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseDown: (event: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseUp: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  };
}
