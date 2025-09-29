/**
 * Purpose: Matter.js physics engine setup for racing game
 * Scope: Physics engine initialization and basic car setup
 * Overview: Sets up Matter.js engine with appropriate settings for top-down racing
 * Dependencies: matter-js
 * Exports: Physics engine creation and car body creation functions
 * Implementation: Matter.js physics with 2D top-down view settings
 */

import * as Matter from 'matter-js';

// Physics constants
const PHYSICS_GRAVITY_X = 0;
const PHYSICS_GRAVITY_Y = 0; // Top-down view, no gravity
const PHYSICS_FRICTION_AIR = 0.05;
const PHYSICS_CAR_MASS = 1;
const PHYSICS_CAR_WIDTH = 30;
const PHYSICS_CAR_HEIGHT = 20;

// Car physics properties
export interface CarPhysicsProperties {
  frictionAir: number;
  mass: number;
  inertia: number;
  restitution: number;
}

export const DEFAULT_CAR_PROPERTIES: CarPhysicsProperties = {
  frictionAir: PHYSICS_FRICTION_AIR,
  mass: PHYSICS_CAR_MASS,
  inertia: Infinity, // Prevent rotation for now
  restitution: 0.6, // Bounce factor
};

/**
 * Create and configure the Matter.js physics engine
 *
 * @returns Configured Matter.js engine for racing game
 */
export function createPhysicsEngine(): Matter.Engine {
  const engine = Matter.Engine.create();

  // Configure gravity for top-down view
  engine.gravity.x = PHYSICS_GRAVITY_X;
  engine.gravity.y = PHYSICS_GRAVITY_Y;

  // Enable collision detection
  engine.detector = Matter.Detector.create();

  // Configure world settings
  engine.world.gravity.scale = 0.001; // Very low gravity scale

  return engine;
}

/**
 * Create a car body for the physics simulation
 *
 * @param x Initial X position
 * @param y Initial Y position
 * @param properties Optional car physics properties
 * @returns Matter.js body representing the car
 */
export function createCar(
  x: number,
  y: number,
  properties: Partial<CarPhysicsProperties> = {},
): Matter.Body {
  const carProperties = { ...DEFAULT_CAR_PROPERTIES, ...properties };

  const car = Matter.Bodies.rectangle(x, y, PHYSICS_CAR_WIDTH, PHYSICS_CAR_HEIGHT, {
    frictionAir: carProperties.frictionAir,
    mass: carProperties.mass,
    inertia: carProperties.inertia,
    restitution: carProperties.restitution,
    render: {
      fillStyle: '#ff0000', // Red car for visibility
      strokeStyle: '#000000',
      lineWidth: 2,
    },
  });

  // Add car to world will be done by the game loop
  return car;
}

/**
 * Create static walls from track boundary points
 *
 * @param boundaries Array of boundary points
 * @returns Array of Matter.js bodies representing walls
 */
export function createTrackWalls(
  boundaries: Array<{ x: number; y: number }>,
): Matter.Body[] {
  const walls: Matter.Body[] = [];

  // Create walls between consecutive boundary points
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i];
    const end = boundaries[(i + 1) % boundaries.length]; // Wrap around

    // Calculate wall position and angle
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    const length = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
    );
    const angle = Math.atan2(end.y - start.y, end.x - start.x);

    // Create wall segment
    const wall = Matter.Bodies.rectangle(centerX, centerY, length, 10, {
      isStatic: true,
      angle: angle,
      render: {
        fillStyle: '#333333',
        strokeStyle: '#000000',
        lineWidth: 1,
      },
    });

    walls.push(wall);
  }

  return walls;
}

/**
 * Apply force to car based on mouse position and input
 *
 * @param car Car body to apply force to
 * @param mouseX Target mouse X position
 * @param mouseY Target mouse Y position
 * @param isAccelerating Whether the car should accelerate
 * @param isBraking Whether the car should brake
 */
export function applyCarForces(
  car: Matter.Body,
  mouseX: number,
  mouseY: number,
  isAccelerating: boolean,
  isBraking: boolean,
): void {
  // Calculate direction to mouse
  const directionX = mouseX - car.position.x;
  const directionY = mouseY - car.position.y;
  const distance = Math.sqrt(directionX * directionX + directionY * directionY);

  if (distance > 5) {
    // Only apply force if mouse is not too close
    // Normalize direction
    const normalizedX = directionX / distance;
    const normalizedY = directionY / distance;

    // Apply force based on input
    let forceMagnitude = 0;
    if (isAccelerating) {
      forceMagnitude = 0.001; // Forward force
    } else if (isBraking) {
      forceMagnitude = -0.0005; // Backward force
    }

    // Apply the force
    const forceX = normalizedX * forceMagnitude;
    const forceY = normalizedY * forceMagnitude;

    Matter.Body.applyForce(car, car.position, { x: forceX, y: forceY });

    // Apply angular velocity to turn towards mouse
    const targetAngle = Math.atan2(directionY, directionX);
    const currentAngle = car.angle;
    const angleDiff = targetAngle - currentAngle;

    // Normalize angle difference to [-π, π]
    const normalizedAngleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;

    // Apply angular velocity for turning
    const turnForce = normalizedAngleDiff * 0.01;
    Matter.Body.setAngularVelocity(car, turnForce);
  }
}

/**
 * Get car state for rendering and game logic
 *
 * @param car Car body
 * @returns Car state object
 */
export function getCarState(car: Matter.Body) {
  return {
    x: car.position.x,
    y: car.position.y,
    angle: car.angle,
    velocityX: car.velocity.x,
    velocityY: car.velocity.y,
    angularVelocity: car.angularVelocity,
    speed: Math.sqrt(car.velocity.x ** 2 + car.velocity.y ** 2),
  };
}
