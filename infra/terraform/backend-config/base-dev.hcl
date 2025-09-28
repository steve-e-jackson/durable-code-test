# Purpose: Backend configuration for base infrastructure workspace in dev environment
# Scope: S3 backend configuration for Terraform state management
# Overview: Defines the S3 backend settings for the base workspace which contains
#     persistent infrastructure resources like VPC, NAT Gateways, ECR repositories.
#     This configuration ensures base infrastructure state is stored separately
#     from runtime resources, enabling independent lifecycle management.
# Dependencies: S3 bucket and DynamoDB table must exist for state storage
# Environment: Development environment base workspace

bucket         = "durable-code-terraform-state"
key            = "base/dev/terraform.tfstate"
region         = "us-west-2"
encrypt        = true
dynamodb_table = "durable-code-terraform-locks"