/**
 * Purpose: Vite build tool configuration for React frontend development and production builds
 *
 * Scope: Build system configuration covering development server, bundling, and deployment setup
 *
 * Overview: Configures Vite build tool with React plugin support, path aliases for clean imports,
 *     development server settings with proxy configuration for backend API integration, and
 *     bundle analysis capabilities. Includes development-focused optimizations like hot module
 *     replacement and production build optimizations for deployment. Sets up proxy routing
 *     to handle API requests during development and establishes import aliases for maintainable
 *     code organization.
 *
 * Dependencies: Vite build tool, React plugin for JSX support, Node.js path utilities
 *
 * Exports: Vite configuration object with plugins, server settings, and build options
 *
 * Interfaces: Vite configuration schema with development and production build settings
 *
 * Implementation: Configuration-as-code pattern with environment-specific optimizations
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Temporarily disabled due to development environment issue
    // visualizer({
    //   filename: './dist/stats.html',
    //   open: false,
    //   gzipSize: true,
    //   brotliSize: true,
    // }) as any,
  ],
  optimizeDeps: {
    include: ['matter-js']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
      '@styles': path.resolve(__dirname, './src/styles')
    }
  },
  server: {
    port: 5173,
    host: true, // Listen on all interfaces and accept connections from any hostname
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://durable-code-backend-main-dev:8000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxy
      },
    },
  },
  preview: {
    port: 5173,
  },
});
