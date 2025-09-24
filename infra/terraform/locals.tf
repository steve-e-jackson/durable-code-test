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

  # Extended name prefix with project name
  full_name_prefix = "${var.product_domain}-${var.project_name}-${var.environment}"

  # Common tags applied to all resources (in addition to provider default tags)
  common_tags = {
    ProductDomain       = var.product_domain
    Product             = var.project_name
    Environment         = var.environment
    ManagedBy           = "terraform"
    CostCenter          = "engineering"
    DeploymentTimestamp = formatdate("YYYY-MM-DD-hhmm", timestamp())
    DeploymentDate      = formatdate("YYYY-MM-DD", timestamp())
  }

  # Environment-specific flags
  is_production = var.environment == "prod"
  is_development = var.environment == "dev"
  enable_cost_optimization = !local.is_production

  # Cost optimization settings
  enable_spot_instances = local.enable_cost_optimization && var.use_fargate_spot
  enable_auto_shutdown = local.enable_cost_optimization && var.enable_auto_shutdown

  # Resource sizing based on environment
  task_cpu = local.is_production ? max(512, var.fargate_cpu) : var.fargate_cpu
  task_memory = local.is_production ? max(1024, var.fargate_memory) : var.fargate_memory

  # Scaling configuration
  min_capacity = local.enable_auto_shutdown ? 0 : var.min_capacity
  max_capacity = local.is_production ? var.max_capacity : min(3, var.max_capacity)

  # Monitoring configuration
  enable_detailed_monitoring = local.is_production || var.enable_container_insights

  # Security configuration
  enable_enhanced_security = local.is_production && (var.enable_waf || var.enable_guardduty || var.enable_security_hub)
}
