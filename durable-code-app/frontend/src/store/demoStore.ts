/**
 * Purpose: Oscilloscope demo state management for WebSocket connection and waveform data
 * Scope: Demo feature state including WebSocket connection, waveform data, and oscilloscope parameters
 * Overview: This Zustand store manages the state for the oscilloscope demonstration feature,
 *     handling WebSocket connection status, real-time waveform data, and oscilloscope parameters
 *     like amplitude and frequency. The store provides reactive state updates for the demo
 *     components and maintains connection state throughout the user session. It includes
 *     actions for connecting/disconnecting, updating waveform data, and resetting demo state.
 * Dependencies: Zustand for state management, zustand/middleware for devtools integration
 * Exports: useDemoStore hook for accessing and updating demo state
 * Props/Interfaces: WaveformPoint for data points, DemoState for complete store interface
 * State/Behavior: Reactive store with WebSocket connection management and real-time data updates
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface WaveformPoint {
  x: number;
  y: number;
}

interface DemoState {
  // WebSocket connection state
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  socket: WebSocket | null;

  // Oscilloscope data
  waveformData: WaveformPoint[];
  amplitude: number;
  frequency: number;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnectionStatus: (
    status: 'disconnected' | 'connecting' | 'connected' | 'error',
  ) => void;
  setSocket: (socket: WebSocket | null) => void;
  setWaveformData: (data: WaveformPoint[]) => void;
  setAmplitude: (amplitude: number) => void;
  setFrequency: (frequency: number) => void;
  reset: () => void;
}

export const useDemoStore = create<DemoState>()(
  devtools(
    (set) => ({
      // Initial state
      isConnected: false,
      connectionStatus: 'disconnected',
      socket: null,
      waveformData: [],
      amplitude: 1.0,
      frequency: 1.0,

      // Actions
      setConnected: (isConnected) => set({ isConnected }),
      setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
      setSocket: (socket) => set({ socket }),
      setWaveformData: (waveformData) => set({ waveformData }),
      setAmplitude: (amplitude) => set({ amplitude }),
      setFrequency: (frequency) => set({ frequency }),
      reset: () =>
        set({
          isConnected: false,
          connectionStatus: 'disconnected',
          socket: null,
          waveformData: [],
          amplitude: 1.0,
          frequency: 1.0,
        }),
    }),
    { name: 'demo-store' },
  ),
);
