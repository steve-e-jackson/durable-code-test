# Purpose: Define Terraform output values for infrastructure resources and configuration
# Scope: Output values displayed after terraform apply and used by CI/CD pipelines
# Overview: This file defines all output values that expose important infrastructure
#     attributes after deployment. Outputs are organized into logical groups including
#     backend configuration, environment information, domain/DNS settings, and cost
#     management metrics. These outputs serve multiple purposes: displaying critical
#     information after terraform apply, providing values for CI/CD pipelines to consume,
#     enabling cross-stack references, and documenting the deployed infrastructure state.
#     Future outputs are commented but documented to show the complete deployment picture.
#     All sensitive values are properly marked to prevent accidental exposure in logs.
# Dependencies: References Terraform resources defined in the infrastructure modules
# Configuration: Outputs are automatically displayed after successful terraform apply
# Exports: Infrastructure endpoints, resource identifiers, and configuration values
# Implementation: Uses conditional logic for optional resources and try() for safe access

# ============================================================================
# S3 Backend Outputs
# ============================================================================

output "terraform_state_bucket" {
  description = "Name of the S3 bucket storing Terraform state"
  value       = "durable-code-terraform-state"
  sensitive   = false
}

output "terraform_locks_table" {
  description = "Name of the DynamoDB table for state locking"
  value       = "durable-code-terraform-locks"
  sensitive   = false
}

# ============================================================================
# Environment Information
# ============================================================================

output "environment" {
  description = "Current environment name"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "project_name" {
  description = "Project name used for resource naming"
  value       = var.project_name
}

# ============================================================================
# Domain and DNS Outputs
# ============================================================================

output "domain_name" {
  description = "Primary domain name for the application"
  value       = var.domain_name != "" ? var.domain_name : "Not configured"
  sensitive   = false
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = local.should_create_resource.route53 && var.create_route53_zone && var.domain_name != "" ? aws_route53_zone.main[0].zone_id : "Not created"
  sensitive   = false
}

output "name_servers" {
  description = "Name servers for the Route53 hosted zone"
  value       = local.should_create_resource.route53 && var.create_route53_zone && var.domain_name != "" ? aws_route53_zone.main[0].name_servers : []
  sensitive   = false
}

# ============================================================================
# Cost Management Outputs
# ============================================================================

output "monthly_budget" {
  description = "Monthly budget amount in USD"
  value       = var.budget_amount
}

output "auto_shutdown_enabled" {
  description = "Whether auto-shutdown scheduling is enabled"
  value       = var.enable_auto_shutdown
}

output "fargate_spot_enabled" {
  description = "Whether Fargate Spot is enabled for cost savings"
  value       = var.use_fargate_spot
}

# ============================================================================
# Future Infrastructure Outputs (to be added in subsequent PRs)
# ============================================================================

# ECR Repository URLs (PR2 - Complete)
output "ecr_frontend_url" {
  description = "URL of the frontend ECR repository"
  value       = local.should_create_resource.ecr ? aws_ecr_repository.frontend[0].repository_url : ""
  sensitive   = false
}

output "ecr_backend_url" {
  description = "URL of the backend ECR repository"
  value       = local.should_create_resource.ecr ? aws_ecr_repository.backend[0].repository_url : ""
  sensitive   = false
}

# ECS Cluster (PR3 - In Progress)
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = local.should_create_resource.ecs_cluster ? aws_ecs_cluster.main[0].name : "Not created"
  sensitive   = false
}

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = local.should_create_resource.ecs_cluster ? aws_ecs_cluster.main[0].id : "Not created"
  sensitive   = false
}

output "backend_service_name" {
  description = "Name of the backend ECS service"
  value       = local.should_create_resource.ecs_services ? aws_ecs_service.backend[0].name : "Not created"
  sensitive   = false
}

output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = local.should_create_resource.ecs_services ? aws_ecs_service.frontend[0].name : "Not created"
  sensitive   = false
}

output "backend_task_definition" {
  description = "ARN of the backend task definition"
  value       = local.should_create_resource.ecs_services ? aws_ecs_task_definition.backend[0].arn : "Not created"
  sensitive   = false
}

