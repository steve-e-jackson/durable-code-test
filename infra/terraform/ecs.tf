# Purpose: ECS cluster and Fargate service configuration for container orchestration
# Scope: ECS cluster, task definitions, services, auto-scaling, and service discovery for containerized applications
# Overview: This file defines the complete ECS infrastructure for running containerized frontend
#     and backend services on AWS Fargate. It includes cluster configuration with Container Insights,
#     task definitions with proper resource allocation and health checks, service configurations
#     with load balancer integration, auto-scaling policies for production environments, and
#     service discovery for inter-service communication. The configuration emphasizes cost
#     optimization through Fargate Spot usage in development, minimal resource allocation,
#     and environment-specific scaling policies. IAM roles provide least-privilege access
#     for task execution and application permissions. CloudWatch logging captures application
#     output with retention policies optimized for cost and compliance requirements.
# Dependencies: Requires networking.tf (VPC, subnets, security groups), ecr.tf (container repositories), alb.tf (load balancer target groups)
# Configuration: Uses variables from variables.tf for environment-specific resource sizing and cost optimization
# Implementation: Creates ECS cluster, task definitions, services with auto-scaling, service discovery, and IAM roles

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  count = local.should_create_resource.ecs_cluster ? 1 : 0
  name  = local.ecs_cluster_name

  setting {
    name  = "containerInsights"
    value = var.environment == "prod" ? "enabled" : "disabled" # Cost optimization: only for prod
  }

  tags = merge(
    local.common_tags,
    {
      Name        = local.ecs_cluster_name
      Component   = "ECS"
      Description = "Main ECS cluster for container orchestration"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# ECS Cluster Capacity Providers
resource "aws_ecs_cluster_capacity_providers" "main" {
  count = local.should_create_resource.ecs_cluster ? 1 : 0

  cluster_name = aws_ecs_cluster.main[0].name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = var.environment == "prod" ? "FARGATE" : "FARGATE_SPOT"
    weight            = 100
    base              = 1
  }
}

# CloudWatch Log Groups for ECS Tasks
resource "aws_cloudwatch_log_group" "backend" {
  count             = local.should_create_resource.cloudwatch_logs ? 1 : 0
  name              = "/ecs/${var.project_name}-${var.environment}/backend"
  retention_in_days = var.environment == "prod" ? 30 : 7 # Cost optimization

  tags = merge(
    local.common_tags,
    {
      Name      = "ECS Backend Logs"
      Service   = "backend"
      Component = "Logging"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  count             = local.should_create_resource.cloudwatch_logs ? 1 : 0
  name              = "/ecs/${var.project_name}-${var.environment}/frontend"
  retention_in_days = var.environment == "prod" ? 30 : 7 # Cost optimization

  tags = merge(
    local.common_tags,
    {
      Name      = "ECS Frontend Logs"
      Service   = "frontend"
      Component = "Logging"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Task Execution Role - Used by ECS to pull images and write logs
resource "aws_iam_role" "task_execution_role" {
  count = local.should_create_resource.ecs_services ? 1 : 0
  name  = "${var.project_name}-${var.environment}-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name      = "ECS Task Execution Role"
      Component = "IAM"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "task_execution_role_policy" {
  count = local.should_create_resource.ecs_services ? 1 : 0

  role       = aws_iam_role.task_execution_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for ECR access and CloudWatch logs
resource "aws_iam_role_policy" "task_execution_ecr_cloudwatch" {
  count = local.should_create_resource.ecs_services ? 1 : 0

  name = "ecr-cloudwatch-access"
  role = aws_iam_role.task_execution_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          aws_cloudwatch_log_group.backend[0].arn,
          "${aws_cloudwatch_log_group.backend[0].arn}:*",
          aws_cloudwatch_log_group.frontend[0].arn,
          "${aws_cloudwatch_log_group.frontend[0].arn}:*"
        ]
      }
    ]
  })
}

# Task Role - Used by the application containers
resource "aws_iam_role" "task_role" {
  count = local.should_create_resource.ecs_services ? 1 : 0
  name  = "${var.project_name}-${var.environment}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    local.common_tags,
    {
      Name      = "ECS Task Role"
      Component = "IAM"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Task Role Policy - Application permissions
resource "aws_iam_role_policy" "task_role_policy" {
  count = local.should_create_resource.ecs_services ? 1 : 0

  name = "task-permissions"
  role = aws_iam_role.task_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${data.aws_region.current.name}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Backend Task Definition
resource "aws_ecs_task_definition" "backend" {
  count                    = local.should_create_resource.ecs_services ? 1 : 0
  family                   = "${var.project_name}-${var.environment}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "prod" ? "512" : "256"  # Cost optimization
  memory                   = var.environment == "prod" ? "1024" : "512" # Cost optimization
  execution_role_arn       = aws_iam_role.task_execution_role[0].arn
  task_role_arn            = aws_iam_role.task_role[0].arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${aws_ecr_repository.backend[0].repository_url}:v2"

      essential = true

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "8000"
        }
      ]

      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend[0].name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(
    local.common_tags,
    {
      Name      = "Backend Task Definition"
      Service   = "backend"
      Component = "ECS"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Frontend Task Definition
resource "aws_ecs_task_definition" "frontend" {
  count                    = local.should_create_resource.ecs_services ? 1 : 0
  family                   = "${var.project_name}-${var.environment}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "prod" ? "256" : "256" # Frontend needs less resources
  memory                   = var.environment == "prod" ? "512" : "512"
  execution_role_arn       = aws_iam_role.task_execution_role[0].arn
  task_role_arn            = aws_iam_role.task_role[0].arn

  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${aws_ecr_repository.frontend[0].repository_url}:v4"

      essential = true

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        },
        {
          name  = "BACKEND_URL"
          value = "http://backend.${var.environment}.local:8000" # Will be updated with service discovery
        }
      ]

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend[0].name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000 || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = merge(
    local.common_tags,
    {
      Name      = "Frontend Task Definition"
      Service   = "frontend"
      Component = "ECS"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Service Discovery Namespace (Private DNS)
resource "aws_service_discovery_private_dns_namespace" "main" {
  count       = local.should_create_resource.service_discovery ? 1 : 0
  name        = "${var.environment}.local"
  description = "Private namespace for service discovery"
  vpc         = aws_vpc.main[0].id

  tags = merge(
    local.common_tags,
    {
      Name      = "Service Discovery Namespace"
      Component = "ServiceDiscovery"
    }
  )

  lifecycle {
    ignore_changes = [tags]
  }
}

# Backend Service Discovery Service
resource "aws_service_discovery_service" "backend" {
  count = local.should_create_resource.service_discovery ? 1 : 0
  name  = "backend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main[0].id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# Frontend Service Discovery Service
resource "aws_service_discovery_service" "frontend" {
  count = local.should_create_resource.service_discovery ? 1 : 0
  name  = "frontend"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main[0].id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

# ECS Backend Service
resource "aws_ecs_service" "backend" {
  count           = local.should_create_resource.ecs_services ? 1 : 0
  name            = "${var.project_name}-${var.environment}-backend"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.backend[0].arn
  desired_count   = var.environment == "prod" ? 2 : 1 # Cost optimization: 1 for dev

  # Enable Fargate Spot for dev environment (70% cost savings)
  capacity_provider_strategy {
    capacity_provider = var.environment == "prod" ? "FARGATE" : "FARGATE_SPOT"
    weight            = 100
  }

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks[0].id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.backend[0].arn
  }

  # Load balancer configuration
  load_balancer {
    target_group_arn = aws_lb_target_group.backend[0].arn
    container_name   = "backend"
    container_port   = 8000
  }

  # Enable auto-scaling for production
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = var.environment == "prod" ? 100 : 50

  # Circuit breaker for faster rollback on failures
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = merge(
    local.common_tags,
    {
      Name      = "Backend Service"
      Service   = "backend"
      Component = "ECS"
    }
  )

  lifecycle {
    ignore_changes = [desired_count, tags] # Allow auto-scaling to manage this, ignore tag changes
  }
}

# ECS Frontend Service
resource "aws_ecs_service" "frontend" {
  count           = local.should_create_resource.ecs_services ? 1 : 0
  name            = "${var.project_name}-${var.environment}-frontend"
  cluster         = aws_ecs_cluster.main[0].id
  task_definition = aws_ecs_task_definition.frontend[0].arn
  desired_count   = var.environment == "prod" ? 2 : 1 # Cost optimization: 1 for dev

  # Enable Fargate Spot for dev environment (70% cost savings)
  capacity_provider_strategy {
    capacity_provider = var.environment == "prod" ? "FARGATE" : "FARGATE_SPOT"
    weight            = 100
  }

  network_configuration {
    security_groups  = [aws_security_group.ecs_tasks[0].id]
    subnets          = aws_subnet.private[*].id
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.frontend[0].arn
  }

  # Load balancer configuration
  load_balancer {
    target_group_arn = aws_lb_target_group.frontend[0].arn
    container_name   = "frontend"
    container_port   = 3000
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = var.environment == "prod" ? 100 : 50

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  tags = merge(
    local.common_tags,
    {
      Name      = "Frontend Service"
      Service   = "frontend"
      Component = "ECS"
    }
  )

  lifecycle {
    ignore_changes = [desired_count, tags] # Allow auto-scaling to manage this, ignore tag changes
  }
}

# Auto Scaling for Backend Service
resource "aws_appautoscaling_target" "backend" {
  count = var.environment == "prod" ? 1 : 0 # Only for production

  max_capacity       = 4
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main[0].name}/${aws_ecs_service.backend[0].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  count = var.environment == "prod" ? 1 : 0

  name               = "backend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend[0].resource_id
  scalable_dimension = aws_appautoscaling_target.backend[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 60.0
  }
}

# Auto Scaling for Frontend Service
resource "aws_appautoscaling_target" "frontend" {
  count = var.environment == "prod" ? 1 : 0 # Only for production

  max_capacity       = 4
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main[0].name}/${aws_ecs_service.frontend[0].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "frontend_cpu" {
  count = var.environment == "prod" ? 1 : 0

  name               = "frontend-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend[0].resource_id
  scalable_dimension = aws_appautoscaling_target.frontend[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 60.0
  }
}
