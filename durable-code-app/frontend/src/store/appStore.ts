/**
 * Purpose: Global application state management using Zustand for theme, loading, and error states
 * Scope: Centralized state store for application-wide UI state and user preferences
 * Overview: This module provides a lightweight global state store using Zustand for managing
 *     application-wide state including theme preferences (light/dark mode), loading indicators,
 *     and error states. The store is designed to be simple and performant, avoiding unnecessary
 *     complexity while providing reactive state updates throughout the application. It includes
 *     developer tools integration for debugging and state inspection during development.
 * Dependencies: Zustand for state management, zustand/middleware for devtools integration
 * Exports: useAppStore hook for accessing and updating global application state
 * Props/Interfaces: AppState interface defining theme, loading, and error state properties
 * State/Behavior: Reactive state store with actions for theme switching, loading control, and error handling
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  theme: 'light' | 'dark';
  isLoading: boolean;
  error: string | null;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      theme: 'light',
      isLoading: false,
      error: null,
      setTheme: (theme) => set({ theme }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    { name: 'app-store' },
  ),
);
