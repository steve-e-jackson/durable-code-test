# Purpose: Define local values and computed variables for consistent resource configuration
# Scope: Common values used across all Terraform resources
# Overview: This file centralizes frequently used values and computed expressions to ensure
#     consistency across the infrastructure. Local values include common tags, naming
#     prefixes, and conditional flags based on environment. Using locals reduces repetition,
#     makes updates easier, and ensures all resources follow the same patterns. The product
#     domain is incorporated into all naming conventions to maintain clear resource ownership
#     and improve cost tracking across AWS services.
# Dependencies: Variables from variables.tf
# Configuration: Automatically applied to resources that reference these locals

locals {
  # Common naming prefix including product domain
  name_prefix = "${var.product_domain}-${var.environment}"


  # Common tags applied to all resources (in addition to provider default tags)
  # Note: These tags supplement the default_tags defined in providers.tf
  # Avoid duplicating tags that are already in default_tags
  common_tags = {
    DeploymentTimestamp = formatdate("YYYY-MM-DD-hhmm", timestamp())
    DeploymentDate      = formatdate("YYYY-MM-DD", timestamp())
  }

  # Environment-specific flags
  is_production            = var.environment == "prod"
  enable_cost_optimization = !local.is_production






  # ECS configuration
  ecs_cluster_name = "${var.product_domain}-${var.environment}-cluster"
}
