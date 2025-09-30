/**
 * Purpose: Track rendering utilities for racing game
 * Scope: Visual rendering of track boundaries, surface, and decorations
 * Overview: Provides functions to render tracks with smooth curves and visual enhancements
 * Dependencies: Canvas 2D context, racing types
 * Exports: Track rendering functions
 * Implementation: Canvas 2D rendering with smooth curves and visual effects
 */

import type { Point2D, Track } from '../types/racing.types';

// Rendering constants
const TRACK_SURFACE_COLOR = '#404040';
const TRACK_OUTER_WALL_COLOR = '#ff0000';
const TRACK_INNER_WALL_COLOR = '#ff0000';
const TRACK_LINE_WIDTH = 4;
const BACKGROUND_COLOR = '#2d5016';
const START_LINE_COLOR = '#ffffff';
const START_LINE_WIDTH = 6;

/**
 * Render the track background
 *
 * @param ctx Canvas rendering context
 * @param width Canvas width
 * @param height Canvas height
 */
export function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw a smooth curve through points
 *
 * @param ctx Canvas rendering context
 * @param points Array of points to connect
 * @param close Whether to close the path
 */
function drawSmoothCurve(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  close: boolean = true,
): void {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  // Use quadratic curves for smooth rendering
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }

  // Handle last segment
  if (close && points.length > 2) {
    const xc = (points[points.length - 1].x + points[0].x) / 2;
    const yc = (points[points.length - 1].y + points[0].y) / 2;
    ctx.quadraticCurveTo(
      points[points.length - 1].x,
      points[points.length - 1].y,
      xc,
      yc,
    );
    ctx.quadraticCurveTo(points[0].x, points[0].y, points[1].x, points[1].y);
  } else {
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  }

  if (close) {
    ctx.closePath();
  }
}

/**
 * Fill the track surface between boundaries
 *
 * @param ctx Canvas rendering context
 * @param outer Outer boundary points
 * @param inner Inner boundary points
 */
function fillTrackSurface(
  ctx: CanvasRenderingContext2D,
  outer: Point2D[],
  inner: Point2D[],
): void {
  ctx.fillStyle = TRACK_SURFACE_COLOR;

  ctx.beginPath();

  // Draw outer boundary
  ctx.moveTo(outer[0].x, outer[0].y);
  for (let i = 1; i < outer.length; i++) {
    ctx.lineTo(outer[i].x, outer[i].y);
  }
  ctx.closePath();

  // Draw inner boundary (reversed for proper filling)
  ctx.moveTo(inner[0].x, inner[0].y);
  for (let i = inner.length - 1; i >= 0; i--) {
    ctx.lineTo(inner[i].x, inner[i].y);
  }
  ctx.closePath();

  ctx.fill('evenodd');
}

/**
 * Draw track boundary lines
 *
 * @param ctx Canvas rendering context
 * @param outer Outer boundary points
 * @param inner Inner boundary points
 */
function drawTrackBoundaries(
  ctx: CanvasRenderingContext2D,
  outer: Point2D[],
  inner: Point2D[],
): void {
  // Draw outer boundary
  ctx.strokeStyle = TRACK_OUTER_WALL_COLOR;
  ctx.lineWidth = TRACK_LINE_WIDTH;
  drawSmoothCurve(ctx, outer, true);
  ctx.stroke();

  // Draw inner boundary
  ctx.strokeStyle = TRACK_INNER_WALL_COLOR;
  ctx.lineWidth = TRACK_LINE_WIDTH;
  drawSmoothCurve(ctx, inner, true);
  ctx.stroke();
}

/**
 * Draw start/finish line
 *
 * @param ctx Canvas rendering context
 * @param track Track data
 */
function drawStartLine(ctx: CanvasRenderingContext2D, track: Track): void {
  const { start_position } = track;
  const lineLength = track.track_width;

  ctx.strokeStyle = START_LINE_COLOR;
  ctx.lineWidth = START_LINE_WIDTH;
  ctx.setLineDash([10, 5]);

  ctx.beginPath();
  ctx.moveTo(start_position.x - lineLength / 2, start_position.y);
  ctx.lineTo(start_position.x + lineLength / 2, start_position.y);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * Render the complete track
 *
 * @param ctx Canvas rendering context
 * @param track Track data to render
 */
export function renderTrack(ctx: CanvasRenderingContext2D, track: Track): void {
  const { boundaries } = track;

  // Fill track surface
  fillTrackSurface(ctx, boundaries.outer, boundaries.inner);

  // Draw boundaries
  drawTrackBoundaries(ctx, boundaries.outer, boundaries.inner);

  // Draw start line
  drawStartLine(ctx, track);
}

/**
 * Render car on the track with character and style
 *
 * @param ctx Canvas rendering context
 * @param x Car X position
 * @param y Car Y position
 * @param angle Car angle in radians
 * @param speed Optional speed for visual effects
 */
export function renderCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  speed: number = 0,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Car dimensions
  const carLength = 30;
  const carWidth = 20;

  // Draw shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(-carLength / 2 + 2, -carWidth / 2 + 2, carLength, carWidth);

  // Draw car body with gradient
  const gradient = ctx.createLinearGradient(0, -carWidth / 2, 0, carWidth / 2);
  gradient.addColorStop(0, '#ff4444');
  gradient.addColorStop(0.5, '#cc0000');
  gradient.addColorStop(1, '#990000');
  ctx.fillStyle = gradient;

  // Rounded car body
  ctx.beginPath();
  ctx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, 4);
  ctx.fill();

  // Car outline
  ctx.strokeStyle = '#330000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Windshield
  ctx.fillStyle = 'rgba(100, 150, 200, 0.6)';
  ctx.beginPath();
  ctx.roundRect(-carLength / 4, -carWidth / 3, carLength / 3, carWidth * 0.66, 2);
  ctx.fill();

  // Racing stripes for character
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-carLength / 2 + 5, -2);
  ctx.lineTo(carLength / 2 - 5, -2);
  ctx.moveTo(-carLength / 2 + 5, 2);
  ctx.lineTo(carLength / 2 - 5, 2);
  ctx.stroke();

  // Front wheels
  ctx.fillStyle = '#222222';
  ctx.fillRect(carLength / 2 - 8, -carWidth / 2 - 2, 6, 3);
  ctx.fillRect(carLength / 2 - 8, carWidth / 2 - 1, 6, 3);

  // Rear wheels
  ctx.fillRect(-carLength / 2 + 2, -carWidth / 2 - 2, 6, 3);
  ctx.fillRect(-carLength / 2 + 2, carWidth / 2 - 1, 6, 3);

  // Headlights
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(carLength / 2 - 2, -carWidth / 3, 2, 0, Math.PI * 2);
  ctx.arc(carLength / 2 - 2, carWidth / 3, 2, 0, Math.PI * 2);
  ctx.fill();

  // Speed lines effect when moving fast
  if (speed > 2) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(0.5, speed / 10)})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const offset = -carLength / 2 - 10 - i * 5;
      ctx.beginPath();
      ctx.moveTo(offset, -5);
      ctx.lineTo(offset - 8, -5);
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset - 8, 0);
      ctx.moveTo(offset, 5);
      ctx.lineTo(offset - 8, 5);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Render debug information
 *
 * @param ctx Canvas rendering context
 * @param speed Current speed
 * @param position Car position
 */
export function renderDebugInfo(
  ctx: CanvasRenderingContext2D,
  speed: number,
  position: { x: number; y: number },
): void {
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText(`Speed: ${speed.toFixed(2)}`, 10, 20);
  ctx.fillText(
    `Position: (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`,
    10,
    40,
  );
}
