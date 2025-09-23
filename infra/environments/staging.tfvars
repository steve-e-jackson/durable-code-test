# Staging Environment Configuration
# This file contains environment-specific values for the staging environment
# Balanced settings between cost and production-like behavior

environment = "staging"
aws_region  = "us-west-2"

# Domain Configuration
# Will be updated after domain registration in PR0
domain_name         = ""  # e.g., "staging.codewithai.dev"
create_route53_zone = false

# Cost Optimization Settings
enable_auto_shutdown = true   # Still shutdown during off-hours
use_fargate_spot    = false  # Use on-demand for more stability

# Moderate resource sizing for staging
fargate_cpu    = 512   # Double dev resources
fargate_memory = 1024  # Double dev memory
desired_count  = 2     # Two instances for HA testing
min_capacity   = 1     # Keep at least one running
max_capacity   = 3     # Allow some scaling

# Monitoring (basic monitoring enabled)
enable_container_insights = true
budget_amount            = 15.0  # Mid-range budget

# Security (some features enabled for testing)
enable_waf          = false  # Can be enabled if needed
enable_guardduty    = true   # Enable threat detection
enable_security_hub = false  # Optional

# CI/CD Configuration
github_branches = ["main", "release/*"]

# Additional tags for staging environment
additional_tags = {
  "Environment"     = "Staging"
  "CostOptimization" = "Moderate"
  "AutoShutdown"    = "Enabled"
  "Purpose"         = "Pre-production testing"
}