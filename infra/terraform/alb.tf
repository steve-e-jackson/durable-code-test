# Purpose: Application Load Balancer configuration for distributing traffic to ECS services
# Scope: ALB, target groups, listeners, and health check configurations for frontend and backend
# Overview: This file defines the Application Load Balancer (ALB) that serves as the entry point
#     for all incoming traffic to the application. It includes target groups for both frontend
#     and backend services running on ECS Fargate, health check configurations to ensure
#     service availability, and listener rules for HTTP/HTTPS traffic routing. The ALB is
#     designed for cost optimization with minimal resources while maintaining high availability.
#     Security is enforced through security groups and HTTPS termination at the ALB level.
#     The configuration supports multiple environments with environment-specific settings
#     defined in tfvars files.
# Dependencies: Requires networking.tf (VPC, subnets, security groups) and ecs.tf (ECS services)
# Configuration: Uses variables from variables.tf for environment-specific customization
# Implementation: Creates ALB, target groups, listeners, and attachments to ECS services

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = var.environment == "prod" ? true : false
  enable_http2                     = true
  enable_cross_zone_load_balancing = false # Cost optimization - avoid cross-AZ charges

  # Access logs disabled for cost optimization in dev
  # Enable in production for compliance/debugging
  dynamic "access_logs" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      bucket  = aws_s3_bucket.alb_logs[0].bucket
      enabled = true
    }
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-${var.environment}-alb"
      Type = "ApplicationLoadBalancer"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# S3 bucket for ALB access logs (production only)
resource "aws_s3_bucket" "alb_logs" {
  count  = var.environment == "prod" ? 1 : 0
  bucket = "${var.project_name}-${var.environment}-alb-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    {
      Name    = "${var.project_name}-${var.environment}-alb-logs"
      Purpose = "ALB-AccessLogs"
    }
  )
}

# S3 bucket policy for ALB access logs
resource "aws_s3_bucket_policy" "alb_logs" {
  count  = var.environment == "prod" ? 1 : 0
  bucket = aws_s3_bucket.alb_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ALBAccessLogsWrite"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::797873946194:root" # ALB service account for us-west-2
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs[0].arn}/*"
      }
    ]
  })
}

# Target Group for Frontend Service
resource "aws_lb_target_group" "frontend" {
  count                = local.should_create_resource.alb_target_groups ? 1 : 0
  name                 = "${var.project_name}-${var.environment}-frontend-tg"
  port                 = 3000
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main[0].id
  target_type          = "ip"                                # Required for Fargate
  deregistration_delay = var.environment == "prod" ? 30 : 10 # Faster deploys in dev

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = var.environment == "prod" ? 30 : 60 # Less frequent in dev
    path                = "/"
    matcher             = "200"
    protocol            = "HTTP"
  }

  stickiness {
    enabled         = true
    type            = "lb_cookie"
    cookie_duration = 86400 # 1 day
  }

  tags = merge(
    local.common_tags,
    {
      Name    = "${var.project_name}-${var.environment}-frontend-tg"
      Service = "frontend"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Target Group for Backend Service
resource "aws_lb_target_group" "backend" {
  count                = local.should_create_resource.alb_target_groups ? 1 : 0
  name                 = "${var.project_name}-${var.environment}-backend-tg"
  port                 = 8000
  protocol             = "HTTP"
  vpc_id               = aws_vpc.main[0].id
  target_type          = "ip" # Required for Fargate
  deregistration_delay = var.environment == "prod" ? 30 : 10

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = var.environment == "prod" ? 30 : 60
    path                = "/health"
    matcher             = "200"
    protocol            = "HTTP"
  }

  stickiness {
    enabled = false # API doesn't need session stickiness
    type    = "lb_cookie"
  }

  tags = merge(
    local.common_tags,
    {
      Name    = "${var.project_name}-${var.environment}-backend-tg"
      Service = "backend"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# HTTP Listener (redirects to HTTPS in production)
resource "aws_lb_listener" "http" {
  count             = local.should_create_resource.alb_listeners ? 1 : 0
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # Redirect HTTP to HTTPS when HTTPS is enabled
  # Otherwise forward to frontend
  dynamic "default_action" {
    for_each = var.enable_https && length(aws_acm_certificate.main) > 0 ? [1] : []
    content {
      type = "redirect"

      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  # When HTTPS is disabled or no certificate available
  dynamic "default_action" {
    for_each = !var.enable_https || length(aws_acm_certificate.main) == 0 ? [1] : []
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.frontend[0].arn
    }
  }
}

# HTTPS Listener (when certificate is available and HTTPS is enabled)
resource "aws_lb_listener" "https" {
  count = local.should_create_resource.alb_listeners && var.enable_https && length(aws_acm_certificate.main) > 0 ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.main[0].certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend[0].arn
  }
}

# Listener Rule for Backend API (HTTP)
resource "aws_lb_listener_rule" "backend_http" {
  count = local.should_create_resource.alb_listeners ? 1 : 0

  listener_arn = aws_lb_listener.http[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health", "/oscilloscope/*"]
    }
  }
}

# Listener Rule for Backend API (HTTPS)
resource "aws_lb_listener_rule" "backend_https" {
  count = local.should_create_resource.alb_listeners && var.enable_https && length(aws_acm_certificate.main) > 0 ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }

  condition {
    path_pattern {
      values = ["/api/*", "/health", "/oscilloscope/*"]
    }
  }
}

# Note: Target group attachments are handled automatically by the ECS service
# configuration in ecs.tf through the load_balancer blocks. No manual
# attachment is needed for Fargate tasks.

# CloudWatch Alarms for ALB monitoring
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  count = var.environment == "prod" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "Alert when ALB has unhealthy targets"
  treat_missing_data  = "breaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}

# CloudWatch Alarm for high latency
resource "aws_cloudwatch_metric_alarm" "alb_target_response_time" {
  count = var.environment == "prod" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = "2" # 2 seconds
  alarm_description   = "Alert when ALB response time exceeds 2 seconds"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = local.common_tags
}
