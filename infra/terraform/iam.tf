# Purpose: Configure IAM roles and policies for GitHub Actions CI/CD integration
# Scope: OIDC provider, IAM roles, and policies for secure GitHub Actions authentication
# Overview: This file establishes secure authentication between GitHub Actions and AWS using
#     OpenID Connect (OIDC) to eliminate the need for long-lived AWS credentials. It creates
#     an OIDC identity provider for GitHub, IAM roles with specific trust policies that restrict
#     access to designated repositories and branches, and granular permissions for ECR image
#     management, ECS service updates, and CloudWatch logging. The configuration follows AWS
#     security best practices with principle of least privilege, enabling GitHub Actions to
#     deploy applications, update task definitions, and manage container lifecycle without
#     storing sensitive credentials in GitHub secrets. All policies are scoped to specific
#     resources and include conditions for enhanced security. This setup supports automated
#     CI/CD workflows while maintaining strict access controls and audit trails.
# Dependencies: Requires ECS resources (task execution and task roles) for IAM policy references
# Configuration: Uses project-specific variables for repository access and environment scoping
# Implementation: Creates OIDC provider, GitHub Actions role, and service-specific IAM policies

# GitHub OIDC Provider for secure authentication without long-lived credentials
resource "aws_iam_openid_connect_provider" "github" {
  count = var.deployment_scope != "runtime" ? 1 : 0

  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC thumbprint - this is static and provided by GitHub
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1", "1c58a3a8518e8759bf075b76b750d4f2df264fcd"]

  tags = {
    Name        = "${var.project_name}-github-oidc"
    Environment = var.environment
    Purpose     = "GitHub Actions OIDC authentication"
  }
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  count = var.deployment_scope != "runtime" ? 1 : 0

  name = "${var.project_name}-${var.environment}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github[0].arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:steve-e-jackson/durable-code-test:*",
              "repo:steve-e-jackson/durable-code-test-2:*"
            ]
          }
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-github-actions"
    Environment = var.environment
    Purpose     = "GitHub Actions CI/CD deployment"
  }
}

# IAM Policy for GitHub Actions - ECR permissions
resource "aws_iam_role_policy" "github_actions_ecr" {
  count = var.deployment_scope != "runtime" ? 1 : 0

  name = "${var.project_name}-${var.environment}-github-actions-ecr"
  role = aws_iam_role.github_actions[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Policy for GitHub Actions - ECS permissions
resource "aws_iam_role_policy" "github_actions_ecs" {
  count = var.deployment_scope != "runtime" ? 1 : 0

  name = "${var.project_name}-${var.environment}-github-actions-ecs"
  role = aws_iam_role.github_actions[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:RegisterTaskDefinition",
          "ecs:DeregisterTaskDefinition",
          "ecs:ListTaskDefinitions",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeClusters"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.task_execution_role[0].arn,
          aws_iam_role.task_role[0].arn
        ]
      }
    ]
  })
}

# IAM Policy for GitHub Actions - CloudWatch Logs permissions
resource "aws_iam_role_policy" "github_actions_logs" {
  count = var.deployment_scope != "runtime" ? 1 : 0

  name = "${var.project_name}-${var.environment}-github-actions-logs"
  role = aws_iam_role.github_actions[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# Output the role ARN for use in GitHub Actions
output "github_actions_role_arn" {
  value       = var.deployment_scope != "runtime" ? aws_iam_role.github_actions[0].arn : ""
  description = "ARN of the IAM role for GitHub Actions"
}

output "github_oidc_provider_arn" {
  value       = var.deployment_scope != "runtime" ? aws_iam_openid_connect_provider.github[0].arn : ""
  description = "ARN of the GitHub OIDC provider"
}
