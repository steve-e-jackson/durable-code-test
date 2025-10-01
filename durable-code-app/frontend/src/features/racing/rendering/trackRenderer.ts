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
const BACKGROUND_COLOR = '#2d7a1f'; // Bright grass green
const GRASS_DARK = '#247018'; // Darker grass for stripes
const START_LINE_COLOR = '#ffffff';
const START_LINE_WIDTH = 6;
const BLEACHER_COLOR = '#8B4513'; // Brown for wooden bleachers
const BLEACHER_SEAT_COLOR = '#A0522D';

// Enhanced decorative element constants
const TREE_TRUNK_COLOR = '#8B4513';
const TREE_CROWN_COLOR = '#228B22';
const TREE_CROWN_HIGHLIGHT = '#32CD32';
const PALM_TRUNK_COLOR = '#8B7355';
const PALM_FROND_COLOR = '#228B22';
const BUILDING_COLOR = '#C0C0C0';
const BUILDING_WINDOW_COLOR = '#4A90E2';
const TIRE_WALL_COLOR = '#1a1a1a';
const KERB_RED = '#E63946';
const KERB_WHITE = '#F1F1F1';
const GRAVEL_COLOR = '#D2B48C';
const BARRIER_COLOR = '#DC143C';

/**
 * Render the track background with grass pattern
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
  // Base grass color
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Add grass stripes for texture
  ctx.fillStyle = GRASS_DARK;
  const stripeWidth = 40;
  for (let x = 0; x < width; x += stripeWidth * 2) {
    ctx.fillRect(x, 0, stripeWidth, height);
  }

  // Add subtle texture overlay
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? GRASS_DARK : BACKGROUND_COLOR;
    ctx.fillRect(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 5,
      Math.random() * 5,
    );
  }
  ctx.globalAlpha = 1.0;
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

  // For circular tracks, make the finish line vertical (perpendicular to horizontal)
  const lineAngle = Math.PI / 2; // Vertical line (90 degrees)

  // Calculate line endpoints perpendicular to track direction
  const halfLength = lineLength / 2;
  const x1 = start_position.x + Math.cos(lineAngle) * halfLength;
  const y1 = start_position.y + Math.sin(lineAngle) * halfLength;
  const x2 = start_position.x - Math.cos(lineAngle) * halfLength;
  const y2 = start_position.y - Math.sin(lineAngle) * halfLength;

  ctx.strokeStyle = START_LINE_COLOR;
  ctx.lineWidth = START_LINE_WIDTH;
  ctx.setLineDash([10, 5]);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * Draw a palm tree decoration
 *
 * @param ctx Canvas rendering context
 * @param x X position
 * @param y Y position
 */
function drawPalmTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  // Palm trunk
  ctx.fillStyle = PALM_TRUNK_COLOR;
  ctx.fillRect(-4, -30, 8, 30);

  // Palm fronds
  ctx.fillStyle = PALM_FROND_COLOR;
  for (let i = 0; i < 6; i++) {
    ctx.save();
    ctx.rotate((Math.PI * 2 * i) / 6);
    ctx.beginPath();
    ctx.ellipse(0, -35, 8, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draw a regular tree decoration
 *
 * @param ctx Canvas rendering context
 * @param x X position
 * @param y Y position
 */
function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  // Trunk
  ctx.fillStyle = TREE_TRUNK_COLOR;
  ctx.fillRect(-3, -20, 6, 20);

  // Crown (foliage)
  ctx.fillStyle = TREE_CROWN_COLOR;
  ctx.beginPath();
  ctx.arc(0, -25, 15, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = TREE_CROWN_HIGHLIGHT;
  ctx.beginPath();
  ctx.arc(-5, -28, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw a building decoration
 *
 * @param ctx Canvas rendering context
 * @param x X position
 * @param y Y position
 * @param width Building width
 * @param height Building height
 */
function drawBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.save();

  // Building body
  ctx.fillStyle = BUILDING_COLOR;
  ctx.fillRect(x, y - height, width, height);

  // Windows
  ctx.fillStyle = BUILDING_WINDOW_COLOR;
  const windowRows = Math.floor(height / 15);
  const windowCols = Math.floor(width / 15);

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      ctx.fillRect(x + col * 15 + 3, y - height + row * 15 + 3, 8, 8);
    }
  }

  // Building outline
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y - height, width, height);

  ctx.restore();
}

