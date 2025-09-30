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
 * Render car on the track
 *
 * @param ctx Canvas rendering context
 * @param x Car X position
 * @param y Car Y position
 * @param angle Car angle in radians
 */
export function renderCar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Draw car body
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(-15, -10, 30, 20);

  // Draw car outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(-15, -10, 30, 20);

  // Draw direction indicator
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(5, -5);
  ctx.lineTo(5, 5);
  ctx.closePath();
  ctx.fill();

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
