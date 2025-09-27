/**
 * Standards Page - Development Standards and Best Practices
 * Integrated React component to replace external HTML file
 */
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Standards.module.css';

function Standards() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTab = searchParams.get('return') || 'Building';

  const handleBackClick = () => {
    navigate(`/#${returnTab}`);
  };

  return (
    <div className={styles.standardsPage}>
      <div className={styles.breadcrumb}>
        <button onClick={handleBackClick} className={styles.breadcrumbLink}>
          ← Back to {returnTab}
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>Development Standards</span>
      </div>

      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Development Standards Guide</h1>
          <p className={styles.pageSubtitle}>
            Comprehensive guidelines for AI-assisted development and code quality
          </p>
        </header>

        <main className={styles.content}>
          <section>
            <h2 className={styles.sectionTitle}>Code Quality Standards</h2>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>Naming Conventions</h3>
              <ul className={styles.standardsList}>
                <li>
                  <strong>Variables:</strong> Use descriptive camelCase names (e.g.,{' '}
                  <code>userAccountBalance</code>)
                </li>
                <li>
                  <strong>Functions:</strong> Use verbs that describe actions (e.g.,{' '}
                  <code>calculateTotal</code>, <code>validateInput</code>)
                </li>
                <li>
                  <strong>Classes:</strong> Use PascalCase nouns (e.g.,{' '}
                  <code>UserAccount</code>, <code>PaymentProcessor</code>)
                </li>
                <li>
                  <strong>Constants:</strong> Use SCREAMING_SNAKE_CASE (e.g.,{' '}
                  <code>MAX_RETRY_ATTEMPTS</code>)
                </li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>Code Structure</h3>
              <ul className={styles.standardsList}>
                <li>Maximum function length: 50 lines</li>
                <li>Maximum file length: 500 lines</li>
                <li>Use TypeScript for all new code</li>
                <li>Include JSDoc comments for public APIs</li>
                <li>Follow SOLID principles</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Testing Standards</h2>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>Unit Testing</h3>
              <ul className={styles.standardsList}>
                <li>Minimum 80% code coverage</li>
                <li>
                  Test file naming: <code>ComponentName.test.tsx</code>
                </li>
                <li>Use descriptive test names that explain the scenario</li>
                <li>Follow Arrange-Act-Assert pattern</li>
              </ul>
            </div>

            <div className={styles.codeBlock}>
              <pre>{`// Example test structure
describe('UserAccount', () => {
  it('should calculate balance correctly when deposits exceed withdrawals', () => {
    // Arrange
    const account = new UserAccount(100);

    // Act
    account.deposit(50);
    account.withdraw(25);

    // Assert
    expect(account.getBalance()).toBe(125);
  });
});`}</pre>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>AI Development Guidelines</h2>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>Context Management</h3>
              <ul className={styles.standardsList}>
                <li>Maintain comprehensive README files</li>
                <li>Document business logic and domain knowledge</li>
                <li>Include examples of good and bad patterns</li>
                <li>Keep .ai folder updated with project context</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>Code Generation Standards</h3>
              <ul className={styles.standardsList}>
                <li>Always include error handling</li>
                <li>Add proper TypeScript types</li>
                <li>Include unit tests with generated code</li>
                <li>Follow existing project patterns</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>Quality Assurance</h2>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>Automated Checks</h3>
              <ul className={styles.standardsList}>
                <li>ESLint for code style</li>
                <li>Prettier for formatting</li>
                <li>TypeScript for type safety</li>
                <li>Custom linters for project-specific rules</li>
              </ul>
            </div>

            <div className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>CI/CD Requirements</h3>
              <ul className={styles.standardsList}>
                <li>All tests must pass</li>
                <li>No linting errors</li>
                <li>Type checking passes</li>
                <li>Build succeeds</li>
                <li>Security scans pass</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Standards;
