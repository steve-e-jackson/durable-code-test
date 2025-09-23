/**
 * Purpose: Planning tab feature component for project planning and documentation
 * Scope: React component for displaying planning resources, workflows, and case study
 * Overview: Modularized planning tab with data management via custom hook, including
 *     interactive case study section with popup details for AWS deployment journey
 * Dependencies: React, usePlanning hook, CSS modules
 * Exports: PlanningTab component
 * Props/Interfaces: No props - self-contained feature component
 * Implementation: Feature-based architecture with separation of concerns and popup modals
 */

import { type ReactElement, useCallback, useState } from 'react';
import type { CaseStudyStep } from '../../types/planning.types';
import { usePlanning } from '../../hooks/usePlanning';
import styles from './PlanningTab.module.css';

export function PlanningTab(): ReactElement {
  const { planningSection, caseStudy } = usePlanning();
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const handleStepClick = useCallback((step: CaseStudyStep) => {
    setSelectedStep(step.id);
  }, []);

  const selectedCaseStep = caseStudy.steps.find((step) => step.id === selectedStep);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h3 className="hero-title">
          <span className={styles.titleIcon}>{planningSection.icon}</span>
          {planningSection.title}
        </h3>
        <p className="subtitle">{planningSection.subtitle}</p>
      </div>

      <div className={styles.grid}>
        {planningSection.documents.map((doc) => (
          <div key={doc.id} className={styles.card}>
            <span className={styles.cardIcon}>{doc.icon}</span>
            <h4 className="light-title-on-dark">{doc.title}</h4>
            <p className="light-text-on-dark">{doc.description}</p>
            <a href={doc.href} className={styles.cardLink}>
              View {doc.title.split(' ')[0]} →
            </a>
            <div
              className={`${styles.badge} ${
                doc.badge === 'Essential'
                  ? styles.essential
                  : doc.badge === 'Active'
                    ? styles.active
                    : doc.badge === 'Strategic'
                      ? styles.info
                      : doc.badge === 'Technical'
                        ? styles.neutral
                        : doc.badge === 'Quality'
                          ? styles.success
                          : doc.badge === 'Visual'
                            ? styles.available
                            : doc.badge === 'Timeline'
                              ? styles.warning
                              : styles.neutral
              }`}
            >
              {doc.badge}
            </div>
          </div>
        ))}
      </div>

      {/* Case Study Section */}
      <div className={styles.caseStudySection}>
        <div className={styles.caseStudyHeader}>
          <h3 className="dark-title-on-light">
            <span className={styles.caseStudyIcon}>📚</span>
            {caseStudy.title}
          </h3>
          <p className={styles.caseStudySubtitle}>{caseStudy.subtitle}</p>
        </div>

        <div className={styles.caseStudyGrid}>
          {caseStudy.steps.map((step) => (
            <div
              key={step.id}
              className={`${styles.caseStudyCard} ${styles[step.status]}`}
              onClick={() => handleStepClick(step)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleStepClick(step);
                }
              }}
            >
              <div className={styles.stepNumber}>Step {step.stepNumber}</div>
              <div className={styles.stepContent}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h4 className={styles.stepTitle}>{step.title}</h4>
                <p className={styles.stepSubtitle}>{step.subtitle}</p>
              </div>
              <div className={styles.stepStatus}>
                <span
                  className={`${styles.statusBadge} ${
                    step.status === 'completed'
                      ? styles.statusCompleted
                      : step.status === 'in-progress'
                        ? styles.statusInProgress
                        : styles.statusUpcoming
                  }`}
                >
                  {step.status === 'completed'
                    ? '✅ Completed'
                    : step.status === 'in-progress'
                      ? '🔄 In Progress'
                      : '📅 Upcoming'}
                </span>
              </div>
              <span className={styles.clickHint}>Click for details</span>
            </div>
          ))}
        </div>
      </div>

      {/* Case Study Popup */}
      {selectedCaseStep && (
        <>
          <div className={styles.popupBackdrop} onClick={() => setSelectedStep(null)} />
          <div className={styles.caseStudyPopup}>
            <div className={styles.popupHeader}>
              <h2 className={styles.popupTitle}>
                <span className={styles.popupIcon}>{selectedCaseStep.icon}</span>
                Step {selectedCaseStep.stepNumber}: {selectedCaseStep.title}
              </h2>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedStep(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.popupContainer}>
              {/* Overview Section */}
              <div className={styles.popupSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📋</span>
                  {selectedCaseStep.popup.overview.title}
                </h3>
                <ul className={styles.pointsList}>
                  {selectedCaseStep.popup.overview.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>

              {/* Documents Section */}
              <div className={styles.popupSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📄</span>
                  {selectedCaseStep.popup.documents.title}
                </h3>
                <div className={styles.documentsGrid}>
                  {selectedCaseStep.popup.documents.items.map((doc, index) => (
                    <div key={index} className={styles.documentCard}>
                      <h4 className={styles.documentName}>{doc.name}</h4>
                      <p className={styles.documentDescription}>{doc.description}</p>
                      <p className={styles.documentPurpose}>
                        <strong>Purpose:</strong> {doc.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Implementation Section */}
              <div className={styles.popupSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>⚙️</span>
                  {selectedCaseStep.popup.implementation.title}
                </h3>
                <ul className={styles.pointsList}>
                  {selectedCaseStep.popup.implementation.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>

              {/* Outcomes Section */}
              <div className={styles.popupSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🎯</span>
                  {selectedCaseStep.popup.outcomes.title}
                </h3>
                <ul className={styles.pointsList}>
                  {selectedCaseStep.popup.outcomes.points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Links Section */}
            {selectedCaseStep.popup.links && (
              <div className={styles.popupLinks}>
                {selectedCaseStep.popup.links.map((link, index) => (
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
