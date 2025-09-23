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
# Domain and DNS Outputs (will be populated after domain registration)
# ============================================================================

output "domain_name" {
  description = "Primary domain name for the application"
  value       = var.domain_name
  sensitive   = false
}

# Uncomment after Route53 zone is created
# output "route53_zone_id" {
#   description = "Route53 hosted zone ID"
#   value       = aws_route53_zone.main[0].zone_id
#   sensitive   = false
# }

# output "name_servers" {
#   description = "Name servers for the Route53 hosted zone"
#   value       = try(aws_route53_zone.main[0].name_servers, [])
#   sensitive   = false
# }

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

# ECR Repository URLs (PR2)
# output "ecr_frontend_url" {
#   description = "URL of the frontend ECR repository"
#   value       = aws_ecr_repository.frontend.repository_url
#   sensitive   = false
# }

# output "ecr_backend_url" {
#   description = "URL of the backend ECR repository"
#   value       = aws_ecr_repository.backend.repository_url
#   sensitive   = false
# }

# ECS Cluster (PR3)
# output "ecs_cluster_name" {
#   description = "Name of the ECS cluster"
#   value       = aws_ecs_cluster.main.name
#   sensitive   = false
# }

# ALB URL (PR4)
# output "alb_url" {
#   description = "URL of the Application Load Balancer"
#   value       = "https://${aws_lb.main.dns_name}"
#   sensitive   = false
# }

# output "application_url" {
#   description = "Primary application URL"
#   value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_lb.main.dns_name}"
#   sensitive   = false
# }