/**
 * Purpose: Centralized store exports for simplified import across the application
 * Scope: Barrel exports for all Zustand stores and state management hooks
 * Overview: This module provides a centralized export point for all application stores,
 *     simplifying imports throughout the codebase and providing a clean interface to
 *     the state management layer. It aggregates all Zustand stores including application
 *     state, navigation state, and demo state, allowing components to import stores
 *     from a single location rather than individual store files.
 * Dependencies: Individual store modules (appStore, navigationStore, demoStore)
 * Exports: useAppStore, useNavigationStore, useDemoStore hooks
 * Props/Interfaces: Re-exports store interfaces and types from individual modules
 * State/Behavior: Provides access to all application state management hooks
 */

export { useAppStore } from './appStore';
export { useNavigationStore } from './navigationStore';
export { useDemoStore } from './demoStore';
