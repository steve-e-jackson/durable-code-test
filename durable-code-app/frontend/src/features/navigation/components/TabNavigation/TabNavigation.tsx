/**
 * Purpose: Tab navigation component for main application
 * Scope: React component for rendering navigation tabs
 * Overview: Reusable navigation component with tab switching
 * Dependencies: React, common components
 * Exports: TabNavigation component
 * Props/Interfaces: NavigationProps - activeTab, onTabChange, tabs
 * Implementation: Renders tab navigation with active state management
 */

import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { Tab } from '../../../../components/common/Tab';
import { Icon } from '../../../../components/common/Icon';
import { Dropdown } from '../../../../components/common/Dropdown';
import { useNavigationStore } from '../../../../store/navigationStore';
import type {
  NavigationProps,
  SubTabContent,
  TabName,
} from '../../types/navigation.types';
import styles from './TabNavigation.module.css';

export function TabNavigation({
  activeTab,
  onTabChange,
  tabs,
}: NavigationProps): ReactElement {
  const { setActiveSubTab } = useNavigationStore();

  const handleSubTabSelect = useCallback(
    (tabName: TabName, subTab: SubTabContent) => {
      onTabChange(tabName);
      setActiveSubTab(subTab.id);
    },
    [onTabChange, setActiveSubTab],
  );

  return (
    <nav className={styles.navigation}>
      {(Object.keys(tabs) as TabName[]).map((tabName) => {
        const tab = tabs[tabName];
        const hasSubTabs = tab.subTabs && tab.subTabs.length > 0;

        if (hasSubTabs) {
          return (
            <Dropdown
              key={tabName}
              trigger={
                <Tab
                  isActive={activeTab === tabName}
                  onClick={() => onTabChange(tabName)}
                  variant="underline"
                >
                  <Icon emoji={tab.icon} label={tab.title} />
                  <span className={styles.tabTitle}>{tab.title}</span>
                  <span className={styles.dropdownIcon}>▼</span>
                </Tab>
              }
              items={tab.subTabs.map((subTab) => ({
                id: subTab.id,
                label: subTab.title,
                icon: subTab.icon,
                description: subTab.description,
                onClick: () => handleSubTabSelect(tabName, subTab),
              }))}
              align="left"
            />
          );
        }

        return (
          <Tab
            key={tabName}
            isActive={activeTab === tabName}
            onClick={() => onTabChange(tabName)}
            variant="underline"
          >
            <Icon emoji={tab.icon} label={tab.title} />
            <span className={styles.tabTitle}>{tab.title}</span>
          </Tab>
        );
      })}
    </nav>
  );
}
