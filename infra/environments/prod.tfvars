# Purpose: Production environment configuration with reliability and security focus
# Scope: Variable overrides specific to the production environment for infrastructure deployment
# Overview: This file provides environment-specific variable values for the production
#     infrastructure, prioritizing reliability, security, and performance while maintaining
#     cost efficiency where feasible. Uses on-demand Fargate instances for maximum
#     reliability with continuous 24/7 availability (no auto-shutdown). Resources are sized
#     for production workloads (512 CPU/1024 Memory) with a minimum of two instances for
#     high availability and fault tolerance. All security features are enabled including
#     WAF, GuardDuty, and Security Hub for comprehensive threat detection and compliance
#     monitoring. Full Container Insights provides detailed monitoring, alerting, and
#     operational visibility. The configuration targets a monthly budget of $25 while
#     ensuring production-grade reliability, security, and performance for end users.
# Dependencies: Requires variables defined in terraform/variables.tf and backend configuration
# Exports: Environment-specific variable overrides for production infrastructure deployment
# Configuration: Applied via terraform plan/apply -var-file=../environments/prod.tfvars
# Environment: Production environment with maximum reliability, security, and 24/7 availability
# Related: Links to dev.tfvars and staging.tfvars for environment comparison and configuration patterns
# Implementation: Uses on-demand Fargate, continuous availability, enhanced security features, and full monitoring

environment = "prod"
aws_region  = "us-west-2"

# Domain Configuration
domain_name         = "durableaicoding.net"  # Main production domain
create_route53_zone = true  # Create hosted zone for root domain

# Cost Optimization Settings
enable_auto_shutdown = false  # Always available in production
use_fargate_spot    = false  # Use on-demand for reliability

# Production resource sizing
fargate_cpu    = 512   # Balanced CPU
fargate_memory = 1024  # Balanced memory
desired_count  = 2     # Two instances for HA
min_capacity   = 2     # Maintain HA
max_capacity   = 4     # Allow scaling for traffic spikes

# Monitoring (full monitoring in production)
enable_container_insights = true
budget_amount            = 25.0  # Target budget

# Security (enhanced security for production)
enable_waf          = true   # Web Application Firewall
enable_guardduty    = true   # Threat detection
enable_security_hub = true   # Compliance monitoring

# CI/CD Configuration
github_branches = ["main"]  # Only main branch can deploy to prod

# Additional tags for production environment
additional_tags = {
  "Environment"     = "Production"
  "CostOptimization" = "Balanced"
  "Criticality"     = "High"
  "Compliance"      = "Required"
  "BackupRequired"  = "Yes"
}
