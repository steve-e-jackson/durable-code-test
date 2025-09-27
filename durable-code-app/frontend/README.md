# Frontend Application

**Purpose**: React TypeScript frontend with oscilloscope visualization and real-time data display

**Scope**: Modern React application built with TypeScript and Vite for oscilloscope simulation interface

**Overview**: Provides a sophisticated frontend application built with React, TypeScript, and Vite featuring
    real-time oscilloscope visualization, WebSocket data streaming, and responsive design patterns.
    Implements advanced Canvas-based rendering for high-performance data visualization, custom React hooks
    for state management, and CSS Modules for component styling. The application connects to the backend
    via WebSocket for real-time data streaming and includes comprehensive error boundaries and performance
    monitoring capabilities.

**Dependencies**: React 18, TypeScript, Vite build tool, CSS Modules, WebSocket client libraries

**Exports**: Production-ready React application, development server, build artifacts, and component library

**Related**: Backend FastAPI service, Docker containerization, and deployment pipeline

**Implementation**: Modern React patterns with TypeScript, Vite tooling, and performance-optimized architecture

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run with Docker
docker build -t frontend .
docker run -p 3000:3000 frontend
```

## Development

This application uses React + TypeScript + Vite for optimal development experience.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
