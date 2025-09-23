# Backend configuration for Terraform state management
# This file configures S3 as the backend for storing Terraform state
# with DynamoDB for state locking to prevent concurrent modifications

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # S3 backend configuration for state storage
  # Note: The S3 bucket and DynamoDB table must be created manually before running terraform init
  # See ../scripts/setup-terraform-backend.sh for automated setup
  backend "s3" {
    # Bucket name must be globally unique
    # Recommended naming: [project]-[account-id]-terraform-state
    bucket = "durable-code-terraform-state"

    # Key path within the bucket for the state file
    key    = "infrastructure/terraform.tfstate"

    # AWS region where the bucket exists
    region = "us-west-2"

    # Enable state file encryption at rest
    encrypt = true

    # DynamoDB table for state locking
    # Table must have a primary key named "LockID" of type String
    dynamodb_table = "durable-code-terraform-locks"

    # Enable versioning to maintain state history
    # The S3 bucket must have versioning enabled
    # versioning_enabled = true  # This is set on the bucket, not here
  }
}