# Racing Game Demo - Detailed PR Breakdown

**Purpose**: Detailed implementation instructions for each pull request in the racing game demo feature

**Scope**: Step-by-step guidance for all 6 PRs required to complete the racing game demo

**Overview**: This document provides comprehensive implementation details for each PR, including specific
    file changes, code examples, testing requirements, and validation criteria. Each PR is designed to be
    independently functional while building toward the complete feature.

---

## PR1: Navigation Dropdown Support

### Overview
Transform the Demo tab into a dropdown menu supporting multiple demo applications.

### Branch
`feat/racing-game-pr1-navigation`

### Files to Modify

#### 1. Update Navigation Types
**File**: `src/features/navigation/types/navigation.types.ts`
```typescript
// Add sub-navigation support
export interface SubTabContent {
  id: string;
  title: string;
  icon?: string;
  description: string;
  component: LazyExoticComponent<ComponentType>;
}

export interface TabContent {
  title: string;
  icon: string;
  description: string;
  component?: LazyExoticComponent<ComponentType>;
  subTabs?: SubTabContent[]; // New: Support for sub-tabs
}
```

#### 2. Create Demo Router Component
**File**: `src/features/demo/components/DemoRouter/DemoRouter.tsx`
```typescript
import { Routes, Route } from 'react-router-dom';
import { OscilloscopeDemo } from '../OscilloscopeDemo';
import { RacingGameDemo } from '../../racing/components/RacingGameTab';

export function DemoRouter() {
  return (
    <Routes>
      <Route path="oscilloscope" element={<OscilloscopeDemo />} />
      <Route path="racing" element={<RacingGameDemo />} />
      <Route index element={<DemoSelector />} />
    </Routes>
  );
}
```

#### 3. Create Demo Selector
**File**: `src/features/demo/components/DemoSelector/DemoSelector.tsx`
```typescript
// Landing page for demo selection with cards for each demo
```

#### 4. Update Tab Configuration
**File**: `src/config/tabs.config.ts`
```typescript
Demo: {
  title: 'Demo',
  icon: '🎮',
  description: 'Interactive demonstrations',
  subTabs: [
    {
      id: 'oscilloscope',
      title: 'Oscilloscope',
      icon: '📊',
      description: 'Real-time waveform visualization',
      component: OscilloscopeDemo,
    },
    {
      id: 'racing',
      title: 'Racing Game',
      icon: '🏎️',
      description: 'Physics-based racing game',
      component: RacingGameDemo,
    },
  ],
}
```

### Testing Requirements
- Navigation dropdown renders correctly
- Sub-navigation items are clickable
- Routing works for each demo
- Back navigation functions properly
- Mobile responsive dropdown

### Success Criteria
- [ ] Demo tab shows dropdown on hover/click
- [ ] Both demos accessible via dropdown
- [ ] URLs reflect current demo
- [ ] Navigation state preserved
- [ ] All existing tests pass

---

## PR2: Physics Engine & Track Generation

### Overview
Implement core game mechanics including physics simulation and procedural track generation.

### Branch
`feat/racing-game-pr2-physics`

### New Files to Create

#### 1. Physics Engine
**File**: `src/features/racing/utils/physics.ts`
```typescript
export class PhysicsEngine {
  private car: CarPhysics;
  private world: WorldPhysics;

  update(deltaTime: number, input: InputState): void {
    // Apply forces
    this.applyAcceleration(input);
    this.applyFriction();
    this.updateVelocity(deltaTime);
    this.updatePosition(deltaTime);
    this.handleCollisions();
  }

  private applyAcceleration(input: InputState): void {
    // Mouse following logic
    const targetVector = this.getTargetVector(input.mousePosition);
    const throttle = input.leftMouseDown ? 1 : 0;
    const brake = input.rightMouseDown ? 1 : 0;
    // Apply forces based on input
  }

  private handleCollisions(): void {
    // Wall bouncing
    // Track boundary detection
  }
}
```

#### 2. Track Generator
**File**: `src/features/racing/utils/trackGenerator.ts`
```typescript
export class TrackGenerator {
  generate(config: TrackConfig): Track {
    const segments: TrackSegment[] = [];

    // Generate track segments
    this.generateStartFinish(segments);
    this.generateCurves(segments, config);
    this.generateStraights(segments, config);
    this.connectSegments(segments);

    return {
      segments,
      checkpoints: this.generateCheckpoints(segments),
      bounds: this.calculateBounds(segments),
    };
  }

  private generateCurves(segments: TrackSegment[], config: TrackConfig): void {
    // Procedural curve generation
    // Based on difficulty and complexity
  }
}
```

