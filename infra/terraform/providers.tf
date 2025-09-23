# AWS Provider Configuration
# This file configures the AWS provider with appropriate settings
# for the Durable Code Test deployment infrastructure

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