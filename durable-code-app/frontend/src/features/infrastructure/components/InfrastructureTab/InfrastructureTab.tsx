/**
 * Purpose: Infrastructure tab component showcasing AI-ready project setup and architecture
 * Scope: Feature-based React component for displaying infrastructure best practices
 * Overview: Modern React component demonstrating infrastructure setup for AI-assisted development
 *     including project organization, tooling configuration, CI/CD setup, and development
 *     environment preparation. Modularized with proper separation of concerns, CSS modules,
 *     and comprehensive error handling following established patterns.
 * Dependencies: React, infrastructure hooks, common components, CSS modules
 * Exports: InfrastructureTab component (default export), InfrastructureTabProps interface
 * Props/Interfaces: Optional className and error handling callback
 * State/Behavior: Fetches infrastructure data via hook, displays modular content sections
 */

import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ErrorMessage, LoadingSpinner } from '../../../../components/common';
import { useInfrastructure } from '../../hooks/useInfrastructure';
import type {
  InfrastructureItem,
  InfrastructureTabProps,
} from '../../types/infrastructure.types';
import styles from './InfrastructureTab.module.css';

/**
 * InfrastructureTab component
 *
 * @param props - Component props
 * @returns Rendered infrastructure tab component
 */
export function InfrastructureTab({
  className = '',
  onError,
}: InfrastructureTabProps): ReactElement {
  const { infrastructureItems, loading, error } = useInfrastructure();

  // State for clicked popup
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Component classes
  const componentClasses = useMemo(() => {
    return [
      styles.infrastructureTab,
      'tab-content',
      'infrastructure-content',
      className,
      loading && styles.loading,
      error && styles.error,
    ]
      .filter(Boolean)
      .join(' ');
  }, [className, loading, error]);

  // Event handlers
  const handleItemClick = useCallback((item: InfrastructureItem) => {
    if (item.popup) {
      setSelectedItem(item.id);
    }
  }, []);

  // Error propagation
  if (error) {
    onError?.(error);
  }

  // Render helpers
  const renderInfrastructureGrid = useCallback(() => {
    return (
      <div className={styles.infrastructureGrid}>
        {infrastructureItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.infrastructureCard} feature-card`}
            onClick={() => handleItemClick(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleItemClick(item);
              }
            }}
          >
            <div className={styles.cardContent}>
              <div className={styles.cardIcon}>{item.icon}</div>
              <h4 className={styles.cardTitle}>{item.title}</h4>
              <span className={styles.clickHint}>Click to explore</span>
            </div>
          </div>
        ))}
      </div>
    );
  }, [infrastructureItems, handleItemClick]);

  // Removed unused renderFolderStructure function

  // Removed unused renderMakeTargets function

  // Removed unused renderCustomLinters function

  // Removed unused renderStats function

  // Removed unused renderActionLinks function

  // Find selected item for popup
  const selectedInfraItem = useMemo(() => {
    if (!selectedItem) return null;
    return infrastructureItems.find((item) => item.id === selectedItem);
  }, [selectedItem, infrastructureItems]);

  // Loading state
  if (loading) {
    return (
      <div className={componentClasses}>
        <LoadingSpinner className={styles.loadingSpinner} />
        <p>Loading infrastructure data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={componentClasses}>
        <ErrorMessage
          message={error.message}
          title="Error loading infrastructure"
          variant="error"
          onDismiss={() => window.location.reload()}
          className={styles.errorMessage}
        />
      </div>
    );
  }

  // Main render
  return (
    <div className={componentClasses}>
      {/* Hero section */}
      <div className={styles.infrastructureHero}>
        <h3 className="hero-title">
          <span className={styles.titleIcon}>🏗️</span>
          Why Rigid Infrastructure Matters for AI Development
        </h3>
        <p className="subtitle">
          AI coding assistants are powerful but unpredictable. Without strict repository
          controls, they create inconsistent code, violate conventions, and introduce
          subtle bugs that compound over time. The solution isn't to restrict AI, but to
          create <strong>rigid infrastructure</strong> that channels its creativity
          productively. When every file has a defined location, every operation runs
          identically, and every violation gets caught automatically, AI becomes a
          reliable engineering partner instead of a source of technical debt. The
          patterns below show how to build this foundation.
        </p>
      </div>

      {/* Infrastructure grid */}
      {renderInfrastructureGrid()}

      {/* Popup rendered at component level */}
      {selectedInfraItem && selectedInfraItem.popup && (
        <>
          <div className={styles.popupBackdrop} onClick={() => setSelectedItem(null)} />
          <div className={styles.structuredPopup}>
            {/* Document Header */}
            <div className={styles.documentHeader}>
              <h2 className={styles.documentTitle}>
                <span className={styles.documentIcon}>{selectedInfraItem.icon}</span>
                {selectedInfraItem.title}
              </h2>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedItem(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.popupContainer}>
              {/* Problem Section */}
              <div className={styles.popupSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🔴</span>
                  The Problem
                </h3>
                <div className={styles.sectionContent}>
                  <h4>{selectedInfraItem.popup.problem.title}</h4>
                  <ul className={styles.pointsList}>
                    {selectedInfraItem.popup.problem.points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Solution Section */}
              <div className={styles.popupSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>✅</span>
                  Our Solution
                </h3>
                <div className={styles.sectionContent}>
                  <h4>{selectedInfraItem.popup.solution.title}</h4>
                  <ul className={styles.pointsList}>
                    {selectedInfraItem.popup.solution.points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Example Section */}
              <div className={styles.popupSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>💻</span>
                  Example from Our Code
                </h3>
                <div className={styles.exampleHeader}>
                  <span className={styles.exampleTitle}>
                    {selectedInfraItem.popup.example.title}
                  </span>
                  {selectedInfraItem.popup.example.file && (
                    <span className={styles.exampleFile}>
                      {selectedInfraItem.popup.example.file}
                    </span>
                  )}
                </div>
                <pre className={styles.codeBlock}>
                  <code
                    className={`language-${selectedInfraItem.popup.example.language}`}
                  >
                    {selectedInfraItem.popup.example.code}
                  </code>
                </pre>
              </div>
            </div>

            {/* Links Section - Outside scrollable area */}
            {selectedInfraItem.popup.links && (
              <div className={styles.popupLinks}>
                {selectedInfraItem.popup.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.popupLink}
                  >
                    {link.text} →
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default InfrastructureTab;