#### 3. Racing Game Hook
**File**: `src/features/racing/hooks/useRacingGame.ts`
```typescript
export function useRacingGame() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [track, setTrack] = useState<Track | null>(null);
  const [carState, setCarState] = useState<CarState>(initialCarState);

  const physicsEngine = useRef(new PhysicsEngine());
  const trackGenerator = useRef(new TrackGenerator());

  useEffect(() => {
    // Game loop
    let animationId: number;

    const gameLoop = (timestamp: number) => {
      if (gameState === GameState.RACING) {
        physicsEngine.current.update(deltaTime, inputState);
        render();
      }
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  return {
    gameState,
    track,
    carState,
    startGame,
    pauseGame,
    resetGame,
  };
}
```

### Testing Requirements
- Physics calculations are accurate
- Collision detection works correctly
- Track generation is deterministic with seed
- Different difficulty levels produce appropriate tracks
- Performance meets 60 FPS target

### Success Criteria
- [ ] Car follows mouse smoothly
- [ ] Acceleration/braking works
- [ ] Sliding physics feel realistic
- [ ] Wall collisions cause bouncing
- [ ] Track generates with variety

---

## PR3: Game Controls & UI Components

### Overview
Implement user interface components and control systems for the racing game.

### Branch
`feat/racing-game-pr3-controls`

### New Components

#### 1. Game Canvas Component
**File**: `src/features/racing/components/GameCanvas/GameCanvas.tsx`
```typescript
export function GameCanvas({ track, carState, gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render layers
      renderBackground(ctx);
      renderTrack(ctx, track);
      renderCar(ctx, carState);
      renderEffects(ctx);
      renderUI(ctx, gameState);
    };

    render();
  }, [track, carState, gameState]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className={styles.gameCanvas}
    />
  );
}
```

#### 2. Control Panel
**File**: `src/features/racing/components/ControlPanel/ControlPanel.tsx`
```typescript
export function ControlPanel({ onStart, onPause, onReset, settings }: ControlPanelProps) {
  return (
    <div className={styles.controlPanel}>
      <div className={styles.gameControls}>
        <button onClick={onStart}>Start Race</button>
        <button onClick={onPause}>Pause</button>
        <button onClick={onReset}>Reset</button>
      </div>

      <div className={styles.settings}>
        <label>
          Difficulty:
          <select value={settings.difficulty} onChange={handleDifficultyChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
      </div>

      <div className={styles.instructions}>
        <h4>Controls:</h4>
        <ul>
          <li>Move mouse: Steer car</li>
          <li>Left click: Accelerate</li>
          <li>Right click: Brake</li>
        </ul>
      </div>
    </div>
  );
}
```

#### 3. Status Display
**File**: `src/features/racing/components/StatusDisplay/StatusDisplay.tsx`
```typescript
export function StatusDisplay({ time, speed, lap, bestTime }: StatusDisplayProps) {
  return (
    <div className={styles.statusDisplay}>
      <div className={styles.metric}>
        <span className={styles.label}>Time:</span>
        <span className={styles.value}>{formatTime(time)}</span>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Speed:</span>
        <span className={styles.value}>{Math.round(speed)} km/h</span>
      </div>
      <div className={styles.metric}>
        <span className={styles.label}>Best:</span>
        <span className={styles.value}>{formatTime(bestTime)}</span>
      </div>
    </div>
  );
}
```

### Testing Requirements
- Canvas renders correctly
- Mouse events are captured
- Controls are responsive
- UI updates reflect game state
- Components handle edge cases

### Success Criteria
- [ ] Canvas displays track and car
- [ ] Mouse controls work smoothly
- [ ] Control panel functions correctly
- [ ] Status display updates in real-time
- [ ] UI is responsive on all screen sizes

---

## PR4: Timing & Scoring System

### Overview
Implement game logic for timing, scoring, checkpoints, and win conditions.

### Branch
`feat/racing-game-pr4-scoring`

### New Systems

