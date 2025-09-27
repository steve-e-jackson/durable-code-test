/**
 * Purpose: ESLint configuration for TypeScript React application with strict rules
 * Scope: All TypeScript and TSX files in the frontend application
 * Overview: Comprehensive ESLint configuration that enforces code quality, type safety,
 *     and React best practices. Includes TypeScript strict rules, React hooks rules,
 *     accessibility standards, and custom rules for import organization and code style.
 *     Configured to work with modern React development including React Refresh.
 * Dependencies: ESLint, TypeScript ESLint, React plugins, globals configuration
 * Exports: ESLint configuration array for typescript-eslint config system
 * Props/Interfaces: ESLint configuration format with rules, plugins, and settings
 * Implementation: Flat config format with TypeScript parser and comprehensive rule set
 */

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.strict,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',

      // React rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-debugger': 'warn',

      // Import ordering (basic - can be enhanced with eslint-plugin-import later)
      'sort-imports': ['error', {
        'ignoreCase': true,
        'ignoreDeclarationSort': true
      }]
    }
  },
]);
