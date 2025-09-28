/**
 * Purpose: React context for oscilloscope state management and prop drilling reduction
 * Scope: Demo feature oscilloscope data and control methods context provider
 * Overview: Provides a centralized context for oscilloscope state, stats, data buffer,
 *     and control methods to avoid prop drilling through multiple component layers.
 *     Allows child components to access oscilloscope functionality via useOscilloscopeContext hook.
 * Dependencies: React context API, useOscilloscope hook, oscilloscope types
 * Exports: OscilloscopeProvider component and useOscilloscopeContext hook
 * Interfaces: OscilloscopeContextType for context value shape
 * Implementation: Context pattern with provider wrapper and custom hook for consumption
 */

import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useOscilloscope } from '../hooks/useOscilloscope';
import type { OscilloscopeContextType } from '../types/context.types';
import { OscilloscopeContext } from './context';

interface OscilloscopeProviderProps {
  children: ReactNode;
}

export const OscilloscopeProvider: React.FC<OscilloscopeProviderProps> = ({
  children,
}) => {
  const oscilloscope = useOscilloscope();

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<OscilloscopeContextType>(
    () => ({
      state: oscilloscope.state,
      stats: oscilloscope.stats,
      dataBuffer: oscilloscope.dataBuffer,
      error: oscilloscope.error,
      startStreaming: oscilloscope.startStreaming,
      stopStreaming: oscilloscope.stopStreaming,
      updateWaveform: oscilloscope.updateWaveform,
      updateFrequency: oscilloscope.updateFrequency,
      updateAmplitude: oscilloscope.updateAmplitude,
      updateOffset: oscilloscope.updateOffset,
      updateTimeScale: oscilloscope.updateTimeScale,
      updateVoltScale: oscilloscope.updateVoltScale,
      updateTriggerLevel: oscilloscope.updateTriggerLevel,
      togglePause: oscilloscope.togglePause,
      clearBuffer: oscilloscope.clearBuffer,
      resetToDefaults: oscilloscope.resetToDefaults,
    }),
    [
      oscilloscope.state,
      oscilloscope.stats,
      oscilloscope.dataBuffer,
      oscilloscope.error,
      oscilloscope.startStreaming,
      oscilloscope.stopStreaming,
      oscilloscope.updateWaveform,
      oscilloscope.updateFrequency,
      oscilloscope.updateAmplitude,
      oscilloscope.updateOffset,
      oscilloscope.updateTimeScale,
      oscilloscope.updateVoltScale,
      oscilloscope.updateTriggerLevel,
      oscilloscope.togglePause,
      oscilloscope.clearBuffer,
      oscilloscope.resetToDefaults,
    ],
  );

  return (
    <OscilloscopeContext.Provider value={contextValue}>
      {children}
    </OscilloscopeContext.Provider>
  );
};
