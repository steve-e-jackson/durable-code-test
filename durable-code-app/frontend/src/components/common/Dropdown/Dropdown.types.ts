/**
 * Purpose: Type definitions for Dropdown component
 * Scope: Dropdown-related types and interfaces
 * Overview: Type definitions for dropdown menu component
 * Dependencies: React types
 * Exports: Dropdown types
 * Implementation: Strong typing for dropdown component
 */

import type { ReactNode } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right' | 'center';
  className?: string;
  onItemSelect?: (item: DropdownItem) => void;
}
