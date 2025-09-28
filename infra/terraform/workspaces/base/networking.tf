# Base Infrastructure - Networking Resources
# These are persistent resources that should not be destroyed frequently

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-vpc"
      Type = "networking"
    }
  )
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-igw"
      Type = "networking"
    }
  )
}

# Public Subnets
resource "aws_subnet" "public" {
  count = var.az_count

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-public-${count.index + 1}"
      Type = "public"
      AZ   = data.aws_availability_zones.available.names[count.index]
    }
  )
}

# Private Subnets
resource "aws_subnet" "private" {
  count = var.az_count

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, var.az_count + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-private-${count.index + 1}"
      Type = "private"
      AZ   = data.aws_availability_zones.available.names[count.index]
    }
  )
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? var.az_count : 0

  domain     = "vpc"
  depends_on = [aws_internet_gateway.main]

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-nat-eip-${count.index + 1}"
      Type = "nat-gateway"
    }
  )
}

# NAT Gateways (optional for cost optimization)
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? var.az_count : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-nat-${count.index + 1}"
      Type = "nat-gateway"
    }
  )

  depends_on = [aws_internet_gateway.main]
}

# Route Tables - Public
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-public-rt"
      Type = "route-table"
    }
  )
}

# Route Tables - Private
resource "aws_route_table" "private" {
  count = var.az_count

  vpc_id = aws_vpc.main.id

  # Only add NAT Gateway route if NAT Gateway is enabled
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name = "${var.project_name}-${local.environment}-private-rt-${count.index + 1}"
      Type = "route-table"
    }
  )
}

# Route Table Associations - Public
resource "aws_route_table_association" "public" {
  count = var.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations - Private
resource "aws_route_table_association" "private" {
  count = var.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups

# Application Load Balancer Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${local.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id

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

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name      = "${var.project_name}-${local.environment}-alb-sg"
      Type      = "security-group"
      Component = "load-balancer"
    }
  )
}

# ECS Tasks Security Group
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${local.environment}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "HTTP from ALB (Backend)"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name      = "${var.project_name}-${local.environment}-ecs-tasks-sg"
      Type      = "security-group"
      Component = "ecs-tasks"
    }
  )
}

# VPC Endpoints Security Group (for private subnets without NAT Gateway)
resource "aws_security_group" "vpc_endpoints" {
  count = !var.enable_nat_gateway ? 1 : 0

  name        = "${var.project_name}-${local.environment}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.main.id

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

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name      = "${var.project_name}-${local.environment}-vpc-endpoints-sg"
      Type      = "security-group"
      Component = "vpc-endpoints"
    }
  )
}

# VPC Endpoints (for cost optimization when NAT Gateway is disabled)

# S3 VPC Endpoint (Gateway type - no cost)
resource "aws_vpc_endpoint" "s3" {
  count = !var.enable_nat_gateway ? 1 : 0

  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name    = "${var.project_name}-${local.environment}-s3-endpoint"
      Type    = "vpc-endpoint"
      Service = "s3"
    }
  )
}

# ECR API VPC Endpoint (Interface type)
resource "aws_vpc_endpoint" "ecr_api" {
  count = !var.enable_nat_gateway ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name    = "${var.project_name}-${local.environment}-ecr-api-endpoint"
      Type    = "vpc-endpoint"
      Service = "ecr-api"
    }
  )
}

# ECR Docker VPC Endpoint (Interface type)
resource "aws_vpc_endpoint" "ecr_dkr" {
  count = !var.enable_nat_gateway ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name    = "${var.project_name}-${local.environment}-ecr-dkr-endpoint"
      Type    = "vpc-endpoint"
      Service = "ecr-dkr"
    }
  )
}

# CloudWatch Logs VPC Endpoint (Interface type)
resource "aws_vpc_endpoint" "logs" {
  count = !var.enable_nat_gateway ? 1 : 0

  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(
    local.common_tags,
    var.additional_tags,
    {
      Name    = "${var.project_name}-${local.environment}-logs-endpoint"
      Type    = "vpc-endpoint"
      Service = "cloudwatch-logs"
    }
  )
}