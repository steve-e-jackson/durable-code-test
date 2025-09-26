/**
 * Purpose: Journey tab component displaying project development timeline
 * Scope: Visual timeline of project evolution through milestones
 * Overview: Vertical timeline visualization with alternating milestone placement
 * Dependencies: React, useJourney hook, CSS modules
 * Exports: JourneyTab component
 * Props/Interfaces: No props - self-contained feature component
 * Implementation: Interactive timeline with expandable milestone details
 */

import { type ReactElement } from 'react';
import { useJourney } from '../../hooks/useJourney';
import styles from './JourneyTab.module.css';

export function JourneyTab(): ReactElement {
  const {
    journeyData,
    phases,
    expandedMilestones,
    toggleMilestone,
    selectedPhase,
    selectPhase,
    totalMilestones,
    getMilestoneNumber,
  } = useJourney();

  const getMilestoneTypeClass = (type: string): string => {
    switch (type) {
      case 'feat':
        return styles.typeFeat;
      case 'fix':
        return styles.typeFix;
      case 'refactor':
        return styles.typeRefactor;
      case 'perf':
        return styles.typePerf;
      case 'docs':
        return styles.typeDocs;
      case 'test':
        return styles.typeTest;
      default:
        return styles.typeDefault;
    }
  };

  const getMilestoneImpactClass = (impact: string): string => {
    switch (impact) {
      case 'major':
        return styles.impactMajor;
      case 'minor':
        return styles.impactMinor;
      default:
        return styles.impactPatch;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h3 className="hero-title">{journeyData.title}</h3>
        <p className="subtitle">{journeyData.subtitle}</p>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <strong>{journeyData.phases.length}</strong> Phases
          </span>
          <span className={styles.statSeparator}>•</span>
          <span className={styles.statItem}>
            <strong>{totalMilestones}</strong> Milestones
          </span>
        </div>
      </div>

      {/* Phase Filter */}
      <div className={styles.phaseFilter}>
        <button
          className={`${styles.phaseButton} ${!selectedPhase ? styles.phaseButtonActive : ''}`}
          onClick={() => selectPhase(null)}
        >
          All Phases
        </button>
        {journeyData.phases.map((phase) => (
          <button
            key={phase.id}
            className={`${styles.phaseButton} ${
              selectedPhase === phase.id ? styles.phaseButtonActive : ''
            }`}
            onClick={() => selectPhase(phase.id)}
            style={
              {
                '--phase-color': phase.color,
              } as React.CSSProperties
            }
          >
            {phase.name}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className={styles.timeline}>
        <div className={styles.timelineLine} />

        {phases.map((phase) => (
          <div key={phase.id} className={styles.phase}>
            <div
              className={styles.phaseHeader}
              style={
                {
                  '--phase-color': phase.color,
                } as React.CSSProperties
              }
            >
              <h3 className={styles.phaseTitle}>{phase.name}</h3>
              <p className={styles.phaseDescription}>{phase.description}</p>
            </div>

            <div className={styles.milestones}>
              {phase.milestones.map((milestone) => {
                const isExpanded = expandedMilestones.has(milestone.id);
                const milestoneNumber = getMilestoneNumber(milestone);
                const isLeft = milestoneNumber % 2 === 1;

                return (
                  <div
                    key={milestone.id}
                    className={`${styles.milestoneWrapper} ${
                      isLeft ? styles.milestoneLeft : styles.milestoneRight
                    }`}
                  >
                    <div
                      className={`${styles.milestone} ${
                        isExpanded ? styles.milestoneExpanded : ''
                      }`}
                      onClick={() => toggleMilestone(milestone.id)}
                    >
                      <div className={styles.milestoneHeader}>
                        <div className={styles.milestoneNumber}>{milestoneNumber}</div>
                        <div className={styles.milestoneContent}>
                          <div className={styles.milestoneMeta}>
                            <span
                              className={`${styles.milestoneType} ${getMilestoneTypeClass(
                                milestone.type,
                              )}`}
                            >
                              {milestone.type}
                            </span>
                            {milestone.prNumber && (
                              <span className={styles.milestonePR}>
                                PR #{milestone.prNumber}
                              </span>
                            )}
                            <span
                              className={`${styles.milestoneImpact} ${getMilestoneImpactClass(
                                milestone.impact,
                              )}`}
                            >
                              {milestone.impact}
                            </span>
                            {milestone.date && (
                              <span className={styles.milestoneDate}>
                                {milestone.date}
                              </span>
                            )}
                          </div>
                          <h4 className={styles.milestoneTitle}>{milestone.title}</h4>
                          <p className={styles.milestoneDescription}>
                            {milestone.description}
                          </p>
                        </div>
                      </div>

                      {isExpanded && milestone.details && (
                        <div className={styles.milestoneDetails}>
                          <ul className={styles.detailsList}>
                            {milestone.details.map((detail, idx) => (
                              <li key={idx}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className={styles.milestoneConnector}>
                        <div className={styles.connectorDot} />
                        <div className={styles.connectorLine} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Timeline End Marker */}
        <div className={styles.timelineEnd}>
          <div className={styles.timelineEndDot} />
          <p className={styles.timelineEndText}>Journey Continues...</p>
        </div>
      </div>
    </div>
  );
}
