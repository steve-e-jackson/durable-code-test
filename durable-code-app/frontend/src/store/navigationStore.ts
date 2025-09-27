/**
 * Purpose: Navigation state management for tab-based application navigation
 * Scope: Application navigation state including active tab, navigation history, and routing
 * Overview: This Zustand store manages the navigation state for the tab-based application
 *     interface, tracking the currently active tab, maintaining navigation history for
 *     back navigation, and synchronizing with browser history state. The store provides
 *     seamless navigation between different application sections including Repository,
 *     Planning, Building, Quality Assurance, Maintenance, Demo, and Journey tabs.
 * Dependencies: Zustand for state management, zustand/middleware for devtools integration
 * Exports: useNavigationStore hook, TabName type for tab identifiers
 * Props/Interfaces: NavigationState interface with tab management and history navigation
 * State/Behavior: Stateful navigation with history tracking and browser history integration
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type TabName =
  | 'Repository'
  | 'Planning'
  | 'Building'
  | 'Quality Assurance'
  | 'Maintenance'
  | 'Demo'
  | 'Journey';

interface NavigationState {
  activeTab: TabName;
  tabHistory: TabName[];
  setActiveTab: (tab: TabName) => void;
  navigateBack: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      activeTab: 'Repository',
      tabHistory: [],
      setActiveTab: (tab) => {
        const { tabHistory } = get();
        set({
          activeTab: tab,
          tabHistory: [...tabHistory, tab],
        });
        window.history.pushState(null, '', `#${tab}`);
      },
      navigateBack: () => {
        const { tabHistory } = get();
        if (tabHistory.length > 1) {
          const newHistory = [...tabHistory];
          newHistory.pop();
          const previousTab = newHistory[newHistory.length - 1] || 'Repository';
          set({
            activeTab: previousTab,
            tabHistory: newHistory,
          });
          window.history.pushState(null, '', `#${previousTab}`);
        }
      },
    }),
    { name: 'navigation-store' },
  ),
);
