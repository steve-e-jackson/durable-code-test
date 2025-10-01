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

# Internet Gateway Lookup - Required for NAT Gateway dependencies
data "aws_internet_gateway" "main" {
  filter {
    name   = "attachment.vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# VPC Lookup - Find VPC created by base workspace
# Uses Name tag for reliable discovery since base workspace uses durable-code prefix
data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["durable-code-${local.environment}-vpc"]
  }

  filter {
    name   = "tag:Scope"
    values = ["base"]
  }

  filter {
    name   = "tag:ManagedBy"
    values = ["Terraform"]
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
    name   = "tag:Scope"
    values = ["base"]
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
    name   = "tag:Scope"
    values = ["base"]
  }
}

# ALB Security Group Lookup
# Uses durable-code prefix to match base workspace naming
data "aws_security_group" "alb" {
  filter {
    name   = "tag:Name"
    values = ["durable-code-${local.environment}-alb-sg"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# ECS Tasks Security Group Lookup
# Uses durable-code prefix to match base workspace naming
data "aws_security_group" "ecs_tasks" {
  filter {
    name   = "tag:Name"
    values = ["durable-code-${local.environment}-ecs-tasks-sg"]
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

# ALB moved to runtime workspace - created directly instead of looked up

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

