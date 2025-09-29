/**
 * Purpose: Unit tests for physics engine setup and functionality
 * Scope: Physics engine creation, car creation, and force application
 * Overview: Tests Matter.js integration and physics calculations
 * Dependencies: vitest, Matter.js physics
 * Exports: Test suite for physics functionality
 * Implementation: Unit tests with mocked physics scenarios
 */

import { beforeEach, describe, expect, it } from 'vitest';
import * as Matter from 'matter-js';
import {
  applyCarForces,
  createCar,
  createPhysicsEngine,
  createTrackWalls,
  DEFAULT_CAR_PROPERTIES,
  getCarState,
} from '../physics/setup';

describe('Physics Engine', () => {
  let engine: Matter.Engine;

  beforeEach(() => {
    engine = createPhysicsEngine();
  });

  describe('createPhysicsEngine', () => {
    it('should create a Matter.js engine with correct gravity settings', () => {
      expect(engine).toBeDefined();
      expect(engine.gravity.x).toBe(0);
      expect(engine.gravity.y).toBe(0);
      expect(engine.world).toBeDefined();
    });

    it('should have collision detection enabled', () => {
      expect(engine.detector).toBeDefined();
    });

    it('should have minimal gravity scale for top-down view', () => {
      expect(engine.world.gravity.scale).toBe(0.001);
    });
  });

  describe('createCar', () => {
    it('should create a car body with default properties', () => {
      const car = createCar(100, 200);

      expect(car).toBeDefined();
      expect(car.position.x).toBe(100);
      expect(car.position.y).toBe(200);
      expect(car.mass).toBe(DEFAULT_CAR_PROPERTIES.mass);
      expect(car.frictionAir).toBe(DEFAULT_CAR_PROPERTIES.frictionAir);
    });

    it('should create a car body with custom properties', () => {
      const customProperties = {
        mass: 2,
        frictionAir: 0.1,
      };
      const car = createCar(50, 75, customProperties);

      expect(car.mass).toBe(2);
      expect(car.frictionAir).toBe(0.1);
      expect(car.restitution).toBe(DEFAULT_CAR_PROPERTIES.restitution);
    });

    it('should create a rectangular car body', () => {
      const car = createCar(0, 0);

      // Matter.js bodies have vertices that define their shape
      expect(car.vertices).toBeDefined();
      expect(car.vertices.length).toBeGreaterThan(0);
    });
  });

  describe('createTrackWalls', () => {
    it('should create walls from boundary points', () => {
      const boundaries = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];

      const walls = createTrackWalls(boundaries);

      expect(walls).toHaveLength(4);
      walls.forEach((wall) => {
        expect(wall.isStatic).toBe(true);
        expect(wall).toBeDefined();
      });
    });

    it('should handle empty boundary array', () => {
      const walls = createTrackWalls([]);
      expect(walls).toHaveLength(0);
    });

    it('should create walls that connect consecutive points', () => {
      const boundaries = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      const walls = createTrackWalls(boundaries);
      expect(walls).toHaveLength(2); // Two walls: 0->1 and 1->0 (wrapping)
    });
  });

  describe('applyCarForces', () => {
    let car: Matter.Body;

    beforeEach(() => {
      car = createCar(400, 300);
      Matter.World.add(engine.world, car);
    });

    it('should not apply force when mouse is too close to car', () => {
      const initialVelocity = { ...car.velocity };

      applyCarForces(car, car.position.x + 2, car.position.y + 2, true, false);

      // Velocity should remain unchanged when mouse is too close
      expect(car.velocity.x).toBe(initialVelocity.x);
      expect(car.velocity.y).toBe(initialVelocity.y);
    });

    it('should apply forward force when accelerating', () => {
      const mouseX = car.position.x + 100;
      const mouseY = car.position.y;

      applyCarForces(car, mouseX, mouseY, true, false);

      // Run physics update to apply the forces
      Matter.Engine.update(engine, 16);

      // Should have applied force towards the mouse (to the right)
      expect(car.velocity.x).toBeGreaterThan(0);
    });

    it('should apply backward force when braking', () => {
      const mouseX = car.position.x + 100;
      const mouseY = car.position.y;

      applyCarForces(car, mouseX, mouseY, false, true);

      // Run physics update to apply the forces
      Matter.Engine.update(engine, 16);

      // Braking should apply negative force
      expect(car.velocity.x).toBeLessThan(0);
    });

    it('should apply angular velocity for turning', () => {
      const mouseX = car.position.x;
      const mouseY = car.position.y + 100;
      const initialAngularVelocity = car.angularVelocity;

      applyCarForces(car, mouseX, mouseY, true, false);

      // Should have changed angular velocity for turning
      expect(car.angularVelocity).not.toBe(initialAngularVelocity);
    });
  });

  describe('getCarState', () => {
    it('should return correct car state information', () => {
      const car = createCar(150, 250);

      // Set some velocity for testing
      Matter.Body.setVelocity(car, { x: 5, y: 3 });
      Matter.Body.setAngle(car, Math.PI / 4);

      const state = getCarState(car);

      expect(state.x).toBe(150);
      expect(state.y).toBe(250);
      expect(state.velocityX).toBe(5);
      expect(state.velocityY).toBe(3);
      expect(state.angle).toBe(Math.PI / 4);
      expect(state.speed).toBeCloseTo(Math.sqrt(25 + 9)); // sqrt(5^2 + 3^2)
    });

    it('should calculate speed correctly from velocity components', () => {
      const car = createCar(0, 0);
      Matter.Body.setVelocity(car, { x: 3, y: 4 });

      const state = getCarState(car);

      expect(state.speed).toBe(5); // 3-4-5 triangle
    });

    it('should handle zero velocity', () => {
      const car = createCar(0, 0);

      const state = getCarState(car);

      expect(state.speed).toBe(0);
      expect(state.velocityX).toBe(0);
      expect(state.velocityY).toBe(0);
    });
  });
});

describe('Physics Integration', () => {
  it('should allow car to be added to physics world', () => {
    const engine = createPhysicsEngine();
    const car = createCar(100, 100);

    Matter.World.add(engine.world, car);

    expect(engine.world.bodies).toContain(car);
  });

  it('should allow walls to be added to physics world', () => {
    const engine = createPhysicsEngine();
    const boundaries = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const walls = createTrackWalls(boundaries);

    Matter.World.add(engine.world, walls);

    walls.forEach((wall) => {
      expect(engine.world.bodies).toContain(wall);
    });
  });

  it('should update physics when engine runs', () => {
    const engine = createPhysicsEngine();
    const car = createCar(100, 100);

    Matter.Body.setVelocity(car, { x: 1, y: 0 });
    Matter.World.add(engine.world, car);

    const initialX = car.position.x;

    // Run physics for one step
    Matter.Engine.update(engine, 16); // 16ms timestep

    // Car should have moved
    expect(car.position.x).toBeGreaterThan(initialX);
  });
});
