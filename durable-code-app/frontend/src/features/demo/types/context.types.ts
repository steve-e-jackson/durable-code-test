/**
 * Purpose: Type definitions for oscilloscope context and related interfaces
 * Scope: Type definitions for demo feature context providers and consumers
 * Overview: Provides TypeScript type definitions for the OscilloscopeContext,
 *     including the comprehensive context type interface and related provider props.
 *     Centralizes all context-related types for better type safety and reusability.
 * Dependencies: Oscilloscope types for state, stats, and waveform definitions
 * Exports: OscilloscopeContextType interface and provider props types
 * Interfaces: Complete type definitions for context value and provider configuration
 * Implementation: Pure TypeScript type definitions with no runtime code
 */

import type {
  OscilloscopeState,
  OscilloscopeStats,
  WaveType,
} from './oscilloscope.types';

export interface OscilloscopeContextType {
  state: OscilloscopeState;
  stats: OscilloscopeStats;
  dataBuffer: Float32Array;
  error: Error | null;
  startStreaming: () => void;
  stopStreaming: () => void;
  updateWaveform: (waveform: WaveType) => void;
  updateFrequency: (frequency: number) => void;
  updateAmplitude: (amplitude: number) => void;
  updateOffset: (offset: number) => void;
  updateTimeScale: (timeScale: number) => void;
  updateVoltScale: (voltScale: number) => void;
  updateTriggerLevel: (triggerLevel: number) => void;
  togglePause: () => void;
  clearBuffer: () => void;
  resetToDefaults: () => void;
}
