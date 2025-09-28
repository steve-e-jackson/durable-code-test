terraform {
  required_version = ">= 1.0"

  backend "s3" {
    # Backend configuration is provided via backend-config file
    # See infra/terraform/backend-config/base-{env}.hcl
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  workspace_name = terraform.workspace
  # Extract environment from workspace name (e.g., base-dev -> dev)
  environment    = length(split("-", terraform.workspace)) > 1 ? split("-", terraform.workspace)[1] : "dev"

  common_tags = {
    Environment = local.environment
    Workspace   = local.workspace_name
    ManagedBy   = "Terraform"
    Scope       = "base"
  }
}