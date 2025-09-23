# Purpose: Staging environment configuration balancing cost efficiency with production-like behavior
# Scope: Variable overrides specific to the staging/pre-production environment
# Overview: This file provides environment-specific variable values for the staging
#     infrastructure, balancing cost optimization with the need for production-like
#     testing conditions. Uses on-demand Fargate instances for stability while still
#     implementing auto-shutdown scheduling to reduce costs during off-hours. Resources
#     are sized moderately (512 CPU/1024 Memory) with two instances for high-availability
#     testing. Container Insights and GuardDuty are enabled to test monitoring and
#     security features before production. The configuration targets a monthly budget
#     of $15 while providing a realistic testing environment for pre-production validation,
#     performance testing, and user acceptance testing.
# Dependencies: Requires variables defined in terraform/variables.tf
# Configuration: Applied via terraform plan/apply -var-file=../environments/staging.tfvars

environment = "staging"
aws_region  = "us-west-2"

# Domain Configuration
domain_name         = "staging.durableaicoding.net"
create_route53_zone = true  # Create hosted zone for staging subdomain

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