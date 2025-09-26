# Purpose: Define DynamoDB resources for the AI contributions feature
# Scope: DynamoDB tables for storing community contributions
# Overview: This file defines the DynamoDB table used by the AI contributions backend
#     to store submitted contributions. The table uses on-demand billing mode for
#     cost efficiency in development and automatic scaling in production.
# Dependencies: None - standalone DynamoDB resources
# Configuration: Table name is environment-specific to support multiple deployments
# Exports: DynamoDB table name and ARN for use by ECS tasks
# Implementation: Simple single-table design with partition key for contribution IDs

# ============================================================================
# DynamoDB Table for AI Contributions
# ============================================================================

resource "aws_dynamodb_table" "contributions" {
  count = local.should_create_resource.contributions ? 1 : 0

  name         = "${var.project_name}-${var.environment}-contributions"
  billing_mode = "PAY_PER_REQUEST" # On-demand billing for cost efficiency

  # Primary key
  hash_key = "id" # Contribution ID (UUID)

  attribute {
    name = "id"
    type = "S" # String type for UUID
  }

  # Global secondary index for querying by status
  global_secondary_index {
    name            = "status-created-at-index"
    hash_key        = "status"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S" # ISO 8601 timestamp string
  }

  # Global secondary index for querying by user email
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  attribute {
    name = "email"
    type = "S"
  }

  # Enable point-in-time recovery for data protection
  point_in_time_recovery {
    enabled = var.environment == "prod" ? true : false
  }

  # Enable server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Time-to-live for automatic data expiration (optional)
  # Can be enabled later if needed for compliance
  # ttl {
  #   attribute_name = "ttl"
  #   enabled        = true
  # }

  tags = merge(
    local.common_tags,
    {
      Name      = "AI Contributions Table"
      Component = "DynamoDB"
      Feature   = "AI-Contributions"
    }
  )

  lifecycle {
    # Prevent accidental deletion in production
    prevent_destroy = false # Set to true in production
    # Ignore deployment timestamp changes
    ignore_changes = [tags["DeploymentTimestamp"], tags["DeploymentDate"]]
  }
}

# ============================================================================
# DynamoDB Table for Rate Limiting (Optional)
# ============================================================================

# This table can be used for distributed rate limiting across multiple
# backend instances. Currently, the backend uses in-memory rate limiting.
# Uncomment if distributed rate limiting is needed.

# resource "aws_dynamodb_table" "rate_limits" {
#   count = local.should_create_resource.contributions ? 1 : 0
#
#   name         = "${var.project_name}-${var.environment}-rate-limits"
#   billing_mode = "PAY_PER_REQUEST"
#
#   hash_key = "key" # Rate limit key (e.g., "ip:192.168.1.1" or "email:user@example.com")
#
#   attribute {
#     name = "key"
#     type = "S"
#   }
#
#   # TTL for automatic cleanup of expired rate limit entries
#   ttl {
#     attribute_name = "expires_at"
#     enabled        = true
#   }
#
#   tags = merge(
#     local.common_tags,
#     {
#       Name      = "Rate Limits Table"
#       Component = "DynamoDB"
#       Feature   = "AI-Contributions"
#     }
#   )
#
#   lifecycle {
#     ignore_changes = [tags["DeploymentTimestamp"], tags["DeploymentDate"]]
#   }
# }
