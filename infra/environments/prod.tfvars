# Purpose: Production environment configuration with reliability and security focus
# Scope: Variable overrides specific to the production environment
# Overview: This file provides environment-specific variable values for the production
#     infrastructure, prioritizing reliability, security, and performance while maintaining
#     cost efficiency where possible. Uses on-demand Fargate instances for maximum
#     reliability with no auto-shutdown to ensure 24/7 availability. Resources are sized
#     for production workloads (512 CPU/1024 Memory) with a minimum of two instances for
#     high availability. All security features are enabled including WAF, GuardDuty, and
#     Security Hub for comprehensive threat detection and compliance monitoring. Full
#     Container Insights provides detailed monitoring and alerting. The configuration
#     targets a monthly budget of $25 while ensuring production-grade reliability,
#     security, and performance for end users.
# Dependencies: Requires variables defined in terraform/variables.tf
# Configuration: Applied via terraform plan/apply -var-file=../environments/prod.tfvars

environment = "prod"
aws_region  = "us-west-2"

# Domain Configuration
# Will be updated after domain registration in PR0
domain_name         = ""  # e.g., "codewithai.dev" or "www.codewithai.dev"
create_route53_zone = false

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