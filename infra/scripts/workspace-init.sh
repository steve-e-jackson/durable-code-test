#!/bin/bash
# Purpose: Initialize and select Terraform workspaces for base/runtime infrastructure separation
# Scope: Terraform workspace management for multi-environment deployments
# Overview: This script handles the initialization of Terraform workspaces with appropriate
#     backend configurations. It creates or selects workspaces named in the format
#     {workspace}-{environment} (e.g., base-dev, runtime-prod) and configures the S3
#     backend for state isolation. Supports base and runtime workspaces across dev,
#     staging, and prod environments.
# Dependencies: Terraform CLI, AWS credentials, backend-config files
# Usage: ./workspace-init.sh [base|runtime] [dev|staging|prod]
# Example: ./workspace-init.sh base dev

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print usage information
usage() {
    echo "Usage: $0 [base|runtime] [dev|staging|prod]"
    echo ""
    echo "Initialize and select Terraform workspaces for infrastructure management."
    echo ""
    echo "Arguments:"
    echo "  workspace  Type of workspace (base or runtime)"
    echo "  env        Environment (dev, staging, or prod)"
    echo ""
    echo "Examples:"
    echo "  $0 base dev      # Initialize base workspace for development"
    echo "  $0 runtime prod  # Initialize runtime workspace for production"
    exit 1
}

# Validate arguments
if [ $# -ne 2 ]; then
    print_message "$RED" "Error: Incorrect number of arguments"
    usage
fi

WORKSPACE=$1
ENV=$2

# Validate workspace argument
if [[ "$WORKSPACE" != "base" && "$WORKSPACE" != "runtime" ]]; then
    print_message "$RED" "Error: Invalid workspace '$WORKSPACE'. Must be 'base' or 'runtime'"
    usage
fi

# Validate environment argument
if [[ "$ENV" != "dev" && "$ENV" != "staging" && "$ENV" != "prod" ]]; then
    print_message "$RED" "Error: Invalid environment '$ENV'. Must be 'dev', 'staging', or 'prod'"
    usage
fi

# Set workspace name
WORKSPACE_NAME="${WORKSPACE}-${ENV}"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Set paths
WORKSPACE_DIR="${PROJECT_ROOT}/infra/terraform/workspaces/${WORKSPACE}"
BACKEND_CONFIG="${PROJECT_ROOT}/infra/terraform/backend-config/${WORKSPACE}-${ENV}.hcl"

# Check if backend config exists
if [ ! -f "$BACKEND_CONFIG" ]; then
    print_message "$RED" "Error: Backend configuration not found: $BACKEND_CONFIG"
    exit 1
fi

# Check if workspace directory exists
if [ ! -d "$WORKSPACE_DIR" ]; then
    print_message "$YELLOW" "Warning: Workspace directory not found: $WORKSPACE_DIR"
    print_message "$YELLOW" "This is expected for PR1. Directory will be fully configured in PR2/PR3."
    # Create a temporary main.tf for testing in PR1
    mkdir -p "$WORKSPACE_DIR"
    cat > "$WORKSPACE_DIR/main.tf" << 'EOF'
# Temporary configuration for workspace initialization testing
# This file will be replaced with actual infrastructure in PR2/PR3

terraform {
  backend "s3" {
    # Backend configuration provided via -backend-config flag
  }
}

provider "aws" {
  region = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

output "workspace_name" {
  value       = terraform.workspace
  description = "Current workspace name"
}

output "message" {
  value       = "Workspace ${terraform.workspace} initialized successfully"
  description = "Initialization status message"
}
EOF
fi

print_message "$CYAN" "========================================="
print_message "$CYAN" "Terraform Workspace Initialization"
print_message "$CYAN" "========================================="
print_message "$GREEN" "Workspace: $WORKSPACE"
print_message "$GREEN" "Environment: $ENV"
print_message "$GREEN" "Workspace Name: $WORKSPACE_NAME"
print_message "$GREEN" "Directory: $WORKSPACE_DIR"
print_message "$GREEN" "Backend Config: $BACKEND_CONFIG"
print_message "$CYAN" "========================================="

# Change to workspace directory
cd "$WORKSPACE_DIR"

# Initialize Terraform with backend config
print_message "$YELLOW" "Initializing Terraform backend..."
if terraform init -backend-config="$BACKEND_CONFIG" -reconfigure; then
    print_message "$GREEN" "✓ Terraform backend initialized successfully"
else
    print_message "$RED" "✗ Failed to initialize Terraform backend"
    exit 1
fi

# Create or select workspace
print_message "$YELLOW" "Selecting workspace: $WORKSPACE_NAME..."
if terraform workspace select "$WORKSPACE_NAME" 2>/dev/null; then
    print_message "$GREEN" "✓ Switched to existing workspace: $WORKSPACE_NAME"
else
    print_message "$YELLOW" "Workspace doesn't exist. Creating new workspace: $WORKSPACE_NAME..."
    if terraform workspace new "$WORKSPACE_NAME"; then
        print_message "$GREEN" "✓ Created and switched to new workspace: $WORKSPACE_NAME"
    else
        print_message "$RED" "✗ Failed to create workspace: $WORKSPACE_NAME"
        exit 1
    fi
fi

# Show current workspace
CURRENT_WORKSPACE=$(terraform workspace show)
print_message "$CYAN" "========================================="
print_message "$GREEN" "Current workspace: $CURRENT_WORKSPACE"
print_message "$CYAN" "========================================="

# List all workspaces
print_message "$CYAN" "Available workspaces:"
terraform workspace list

print_message "$GREEN" "✓ Workspace initialization complete!"
print_message "$CYAN" "You can now run Terraform commands in workspace: $WORKSPACE_NAME"