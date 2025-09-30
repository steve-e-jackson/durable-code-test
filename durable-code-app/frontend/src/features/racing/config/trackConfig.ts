/**
 * Purpose: Track generation configuration
 * Scope: Default parameters for procedural track generation
 * Overview: Centralized configuration for track generation settings
 * Dependencies: None
 * Exports: DEFAULT_TRACK_PARAMS constant
 * Implementation: Configuration object with tuned parameters
 */

export interface TrackGenerationConfig {
  numPoints: number;
  variationAmount: number;
  hairpinChance: number;
  hairpinIntensity: number;
  smoothingPasses: number;
  trackWidth: number;
}

/**
 * Default track generation parameters
 * These values have been tuned to create interesting, windy tracks
 */
export const DEFAULT_TRACK_PARAMS: TrackGenerationConfig = {
  numPoints: 16, // Number of control points around the track
  variationAmount: 0.22, // Radius variation (0-1, higher = more windy)
  hairpinChance: 0.2, // Probability of dramatic curves (0-1)
  hairpinIntensity: 2.5, // Multiplier for hairpin variations (1-5)
  smoothingPasses: 2, // Number of smoothing iterations (0-5)
  trackWidth: 100, // Width of the racing surface in pixels
};
