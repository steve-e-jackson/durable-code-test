import { Link, useSearchParams } from 'react-router-dom';
import styles from './CustomLinters.module.css';

const CustomLinters = () => {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || 'Quality Assurance';

  return (
    <div className={styles.customLintersPage}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb navigation">
        <Link to="/">🏠 Home</Link>
        <span className={styles.breadcrumbSeparator}>›</span>
        <Link to={`/#${returnTo}`}>Quality</Link>
        <span className={styles.breadcrumbSeparator}>›</span>
        <span className={styles.breadcrumbCurrent}>Custom Linters</span>
      </nav>

      <div className={styles.container}>
        <h1>🎯 Custom Linters</h1>
        <div className={styles.subtitle}>
          Enforce your specific coding standards automatically
        </div>

        {/* Magic Number Detector */}
        <div className={styles.linterCard}>
          <div className={styles.linterHeader}>
            <span className={styles.linterIcon}>🔢</span>
            <h2 className={styles.linterTitle}>Magic Number Detector</h2>
            <span className={`${styles.statusBadge} ${styles.statusActive}`}>
              Active in CI/CD
            </span>
          </div>
          <p className={styles.linterDescription}>
            Detects hardcoded numeric and string literals that should be constants. This
            linter ensures code clarity by identifying "magic" values that lack context
            and should be replaced with named constants.
          </p>

          <div className={styles.featureGrid}>
            <div className={styles.featureItem}>
              <h4>🎯 What It Detects</h4>
              <ul>
                <li>Hardcoded numbers (except 0, 1, -1)</li>
                <li>Repeated string literals</li>
                <li>Threshold values without names</li>
                <li>Configuration values in code</li>
              </ul>
            </div>
            <div className={styles.featureItem}>
              <h4>✨ Smart Features</h4>
              <ul>
                <li>Context-aware suggestions</li>
                <li>Automatic constant naming</li>
                <li>Whitelist for common values</li>
                <li>Language-specific rules</li>
              </ul>
            </div>
          </div>

          <div className={styles.codeExample}>
            <pre>
              {`❌ Violation:
if response_time > 3600:  # What does 3600 mean?
    alert_user("Timeout")

✅ Corrected:
SECONDS_PER_HOUR = 3600
if response_time > SECONDS_PER_HOUR:
    alert_user("Timeout")`}
            </pre>
          </div>

          <div className={styles.commandBox}>
            <code>
              python tools/design-linters/magic_number_detector.py --path ./src
            </code>
          </div>
        </div>

        {/* File Placement Linter */}
        <div className={styles.linterCard}>
          <div className={styles.linterHeader}>
            <span className={styles.linterIcon}>📁</span>
            <h2 className={styles.linterTitle}>File Placement Linter</h2>
            <span className={`${styles.statusBadge} ${styles.statusActive}`}>
              Active in CI/CD
            </span>
          </div>
          <p className={styles.linterDescription}>
            Ensures files are placed in appropriate directories according to project
            standards. This linter validates that Python files, HTML files, tests, and
            other file types follow the project's organizational structure.
          </p>

          <div className={styles.featureGrid}>
            <div className={styles.featureItem}>
              <h4>📋 Validation Rules</h4>
              <ul>
                <li>Python files in proper modules</li>
                <li>Tests in test directories</li>
                <li>HTML in public/templates</li>
                <li>Config files at root level</li>
              </ul>
            </div>
            <div className={styles.featureItem}>
              <h4>🚫 Prevents</h4>
              <ul>
                <li>Scattered test files</li>
                <li>Mixed frontend/backend code</li>
                <li>Build artifacts in source</li>
                <li>Misplaced documentation</li>
              </ul>
            </div>
          </div>

          <div className={styles.codeExample}>
            <pre>
              {`❌ Violation:
/src/components/test_button.py     # Test file in source directory
/backend/index.html                # HTML in backend directory
/root/api_handler.py               # Python file at root level

✅ Corrected:
/test/components/test_button.py    # Test in test directory
/frontend/public/index.html        # HTML in proper location
/backend/api/api_handler.py        # Python in module structure`}
            </pre>
          </div>

          <div className={styles.commandBox}>
            <code>
              python tools/design-linters/file_placement_linter.py --check-all
            </code>
          </div>

          <div className={styles.implementationNote}>
            <strong>Note:</strong> File placement rules are defined in STANDARDS.md and
            can be customized per project.
          </div>
        </div>

        {/* Print Statement Linter */}
        <div className={styles.linterCard}>
          <div className={styles.linterHeader}>
            <span className={styles.linterIcon}>🖨️</span>
            <h2 className={styles.linterTitle}>Print Statement Linter</h2>
            <span className={`${styles.statusBadge} ${styles.statusActive}`}>
              Active in CI/CD
            </span>
          </div>
          <p className={styles.linterDescription}>
            Detects and reports print statements in production code. This linter ensures
            proper logging practices by preventing debug print statements from reaching
            production, supporting Python, JavaScript, and TypeScript.
          </p>

          <div className={styles.featureGrid}>
            <div className={styles.featureItem}>
              <h4>🔍 Detection Patterns</h4>
              <ul>
                <li>Python: print(), pprint()</li>
                <li>JavaScript: console.{'log'}()</li>
                <li>TypeScript: console.* methods</li>
                <li>Debug/trace statements</li>
              </ul>
            </div>
            <div className={styles.featureItem}>
              <h4>⚙️ Configuration</h4>
              <ul>
                <li>Exclude test files</li>
                <li>Allow in specific modules</li>
                <li>Severity levels</li>
                <li>Custom ignore patterns</li>
              </ul>
            </div>
          </div>

          <div className={styles.codeExample}>
            <pre>
              {`❌ Violation:
def process_payment(amount):
    print(f"Processing payment: {amount}")  # Debug print in production
    console.{'log'}("Payment started")          # JavaScript console
    return charge_card(amount)

✅ Corrected:
import logging
logger = logging.getLogger(__name__)

def process_payment(amount):
    logger.info(f"Processing payment: {amount}")  # Proper logging
    return charge_card(amount)`}
            </pre>
          </div>

          <div className={styles.commandBox}>
            <code>
              python tools/design-linters/print_statement_linter.py --severity error
            </code>
          </div>
        </div>

        {/* Breadcrumb Navigation Linter */}
        <div className={styles.linterCard}>
          <div className={styles.linterHeader}>
            <span className={styles.linterIcon}>🧭</span>
            <h2 className={styles.linterTitle}>Breadcrumb Navigation Linter</h2>
            <span className={`${styles.statusBadge} ${styles.statusActive}`}>
              Active in CI/CD
            </span>
          </div>
          <p className={styles.linterDescription}>
            Ensures all HTML documentation files have proper breadcrumb navigation for
            better user experience and accessibility. This linter validates navigation
            structure, ARIA labels, and home page links in all HTML documentation.
          </p>

          <div className={styles.featureGrid}>
            <div className={styles.featureItem}>
              <h4>✅ Validation Rules</h4>
              <ul>
                <li>Presence of nav element with breadcrumb class</li>
                <li>ARIA label for accessibility</li>
                <li>Link back to home page</li>
                <li>Non-empty breadcrumb content</li>
              </ul>
            </div>
            <div className={styles.featureItem}>
              <h4>🎯 Benefits</h4>
              <ul>
                <li>Improved user navigation</li>
                <li>Better accessibility compliance</li>
                <li>Consistent documentation structure</li>
                <li>Enhanced user experience</li>
              </ul>
            </div>
          </div>

          <div className={styles.codeExample}>
            <div className={styles.codeHeader}>Required Breadcrumb Structure:</div>
            <pre>
              {`<nav class="breadcrumb" aria-label="Breadcrumb navigation">
    <a href="/">🏠 Home</a>
    <span class="breadcrumb-separator">›</span>
    <a href="/parent">Parent Section</a>
    <span class="breadcrumb-separator">›</span>
    <span class="breadcrumb-current">Current Page</span>
</nav>`}
            </pre>
          </div>

          <div className={styles.commandBox}>
            <code>python tools/design-linters/breadcrumb_linter.py</code>
          </div>
        </div>

        {/* Benefits Section */}
        <div className={styles.benefitsSection}>
          <h2 className={styles.benefitsTitle}>Why Custom Linters Matter</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>🤖</div>
              <div className={styles.benefitText}>Automated Enforcement</div>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>📈</div>
              <div className={styles.benefitText}>Consistent Quality</div>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>⚡</div>
              <div className={styles.benefitText}>Early Detection</div>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>🎓</div>
              <div className={styles.benefitText}>Team Learning</div>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>🔧</div>
              <div className={styles.benefitText}>Customizable Rules</div>
            </div>
            <div className={styles.benefitItem}>
              <div className={styles.benefitIcon}>🚀</div>
              <div className={styles.benefitText}>CI/CD Integration</div>
            </div>
          </div>
        </div>

        {/* Implementation Guide */}
        <div className={styles.linterCard}>
          <div className={styles.linterHeader}>
            <span className={styles.linterIcon}>🛠️</span>
            <h2 className={styles.linterTitle}>Implementation Guide</h2>
          </div>
          <p className={styles.linterDescription}>
            All custom linters are integrated into our CI/CD pipeline and run
            automatically on every pull request.
          </p>

          <div className={styles.featureGrid}>
            <div className={styles.featureItem}>
              <h4>📝 Running Locally</h4>
              <ul>
                <li>
                  Install dependencies: <code>pip install -r requirements.txt</code>
                </li>
                <li>
                  Run all linters: <code>make lint-custom</code>
                </li>
                <li>Run specific linter: See commands above</li>
                <li>
                  Auto-fix issues: Add <code>--fix</code> flag
                </li>
              </ul>
            </div>
            <div className={styles.featureItem}>
              <h4>🔄 CI/CD Integration</h4>
              <ul>
                <li>Runs on every PR automatically</li>
                <li>Blocks merge on violations</li>
                <li>Provides inline PR comments</li>
                <li>Generates violation reports</li>
              </ul>
            </div>
            <div className={styles.featureItem}>
              <h4>⚙️ Configuration</h4>
              <ul>
                <li>
                  Config file: <code>.linter-config.yaml</code>
                </li>
                <li>Exclude patterns supported</li>
                <li>Severity levels: error, warning, info</li>
                <li>Custom rules can be added</li>
              </ul>
            </div>
          </div>

          <div className={styles.implementationNote}>
            <strong>Pro Tip:</strong> Run linters locally before committing to catch
            issues early and save CI/CD time.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomLinters;
