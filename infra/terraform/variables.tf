# Purpose: Define all input variables for Terraform infrastructure with validation and defaults
# Scope: Infrastructure configuration across all AWS resources and environments
# Overview: This file centralizes all input variables used throughout the Terraform configuration,
#     providing a single source of truth for infrastructure parameters. Variables are organized
#     into logical groups covering core configuration, cost optimization, resource sizing,
#     monitoring, security, and CI/CD settings. Each variable includes validation rules,
#     descriptions, and sensible defaults optimized for cost efficiency. The configuration
#     supports multiple environments (dev, staging, prod) with environment-specific overrides
#     via tfvars files. Cost optimization is a primary focus, with variables for auto-shutdown,
#     Fargate Spot, and minimal resource sizing to keep costs under $25/month.
# Dependencies: Used by all Terraform modules and resources
# Configuration: Overridden by environment-specific tfvars files (dev.tfvars, staging.tfvars, prod.tfvars)
# Interfaces: Variables are referenced throughout the infrastructure code as var.<name>
# Implementation: Includes validation blocks to ensure values meet requirements

# ============================================================================
# Core Configuration Variables
# ============================================================================

variable "product_domain" {
  description = "Product domain identifier for resource naming and tagging"
  type        = string
  default     = "durableai"

  validation {
    condition     = can(regex("^[a-z][a-z0-9]*$", var.product_domain))
    error_message = "Product domain must start with a letter and contain only lowercase letters and numbers."
  }
}

variable "project_name" {
  description = "Name of the project, used as a prefix for all resources"
  type        = string
  default     = "durable-code"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]*$", var.project_name))
    error_message = "Project name must start with a letter and contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "terraform_version" {
  description = "Terraform version for tagging purposes"
  type        = string
  default     = "1.0"
}

# ============================================================================
# Domain and DNS Configuration
# ============================================================================

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = ""  # Will be set after domain registration
}

variable "create_route53_zone" {
  description = "Whether to create a Route53 hosted zone"
  type        = bool
  default     = false  # Set to true after domain registration
}

# ============================================================================
# Cost Optimization Variables
# ============================================================================

variable "enable_auto_shutdown" {
  description = "Enable automatic shutdown/startup scheduling for cost savings"
  type        = bool
  default     = true
}

variable "shutdown_schedule" {
  description = "Cron expression for shutdown schedule (UTC)"
  type        = string
  default     = "0 4 ? * MON-FRI *"  # 8 PM PST on weekdays
}

variable "startup_schedule" {
  description = "Cron expression for startup schedule (UTC)"
  type        = string
  default     = "0 16 ? * MON-FRI *"  # 8 AM PST on weekdays
}

variable "use_fargate_spot" {
  description = "Use Fargate Spot for cost savings (non-production only)"
  type        = bool
  default     = false  # Will be true for dev/staging
}

# ============================================================================
# Resource Sizing Variables
# ============================================================================

variable "fargate_cpu" {
  description = "CPU units for Fargate tasks (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256  # Minimum for cost optimization
}

variable "fargate_memory" {
  description = "Memory in MB for Fargate tasks"
  type        = number
  default     = 512  # Minimum for cost optimization
}

variable "desired_count" {
  description = "Desired number of running tasks"
  type        = number
  default     = 1  # Minimum for dev environment
}

variable "max_capacity" {
  description = "Maximum number of tasks for auto-scaling"
  type        = number
  default     = 3  # Conservative limit for cost control
}

variable "min_capacity" {
  description = "Minimum number of tasks for auto-scaling"
  type        = number
  default     = 0  # Allow scale to zero during off-hours
}

# ============================================================================
# Monitoring and Alerting Variables
# ============================================================================

variable "budget_amount" {
  description = "Monthly budget amount in USD for cost alerts"
  type        = number
  default     = 25.0
}

variable "alert_email" {
  description = "Email address for receiving alerts"
  type        = string
  default     = ""  # Must be provided via environment-specific tfvars
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights for detailed monitoring"
  type        = bool
  default     = false  # Disabled by default for cost savings
}

# ============================================================================
# Security Variables
# ============================================================================

variable "enable_waf" {
  description = "Enable AWS WAF for additional security (increases cost)"
  type        = bool
  default     = false
}

variable "enable_guardduty" {
  description = "Enable AWS GuardDuty for threat detection"
  type        = bool
  default     = false  # Can be enabled later if needed
}

variable "enable_security_hub" {
  description = "Enable AWS Security Hub for compliance monitoring"
  type        = bool
  default     = false  # Can be enabled later if needed
}

# ============================================================================
# CI/CD Variables
# ============================================================================

variable "github_repository" {
  description = "GitHub repository for OIDC configuration (owner/repo)"
  type        = string
  default     = "steve-e-jackson/durable-code-test"
}

variable "github_branches" {
  description = "List of GitHub branches allowed to deploy"
  type        = list(string)
  default     = ["main", "develop"]
}

# ============================================================================
# Networking Variables
# ============================================================================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "az_count" {
  description = "Number of availability zones to use"
  type        = number
  default     = 2

  validation {
    condition     = var.az_count >= 1 && var.az_count <= 6
    error_message = "AZ count must be between 1 and 6."
  }
}

variable "enable_nat_gateway" {
  description = "Whether to create NAT Gateways for private subnets (set to false for cost savings in dev)"
  type        = bool
  default     = true
}

# ============================================================================
# Tags
# ============================================================================

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
