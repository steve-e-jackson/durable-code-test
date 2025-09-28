# Purpose: AWS provider configuration for base infrastructure workspace
# Scope: Provider settings, default tags, and region configuration for all base resources
# Overview: Configures the AWS provider for the base infrastructure workspace with region settings
#     and default tags that are automatically applied to all resources created by this workspace.
#     The default tags ensure consistent tagging across all base resources for cost tracking,
#     compliance, and resource identification. These tags are inherited by all resources and can
#     be supplemented with resource-specific tags as needed.
# Dependencies: AWS credentials configured via environment variables or IAM role
# Exports: Configured AWS provider for use by all resources in this workspace
# Configuration: Region from variables, tags from local common_tags
# Environment: Uses workspace-aware tagging to identify resources by environment
# Related: variables.tf for aws_region, main.tf for local.common_tags
# Implementation: Default tags pattern ensures consistent resource tagging

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}