# Purpose: Main Terraform configuration entry point for infrastructure deployment
# Scope: Coordinates all infrastructure modules and resources for the durable-code application
# Overview: This file serves as the primary entry point for the Terraform configuration,
#     defining the core infrastructure resources including data sources and module inclusions.
#     It establishes the foundation for a cost-optimized AWS deployment using ECS Fargate,
#     with emphasis on minimal resource usage and auto-shutdown capabilities. The configuration
#     is designed to maintain monthly costs under $25 while providing a production-ready
#     infrastructure pattern. All resources are properly tagged for cost tracking and
#     management. The architecture supports multiple environments (dev, staging, prod)
#     with environment-specific optimizations defined in tfvars files.
# Dependencies: Requires backend.tf, providers.tf, and variables.tf to be configured
# Configuration: Uses variables from variables.tf and environment-specific tfvars files
# Implementation: Includes data sources and locals for dynamic resource configuration

# Data source for current AWS caller identity (account ID, user ID, etc.)
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}

# Data source for available availability zones in the current region
data "aws_availability_zones" "available" {
  state = "available"
}
