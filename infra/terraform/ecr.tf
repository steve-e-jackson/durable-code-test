# Purpose: AWS ECR (Elastic Container Registry) configuration for Docker image storage and lifecycle management
# Scope: Creates and configures ECR repositories for frontend and backend container image storage
# Overview: This file establishes ECR repositories for storing Docker images with comprehensive
#     security and cost optimization features. It creates separate repositories for frontend and
#     backend services with image scanning enabled for vulnerability detection, tag immutability
#     to prevent accidental overwrites, and encryption at rest for security. Lifecycle policies
#     automatically clean up old and untagged images to control storage costs while retaining
#     important release versions. Repository policies provide secure access control for ECS task
#     execution and CI/CD pipeline operations. The configuration supports multiple environments
#     with proper tagging and naming conventions for resource organization.
# Dependencies: AWS provider configuration, variables from variables.tf, and IAM roles for access control
# Exports: ECR repository URLs for container image push/pull operations, repository ARNs for IAM policies
# Configuration: Uses environment-specific naming and tagging through local values
# Environment: Supports dev, staging, and prod environments with consistent repository patterns
# Related: Links to ECS task definitions, CI/CD pipeline configurations, and IAM role policies
# Implementation: Cost-optimized with automated lifecycle policies, security scanning, and access controls

# Frontend ECR Repository
resource "aws_ecr_repository" "frontend" {
  count = local.should_create_resource.ecr ? 1 : 0

  name                 = "${local.name_prefix}-frontend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(
    local.common_tags,
    {
      Name      = "${local.name_prefix}-frontend-ecr"
      Component = "frontend"
      Purpose   = "Docker image storage for frontend application"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Backend ECR Repository
resource "aws_ecr_repository" "backend" {
  count = local.should_create_resource.ecr ? 1 : 0

  name                 = "${local.name_prefix}-backend"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(
    local.common_tags,
    {
      Name      = "${local.name_prefix}-backend-ecr"
      Component = "backend"
      Purpose   = "Docker image storage for backend API"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Lifecycle policy for frontend repository - Keep only recent images
resource "aws_ecr_lifecycle_policy" "frontend" {
  count = local.should_create_resource.ecr ? 1 : 0

  repository = aws_ecr_repository.frontend[0].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "release", "prod"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep development images for 7 days"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["dev", "staging"]
          countType     = "sinceImagePushed"
          countUnit     = "days"
          countNumber   = 7
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 3
        description  = "Remove untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Lifecycle policy for backend repository - Keep only recent images
resource "aws_ecr_lifecycle_policy" "backend" {
  count = local.should_create_resource.ecr ? 1 : 0

  repository = aws_ecr_repository.backend[0].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "release", "prod"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Keep development images for 7 days"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["dev", "staging"]
          countType     = "sinceImagePushed"
          countUnit     = "days"
          countNumber   = 7
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 3
        description  = "Remove untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Repository policy for frontend - Allow specific AWS accounts and services
resource "aws_ecr_repository_policy" "frontend" {
  count = local.should_create_resource.ecr ? 1 : 0

  repository = aws_ecr_repository.frontend[0].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPushFromGitHubActions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      },
      {
        Sid    = "AllowECSTaskExecution"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Repository policy for backend - Allow specific AWS accounts and services
resource "aws_ecr_repository_policy" "backend" {
  count = local.should_create_resource.ecr ? 1 : 0

  repository = aws_ecr_repository.backend[0].name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowPushFromGitHubActions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      },
      {
        Sid    = "AllowECSTaskExecution"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ]
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}


# Outputs for ECR repositories
output "ecr_frontend_repository_url" {
  description = "The URL of the frontend ECR repository"
  value       = local.should_create_resource.ecr ? aws_ecr_repository.frontend[0].repository_url : ""
}

output "ecr_backend_repository_url" {
  description = "The URL of the backend ECR repository"
  value       = local.should_create_resource.ecr ? aws_ecr_repository.backend[0].repository_url : ""
}

output "ecr_frontend_repository_arn" {
  description = "The ARN of the frontend ECR repository"
  value       = local.should_create_resource.ecr ? aws_ecr_repository.frontend[0].arn : ""
}

output "ecr_backend_repository_arn" {
  description = "The ARN of the backend ECR repository"
  value       = local.should_create_resource.ecr ? aws_ecr_repository.backend[0].arn : ""
}

output "ecr_frontend_repository_name" {
  description = "The name of the frontend ECR repository"
  value       = local.should_create_resource.ecr ? aws_ecr_repository.frontend[0].name : ""
}

output "ecr_backend_repository_name" {
  description = "The name of the backend ECR repository"
  value       = local.should_create_resource.ecr ? aws_ecr_repository.backend[0].name : ""
}