output "frontend_task_definition" {
  description = "ARN of the frontend task definition"
  value       = local.should_create_resource.ecs_services ? aws_ecs_task_definition.frontend[0].arn : "Not created"
  sensitive   = false
}

output "service_discovery_namespace" {
  description = "Service discovery namespace for internal communication"
  value       = local.should_create_resource.service_discovery ? aws_service_discovery_private_dns_namespace.main[0].name : "Not created"
  sensitive   = false
}

output "backend_internal_dns" {
  description = "Internal DNS name for backend service"
  value       = local.should_create_resource.service_discovery ? "backend.${aws_service_discovery_private_dns_namespace.main[0].name}" : "Not created"
  sensitive   = false
}

output "frontend_internal_dns" {
  description = "Internal DNS name for frontend service"
  value       = local.should_create_resource.service_discovery ? "frontend.${aws_service_discovery_private_dns_namespace.main[0].name}" : "Not created"
  sensitive   = false
}

# ============================================================================
# DynamoDB Outputs
# ============================================================================

output "contributions_table_name" {
  description = "Name of the DynamoDB table for contributions"
  value       = local.should_create_resource.contributions ? aws_dynamodb_table.contributions[0].name : "Not created"
  sensitive   = false
}

output "contributions_table_arn" {
  description = "ARN of the DynamoDB table for contributions"
  value       = local.should_create_resource.contributions ? aws_dynamodb_table.contributions[0].arn : "Not created"
  sensitive   = false
}

output "contributions_table_billing_mode" {
  description = "Billing mode of the contributions table"
  value       = local.should_create_resource.contributions ? aws_dynamodb_table.contributions[0].billing_mode : "Not created"
  sensitive   = false
}

# ============================================================================
# Application Load Balancer Outputs (PR4)
# ============================================================================

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
  sensitive   = false
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
  sensitive   = false
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
  sensitive   = false
}

output "alb_url" {
  description = "URL to access the application via ALB"
  value       = var.enable_https && length(aws_acm_certificate.main) > 0 ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
  sensitive   = false
}

# Target Group Outputs
output "frontend_target_group_arn" {
  description = "ARN of the frontend target group"
  value       = local.should_create_resource.alb_target_groups ? aws_lb_target_group.frontend[0].arn : "Not created"
  sensitive   = false
}

output "backend_target_group_arn" {
  description = "ARN of the backend target group"
  value       = local.should_create_resource.alb_target_groups ? aws_lb_target_group.backend[0].arn : "Not created"
  sensitive   = false
}

# Application URLs
output "application_urls" {
  description = "URLs to access the application"
  value = {
    alb_direct    = var.enable_https && length(aws_acm_certificate.main) > 0 ? "https://${aws_lb.main.dns_name}" : "http://${aws_lb.main.dns_name}"
    custom_domain = var.domain_name != "" ? (var.enable_https ? "https://${var.domain_name}" : "http://${var.domain_name}") : "Not configured"
    www_domain    = var.domain_name != "" ? (var.enable_https ? "https://www.${var.domain_name}" : "http://www.${var.domain_name}") : "Not configured"
    api_domain    = var.domain_name != "" ? (var.enable_https ? "https://api.${var.domain_name}" : "http://api.${var.domain_name}") : "Not configured"
    environment   = var.environment != "prod" && var.domain_name != "" ? (var.enable_https ? "https://${var.environment}.${var.domain_name}" : "http://${var.environment}.${var.domain_name}") : "N/A"
  }
  sensitive = false
}

# Certificate Output (when configured)
output "certificate_arn" {
  description = "ARN of the ACM certificate"
  value       = local.should_create_resource.acm && var.domain_name != "" && var.create_route53_zone ? aws_acm_certificate.main[0].arn : "Not created"
  sensitive   = false
}

output "certificate_status" {
  description = "Status of the ACM certificate"
  value       = local.should_create_resource.acm && var.domain_name != "" && var.create_route53_zone ? aws_acm_certificate.main[0].status : "Not created"
  sensitive   = false
}
