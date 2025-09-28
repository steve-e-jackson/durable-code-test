# Base Infrastructure - Application Load Balancer
# The ALB itself is a base resource, but listeners and target groups are runtime resources

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-${local.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = local.environment == "prod" ? true : false
  enable_http2                     = true
  enable_cross_zone_load_balancing = false # Cost optimization - avoid cross-AZ charges

  # Access logs disabled for cost optimization in dev
  # Enable in production for compliance/debugging
  dynamic "access_logs" {
    for_each = local.environment == "prod" ? [1] : []
    content {
      bucket  = aws_s3_bucket.alb_logs[0].bucket
      enabled = true
    }
  }

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-alb"
      Type = "ApplicationLoadBalancer"
    }
  )
}

# S3 bucket for ALB access logs (production only)
resource "aws_s3_bucket" "alb_logs" {
  count  = local.environment == "prod" ? 1 : 0
  bucket = "${var.project_name}-${local.environment}-alb-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name    = "${var.project_name}-${local.environment}-alb-logs"
      Purpose = "ALB-AccessLogs"
    }
  )
}

# S3 bucket lifecycle configuration for log retention
resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  count  = local.environment == "prod" ? 1 : 0
  bucket = aws_s3_bucket.alb_logs[0].id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {} # Required even if empty

    expiration {
      days = 30 # Keep logs for 30 days
    }
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "alb_logs" {
  count  = local.environment == "prod" ? 1 : 0
  bucket = aws_s3_bucket.alb_logs[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket policy for ALB access logs
resource "aws_s3_bucket_policy" "alb_logs" {
  count  = local.environment == "prod" ? 1 : 0
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

  depends_on = [aws_s3_bucket_public_access_block.alb_logs]
}