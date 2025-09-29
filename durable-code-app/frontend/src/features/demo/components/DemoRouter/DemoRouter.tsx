/**
 * Purpose: Router component for demo sub-navigation
 * Scope: Handles routing between different demo applications
 * Overview: Routes to specific demo based on sub-tab selection
 * Dependencies: React, navigation store, demo components
 * Exports: DemoRouter component
 * Implementation: Renders appropriate demo based on activeSubTab
 */

import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useNavigationStore } from '../../../../store/navigationStore';
import { OscilloscopeDemo } from '../OscilloscopeDemo';
import { RacingGameTab } from '../../../racing/components/RacingGameTab';
import { DemoSelector } from '../DemoSelector';

export function DemoRouter(): ReactElement {
  const { activeSubTab, setActiveSubTab } = useNavigationStore();

  // Set default sub-tab if none is selected
  useEffect(() => {
    if (!activeSubTab) {
      // Parse hash to check if there's a sub-tab in the URL
      const hash =
        typeof window !== 'undefined' && window.location?.hash
          ? window.location.hash.slice(1)
          : '';
      const parts = hash.split('/');
      if (parts.length > 1 && parts[0] === 'Demo') {
        setActiveSubTab(parts[1]);
      }
    }
  }, [activeSubTab, setActiveSubTab]);

  // Render the appropriate demo based on activeSubTab
  switch (activeSubTab) {
    case 'oscilloscope':
      return <OscilloscopeDemo />;
    case 'racing':
      return <RacingGameTab />;
    default:
      return <DemoSelector />;
  }
}