#### 1. Timing System
**File**: `src/features/racing/utils/timing.ts`
```typescript
export class TimingSystem {
  private startTime: number = 0;
  private currentTime: number = 0;
  private bestTime: number = Infinity;
  private checkpoints: Set<string> = new Set();

  startRace(): void {
    this.startTime = performance.now();
    this.currentTime = 0;
    this.checkpoints.clear();
  }

  update(): number {
    this.currentTime = performance.now() - this.startTime;
    return this.currentTime;
  }

  crossCheckpoint(checkpointId: string): boolean {
    if (this.checkpoints.has(checkpointId)) {
      return false; // Already crossed
    }
    this.checkpoints.add(checkpointId);
    return true;
  }

  finishRace(): RaceResult {
    const finalTime = this.currentTime;
    if (finalTime < this.bestTime) {
      this.bestTime = finalTime;
    }
    return {
      time: finalTime,
      bestTime: this.bestTime,
      isNewBest: finalTime === this.bestTime,
    };
  }
}
```

#### 2. Game State Manager
**File**: `src/features/racing/utils/gameStateManager.ts`
```typescript
export class GameStateManager {
  private state: GameState = GameState.MENU;
  private listeners: Set<StateChangeListener> = new Set();

  transition(newState: GameState): void {
    const validTransition = this.isValidTransition(this.state, newState);
    if (!validTransition) {
      console.warn(`Invalid transition: ${this.state} -> ${newState}`);
      return;
    }

    const oldState = this.state;
    this.state = newState;
    this.notifyListeners(oldState, newState);
  }

  private isValidTransition(from: GameState, to: GameState): boolean {
    const transitions: Record<GameState, GameState[]> = {
      [GameState.MENU]: [GameState.LOADING],
      [GameState.LOADING]: [GameState.COUNTDOWN],
      [GameState.COUNTDOWN]: [GameState.RACING],
      [GameState.RACING]: [GameState.PAUSED, GameState.FINISHED],
      [GameState.PAUSED]: [GameState.RACING, GameState.MENU],
      [GameState.FINISHED]: [GameState.MENU],
    };
    return transitions[from]?.includes(to) ?? false;
  }
}
```

#### 3. Checkpoint System
**File**: `src/features/racing/components/Checkpoints/Checkpoints.tsx`
```typescript
export function Checkpoints({ checkpoints, carPosition }: CheckpointsProps) {
  const [passedCheckpoints, setPassedCheckpoints] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkpoints.forEach(checkpoint => {
      if (isCarInCheckpoint(carPosition, checkpoint) && !passedCheckpoints.has(checkpoint.id)) {
        setPassedCheckpoints(prev => new Set(prev).add(checkpoint.id));
        onCheckpointPass(checkpoint);
      }
    });
  }, [carPosition, checkpoints]);

  return null; // Visual rendering handled by canvas
}
```

### Testing Requirements
- Timer accuracy within 1ms
- Checkpoint detection is reliable
- State transitions are valid
- Best time tracking works
- Race completion triggers correctly

### Success Criteria
- [ ] Timer starts and stops correctly
- [ ] Checkpoints register when crossed
- [ ] Finish line detection works
- [ ] Best times are saved
- [ ] Game states transition smoothly

---

## PR5: Polish & Optimizations

### Overview
Add visual effects, sound, animations, and performance optimizations.

### Branch
`feat/racing-game-pr5-polish`

### Enhancements

#### 1. Particle Effects
**File**: `src/features/racing/utils/particles.ts`
```typescript
export class ParticleSystem {
  private particles: Particle[] = [];
  private pool: Particle[] = [];

  emit(type: ParticleType, position: Point, config: ParticleConfig): void {
    const particle = this.pool.pop() || new Particle();
    particle.reset(type, position, config);
    this.particles.push(particle);
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);

      if (particle.isDead()) {
        this.particles.splice(i, 1);
        this.pool.push(particle); // Recycle
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => particle.render(ctx));
  }
}
```

#### 2. Skid Marks
**File**: `src/features/racing/utils/skidMarks.ts`
```typescript
export class SkidMarkRenderer {
  private marks: SkidMark[] = [];
  private canvas: OffscreenCanvas;

  addSkidMark(position: Point, intensity: number): void {
    if (intensity < 0.3) return; // Threshold

    this.marks.push({
      position,
      intensity,
      age: 0,
    });

    // Fade old marks
    this.marks = this.marks.filter(mark => mark.age < MAX_AGE);
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Render to offscreen canvas for performance
    // Then composite onto main canvas
  }
}
```

