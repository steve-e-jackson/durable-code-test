#!/bin/bash
# Purpose: Shell script for executing Playwright integration tests in Docker containers
# Scope: Automated test execution orchestration for browser-based integration testing
# Overview: This script coordinates the execution of Playwright integration tests within
#     Docker containers, providing network connectivity to application services and
#     ensuring proper browser automation setup. It handles container networking,
#     dependency installation, browser setup, and test execution with comprehensive
#     error handling and status reporting for CI/CD pipeline integration.
# Dependencies: Docker engine, bash shell, network connectivity to application containers
# Exports: Test execution results and exit codes for CI/CD pipeline integration
# Usage: ./run_tests_docker.sh (executed from project root or CI/CD environment)
# Environment: Development testing, CI/CD pipelines, automated integration testing
# Related: Dockerfile.playwright for container configuration and test files for execution
# Implementation: Docker container orchestration with network setup and dependency management

# Script to run Playwright tests in Docker using a simpler approach

# Colors for output
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}Running Playwright integration tests in Docker...${NC}"

# Run tests using Python container with Playwright
docker run --rm \
  --network durable-code-test_durable-network \
  -v $(pwd)/test/integration_test:/tests \
  -w /tests \
  python:3.11-slim bash -c "
    apt-get update && apt-get install -y wget gnupg
    pip install --no-cache-dir playwright pytest pytest-asyncio pytest-playwright
    playwright install-deps chromium
    playwright install chromium
    pytest -v test_oscilloscope_playwright.py --asyncio-mode=auto
  "

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Playwright tests completed successfully!${NC}"
else
  echo -e "${RED}✗ Playwright tests failed${NC}"
  exit 1
fi
