# Purpose: Define AWS provider configuration with default tags and multi-region support
# Scope: AWS provider settings for all Terraform resources across environments
# Overview: This file configures the AWS provider with appropriate settings for deploying
#     infrastructure across multiple regions. It establishes default resource tagging for
#     cost tracking, compliance, and resource management. The configuration includes both
#     the primary provider for the main region and an aliased provider for us-east-1
#     (required for CloudFront certificates). Default tags ensure all resources are
#     properly labeled for cost allocation, project tracking, and automated management.
#     The provider configuration supports role assumption for cross-account deployments.
# Dependencies: AWS credentials configured via AWS CLI or environment variables
# Configuration: Uses variables from variables.tf for region and project settings
# Exports: Primary AWS provider and us-east-1 aliased provider for ACM certificates

provider "aws" {
  region = var.aws_region

  # Default tags applied to all resources created by Terraform
  # These tags are essential for cost tracking and resource management
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      CostCenter  = "durable-code"
      Repository  = "github.com/steve-e-jackson/durable-code-test"
      CreatedBy   = "terraform-${var.terraform_version}"
    }
  }

  # Assume role configuration (optional, for cross-account deployments)
  # Uncomment and configure if using role assumption
  # assume_role {
  #   role_arn = "arn:aws:iam::ACCOUNT_ID:role/TerraformDeploymentRole"
  # }
}

# Additional provider for ACM certificates in us-east-1
# Required for CloudFront distributions (if used in future)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      CostCenter  = "durable-code"
      Repository  = "github.com/steve-e-jackson/durable-code-test"
      CreatedBy   = "terraform-${var.terraform_version}"
    }
  }
}