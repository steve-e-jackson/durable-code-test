# Purpose: Define VPC networking infrastructure including subnets, gateways, and security groups
# Scope: Complete networking foundation for ECS Fargate deployment with load balancer
# Overview: This file establishes the network architecture for the durable-code application,
#     creating a VPC with public and private subnets across multiple availability zones for
#     high availability and fault tolerance. The configuration includes an Internet Gateway
#     for public subnet connectivity, NAT Gateway for private subnet internet access,
#     and route tables for proper traffic routing. Security groups are defined with
#     least-privilege access controls for ALB and ECS services. The network design supports
#     cost optimization through optional NAT Gateway configuration that can be disabled
#     in dev environments. All networking resources follow AWS best practices for security,
#     scalability, and cost efficiency. CIDR blocks are sized appropriately for expected
#     growth while maintaining efficient IP address utilization.
# Dependencies: Requires variables.tf for environment-specific configuration
# Configuration: Supports multiple environments with cost optimization options
# Implementation: Creates high-availability networking foundation for container workloads

# ============================================================================
# VPC Configuration
# ============================================================================

resource "aws_vpc" "main" {
  count = local.should_create_resource.vpc ? 1 : 0

  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-vpc"
    Type = "networking"
  })
}

# ============================================================================
# Internet Gateway
# ============================================================================

resource "aws_internet_gateway" "main" {
  count = local.should_create_resource.networking ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-igw"
    Type = "networking"
  })
}

# ============================================================================
# Public Subnets
# ============================================================================

resource "aws_subnet" "public" {
  count = local.should_create_resource.networking ? var.az_count : 0

  vpc_id                  = aws_vpc.main[0].id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    Type = "public-subnet"
    AZ   = data.aws_availability_zones.available.names[count.index]
  })
}

# ============================================================================
# Private Subnets
# ============================================================================

resource "aws_subnet" "private" {
  count = local.should_create_resource.networking ? var.az_count : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, var.az_count + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-private-${count.index + 1}"
    Type = "private-subnet"
    AZ   = data.aws_availability_zones.available.names[count.index]
  })
}

# ============================================================================
# Elastic IPs for NAT Gateways
# ============================================================================

resource "aws_eip" "nat" {
  count = local.should_create_resource.networking && var.enable_nat_gateway ? var.az_count : 0

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-nat-eip-${count.index + 1}"
    Type = "nat-gateway"
  })
}

# ============================================================================
# NAT Gateways (optional for cost optimization)
# ============================================================================

resource "aws_nat_gateway" "main" {
  count = local.should_create_resource.networking && var.enable_nat_gateway ? var.az_count : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-nat-${count.index + 1}"
    Type = "nat-gateway"
  })

  depends_on = [aws_internet_gateway.main]
}

# ============================================================================
# Route Tables
# ============================================================================

# Public route table
resource "aws_route_table" "public" {
  count = local.should_create_resource.networking ? 1 : 0

  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-public-rt"
    Type = "route-table"
  })
}

# Private route tables
resource "aws_route_table" "private" {
  count = local.should_create_resource.networking ? var.az_count : 0

  vpc_id = aws_vpc.main[0].id

  # Only add NAT Gateway route if NAT Gateway is enabled
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-private-rt-${count.index + 1}"
    Type = "route-table"
  })
}

# ============================================================================
# Route Table Associations
# ============================================================================

# Public subnet associations
resource "aws_route_table_association" "public" {
  count = local.should_create_resource.networking ? var.az_count : 0

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public[0].id
}

# Private subnet associations
resource "aws_route_table_association" "private" {
  count = local.should_create_resource.networking ? var.az_count : 0

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# Security Groups
# ============================================================================

# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  count = local.should_create_resource.networking ? 1 : 0

  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.additional_tags, {
    Name      = "${var.project_name}-${var.environment}-alb-sg"
    Type      = "security-group"
    Component = "load-balancer"
  })
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  count = local.should_create_resource.networking ? 1 : 0

  name        = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb[0].id]
  }

  ingress {
    description     = "HTTP from ALB (Backend)"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb[0].id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.additional_tags, {
    Name      = "${var.project_name}-${var.environment}-ecs-tasks-sg"
    Type      = "security-group"
    Component = "ecs-tasks"
  })
}

# VPC Endpoints Security Group (for private subnets without NAT Gateway)
resource "aws_security_group" "vpc_endpoints" {
  count = local.should_create_resource.networking && !var.enable_nat_gateway ? 1 : 0

  name        = "${var.project_name}-${var.environment}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.additional_tags, {
    Name      = "${var.project_name}-${var.environment}-vpc-endpoints-sg"
    Type      = "security-group"
    Component = "vpc-endpoints"
  })
}

# ============================================================================
# VPC Endpoints (for cost optimization when NAT Gateway is disabled)
# ============================================================================

# S3 VPC Endpoint (Gateway type - no cost)
resource "aws_vpc_endpoint" "s3" {
  count = local.should_create_resource.networking && !var.enable_nat_gateway ? 1 : 0

  vpc_id            = aws_vpc.main[0].id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = merge(var.additional_tags, {
    Name    = "${var.project_name}-${var.environment}-s3-endpoint"
    Type    = "vpc-endpoint"
    Service = "s3"
  })
}

# ECR API VPC Endpoint (Interface type)
resource "aws_vpc_endpoint" "ecr_api" {
  count = local.should_create_resource.networking && !var.enable_nat_gateway ? 1 : 0

  vpc_id              = aws_vpc.main[0].id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(var.additional_tags, {
    Name    = "${var.project_name}-${var.environment}-ecr-api-endpoint"
    Type    = "vpc-endpoint"
    Service = "ecr-api"
  })
}

# ECR Docker VPC Endpoint (Interface type)
resource "aws_vpc_endpoint" "ecr_dkr" {
  count = local.should_create_resource.networking && !var.enable_nat_gateway ? 1 : 0

  vpc_id              = aws_vpc.main[0].id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(var.additional_tags, {
    Name    = "${var.project_name}-${var.environment}-ecr-dkr-endpoint"
    Type    = "vpc-endpoint"
    Service = "ecr-dkr"
  })
}

# CloudWatch Logs VPC Endpoint (Interface type)
resource "aws_vpc_endpoint" "logs" {
  count = local.should_create_resource.networking && !var.enable_nat_gateway ? 1 : 0

  vpc_id              = aws_vpc.main[0].id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(var.additional_tags, {
    Name    = "${var.project_name}-${var.environment}-logs-endpoint"
    Type    = "vpc-endpoint"
    Service = "cloudwatch-logs"
  })
}