#### 3. Performance Optimizations
**File**: `src/features/racing/utils/renderer.ts`
```typescript
export class OptimizedRenderer {
  private staticCanvas: OffscreenCanvas;
  private dynamicCanvas: OffscreenCanvas;
  private dirtyRegions: DirtyRegion[] = [];

  renderStatic(track: Track): void {
    // Render track once to static canvas
    // Only re-render on track change
  }

  renderDynamic(gameObjects: GameObject[]): void {
    // Clear only dirty regions
    this.clearDirtyRegions();

    // Render moving objects
    gameObjects.forEach(obj => {
      if (obj.hasChanged()) {
        this.renderObject(obj);
        this.markDirty(obj.getBounds());
      }
    });
  }

  composite(mainCtx: CanvasRenderingContext2D): void {
    // Layer canvases efficiently
    mainCtx.drawImage(this.staticCanvas, 0, 0);
    mainCtx.drawImage(this.dynamicCanvas, 0, 0);
  }
}
```

### Visual Improvements
- Smooth camera following
- Speed lines effect
- Dust particles when sliding
- Track shadows and lighting
- Animated countdown
- Victory celebration effects

### Performance Targets
- Maintain 60 FPS with effects
- Reduce memory allocations
- Optimize render calls
- Implement dirty rectangle rendering
- Use object pooling

### Success Criteria
- [ ] Particle effects render smoothly
- [ ] Skid marks appear when sliding
- [ ] Performance stays above 60 FPS
- [ ] Memory usage remains stable
- [ ] Visual polish enhances gameplay

---

## PR6: Testing & Documentation

### Overview
Comprehensive testing suite and documentation for the racing game feature.

### Branch
`feat/racing-game-pr6-testing`

### Testing Coverage

#### 1. Unit Tests
**File**: `src/features/racing/utils/__tests__/physics.test.ts`
```typescript
describe('PhysicsEngine', () => {
  describe('collision detection', () => {
    it('should detect wall collisions', () => {
      // Test wall collision
    });

    it('should calculate bounce vector correctly', () => {
      // Test bounce physics
    });
  });

  describe('movement physics', () => {
    it('should apply acceleration correctly', () => {
      // Test acceleration
    });

    it('should simulate friction', () => {
      // Test friction
    });
  });
});
```

#### 2. Integration Tests
**File**: `src/features/racing/components/__tests__/RacingGame.integration.test.tsx`
```typescript
describe('Racing Game Integration', () => {
  it('should complete a full game cycle', async () => {
    // Test menu -> race -> finish flow
  });

  it('should handle input correctly', async () => {
    // Test mouse controls
  });

  it('should track timing accurately', async () => {
    // Test timer system
  });
});
```

#### 3. Performance Tests
**File**: `src/features/racing/__tests__/performance.test.ts`
```typescript
describe('Performance', () => {
  it('should maintain 60 FPS', async () => {
    // Measure frame rate
  });

  it('should not leak memory', async () => {
    // Check memory usage over time
  });
});
```

### Documentation

#### 1. User Guide
**File**: `docs/racing-game-guide.md`
- How to play
- Controls reference
- Tips and strategies
- Troubleshooting

#### 2. Developer Documentation
**File**: `src/features/racing/README.md`
- Architecture overview
- Component structure
- Adding new features
- Performance considerations

#### 3. API Documentation
- JSDoc comments for all public APIs
- Type definitions documented
- Hook usage examples
- Utility function descriptions

### Success Criteria
- [ ] 80%+ test coverage
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Performance benchmarks met
- [ ] Accessibility standards met

---

## 🚀 Deployment Checklist

After all PRs are complete:

### Final Integration
1. [ ] Merge all PRs to main
2. [ ] Run full test suite
3. [ ] Performance validation
4. [ ] Cross-browser testing
5. [ ] Mobile responsiveness check

### Documentation Update
1. [ ] Update main README
2. [ ] Add to feature showcase
3. [ ] Create demo video/GIF
4. [ ] Update roadmap status

### Release
1. [ ] Tag release version
2. [ ] Deploy to production
3. [ ] Announce feature completion
4. [ ] Move roadmap item to complete

---

**Document Version**: 1.0.0
**Last Updated**: 2025-09-28
**Status**: Ready for Implementation