/**
 * Purpose: ESLint configuration for TypeScript React frontend with strict code quality rules
 *
 * Scope: Linting configuration covering TypeScript, React, and code quality standards
 *
 * Overview: Comprehensive ESLint setup integrating TypeScript, React hooks, and React refresh
 *     with strict coding standards. Enforces consistent code style, prevents common errors,
 *     and maintains high code quality across the frontend application. Includes rules for
 *     TypeScript best practices, React patterns, import organization, and general JavaScript
 *     quality standards with appropriate warnings and errors.
 *
 * Dependencies: ESLint core, TypeScript ESLint, React plugins, global environment definitions
 *
 * Exports: ESLint configuration object with rules, plugins, and environment settings
 *
 * Interfaces: ESLint configuration schema with TypeScript and React-specific rule sets
 *
 * Implementation: Configuration composition pattern with multiple rule set extensions
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
