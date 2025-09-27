/**
 * Purpose: Vitest testing framework configuration for React frontend unit and integration tests
 *
 * Scope: Test runner configuration covering React components, utilities, and integration testing
 *
 * Overview: Configures Vitest testing framework with React Testing Library integration, JSDOM
 *     environment for browser simulation, and comprehensive coverage reporting. Includes test
 *     setup files, CSS processing support, and coverage thresholds to maintain code quality.
 *     Optimized for React component testing with proper environment variables and exclusion
 *     patterns for accurate coverage reporting.
 *
 * Dependencies: Vitest testing framework, React plugin for JSX support, JSDOM for browser environment
 *
 * Exports: Vitest configuration object with testing environment and coverage settings
 *
 * Interfaces: Vitest configuration schema with React-specific testing optimizations
 *
 * Implementation: Testing framework configuration with coverage enforcement and environment setup
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    env: {
      NODE_ENV: 'test',
    },
    // Coverage configuration
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/build/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
});
