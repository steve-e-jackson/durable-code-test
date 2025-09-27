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
  isNavigating: boolean;
  setActiveTab: (tab: TabName) => void;
  navigateBack: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      activeTab: 'Repository',
      tabHistory: [],
      isNavigating: false,
      setActiveTab: (tab) => {
        const state = get();

        // Prevent duplicate navigation and race conditions
        if (state.activeTab === tab || state.isNavigating) {
          return;
        }

        // Atomic update with navigation lock
        set({
          activeTab: tab,
          tabHistory: [...state.tabHistory, tab],
          isNavigating: true,
        });

        // Update browser history after state
        window.history.pushState(null, '', `#${tab}`);

        // Release navigation lock after microtask
        Promise.resolve().then(() => {
          set({ isNavigating: false });
        });
      },
      navigateBack: () => {
        const state = get();

        // Prevent navigation during active navigation
        if (state.isNavigating || state.tabHistory.length <= 1) {
          return;
        }

        const newHistory = [...state.tabHistory];
        newHistory.pop();
        const previousTab = newHistory[newHistory.length - 1] || 'Repository';

        // Atomic update with navigation lock
        set({
          activeTab: previousTab,
          tabHistory: newHistory,
          isNavigating: true,
        });

        // Update browser history after state
        window.history.pushState(null, '', `#${previousTab}`);

        // Release navigation lock after microtask
        Promise.resolve().then(() => {
          set({ isNavigating: false });
        });
      },
    }),
    { name: 'navigation-store' },
  ),
);
