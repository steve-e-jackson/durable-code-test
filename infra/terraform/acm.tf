# Purpose: AWS Certificate Manager (ACM) configuration for SSL/TLS certificates
# Scope: Certificate creation, validation, and management for HTTPS-enabled ALB
# Overview: This file manages SSL/TLS certificates through AWS Certificate Manager for
#     secure HTTPS connections. It includes certificate requests, DNS validation records,
#     and certificate validation resources. The configuration supports both single domain
#     and wildcard certificates, with automatic renewal handled by ACM. DNS validation
#     is preferred over email validation for automation. The certificates are region-specific
#     and must be in the same region as the ALB. Cost: ACM certificates are free, but
#     Route53 hosted zones incur charges (~$0.50/month per zone).
# Dependencies: Requires route53.tf for DNS validation records (when enabled)
# Configuration: Uses variables for domain names and certificate settings
# Implementation: Creates certificates with DNS validation for automatic renewal

# ACM Certificate for the primary domain (only when domain is configured)
resource "aws_acm_certificate" "main" {
  count = var.domain_name != "" && var.create_route53_zone ? 1 : 0

  domain_name = var.domain_name
  subject_alternative_names = [
    "*.${var.domain_name}",                     # Wildcard for subdomains
    "${var.environment}.${var.domain_name}",    # Environment-specific subdomain
    "api.${var.domain_name}",                   # API subdomain
    "api-${var.environment}.${var.domain_name}" # Environment-specific API
  ]

  validation_method = "DNS" # DNS validation for automation

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    local.common_tags,
    {
      Name        = "${var.project_name}-${var.environment}-certificate"
      Domain      = var.domain_name
      Environment = var.environment
    }
  )
}

# Route53 record for certificate validation
resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name != "" && var.create_route53_zone ? {
    for dvo in aws_acm_certificate.main[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main[0].zone_id

  depends_on = [aws_route53_zone.main]
}

# Certificate validation
resource "aws_acm_certificate_validation" "main" {
  count = var.domain_name != "" && var.create_route53_zone ? 1 : 0

  certificate_arn         = aws_acm_certificate.main[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  depends_on = [aws_route53_record.cert_validation]
}

# CloudWatch alarm for certificate expiry (production only)
resource "aws_cloudwatch_metric_alarm" "certificate_expiry" {
  count = var.environment == "prod" && var.domain_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-cert-expiry"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DaysToExpiry"
  namespace           = "AWS/CertificateManager"
  period              = "86400" # Daily check
  statistic           = "Average"
  threshold           = "30" # Alert 30 days before expiry
  alarm_description   = "Alert when certificate is expiring in less than 30 days"
  treat_missing_data  = "breaching"

  dimensions = {
    CertificateArn = aws_acm_certificate.main[0].arn
  }

  tags = local.common_tags
}
