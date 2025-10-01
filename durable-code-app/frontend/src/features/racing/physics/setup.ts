/**
 * Purpose: Matter.js physics engine setup for racing game
 * Scope: Physics engine initialization and basic car setup
 * Overview: Sets up Matter.js engine with appropriate settings for top-down racing
 * Dependencies: matter-js
 * Exports: Physics engine creation and car body creation functions
 * Implementation: Matter.js physics with 2D top-down view settings
 */

import Matter from 'matter-js';

// Physics constants
const PHYSICS_GRAVITY_X = 0;
const PHYSICS_GRAVITY_Y = 0; // Top-down view, no gravity
const PHYSICS_FRICTION_AIR = 0.05;
const PHYSICS_CAR_MASS = 1;
const PHYSICS_CAR_WIDTH = 30;
const PHYSICS_CAR_HEIGHT = 20;

// Car physics tuning
const MIN_SPEED_FOR_STEERING = 0.5; // Minimum speed required to turn
const MAX_STEERING_ANGLE = 0.6; // Maximum steering angle in radians
const STEERING_SPEED = 0.05; // How fast the car turns
const DRIFT_THRESHOLD = 3.0; // Speed at which drift starts
const DRIFT_FRICTION = 0.95; // Friction during drift
const NORMAL_FRICTION = 0.98; // Normal friction

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
  inertia: 10, // Allow rotation with controlled inertia
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
 * Apply force to car based on mouse position and input with realistic physics
 * Implements rear-wheel pivot point, speed-dependent steering, and drift mechanics
 *
 * @param car Car body to apply force to
 * @param mouseX Target mouse X position
 * @param mouseY Target mouse Y position
 * @param isAccelerating Whether the car should accelerate
 * @param isBraking Whether the car should brake
 * @param wrongWayDetected Whether car is going the wrong way (adds resistance)
 */
export function applyCarForces(
  car: Matter.Body,
  mouseX: number,
  mouseY: number,
  isAccelerating: boolean,
  isBraking: boolean,
  _wrongWayDetected: boolean = false,
): void {
  // Calculate current speed
  const speed = Math.sqrt(car.velocity.x ** 2 + car.velocity.y ** 2);

  // Calculate direction to mouse
  const directionX = mouseX - car.position.x;
  const directionY = mouseY - car.position.y;
  const distance = Math.sqrt(directionX * directionX + directionY * directionY);

  // Calculate car's forward direction
  const carForwardX = Math.cos(car.angle);
  const carForwardY = Math.sin(car.angle);

  // Apply acceleration/braking forces in car's forward direction
  let forceMagnitude = 0;
  if (isAccelerating) {
    forceMagnitude = 0.0015; // Forward force
  } else if (isBraking) {
    forceMagnitude = -0.001; // Backward force
  }

  // Apply force in the direction the car is facing
  if (forceMagnitude !== 0) {
    const forceX = carForwardX * forceMagnitude;
    const forceY = carForwardY * forceMagnitude;
    Matter.Body.applyForce(car, car.position, { x: forceX, y: forceY });
  }

  // Only apply steering if car is moving
  if (distance > 5 && speed > MIN_SPEED_FOR_STEERING) {
    // Calculate desired angle to mouse
    const targetAngle = Math.atan2(directionY, directionX);
    const currentAngle = car.angle;
    const angleDiff = targetAngle - currentAngle;

    // Normalize angle difference to [-π, π]
    const normalizedAngleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI;

    // Calculate steering angle based on speed (less steering at high speed)
    // Note: Rear axle pivot is conceptually at the back of the car, affecting rotation behavior
    const speedFactor = Math.min(1, speed / 5);
    const steeringAngle =
      normalizedAngleDiff * STEERING_SPEED * (1 / (1 + speedFactor * 0.5));

    // Clamp steering angle
    const clampedSteering = Math.max(
      -MAX_STEERING_ANGLE,
      Math.min(MAX_STEERING_ANGLE, steeringAngle),
    );

    // Apply rotation around rear axle
    Matter.Body.setAngularVelocity(car, clampedSteering);

    // Drift mechanics - if turning too fast, reduce lateral grip
    const lateralVelocityX = car.velocity.x - carForwardX * speed;
    const lateralVelocityY = car.velocity.y - carForwardY * speed;
    const lateralSpeed = Math.sqrt(lateralVelocityX ** 2 + lateralVelocityY ** 2);

    // Determine if car is drifting
    const isDrifting = speed > DRIFT_THRESHOLD && Math.abs(normalizedAngleDiff) > 0.3;
    const frictionFactor = isDrifting ? DRIFT_FRICTION : NORMAL_FRICTION;

    // Apply lateral friction to simulate tire grip/slip
    if (lateralSpeed > 0.1) {
      const frictionX = -lateralVelocityX * (1 - frictionFactor);
      const frictionY = -lateralVelocityY * (1 - frictionFactor);
      Matter.Body.setVelocity(car, {
        x: car.velocity.x + frictionX,
        y: car.velocity.y + frictionY,
      });
    }
  }

  // Apply passive friction to slow down over time
  const passiveFriction = 0.99;

  Matter.Body.setVelocity(car, {
    x: car.velocity.x * passiveFriction,
    y: car.velocity.y * passiveFriction,
  });
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
