/**
 * Purpose: Repository tab component showcasing AI-ready project setup and architecture
 * Scope: Feature-based React component for displaying repository best practices
 * Overview: Modern React component demonstrating repository setup for AI-assisted development
 *     including project organization, tooling configuration, CI/CD setup, and development
 *     environment preparation. Modularized with proper separation of concerns, CSS modules,
 *     and comprehensive error handling following established patterns.
 * Dependencies: React, repository hooks, common components, CSS modules
 * Exports: RepositoryTab component (default export), RepositoryTabProps interface
 * Props/Interfaces: Optional className and error handling callback
 * State/Behavior: Fetches repository data via hook, displays modular content sections
 */

import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ErrorMessage, LoadingSpinner } from '../../../../components/common';
import { useRepository } from '../../hooks/useRepository';
import type { RepositoryItem, RepositoryTabProps } from '../../types/repository.types';
import styles from './RepositoryTab.module.css';

/**
 * RepositoryTab component
 *
 * @param props - Component props
 * @returns Rendered repository tab component
 */
export function RepositoryTab({
  className = '',
  onError,
}: RepositoryTabProps): ReactElement {
  const {
    repositoryItems,
    folderStructure: _folderStructure,
    loading,
    error,
  } = useRepository();

  // State for clicked popup
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  // Component classes
  const componentClasses = useMemo(() => {
    return [
      styles.repositoryTab,
      'tab-content',
      'repository-content',
      className,
      loading && styles.loading,
      error && styles.error,
    ]
      .filter(Boolean)
      .join(' ');
  }, [className, loading, error]);

  // Event handlers
  const handleItemClick = useCallback((item: RepositoryItem) => {
    if (item.popup) {
      setSelectedItem(item.id);
    }
  }, []);

  // Error propagation
  if (error) {
    onError?.(error);
  }

  // Render helpers
  const renderRepositoryGrid = useCallback(() => {
    return (
      <div className={styles.repositoryGrid}>
        {repositoryItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.repositoryCard} feature-card`}
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
  }, [repositoryItems, handleItemClick]);

  // Find selected item for popup
  const selectedRepoItem = useMemo(() => {
    if (!selectedItem) return null;
    return repositoryItems.find((item) => item.id === selectedItem);
  }, [selectedItem, repositoryItems]);

  // Loading state
  if (loading) {
    return (
      <div className={componentClasses}>
        <LoadingSpinner className={styles.loadingSpinner} />
        <p>Loading repository data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={componentClasses}>
        <ErrorMessage
          message={error.message}
          title="Error loading repository"
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
      <div className={styles.repositoryHero}>
        <h3 className="hero-title">
          Why Rigid Repository Structure Matters for AI Development
        </h3>
        <p className="subtitle">
          AI coding assistants are powerful but unpredictable. Without strict repository
          controls, they create inconsistent code, violate conventions, and introduce
          subtle bugs that compound over time. The solution is to establish{' '}
          <strong>rigid boundaries inside which AI can be free to create</strong>. When
          every file has a defined location, every operation runs identically, and every
          violation gets caught automatically, AI becomes a reliable engineering partner
          instead of a source of technical debt. The patterns below show how to build
          this foundation.
        </p>
      </div>

      {/* Repository grid */}
      {renderRepositoryGrid()}

      {/* Popup rendered at component level */}
      {selectedRepoItem && selectedRepoItem.popup && (
        <>
          <div className={styles.popupBackdrop} onClick={() => setSelectedItem(null)} />
          <div className={styles.structuredPopup}>
            {/* Document Header */}
            <div className={styles.documentHeader}>
              <h2 className={styles.documentTitle}>
                <span className={styles.documentIcon}>{selectedRepoItem.icon}</span>
                {selectedRepoItem.title}
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
                  <h4>{selectedRepoItem.popup.problem.title}</h4>
                  <ul className={styles.pointsList}>
                    {selectedRepoItem.popup.problem.points.map((point, index) => (
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
                  <h4>{selectedRepoItem.popup.solution.title}</h4>
                  <ul className={styles.pointsList}>
                    {selectedRepoItem.popup.solution.points.map((point, index) => (
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
                    {selectedRepoItem.popup.example.title}
                  </span>
                  {selectedRepoItem.popup.example.file && (
                    <span className={styles.exampleFile}>
                      {selectedRepoItem.popup.example.file}
                    </span>
                  )}
                </div>
                <pre className={styles.codeBlock}>
                  <code
                    className={`language-${selectedRepoItem.popup.example.language}`}
                  >
                    {selectedRepoItem.popup.example.code}
                  </code>
                </pre>
              </div>
            </div>

            {/* Links Section - Outside scrollable area */}
            {selectedRepoItem.popup.links && (
              <div className={styles.popupLinks}>
                {selectedRepoItem.popup.links.map((link, index) => (
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

export default RepositoryTab;
