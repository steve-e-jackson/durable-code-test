# Purpose: Define resource scopes for base vs runtime infrastructure separation
# Scope: Controls which resources are deployed/destroyed based on SCOPE parameter
# Overview: This file defines tags and metadata to separate persistent base resources
#     from ephemeral runtime resources. Base resources include VPC, NAT, ECR, Route53
#     which are expensive to recreate. Runtime resources include ECS, ALB listeners
#     which can be quickly recreated for cost savings.

locals {
  # Define which resources belong to which scope
  resource_scope = {
    # Base/persistent resources - slow to provision, expensive to recreate
    base = {
      # Networking - takes time to provision NAT Gateway
      "aws_vpc.main"                        = true
      "aws_subnet.public"                   = true
      "aws_subnet.private"                  = true
      "aws_internet_gateway.main"           = true
      "aws_eip.nat"                         = true
      "aws_nat_gateway.main"                = true
      "aws_route_table.public"              = true
      "aws_route_table.private"             = true
      "aws_route_table_association.public"  = true
      "aws_route_table_association.private" = true
      "aws_security_group.alb"              = true
      "aws_security_group.ecs_tasks"        = true

      # ECR - Container registries
      "aws_ecr_repository.frontend"       = true
      "aws_ecr_repository.backend"        = true
      "aws_ecr_lifecycle_policy.frontend" = true
      "aws_ecr_lifecycle_policy.backend"  = true

      # Route53 and certificates - DNS takes 30+ mins to validate
      "aws_route53_zone.main"               = true
      "aws_acm_certificate.main"            = true
      "aws_route53_record.cert_validation"  = true
      "aws_acm_certificate_validation.main" = true

      # ALB itself (but not listeners/targets)
      "aws_lb.main" = true

      # DynamoDB tables - persistent data storage
      "aws_dynamodb_table.contributions" = true
      "aws_dynamodb_table.rate_limits"   = true
    }

    # Runtime/temporal resources - quick to provision, can be destroyed for cost savings
    runtime = {
      # ECS Cluster and Services
      "aws_ecs_cluster.main"             = true
      "aws_ecs_task_definition.backend"  = true
      "aws_ecs_task_definition.frontend" = true
      "aws_ecs_service.backend"          = true
      "aws_ecs_service.frontend"         = true

      # IAM roles for ECS
      "aws_iam_role.ecs_task_execution"                   = true
      "aws_iam_role.ecs_task"                             = true
      "aws_iam_role_policy_attachment.ecs_task_execution" = true

      # CloudWatch logs
      "aws_cloudwatch_log_group.backend"  = true
      "aws_cloudwatch_log_group.frontend" = true

      # ALB listeners and targets
      "aws_lb_target_group.backend"   = true
      "aws_lb_target_group.frontend"  = true
      "aws_lb_listener.http"          = true
      "aws_lb_listener.https"         = true
      "aws_lb_listener_rule.backend"  = true
      "aws_lb_listener_rule.frontend" = true

      # Service discovery
      "aws_service_discovery_private_dns_namespace.main" = true
      "aws_service_discovery_service.backend"            = true
      "aws_service_discovery_service.frontend"           = true

      # Route53 records pointing to ALB
      "aws_route53_record.alb" = true
      "aws_route53_record.www" = true
    }
  }

  # Determine current deployment scope from variable
  deployment_scope = var.deployment_scope

  # Tag all resources with their scope for easy identification
  scope_tags = {
    Scope     = local.deployment_scope
    ManagedBy = "Terraform"
  }
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
    vpc           = local.create_base_resources
    networking    = local.create_base_resources
    ecr           = local.create_base_resources
    route53       = local.create_base_resources
    acm           = local.create_base_resources
    alb           = local.create_base_resources # ALB itself is base
    contributions = local.create_base_resources # DynamoDB tables are persistent

    # Runtime resources
    ecs_cluster       = local.create_runtime_resources
    ecs_services      = local.create_runtime_resources
    alb_listeners     = local.create_runtime_resources
    alb_target_groups = local.create_runtime_resources
    service_discovery = local.create_runtime_resources
    cloudwatch_logs   = local.create_runtime_resources
  }
}