/**
 * Draw tire wall barriers
 *
 * @param ctx Canvas rendering context
 * @param x X position
 * @param y Y position
 * @param count Number of tires
 */
function drawTireWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
): void {
  ctx.save();
  ctx.fillStyle = TIRE_WALL_COLOR;
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;

  for (let i = 0; i < count; i++) {
    const tireX = x + i * 12;
    ctx.beginPath();
    ctx.arc(tireX, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner circle
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(tireX, y, 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw racing kerbs (red and white striped curbs)
 *
 * @param ctx Canvas rendering context
 * @param points Boundary points to draw kerbs along
 * @param offset Offset from boundary
 */
function drawKerbs(
  ctx: CanvasRenderingContext2D,
  points: Point2D[],
  offset: number,
): void {
  const kerbWidth = 8;
  const stripeLength = 20;

  for (let i = 0; i < points.length; i += Math.floor(stripeLength / 2)) {
    const point = points[i];
    const nextPoint = points[(i + 1) % points.length];

    // Calculate normal direction
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const normalX = (-dy / length) * offset;
      const normalY = (dx / length) * offset;

      // Alternate red and white
      ctx.fillStyle = i % (stripeLength * 2) < stripeLength ? KERB_RED : KERB_WHITE;

      const kerbX = point.x + normalX;
      const kerbY = point.y + normalY;

      ctx.fillRect(kerbX - kerbWidth / 2, kerbY - kerbWidth / 2, kerbWidth, kerbWidth);
    }
  }
}

/**
 * Draw gravel trap run-off areas
 *
 * @param ctx Canvas rendering context
 * @param outer Outer boundary points
 */
function drawGravelTraps(ctx: CanvasRenderingContext2D, outer: Point2D[]): void {
  ctx.fillStyle = GRAVEL_COLOR;
  ctx.globalAlpha = 0.7;

  // Draw gravel areas at key points around the track
  const gravelInterval = Math.floor(outer.length / 8);

  for (let i = 0; i < outer.length; i += gravelInterval) {
    const point = outer[i];
    const nextPoint = outer[(i + 1) % outer.length];

    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const normalX = (-dy / length) * 25;
      const normalY = (dx / length) * 25;

      ctx.beginPath();
      ctx.arc(point.x + normalX, point.y + normalY, 20, 0, Math.PI * 2);
      ctx.fill();

      // Add texture
      for (let j = 0; j < 15; j++) {
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        ctx.fillRect(point.x + normalX + offsetX, point.y + normalY + offsetY, 2, 2);
      }
    }
  }

  ctx.globalAlpha = 1.0;
}

/**
 * Draw decorative barriers along outer boundary
 *
 * @param ctx Canvas rendering context
 * @param outer Outer boundary points
 */
function drawBarriers(ctx: CanvasRenderingContext2D, outer: Point2D[]): void {
  ctx.strokeStyle = BARRIER_COLOR;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);

  ctx.beginPath();
  for (let i = 0; i < outer.length; i++) {
    const point = outer[i];
    const nextPoint = outer[(i + 1) % outer.length];

    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const normalX = (-dy / length) * 15;
      const normalY = (dx / length) * 15;

      if (i === 0) {
        ctx.moveTo(point.x + normalX, point.y + normalY);
      } else {
        ctx.lineTo(point.x + normalX, point.y + normalY);
      }
    }
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Draw environmental decorations (trees, buildings, etc)
 *
 * @param ctx Canvas rendering context
 * @param outer Outer boundary points
 */
function drawEnvironmentalDecorations(
  ctx: CanvasRenderingContext2D,
  outer: Point2D[],
): void {
  const decorationInterval = Math.floor(outer.length / 16);

  for (let i = 0; i < outer.length; i += decorationInterval) {
    const point = outer[i];
    const nextPoint = outer[(i + 1) % outer.length];

    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      const normalX = (-dy / length) * 50;
      const normalY = (dx / length) * 50;

      const decorX = point.x + normalX;
      const decorY = point.y + normalY;

      // Vary decorations based on position
      const decorType = i % 4;

      if (decorType === 0) {
        // Palm tree
        drawPalmTree(ctx, decorX, decorY);
      } else if (decorType === 1) {
        // Regular tree
        drawTree(ctx, decorX, decorY);
      } else if (decorType === 2) {
        // Small building
        drawBuilding(ctx, decorX - 15, decorY, 30, 40);
      } else {
        // Tire wall
        drawTireWall(ctx, decorX - 18, decorY, 3);
      }
    }
  }
}

/**
 * Draw bleachers around the track
 *
 * @param ctx Canvas rendering context
 * @param outer Outer boundary points
 */
function drawBleachers(ctx: CanvasRenderingContext2D, outer: Point2D[]): void {
  const bleacherDistance = 40; // Distance from track edge
  const seatHeight = 8;
  const numSeats = 3;

  // Sample points around the track for bleacher placement
  const bleacherInterval = Math.floor(outer.length / 12); // Place bleachers at 12 locations

  for (let i = 0; i < outer.length; i += bleacherInterval) {
    const point = outer[i];
    const nextPoint = outer[(i + 1) % outer.length];

    // Calculate normal (perpendicular) direction pointing outward
    const dx = nextPoint.x - point.x;
    const dy = nextPoint.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) continue;

    const normalX = -dy / length;
    const normalY = dx / length;

    // Bleacher base position (outside the track)
    const baseX = point.x + normalX * bleacherDistance;
    const baseY = point.y + normalY * bleacherDistance;

    // Draw bleacher structure
    ctx.save();
    ctx.translate(baseX, baseY);
    const angle = Math.atan2(dy, dx);
    ctx.rotate(angle + Math.PI / 2);

    // Draw bleacher rows
    for (let row = 0; row < numSeats; row++) {
      const rowY = row * seatHeight;

      // Bleacher seat
      ctx.fillStyle = BLEACHER_SEAT_COLOR;
      ctx.fillRect(-15, rowY, 30, seatHeight);

      // Bleacher support
      ctx.fillStyle = BLEACHER_COLOR;
      ctx.fillRect(-15, rowY + seatHeight - 2, 30, 2);
    }

    ctx.restore();
  }
}

/**
 * Render the complete track with enhanced decorations
 *
 * @param ctx Canvas rendering context
 * @param track Track data to render
 */
export function renderTrack(ctx: CanvasRenderingContext2D, track: Track): void {
  const { boundaries } = track;

  // Layer 1: Gravel traps and run-off areas (furthest back)
  drawGravelTraps(ctx, boundaries.outer);

  // Layer 2: Environmental decorations (trees, buildings)
  drawEnvironmentalDecorations(ctx, boundaries.outer);

  // Layer 3: Bleachers (behind track)
  drawBleachers(ctx, boundaries.outer);

  // Layer 4: Barriers outside track
  drawBarriers(ctx, boundaries.outer);

  // Layer 5: Track surface
  fillTrackSurface(ctx, boundaries.outer, boundaries.inner);

  // Layer 6: Kerbs along boundaries
  drawKerbs(ctx, boundaries.outer, 5);
  drawKerbs(ctx, boundaries.inner, -5);

  // Layer 7: Track boundaries
  drawTrackBoundaries(ctx, boundaries.outer, boundaries.inner);

  // Layer 8: Start/finish line
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
