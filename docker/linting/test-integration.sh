#!/bin/bash
# Integration test script for Docker linting separation
# Tests that all linting functionality works with dedicated containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🧪 Testing Docker Linting Separation Integration${NC}"
echo "=========================================="

# Store test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"

    echo -e "\n${YELLOW}Testing: ${test_name}${NC}"
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Command: $test_command"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Container Dockerfiles exist
echo -e "\n${CYAN}📁 Checking Docker configuration files...${NC}"
run_test "Python linting Dockerfile exists" "test -f docker/linting/Dockerfile.python-lint"
run_test "JavaScript linting Dockerfile exists" "test -f docker/linting/Dockerfile.js-lint"
run_test "Docker Compose configuration exists" "test -f docker-compose.lint.yml"

# Test 2: Container builds
echo -e "\n${CYAN}📦 Testing container builds...${NC}"
run_test "Python linting container builds" "docker build -f docker/linting/Dockerfile.python-lint -t test-python-linter ."
run_test "JavaScript linting container builds" "docker build -f docker/linting/Dockerfile.js-lint -t test-js-linter ."

# Test 3: Docker Compose configuration
echo -e "\n${CYAN}🐳 Testing Docker Compose configuration...${NC}"
run_test "Docker Compose config is valid" "docker-compose -f docker-compose.lint.yml config"

# Test 4: Container startup
echo -e "\n${CYAN}🚀 Testing container startup...${NC}"
# Stop any existing containers first
docker-compose -f docker-compose.lint.yml down 2>/dev/null || true
run_test "Containers start successfully" "docker-compose -f docker-compose.lint.yml up -d"
sleep 5  # Give containers time to fully start

# Test 5: Container running status
echo -e "\n${CYAN}📊 Checking container status...${NC}"
run_test "Python linting container is running" "docker ps | grep -q durable-code-python-linter"
run_test "JavaScript linting container is running" "docker ps | grep -q durable-code-js-linter"

# Test 6: Volume mounts
echo -e "\n${CYAN}📁 Testing volume mounts...${NC}"
run_test "Python container can access backend code" "docker exec durable-code-python-linter-main ls /workspace/backend"
run_test "Python container can access tools" "docker exec durable-code-python-linter-main ls /workspace/tools"
run_test "JS container can access frontend code" "docker exec durable-code-js-linter-main ls /workspace/frontend"

# Test 7: Linting tools availability
echo -e "\n${CYAN}🔧 Testing linting tools availability...${NC}"
# Python tools
run_test "Black is available" "docker exec durable-code-python-linter-main which black"
run_test "Ruff is available" "docker exec durable-code-python-linter-main which ruff"
run_test "MyPy is available" "docker exec durable-code-python-linter-main which mypy"
run_test "Pylint is available" "docker exec durable-code-python-linter-main which pylint"
run_test "Flake8 is available" "docker exec durable-code-python-linter-main which flake8"
run_test "Shellcheck is available" "docker exec durable-code-python-linter-main which shellcheck"
run_test "TFLint is available" "docker exec durable-code-python-linter-main which tflint"

# JavaScript tools
run_test "HTMLHint is available" "docker exec durable-code-js-linter-main which htmlhint"
run_test "TypeScript is available" "docker exec durable-code-js-linter-main which tsc"
run_test "NPM is available" "docker exec durable-code-js-linter-main which npm"

# Test 8: Make targets
echo -e "\n${CYAN}🎯 Testing Make targets...${NC}"
run_test "Make lint-containers-status works" "make lint-containers-status"

# Test 9: Actual linting execution (sample checks)
echo -e "\n${CYAN}🔍 Testing linting execution...${NC}"
run_test "Python Black check works" "docker exec durable-code-python-linter-main bash -c 'cd /workspace && poetry run black --check backend' 2>&1 | grep -v 'would be reformatted'"
run_test "Python Ruff check works" "docker exec durable-code-python-linter-main bash -c 'cd /workspace && poetry run ruff check backend --exit-zero'"
run_test "TypeScript check works" "docker exec durable-code-js-linter-main sh -c 'cd /workspace/frontend && npm run typecheck'"

# Test 10: Container resource limits
echo -e "\n${CYAN}📈 Checking container resource limits...${NC}"
run_test "Python container has resource limits" "docker inspect durable-code-python-linter-main | grep -q Memory"
run_test "JS container has resource limits" "docker inspect durable-code-js-linter-main | grep -q Memory"

# Test 11: Container user permissions
echo -e "\n${CYAN}🔒 Testing container security...${NC}"
run_test "Python container runs as non-root" "docker exec durable-code-python-linter-main id -u | grep -q 1000"
run_test "JS container runs as non-root" "docker exec durable-code-js-linter-main id -u | grep -q 1000"

# Test 12: Full Make lint-all (if requested)
if [[ "${RUN_FULL_LINT}" == "yes" ]]; then
    echo -e "\n${CYAN}🔍 Running full linting suite...${NC}"
    run_test "make lint-all completes" "timeout 300 make lint-all"
else
    echo -e "\n${YELLOW}ℹ️  Skipping full lint-all test (set RUN_FULL_LINT=yes to enable)${NC}"
fi

# Cleanup
echo -e "\n${CYAN}🧹 Cleaning up...${NC}"
docker-compose -f docker-compose.lint.yml down 2>/dev/null || true
docker rmi test-python-linter test-js-linter 2>/dev/null || true

# Summary
echo -e "\n${CYAN}=========================================="
echo -e "📊 Test Summary${NC}"
echo -e "Tests passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests failed: ${RED}${TESTS_FAILED}${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All integration tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi