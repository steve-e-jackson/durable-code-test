import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useNavigationStore } from './navigationStore';
import type { TabName } from './navigationStore';

// Mock window.history.pushState
const mockPushState = vi.fn();
Object.defineProperty(window, 'history', {
  value: {
    pushState: mockPushState,
  },
  writable: true,
});

describe('Navigation Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNavigationStore.setState({
      activeTab: 'Repository',
      tabHistory: [],
      isNavigating: false,
    });
    mockPushState.mockClear();

    // Mock window.location.hash
    Object.defineProperty(window, 'location', {
      value: {
        hash: '',
      },
      writable: true,
      configurable: true,
    });
  });

  describe('Basic Navigation', () => {
    it('should initialize with Repository tab', () => {
      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('Repository');
      expect(state.tabHistory).toEqual([]);
      expect(state.isNavigating).toBe(false);
    });

    it('should navigate to a new tab', async () => {
      const store = useNavigationStore.getState();

      act(() => {
        store.setActiveTab('Planning');
      });

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('Planning');
      expect(state.tabHistory).toEqual(['Planning']);
      expect(mockPushState).toHaveBeenCalledWith(null, '', '#Planning');
    });

    it('should update tab history correctly', async () => {
      const store = useNavigationStore.getState();

      act(() => {
        store.setActiveTab('Planning');
      });

      // Wait for navigation lock to release
      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        store.setActiveTab('Building');
      });

      await act(async () => {
        await Promise.resolve();
      });

      const state = useNavigationStore.getState();
      expect(state.tabHistory).toEqual(['Planning', 'Building']);
    });
  });

  describe('Race Condition Prevention', () => {
    it('should prevent duplicate navigation to the same tab', async () => {
      const store = useNavigationStore.getState();

      // Rapid navigation attempts to the same tab
      act(() => {
        store.setActiveTab('Planning');
        store.setActiveTab('Planning');
        store.setActiveTab('Planning');
      });

      const state = useNavigationStore.getState();

      // Should only navigate once
      expect(state.tabHistory.filter((t) => t === 'Planning').length).toBe(1);
      expect(state.activeTab).toBe('Planning');
      expect(mockPushState).toHaveBeenCalledTimes(1);
    });

    it('should prevent navigation during active navigation', async () => {
      const store = useNavigationStore.getState();

      // Start navigation to Planning
      act(() => {
        store.setActiveTab('Planning');
      });

      // Immediately try to navigate to Building while isNavigating is true
      const stateWhileNavigating = useNavigationStore.getState();
      expect(stateWhileNavigating.isNavigating).toBe(true);

      act(() => {
        store.setActiveTab('Building');
      });

      // Building navigation should be ignored
      expect(stateWhileNavigating.activeTab).toBe('Planning');
      expect(stateWhileNavigating.tabHistory).toEqual(['Planning']);

      // Wait for navigation lock to release
      await act(async () => {
        await Promise.resolve();
      });

      const finalState = useNavigationStore.getState();
      expect(finalState.isNavigating).toBe(false);

      // Now navigation should work
      act(() => {
        store.setActiveTab('Building');
      });

      const afterSecondNav = useNavigationStore.getState();
      expect(afterSecondNav.activeTab).toBe('Building');
      expect(afterSecondNav.tabHistory).toEqual(['Planning', 'Building']);
    });

    it('should maintain state-history sync', async () => {
      const store = useNavigationStore.getState();

      act(() => {
        store.setActiveTab('Building');
      });

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('Building');
      expect(mockPushState).toHaveBeenCalledWith(null, '', '#Building');
      // The actual browser hash would be updated by pushState in a real environment
      // We're testing that pushState was called with the correct arguments
    });

    it('should handle rapid sequential navigation correctly', async () => {
      const store = useNavigationStore.getState();
      const tabs: TabName[] = ['Planning', 'Building', 'Quality Assurance', 'Demo'];

      // Navigate through tabs with proper timing
      for (const tab of tabs) {
        act(() => {
          store.setActiveTab(tab);
        });

        // Wait for navigation lock to release
        await act(async () => {
          await Promise.resolve();
        });
      }

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('Demo');
      expect(state.tabHistory).toEqual(tabs);
      expect(state.isNavigating).toBe(false);
      expect(mockPushState).toHaveBeenCalledTimes(tabs.length);
    });
  });

  describe('Navigate Back', () => {
    beforeEach(async () => {
      const store = useNavigationStore.getState();

      // Setup navigation history
      act(() => {
        store.setActiveTab('Planning');
      });

      await act(async () => {
        await Promise.resolve();
      });

      act(() => {
        store.setActiveTab('Building');
      });

      await act(async () => {
        await Promise.resolve();
      });

      mockPushState.mockClear();
    });

    it('should navigate back to previous tab', async () => {
      const store = useNavigationStore.getState();

      act(() => {
        store.navigateBack();
      });

      await act(async () => {
        await Promise.resolve();
      });

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('Planning');
      expect(state.tabHistory).toEqual(['Planning']);
      expect(mockPushState).toHaveBeenCalledWith(null, '', '#Planning');
    });

    it('should not navigate back if only one tab in history', async () => {
      const store = useNavigationStore.getState();

      // Navigate back twice to leave only one tab
      act(() => {
        store.navigateBack();
      });

      await act(async () => {
        await Promise.resolve();
      });

      mockPushState.mockClear();

      // Try to navigate back again
      act(() => {
        store.navigateBack();
      });

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('Planning');
      expect(state.tabHistory).toEqual(['Planning']);
      expect(mockPushState).not.toHaveBeenCalled();
    });

    it('should prevent navigate back during active navigation', async () => {
      const store = useNavigationStore.getState();

      // Start navigation
      act(() => {
        store.setActiveTab('Demo');
      });

      // Immediately try to navigate back while isNavigating is true
      act(() => {
        store.navigateBack();
      });

      const state = useNavigationStore.getState();
      // Should be on Demo, not navigated back
      expect(state.activeTab).toBe('Demo');
      expect(state.tabHistory).toContain('Demo');
    });

    it('should handle empty history gracefully', () => {
      // Reset to empty history
      useNavigationStore.setState({
        activeTab: 'Repository',
        tabHistory: [],
        isNavigating: false,
      });

      const store = useNavigationStore.getState();

      act(() => {
        store.navigateBack();
      });

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('Repository');
      expect(state.tabHistory).toEqual([]);
      expect(mockPushState).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Lock Management', () => {
    it('should acquire and release navigation lock correctly', async () => {
      const store = useNavigationStore.getState();

      act(() => {
        store.setActiveTab('Planning');
      });

      // Check lock is acquired
      let state = useNavigationStore.getState();
      expect(state.isNavigating).toBe(true);

      // Wait for lock to be released
      await act(async () => {
        await Promise.resolve();
      });

      // Check lock is released
      state = useNavigationStore.getState();
      expect(state.isNavigating).toBe(false);
    });

    it('should handle multiple navigation attempts with proper locking', async () => {
      const store = useNavigationStore.getState();
      const navigationAttempts: Set<string> = new Set();

      // Subscribe to state changes to track navigation
      const unsubscribe = useNavigationStore.subscribe((state) => {
        if (state.activeTab !== 'Repository' && !state.isNavigating) {
          navigationAttempts.add(state.activeTab);
        }
      });

      // Attempt multiple rapid navigations
      act(() => {
        store.setActiveTab('Planning');
        store.setActiveTab('Building'); // Should be ignored
        store.setActiveTab('Demo'); // Should be ignored
      });

      await act(async () => {
        await Promise.resolve();
      });

      // Only Planning should have been navigated to
      expect(Array.from(navigationAttempts)).toEqual(['Planning']);

      // Clear for next test
      navigationAttempts.clear();

      // Now subsequent navigations should work
      act(() => {
        store.setActiveTab('Building');
      });

      await act(async () => {
        await Promise.resolve();
      });

      expect(Array.from(navigationAttempts)).toEqual(['Building']);

      unsubscribe();
    });
  });

  describe('Edge Cases', () => {
    it('should handle navigation to current tab gracefully', () => {
      const store = useNavigationStore.getState();

      act(() => {
        store.setActiveTab('Repository');
      });

      const state = useNavigationStore.getState();
      expect(state.activeTab).toBe('Repository');
      expect(state.tabHistory).toEqual([]);
      expect(mockPushState).not.toHaveBeenCalled();
    });

    it('should handle all valid tab names', async () => {
      const store = useNavigationStore.getState();
      const validTabs: TabName[] = [
        'Repository',
        'Planning',
        'Building',
        'Quality Assurance',
        'Maintenance',
        'Demo',
        'Journey',
      ];

      for (const tab of validTabs) {
        useNavigationStore.setState({
          activeTab: 'Repository',
          tabHistory: [],
          isNavigating: false,
        });
        mockPushState.mockClear();

        act(() => {
          store.setActiveTab(tab);
        });

        await act(async () => {
          await Promise.resolve();
        });

        const state = useNavigationStore.getState();
        if (tab !== 'Repository') {
          expect(state.activeTab).toBe(tab);
          expect(state.tabHistory).toContain(tab);
          expect(mockPushState).toHaveBeenCalledWith(null, '', `#${tab}`);
        }
      }
    });
  });
});
