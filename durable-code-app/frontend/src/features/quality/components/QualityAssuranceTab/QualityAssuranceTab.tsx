/**
 * Purpose: Quality Assurance tab for code quality tools and metrics
 * Scope: React component for QA practices and linter statistics
 * Overview: Modularized QA tab with CSS Modules styling
 * Dependencies: React, React Router, FeatureCard component
 * Exports: QualityAssuranceTab component
 * Props/Interfaces: No props - self-contained feature component
 * Implementation: Feature module with CSS Modules and FeatureCard grid
 */

import type { ReactElement } from 'react';
import { FeatureCard } from '../../../../components/common/FeatureCard/FeatureCard';
import styles from './QualityAssuranceTab.module.css';
import {
  FaBug,
  FaCheckCircle,
  FaClipboardList,
  FaRocket,
  FaShieldAlt,
  FaTools,
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
      icon: <FaCheckCircle />,
      title: 'Test Coverage',
      description:
        '99.2% comprehensive test coverage with automated gap analysis and quality reporting',
      linkText: 'View Coverage Report',
      linkHref: '/reports/test-coverage.html',
      badge: { text: 'Quality', variant: 'quality' as const },
    },
    {
      icon: <FaRocket />,
      title: 'CI/CD Pipeline',
      description:
        'Automated build, lint, test, security, and deployment pipeline with 100% pass rate',
      linkText: 'View Pipeline Status',
      linkHref: '/pipeline?return=QualityAssurance',
      badge: { text: 'Active', variant: 'active' as const },
    },
    {
      icon: <FaBug />,
      title: 'Bug Tracking',
      description:
        'Real-time monitoring with 0.3 bugs per KLOC and 68% reduction in bug reports',
      linkText: 'View Bug Reports',
      linkHref: '/bugs?return=QualityAssurance',
      badge: { text: 'Technical', variant: 'technical' as const },
    },
    {
      icon: <FaClipboardList />,
      title: 'Standards Compliance',
      description:
        'Automated compliance checking with coding standards and best practices validation',
      linkText: 'View Standards',
      linkHref: '/standards?return=QualityAssurance',
      badge: { text: 'Quality', variant: 'quality' as const },
    },
    {
      icon: <FaTools />,
      title: 'Quality Tools',
      description:
        'Integrated quality tools including SonarQube, ESLint, Prettier, and custom analyzers',
      linkText: 'View Tools',
      linkHref: '/tools?return=QualityAssurance',
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
