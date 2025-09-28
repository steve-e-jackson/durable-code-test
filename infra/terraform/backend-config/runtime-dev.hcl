# Purpose: Backend configuration for runtime infrastructure workspace in dev environment
# Scope: S3 backend configuration for Terraform state management
# Overview: Defines the S3 backend settings for the runtime workspace which contains
#     ephemeral infrastructure resources like ECS services, ALB listeners, and target groups.
#     This configuration ensures runtime infrastructure state is stored separately
#     from base resources, enabling cost-optimized destroy/recreate cycles.
# Dependencies: S3 bucket and DynamoDB table must exist for state storage
# Environment: Development environment runtime workspace

bucket         = "durable-code-terraform-state"
key            = "runtime/dev/terraform.tfstate"
region         = "us-west-2"
encrypt        = true
dynamodb_table = "durable-code-terraform-locks"