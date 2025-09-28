# Base Infrastructure Variables
# Only includes variables needed for persistent base resources

# Core Configuration
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

# Networking Variables
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
  description = "Whether to create NAT Gateways for private subnets"
  type        = bool
  default     = true
}

# Domain and DNS Configuration
variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = ""
}

variable "create_route53_zone" {
  description = "Whether to create a Route53 hosted zone"
  type        = bool
  default     = false
}

# Security Variables (for base security groups)
variable "enable_waf" {
  description = "Enable AWS WAF for additional security (increases cost)"
  type        = bool
  default     = false
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}