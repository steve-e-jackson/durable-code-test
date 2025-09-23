# Production Environment Configuration
# This file contains environment-specific values for the production environment
# Production-ready settings with cost optimization where appropriate

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