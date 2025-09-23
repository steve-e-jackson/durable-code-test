# Development Environment Configuration
# This file contains environment-specific values for the dev environment
# Cost-optimized settings for development and testing

environment = "dev"
aws_region  = "us-west-2"

# Domain Configuration
# Will be updated after domain registration in PR0
domain_name         = ""  # e.g., "dev.codewithai.dev"
create_route53_zone = false

# Cost Optimization Settings
enable_auto_shutdown = true
use_fargate_spot    = true  # 70% cost savings for dev environment

# Minimal resource sizing for dev
fargate_cpu    = 256  # Minimum CPU
fargate_memory = 512  # Minimum memory
desired_count  = 1    # Single instance for dev
min_capacity   = 0    # Allow scale to zero
max_capacity   = 2    # Limited scaling for cost control

# Monitoring (minimal for cost savings)
enable_container_insights = false
budget_amount            = 10.0  # Lower budget for dev

# Security (optional features disabled for cost savings)
enable_waf          = false
enable_guardduty    = false
enable_security_hub = false

# CI/CD Configuration
github_branches = ["develop", "feature/*"]

# Additional tags for dev environment
additional_tags = {
  "Environment"     = "Development"
  "CostOptimization" = "Aggressive"
  "AutoShutdown"    = "Enabled"
  "FargateSpot"     = "Enabled"
}