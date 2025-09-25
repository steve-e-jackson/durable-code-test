# How to Use the FeatureCard Component

## Overview
The FeatureCard component is a standardized, reusable UI component that ensures visual consistency across all feature tabs. Created to solve the problem of tabs having different visual structures, it provides a unified look and feel where only content changes between tabs.

## Key Benefits
- **Visual Consistency**: All tabs use identical card structures
- **Maintainability**: Single component to maintain styling
- **Accessibility**: Built-in keyboard navigation and ARIA support
- **Flexibility**: Supports various badge types and interaction patterns

## Basic Usage

### Import the Component
```tsx
import { FeatureCard } from '../../../../components/common';
import { FaRocket, FaBolt } from 'react-icons/fa';
```

### Define Feature Data
```tsx
const myFeatures = [
  {
    icon: <FaRocket />,
    title: 'Feature Name',
    description: 'Brief description of what this feature does',
    linkText: 'View Feature',
    linkHref: '/path/to/feature?return=CurrentTab',
    badge: { text: 'Essential', variant: 'essential' as const },
  },
  // ... more features
];
```

### Render the Grid
```tsx
return (
  <div className={styles.container}>
    {/* Hero Section */}
    <div className={styles.hero}>
      <h3 className="hero-title">Your Tab Title</h3>
      <p className="subtitle">Your tab description</p>
    </div>

    {/* Feature Grid */}
    <div className={styles.grid}>
      {myFeatures.map((feature, index) => (
        <FeatureCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          linkText={feature.linkText}
          linkHref={feature.linkHref}
          badge={feature.badge}
        />
      ))}
    </div>
  </div>
);
```

## Required CSS Grid Styles
Add to your component's CSS module:

```css
/* Feature Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
```

## Badge Variants
Choose the appropriate badge variant for your feature:

- `essential` - Red badge for critical features
- `active` - Purple badge for currently active features
- `strategic` - Blue badge for high-level strategic features
- `technical` - Gray badge for technical implementation details
- `quality` - Green badge for quality assurance features
- `visual` - Orange badge for visual/design features
- `timeline` - Yellow badge for time-sensitive features
- `neutral` - Default gray badge

## Link Patterns
Follow consistent link patterns for navigation:

```tsx
linkHref: '/feature-path?return=TabName'
```

This allows users to return to the current tab after visiting the linked page.

## Interactive Cards (Optional)
For cards that need click handlers in addition to links:

```tsx
<FeatureCard
  // ... other props
  onClick={() => handleCardClick(feature.id)}
/>
```

## Complete Example: Building a New Tab

```tsx
import type { ReactElement } from 'react';
import { FeatureCard } from '../../../../components/common';
import styles from './MyTab.module.css';
import { FaCode, FaGear, FaRocket } from 'react-icons/fa';

export function MyTab(): ReactElement {
  const myFeatures = [
    {
      icon: <FaCode />,
      title: 'Code Generation',
      description: 'AI-powered code generation tools',
      linkText: 'View Generator',
      linkHref: '/code-gen?return=MyTab',
      badge: { text: 'Essential', variant: 'essential' as const },
    },
    {
      icon: <FaGear />,
      title: 'Configuration',
      description: 'System configuration and settings',
      linkText: 'View Config',
      linkHref: '/config?return=MyTab',
      badge: { text: 'Technical', variant: 'technical' as const },
    },
    {
      icon: <FaRocket />,
      title: 'Deployment',
      description: 'Automated deployment workflows',
      linkText: 'View Deploy',
      linkHref: '/deploy?return=MyTab',
      badge: { text: 'Active', variant: 'active' as const },
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h3 className="hero-title">My Feature Tab</h3>
        <p className="subtitle">
          Description of what this tab covers and why it matters
        </p>
      </div>

      <div className={styles.grid}>
        {myFeatures.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            linkText={feature.linkText}
            linkHref={feature.linkHref}
            badge={feature.badge}
          />
        ))}
      </div>
    </div>
  );
}
```

## CSS Module Template (MyTab.module.css)

```css
.container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Hero Section */
.hero {
  text-align: center;
  margin-bottom: 3rem;
  padding: 3rem;
  background: linear-gradient(
    135deg,
    var(--color-primary-50) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
  border-radius: 16px;
  border: 1px solid var(--color-border-light);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
}

/* Feature Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
```

## Design Principles
1. **Consistency First**: All tabs should look nearly identical
2. **Content Driven**: Only the features data should change between tabs
3. **Icon Selection**: Use FontAwesome icons that clearly represent the feature
4. **Badge Appropriateness**: Choose badge variants that accurately reflect feature status
5. **Link Navigation**: Always include return parameters for proper navigation flow

## Testing
When using FeatureCard components, ensure your tests account for the standard structure:
- Icon elements
- Title text
- Description text
- Link elements with proper hrefs
- Badge elements

## Migration from Custom Structures
When converting existing tabs to use FeatureCard:
1. Extract the essential information (title, description, links)
2. Choose appropriate icons from react-icons/fa
3. Map existing styling to badge variants
4. Update tests to expect the new structure
5. Maintain any custom click behaviors through the onClick prop

This component represents the principle of "nearly indistinguishable in what elements are present, and their look and feel, only content changes."
