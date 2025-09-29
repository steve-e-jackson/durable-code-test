/**
 * Purpose: Placeholder component for Racing Game demo
 * Scope: Temporary placeholder while racing game is in development
 * Overview: Shows coming soon message and planned features
 * Dependencies: React
 * Exports: RacingGameTab component
 * Implementation: Placeholder UI with feature preview
 */

import type { ReactElement } from 'react';
import styles from './RacingGameTab.module.css';

interface PlannedFeature {
  name: string;
  description: string;
  icon: string;
}

const plannedFeatures: PlannedFeature[] = [
  {
    name: 'Physics-Based Movement',
    description: 'Realistic car physics with sliding, friction, and collision dynamics',
    icon: '⚙️',
  },
  {
    name: 'Mouse-Following Controls',
    description: 'Intuitive control system where the car follows your mouse cursor',
    icon: '🖱️',
  },
  {
    name: 'Procedural Track Generation',
    description: 'Dynamically generated tracks with varying difficulty and layouts',
    icon: '🛤️',
  },
  {
    name: 'Real-time Scoring',
    description: 'Time-based scoring with checkpoints and best lap tracking',
    icon: '⏱️',
  },
  {
    name: 'Visual Effects',
    description: 'Particle effects, skid marks, and smooth animations',
    icon: '✨',
  },
  {
    name: 'Performance Optimized',
    description: 'Hardware-accelerated rendering maintaining 60 FPS',
    icon: '🚀',
  },
];

export function RacingGameTab(): ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>🏎️</div>

      <h2 className={styles.title}>Racing Game Demo</h2>
      <p className={styles.subtitle}>
        An exciting physics-based racing game is currently in development
      </p>

      <div className={styles.statusBadge}>
        <span>🚧</span>
        <span>Under Construction</span>
      </div>

      <div className={styles.featureList}>
        <h3 className={styles.featureTitle}>Planned Features</h3>
        <ul className={styles.features}>
          {plannedFeatures.map((feature, index) => (
            <li key={index} className={styles.feature}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <div className={styles.featureText}>
                <div className={styles.featureName}>{feature.name}</div>
                <div className={styles.featureDescription}>{feature.description}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.progress}>
        <div className={styles.progressTitle}>Development Progress</div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
        <p
          style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          PR1 - Navigation Infrastructure (In Progress)
        </p>
      </div>
    </div>
  );
}
