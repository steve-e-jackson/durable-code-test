#!/bin/bash
# Base workspace deployment script
# Deploys base infrastructure (VPC, NAT, ECR, Route53, ALB)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get environment parameter
ENV=${1:-dev}

if [[ -z "$ENV" ]]; then
    echo -e "${RED}Error: Environment parameter required${NC}"
    echo "Usage: $0 [dev|staging|prod]"
    exit 1
fi

echo -e "${YELLOW}Deploying base infrastructure for ${ENV} environment...${NC}"

# Navigate to base workspace
cd "$(dirname "$0")/../terraform/workspaces/base"

# Initialize workspace if not already initialized
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}Initializing base workspace...${NC}"
    terraform init -backend-config="../../backend-config/base-${ENV}.hcl"
else
    echo -e "${GREEN}Workspace already initialized${NC}"
fi

# Select or create workspace
echo -e "${YELLOW}Selecting workspace base-${ENV}...${NC}"
terraform workspace select "base-${ENV}" 2>/dev/null || terraform workspace new "base-${ENV}"

# Check for tfvars file
TFVARS_FILE="../../environments/${ENV}.tfvars"
if [ ! -f "$TFVARS_FILE" ]; then
    echo -e "${RED}Error: Terraform variables file not found: ${TFVARS_FILE}${NC}"
    echo -e "${YELLOW}Please create the file with your environment-specific values${NC}"
    exit 1
fi

# Plan the deployment
echo -e "${YELLOW}Planning base infrastructure changes...${NC}"
terraform plan -var-file="$TFVARS_FILE" -out="base-${ENV}.tfplan"

# Ask for confirmation
echo -e "${YELLOW}Do you want to apply these changes? (yes/no)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    rm -f "base-${ENV}.tfplan"
    exit 1
fi

# Apply the changes
echo -e "${YELLOW}Applying base infrastructure changes...${NC}"
terraform apply "base-${ENV}.tfplan"

# Clean up plan file
rm -f "base-${ENV}.tfplan"

# Show outputs
echo -e "${GREEN}Base infrastructure deployment complete!${NC}"
echo -e "${YELLOW}Key outputs:${NC}"
terraform output -json | jq -r 'to_entries[] | "\(.key): \(.value.value)"' | head -20

echo -e "${GREEN}Base workspace resources:${NC}"
echo "- VPC and networking"
echo "- NAT Gateways (if enabled)"
echo "- ECR repositories"
echo "- Security groups"
echo "- Application Load Balancer"
echo "- Route53 zone (if configured)"
echo "- ACM certificate (if configured)"

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy runtime infrastructure: ./workspace-deploy-runtime.sh ${ENV}"
echo "2. Deploy application code"