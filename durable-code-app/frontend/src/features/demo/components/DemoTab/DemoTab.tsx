/**
 * Purpose: Main demo tab component with routing
 * Scope: Container for demo sub-navigation and routing
 * Overview: Routes to appropriate demo based on selection
 * Dependencies: React, DemoRouter
 * Exports: DemoTab component
 * Interfaces: Self-contained tab component with no external props
 * Implementation: Uses DemoRouter for sub-navigation between demos
 */

import React from 'react';
import type { ReactElement } from 'react';
import { DemoRouter } from '../DemoRouter';

function DemoTabComponent(): ReactElement {
  return <DemoRouter />;
}

export const DemoTab = React.memo(DemoTabComponent);
