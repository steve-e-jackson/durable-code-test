/**
 * Purpose: React context creation for oscilloscope state management
 * Scope: Context definition for demo feature state sharing
 * Overview: Creates the React context instance for oscilloscope state and methods.
 *     Provides the base context that components can consume via useContext or
 *     the custom useOscilloscopeContext hook.
 * Dependencies: React context API, OscilloscopeContextType interface
 * Exports: OscilloscopeContext for provider and consumer usage
 * Interfaces: Uses OscilloscopeContextType for type safety
 * Implementation: Simple context creation with null default value
 */

import { createContext } from 'react';
import type { OscilloscopeContextType } from '../types/context.types';

export const OscilloscopeContext = createContext<OscilloscopeContextType | null>(null);
