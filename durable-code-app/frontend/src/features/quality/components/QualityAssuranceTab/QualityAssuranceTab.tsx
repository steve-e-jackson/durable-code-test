/**
 * Purpose: Quality Assurance tab for code quality tools and metrics
 * Scope: React component for QA practices and linter statistics
 * Overview: Modularized QA tab using FeatureCard components for consistency
 * Dependencies: React, FeatureCard component, CSS modules
 * Exports: QualityAssuranceTab component
 * Props/Interfaces: No props - self-contained feature component
 * Implementation: Feature module with FeatureCard grid layout
 */

import type { ReactElement } from 'react';
import { FeatureCard } from '../../../../components/common/FeatureCard/FeatureCard';
import styles from './QualityAssuranceTab.module.css';
import {
  FaBug,
  FaChartLine,
  FaCheckCircle,
  FaFileAlt,
  FaRocket,
  FaShieldAlt,
} from 'react-icons/fa';

export function QualityAssuranceTab(): ReactElement {
  const qualityFeatures = [
    {
      icon: <FaShieldAlt />,
      title: 'Custom Linters',
      description:
        '18+ active linters ensuring code quality with magic number detection, file organization, and SOLID principles validation',
      linkText: 'View Linter Reports',
      linkHref: '/reports/linter-summary.html',
      badge: { text: 'Essential', variant: 'essential' as const },
    },
    {
      icon: <FaChartLine />,
      title: 'Code Coverage & Metrics',
      description:
        '99.2% test coverage with comprehensive quality metrics including maintainability scores and performance tracking',
      linkText: 'View Coverage Report',
      linkHref: '/reports/test-coverage.html',
      badge: { text: 'Quality', variant: 'quality' as const },
    },
    {
      icon: <FaRocket />,
      title: 'CI/CD Pipeline',
      description:
        'Automated build, lint, test, security, and deployment pipeline with 100% pass rate and sub-10 second execution',
      linkText: 'View Pipeline Status',
      linkHref: '/pipeline?return=Quality',
      badge: { text: 'Active', variant: 'active' as const },
    },
    {
      icon: <FaCheckCircle />,
      title: 'Standards Compliance',
      description:
        'Automated compliance checking for coding standards, best practices, and architectural guidelines',
      linkText: 'View Standards',
      linkHref: '/standards?return=QualityAssurance',
      badge: { text: 'Essential', variant: 'essential' as const },
    },
    {
      icon: <FaBug />,
      title: 'Bug Prevention',
      description:
        'Proactive bug detection with 0.3 bugs per KLOC and 68% reduction in production issues',
      linkText: 'View Bug Reports',
      linkHref: '/reports/bug-analysis.html',
      badge: { text: 'Quality', variant: 'quality' as const },
    },
    {
      icon: <FaFileAlt />,
      title: 'Quality Reports',
      description:
        'Comprehensive reporting dashboard with real-time metrics, trends, and actionable insights',
      linkText: 'View All Reports',
      linkHref: '/reports?return=Quality',
      badge: { text: 'Technical', variant: 'technical' as const },
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h3 className="hero-title">Bulletproof Code Quality</h3>
        <p className="subtitle">
          Comprehensive automated testing, custom linting, and AI-powered validation to
          ensure your code meets the highest standards
        </p>
      </div>

      <div className={styles.grid}>
        {qualityFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}
