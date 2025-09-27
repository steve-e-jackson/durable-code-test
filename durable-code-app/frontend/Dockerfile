# Purpose: Multi-stage Docker build configuration for React frontend production deployment
# Scope: Frontend containerization using nginx for production-ready static asset serving
# Overview: Implements secure multi-stage build process with Node.js build stage and nginx
#     production stage. The builder stage compiles React application with Vite bundler while
#     the production stage serves optimized static assets through nginx. Includes security
#     hardening with non-root user execution, health checks, and efficient layer caching.
#     Supports build-time HTML validation and production-optimized nginx configuration.
# Dependencies: Node.js 20, nginx alpine, React/Vite build tools, HTMLHint for validation
# Exports: Production-ready frontend container exposing port 3000 with nginx serving static assets
# Interfaces: HTTP static asset serving, nginx configuration, and container health endpoints
# Environment: Production deployment with optimized static asset delivery and security features
# Related: nginx configuration, React application, build pipeline, and deployment automation
# Implementation: Multi-stage build with security best practices and production optimization

# Multi-stage build for React frontend
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for building
RUN npm ci

# Install HTMLHint globally for build-time checking
RUN npm install -g htmlhint

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN adduser -D -u 1000 appuser && \
    chown -R appuser:appuser /usr/share/nginx/html && \
    chown -R appuser:appuser /var/cache/nginx && \
    chown -R appuser:appuser /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appuser /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
