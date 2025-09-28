/**
 * Purpose: Custom hook for consuming oscilloscope context with error handling
 * Scope: Demo feature context consumer hook for accessing oscilloscope state and methods
 * Overview: Provides a type-safe hook for consuming the OscilloscopeContext with proper
 *     error handling when used outside the provider. Ensures components access context
 *     data consistently and safely throughout the oscilloscope demo feature.
 * Dependencies: React context API, OscilloscopeContext provider, context types
 * Exports: useOscilloscopeContext hook for context consumption
 * Interfaces: Uses OscilloscopeContextType for return type safety
 * Implementation: Simple context consumer hook with provider validation
 */

import { useContext } from 'react';
import { OscilloscopeContext } from '../contexts/context';
import type { OscilloscopeContextType } from '../types/context.types';

export const useOscilloscopeContext = (): OscilloscopeContextType => {
  const context = useContext(OscilloscopeContext);

  if (!context) {
    throw new Error('useOscilloscopeContext must be used within OscilloscopeProvider');
  }

  return context;
};
