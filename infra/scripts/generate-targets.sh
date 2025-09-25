#!/bin/bash
# Purpose: Generate Terraform target arguments based on deployment scope
# Scope: Used by Make targets to selectively deploy/destroy resources
# Overview: This script outputs the appropriate -target flags for Terraform
#     based on the SCOPE parameter (runtime, base, or all)

SCOPE="${1:-runtime}"

# Base/persistent resources - slow to provision, expensive to recreate
BASE_RESOURCES=(
    # Networking
    "aws_vpc.main"
    "aws_subnet.public"
    "aws_subnet.private"
    "aws_internet_gateway.main"
    "aws_eip.nat"
    "aws_nat_gateway.main"
    "aws_route_table.public"
    "aws_route_table.private"
    "aws_route_table_association.public"
    "aws_route_table_association.private"
    "aws_security_group.alb"
    "aws_security_group.ecs_tasks"

    # ECR
    "aws_ecr_repository.frontend"
    "aws_ecr_repository.backend"
    "aws_ecr_lifecycle_policy.frontend"
    "aws_ecr_lifecycle_policy.backend"

    # Route53 and ACM (slow to validate)
    "aws_route53_zone.main"
    "aws_acm_certificate.main"
    "aws_route53_record.cert_validation"
    "aws_acm_certificate_validation.main"

    # ALB itself (but not listeners)
    "aws_lb.main"
)

# Runtime/temporal resources - quick to provision
RUNTIME_RESOURCES=(
    # ECS
    "aws_ecs_cluster.main"
    "aws_ecs_task_definition.backend"
    "aws_ecs_task_definition.frontend"
    "aws_ecs_service.backend"
    "aws_ecs_service.frontend"

    # IAM for ECS
    "aws_iam_role.ecs_task_execution"
    "aws_iam_role.ecs_task"
    "aws_iam_role_policy_attachment.ecs_task_execution"

    # CloudWatch
    "aws_cloudwatch_log_group.backend"
    "aws_cloudwatch_log_group.frontend"

    # ALB listeners and targets
    "aws_lb_target_group.backend"
    "aws_lb_target_group.frontend"
    "aws_lb_listener.http"
    "aws_lb_listener.https"
    "aws_lb_listener_rule.backend"
    "aws_lb_listener_rule.frontend"

    # Service discovery
    "aws_service_discovery_private_dns_namespace.main"
    "aws_service_discovery_service.backend"
    "aws_service_discovery_service.frontend"

    # Route53 ALB records
    "aws_route53_record.alb"
    "aws_route53_record.www"
)

case "$SCOPE" in
    runtime)
        # Output runtime resource targets
        for resource in "${RUNTIME_RESOURCES[@]}"; do
            echo -n " -target=$resource"
        done
        ;;
    base)
        # Output base resource targets
        for resource in "${BASE_RESOURCES[@]}"; do
            echo -n " -target=$resource"
        done
        ;;
    all)
        # No targets means deploy everything
        echo ""
        ;;
    *)
        echo "Error: Invalid scope '$SCOPE'. Must be 'runtime', 'base', or 'all'" >&2
        exit 1
        ;;
esac
