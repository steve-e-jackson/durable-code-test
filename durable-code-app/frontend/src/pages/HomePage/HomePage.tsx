/**
 * Purpose: Home page component with tabbed interface for durable code framework
 * Scope: Main page component displaying different aspects of AI-ready development
 * Overview: Comprehensive dashboard for the Durable Code framework with tabbed navigation
 * Dependencies: React, navigation feature, tab configurations
 * Exports: HomePage component
 * Props/Interfaces: No props - page component
 * Implementation: Uses navigation feature and tab configuration
 */

import { Suspense } from 'react';
import type { ReactElement } from 'react';
import ParticleBackground from '../../components/ParticleBackground';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TabNavigation, useNavigation } from '../../features/navigation';
import { tabs } from '../../config/tabs.config';
import styles from './HomePage.module.css';
import { MinimalErrorBoundary } from '../../core/errors/MinimalErrorBoundary';

export default function HomePage(): ReactElement {
  const { activeTab, handleTabChange } = useNavigation();
  const tabConfig = tabs[activeTab];

  if (!tabConfig) {
    console.error(`Tab configuration not found for: ${activeTab}`);
    console.error('Available tabs:', Object.keys(tabs));
    throw new Error(`Tab configuration not found for: ${activeTab}`);
  }

  const ActiveTabComponent = tabConfig.component;

  return (
    <div className={styles.app}>
      <ParticleBackground />
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.gradientText}>AI-Authored Excellence</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Proving that AI can create production-quality, scalable, and maintainable
            code through intelligent architecture and automated quality assurance
          </p>
          <div className={styles.heroInfoGrid}>
            <div className={styles.projectInfo}>
              <h3>Project Purpose</h3>
              <p>
                This project serves a dual purpose: documenting best practices for
                AI-assisted development while simultaneously demonstrating through its
                own implementation that these practices enable AI to create
                production-quality, maintainable software at enterprise scale.
              </p>
            </div>
            <div className={styles.projectScope}>
              <h3>Design Goals</h3>
              <ul>
                <li>AI writes quality code on first attempt with minimal iteration</li>
                <li>100% AI-authored codebase proving the methodology works</li>
                <li>Self-documenting architecture that guides future AI development</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={tabs}
        />

        <section className={styles.tabContainer}>
          <MinimalErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <ActiveTabComponent />
            </Suspense>
          </MinimalErrorBoundary>
        </section>

        <section className={styles.aiPrinciples}>
          <div className={styles.principlesContainer}>
            <div className={styles.principlesHeader}>
              <h2>Fundamental AI Principles</h2>
              <p>Core concepts for successful AI-assisted development</p>
            </div>

            <div className={styles.principlesGrid}>
              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>1</div>
                <h3>Immediate Feedback Loops</h3>
                <p>
                  AI needs instant visibility into success or failure through logs,
                  terminal output, test results, and error messages. Without immediate
                  feedback, AI cannot self-correct or validate its actions.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>Terminal</span>
                  <span className={styles.exampleTag}>Logs</span>
                  <span className={styles.exampleTag}>Tests</span>
                  <span className={styles.exampleTag}>Errors</span>
                </div>
              </div>

              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>2</div>
                <h3>Maximum Context</h3>
                <p>
                  AI needs the same context you'd give a new contractor, plus access to
                  external resources: database schemas, API docs, infrastructure setup,
                  Notion pages, and architectural decisions. More context equals better
                  output.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>Database Schema</span>
                  <span className={styles.exampleTag}>API Docs</span>
                  <span className={styles.exampleTag}>Infra Setup</span>
                  <span className={styles.exampleTag}>Architecture</span>
                </div>
              </div>

              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>3</div>
                <h3>Clear Success Criteria</h3>
                <p>
                  Define explicit, measurable success conditions. AI performs best when
                  it knows exactly what "done" looks like - passing tests, meeting
                  performance benchmarks, or matching specifications.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>Tests Pass</span>
                  <span className={styles.exampleTag}>No Lint Errors</span>
                  <span className={styles.exampleTag}>Builds Clean</span>
                  <span className={styles.exampleTag}>Meets Specs</span>
                </div>
              </div>

              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>4</div>
                <h3>Modular Task Decomposition</h3>
                <p>
                  Break complex problems into small, verifiable steps. AI excels at
                  focused, well-defined tasks but struggles with ambiguous, open-ended
                  requests. Think functions, not monoliths.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>Small PRs</span>
                  <span className={styles.exampleTag}>Single Purpose</span>
                  <span className={styles.exampleTag}>Testable Units</span>
                  <span className={styles.exampleTag}>Clear Scope</span>
                </div>
              </div>

              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>5</div>
                <h3>Explicit Over Implicit</h3>
                <p>
                  State requirements explicitly. Don't assume AI will infer conventions,
                  patterns, or constraints. Document your preferences, standards, and
                  anti-patterns clearly.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>No Magic</span>
                  <span className={styles.exampleTag}>Clear Rules</span>
                  <span className={styles.exampleTag}>Examples</span>
                  <span className={styles.exampleTag}>Constraints</span>
                </div>
              </div>

              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>6</div>
                <h3>Defensive Validation</h3>
                <p>
                  Always verify AI output through automated tests, linting, type
                  checking, and builds. Never trust, always verify - use CI/CD pipelines
                  to catch issues before they reach production.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>CI/CD</span>
                  <span className={styles.exampleTag}>Type Safety</span>
                  <span className={styles.exampleTag}>Linting</span>
                  <span className={styles.exampleTag}>Reviews</span>
                </div>
              </div>

              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>7</div>
                <h3>Version Control Everything</h3>
                <p>
                  Track all changes in git with clear commit messages. This provides
                  rollback capability, audit trails, and allows AI to understand project
                  evolution and patterns.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>Git History</span>
                  <span className={styles.exampleTag}>Commits</span>
                  <span className={styles.exampleTag}>Branches</span>
                  <span className={styles.exampleTag}>Tags</span>
                </div>
              </div>

              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>8</div>
                <h3>Living Documentation</h3>
                <p>
                  Treat documentation as code - keep it in the repo, version it, and
                  update it with every change. AI relies on current, accurate docs to
                  understand system behavior and constraints.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>README</span>
                  <span className={styles.exampleTag}>API Docs</span>
                  <span className={styles.exampleTag}>Comments</span>
                  <span className={styles.exampleTag}>Examples</span>
                </div>
              </div>

              <div className={styles.principleCard}>
                <div className={styles.principleNumber}>9</div>
                <h3>Lightweight Look-ups</h3>
                <p>
                  Provide quick-access indices and metadata that AI can rapidly parse.
                  Tables of contents, file headers, and structured navigation enable
                  efficient codebase understanding without excessive context
                  consumption.
                </p>
                <div className={styles.principleExamples}>
                  <span className={styles.exampleTag}>.ai/index.json</span>
                  <span className={styles.exampleTag}>File Headers</span>
                  <span className={styles.exampleTag}>TOC</span>
                  <span className={styles.exampleTag}>Metadata</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4>Resources</h4>
            <ul>
              <li>
                <a
                  href="https://github.com/stevej-at-benlabs/durable-code-test"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/stevej-at-benlabs/durable-code-test/blob/main/README.md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API Reference
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
