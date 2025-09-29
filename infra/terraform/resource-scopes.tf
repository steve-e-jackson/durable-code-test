# Purpose: Define resource scopes for base vs runtime infrastructure separation
# Scope: Controls which resources are deployed/destroyed based on SCOPE parameter
# Overview: This file defines tags and metadata to separate persistent base resources
#     from ephemeral runtime resources. Base resources include VPC, NAT, ECR, Route53
#     which are expensive to recreate. Runtime resources include ECS, ALB listeners
#     which can be quickly recreated for cost savings.


locals {
  # Determine current deployment scope from variable
  deployment_scope = var.deployment_scope
}

# Variable to control deployment scope
variable "deployment_scope" {
  description = "Deployment scope: runtime, base, or all"
  type        = string
  default     = "all"

  validation {
    condition     = contains(["runtime", "base", "all"], var.deployment_scope)
    error_message = "The deployment_scope must be one of: runtime, base, all."
  }
}

# Helper locals for conditional resource creation
locals {
  # Determine if base resources should be created
  create_base_resources = var.deployment_scope == "base" || var.deployment_scope == "all"

  # Determine if runtime resources should be created
  create_runtime_resources = var.deployment_scope == "runtime" || var.deployment_scope == "all"

  # Helper function to check if a specific resource should be created
  should_create_resource = {
    # Base resources
    vpc        = local.create_base_resources
    networking = local.create_base_resources
    ecr        = local.create_base_resources
    route53    = local.create_base_resources
    acm        = local.create_base_resources
    alb        = local.create_base_resources # ALB itself is base

    # Runtime resources
    ecs_cluster       = local.create_runtime_resources
    ecs_services      = local.create_runtime_resources
    alb_listeners     = local.create_runtime_resources
    alb_target_groups = local.create_runtime_resources
    service_discovery = local.create_runtime_resources
    cloudwatch_logs   = local.create_runtime_resources
  }
}
