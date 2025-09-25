/**
 * Purpose: Repository tab component showcasing AI-ready project setup and architecture
 * Scope: Feature-based React component for displaying repository best practices
 * Overview: Standardized component using FeatureCard grid layout for consistency
 * Dependencies: React, FeatureCard component, CSS modules
 * Exports: RepositoryTab component (default export)
 * Props/Interfaces: No props - self-contained feature component
 * Implementation: Feature-based architecture with FeatureCard grid layout
 */

import type { ReactElement } from 'react';
import { FeatureCard } from '../../../../components/common/FeatureCard/FeatureCard';
import styles from './RepositoryTab.module.css';
import {
  FaCheckCircle,
  FaCogs,
  FaDocker,
  FaFileAlt,
  FaFlask,
  FaFolder,
  FaGavel,
  FaListOl,
  FaMap,
} from 'react-icons/fa';

export function RepositoryTab(): ReactElement {
  const repositoryFeatures = [
    {
      icon: <FaFolder />,
      title: 'Project Layout',
      description:
        'Rigid file organization with clear boundaries for AI-assisted development, preventing code sprawl and ensuring consistency',
      linkText: 'View Structure',
      linkHref: '/layout?return=Repository',
      badge: { text: 'Essential', variant: 'essential' as const },
    },
    {
      icon: <FaGavel />,
      title: 'Custom Linters',
      description:
        'AI-powered custom linters that enforce architectural patterns, detect violations, and maintain code quality standards',
      linkText: 'View Linters',
      linkHref: '/linters?return=Repository',
      badge: { text: 'Active', variant: 'active' as const },
    },
    {
      icon: <FaCogs />,
      title: 'Make Targets',
      description:
        'Standardized build system with consistent commands across all environments, ensuring reproducible operations',
      linkText: 'View Targets',
      linkHref: '/make-targets?return=Repository',
      badge: { text: 'Technical', variant: 'technical' as const },
    },
    {
      icon: <FaDocker />,
      title: 'Docker Everything',
      description:
        'Complete containerization strategy ensuring identical environments from development to production',
      linkText: 'View Containers',
      linkHref: '/docker?return=Repository',
      badge: { text: 'Technical', variant: 'technical' as const },
    },
    {
      icon: <FaCheckCircle />,
      title: 'Quality Gates',
      description:
        'Automated quality enforcement at every stage, preventing bad code from advancing through the pipeline',
      linkText: 'View Gates',
      linkHref: '/quality-gates?return=Repository',
      badge: { text: 'Quality', variant: 'quality' as const },
    },
    {
      icon: <FaListOl />,
      title: 'Step-by-Step Guides',
      description:
        'Comprehensive documentation and workflows that guide AI and developers through complex processes',
      linkText: 'View Guides',
      linkHref: '/guides?return=Repository',
      badge: { text: 'Active', variant: 'active' as const },
    },
    {
      icon: <FaFileAlt />,
      title: 'File Headers',
      description:
        'Standardized file documentation ensuring every file has clear purpose, scope, and implementation details',
      linkText: 'View Headers',
      linkHref: '/file-headers?return=Repository',
      badge: { text: 'Quality', variant: 'quality' as const },
    },
    {
      icon: <FaMap />,
      title: 'AI Index',
      description:
        'Comprehensive AI navigation system providing context and guidance for intelligent code assistance',
      linkText: 'View Index',
      linkHref: '/ai-index?return=Repository',
      badge: { text: 'Strategic', variant: 'strategic' as const },
    },
    {
      icon: <FaFlask />,
      title: 'Test Infrastructure',
      description:
        'Robust testing framework with comprehensive coverage ensuring reliability and catching regressions',
      linkText: 'View Tests',
      linkHref: '/test-infrastructure?return=Repository',
      badge: { text: 'Quality', variant: 'quality' as const },
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
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

      <div className={styles.grid}>
        {repositoryFeatures.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
}

export default RepositoryTab;
