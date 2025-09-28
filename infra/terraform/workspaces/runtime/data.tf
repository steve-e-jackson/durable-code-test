# Purpose: Data source definitions for cross-workspace resource references from base infrastructure
# Scope: Lookup of VPC, subnets, security groups, ECR repositories, ALB, and Route53 resources from base workspace
# Overview: This file contains data source definitions that enable the runtime workspace to reference
#     resources created and managed by the base infrastructure workspace. Instead of direct resource
#     references, the runtime workspace uses tag-based and name-based lookups to discover base
#     resources dynamically. This approach provides loose coupling between workspaces while
#     maintaining operational integrity. Data sources use consistent tagging strategies and naming
#     conventions established in the base workspace to ensure reliable resource discovery across
#     environments. The file includes comprehensive lookups for networking, security, container
#     registry, load balancer, and DNS resources required by runtime services.
# Dependencies: Base workspace must be deployed first with properly tagged resources
# Exports: Data source references for use throughout runtime workspace configuration
# Configuration: Uses environment-aware tags and naming patterns for resource discovery
# Environment: Filters resources based on local.environment from workspace name
# Related: Base workspace outputs.tf for available resources, ecs.tf and alb-listeners.tf for usage
# Implementation: Tag-based filtering with fallback to name-based lookups where appropriate

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for current AWS region
data "aws_region" "current" {}

# VPC Lookup - Find VPC created by base workspace
data "aws_vpc" "main" {
  filter {
    name   = "tag:Environment"
    values = [local.environment]
  }

  filter {
    name   = "tag:Scope"
    values = ["base"]
  }

  filter {
    name   = "tag:Project"
    values = [var.project_name]
  }
}

# Public Subnets Lookup - For ALB placement
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }

  filter {
    name   = "tag:Type"
    values = ["public"]
  }

  filter {
    name   = "tag:Environment"
    values = [local.environment]
  }
}

# Private Subnets Lookup - For ECS task placement
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }

  filter {
    name   = "tag:Type"
    values = ["private"]
  }

  filter {
    name   = "tag:Environment"
    values = [local.environment]
  }
}

# ALB Security Group Lookup
data "aws_security_group" "alb" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-${local.environment}-alb-sg"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# ECS Tasks Security Group Lookup
data "aws_security_group" "ecs_tasks" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-${local.environment}-ecs-tasks-sg"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# Backend ECR Repository Lookup
data "aws_ecr_repository" "backend" {
  name = "${var.product_domain}-${local.environment}-backend"
}

# Frontend ECR Repository Lookup
data "aws_ecr_repository" "frontend" {
  name = "${var.product_domain}-${local.environment}-frontend"
}

# Application Load Balancer Lookup
data "aws_lb" "main" {
  tags = {
    Name        = "${var.project_name}-${local.environment}-alb"
    Environment = local.environment
    Scope       = "base"
  }
}

# Route53 Hosted Zone Lookup (conditional - only if domain is configured)
data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

# ACM Certificate Lookup (conditional - only if domain is configured)
data "aws_acm_certificate" "main" {
  count  = var.domain_name != "" ? 1 : 0
  domain = var.domain_name

  statuses = ["ISSUED"]
  types    = ["AMAZON_ISSUED"]

  most_recent = true
}

# Add variable for domain name if not already present
variable "domain_name" {
  description = "Domain name for the application (optional)"
  type        = string
  default     = ""
}