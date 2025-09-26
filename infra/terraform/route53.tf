# Purpose: Route53 DNS configuration for domain management and record creation
# Scope: Hosted zones, DNS records, and health checks for the application domain
# Overview: This file manages DNS configuration through AWS Route53, including the creation
#     of hosted zones for custom domains and DNS records pointing to the Application Load
#     Balancer. It supports both apex domain (example.com) and subdomain (www.example.com)
#     configurations with proper aliasing to the ALB. The configuration includes health
#     checks for monitoring domain availability and proper DNS resolution. Cost optimization
#     is considered with conditional resource creation based on domain availability.
#     Estimated cost: $0.50/month per hosted zone plus $0.40 per million queries.
# Dependencies: Requires alb.tf for ALB DNS name, acm.tf for certificate validation
# Configuration: Uses variables for domain names and conditional creation
# Implementation: Creates hosted zone and A/AAAA records with ALB aliasing

# Route53 Hosted Zone (only created when domain is configured)
resource "aws_route53_zone" "main" {
  count = local.should_create_resource.route53 && var.domain_name != "" && var.create_route53_zone ? 1 : 0

  name    = var.domain_name
  comment = "Hosted zone for ${var.project_name} ${var.environment} environment"

  tags = merge(
    local.common_tags,
    {
      Name        = "${var.project_name}-${var.environment}-zone"
      Domain      = var.domain_name
      Environment = var.environment
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# A Record for apex domain pointing to ALB
resource "aws_route53_record" "apex" {
  count = local.should_create_resource.alb_listeners && var.domain_name != "" && var.create_route53_zone ? 1 : 0

  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# AAAA Record for apex domain (IPv6) pointing to ALB
resource "aws_route53_record" "apex_ipv6" {
  count = local.should_create_resource.alb_listeners && var.domain_name != "" && var.create_route53_zone ? 1 : 0

  zone_id = aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# A Record for www subdomain pointing to ALB
resource "aws_route53_record" "www" {
  count = local.should_create_resource.alb_listeners && var.domain_name != "" && var.create_route53_zone ? 1 : 0

  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# AAAA Record for www subdomain (IPv6) pointing to ALB
resource "aws_route53_record" "www_ipv6" {
  count = local.should_create_resource.alb_listeners && var.domain_name != "" && var.create_route53_zone ? 1 : 0

  zone_id = aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "AAAA"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Environment-specific subdomain
resource "aws_route53_record" "env" {
  count = local.should_create_resource.alb_listeners && var.domain_name != "" && var.create_route53_zone && var.environment != "prod" ? 1 : 0

  zone_id = aws_route53_zone.main[0].zone_id
  name    = "${var.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# API subdomain
resource "aws_route53_record" "api" {
  count = local.should_create_resource.alb_listeners && var.domain_name != "" && var.create_route53_zone ? 1 : 0

  zone_id = aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Environment-specific API subdomain
resource "aws_route53_record" "api_env" {
  count = local.should_create_resource.alb_listeners && var.domain_name != "" && var.create_route53_zone && var.environment != "prod" ? 1 : 0

  zone_id = aws_route53_zone.main[0].zone_id
  name    = "api-${var.environment}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Health Check for the main domain (production only)
resource "aws_route53_health_check" "main" {
  count = local.should_create_resource.route53 && var.environment == "prod" && var.domain_name != "" && var.create_route53_zone ? 1 : 0

  fqdn              = var.domain_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/"
  failure_threshold = "3"
  request_interval  = "30"

  tags = merge(
    local.common_tags,
    {
      Name   = "${var.project_name}-${var.environment}-health-check"
      Domain = var.domain_name
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# CloudWatch Alarm for Route53 Health Check
resource "aws_cloudwatch_metric_alarm" "route53_health" {
  count = local.should_create_resource.route53 && var.environment == "prod" && var.domain_name != "" && var.create_route53_zone ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-route53-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Alert when Route53 health check fails"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.main[0].id
  }

  tags = local.common_tags
}
