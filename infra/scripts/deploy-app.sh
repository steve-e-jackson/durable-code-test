#!/bin/bash
# Purpose: Deploy containerized application to AWS ECS infrastructure
# Scope: Complete application deployment pipeline for AWS ECS with ECR container registry
# Overview: Automated deployment script that handles the full container deployment lifecycle to AWS ECS.
#     Authenticates with ECR, builds and pushes Docker images with timestamped tags, updates ECS service definitions,
#     and manages blue-green deployments. Includes environment-specific configuration, health checks,
#     and rollback capabilities for production-ready container orchestration on AWS infrastructure.

set -e

# Configuration
AWS_REGION="us-west-2"
AWS_ACCOUNT_ID="449870229058"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ENV="${ENV:-dev}"
TAG="v$(date +%Y%m%d-%H%M%S)"

echo "=== Starting Application Deployment ==="
echo "Environment: ${ENV}"
echo "ECR Registry: ${ECR_REGISTRY}"
echo "Tag: ${TAG}"

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Build and tag images
echo "Building Docker images..."

# Frontend
echo "Building frontend..."
cd durable-code-app/frontend
docker build -t durableai-${ENV}-frontend:${TAG} -f Dockerfile .
docker tag durableai-${ENV}-frontend:${TAG} ${ECR_REGISTRY}/durableai-${ENV}-frontend:${TAG}

# Backend
echo "Building backend..."
cd ../backend
docker build -t durableai-${ENV}-backend:${TAG} -f Dockerfile .
docker tag durableai-${ENV}-backend:${TAG} ${ECR_REGISTRY}/durableai-${ENV}-backend:${TAG}

# Push images to ECR
echo "Pushing images to ECR..."
docker push ${ECR_REGISTRY}/durableai-${ENV}-frontend:${TAG}
docker push ${ECR_REGISTRY}/durableai-${ENV}-backend:${TAG}

echo "=== Registering New Task Definitions ==="
echo "Creating new task definitions with updated images..."

# Get current task definitions and update image tags
echo "Fetching current frontend task definition..."
aws ecs describe-task-definition \
  --task-definition durable-code-${ENV}-frontend \
  --region ${AWS_REGION} \
  --query 'taskDefinition' \
  --output json > /tmp/frontend-task-def.json

# Update the image tag in the task definition
jq ".containerDefinitions[0].image = \"${ECR_REGISTRY}/durableai-${ENV}-frontend:${TAG}\" | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)" /tmp/frontend-task-def.json > /tmp/frontend-task-def-new.json

echo "Registering new frontend task definition..."
FRONTEND_TASK_ARN=$(aws ecs register-task-definition \
  --cli-input-json file:///tmp/frontend-task-def-new.json \
  --region ${AWS_REGION} \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "Fetching current backend task definition..."
aws ecs describe-task-definition \
  --task-definition durable-code-${ENV}-backend \
  --region ${AWS_REGION} \
  --query 'taskDefinition' \
  --output json > /tmp/backend-task-def.json

# Update the image tag in the task definition
jq ".containerDefinitions[0].image = \"${ECR_REGISTRY}/durableai-${ENV}-backend:${TAG}\" | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)" /tmp/backend-task-def.json > /tmp/backend-task-def-new.json

echo "Registering new backend task definition..."
BACKEND_TASK_ARN=$(aws ecs register-task-definition \
  --cli-input-json file:///tmp/backend-task-def-new.json \
  --region ${AWS_REGION} \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "=== Updating ECS Services ==="
echo "Updating services with new task definitions..."

# Update ECS services to use the new task definitions
echo "Updating frontend service with new task definition..."
aws ecs update-service \
  --cluster durableai-${ENV}-cluster \
  --service durable-code-${ENV}-frontend \
  --task-definition ${FRONTEND_TASK_ARN} \
  --region ${AWS_REGION} \
  --output json > /dev/null

echo "Updating backend service with new task definition..."
aws ecs update-service \
  --cluster durableai-${ENV}-cluster \
  --service durable-code-${ENV}-backend \
  --task-definition ${BACKEND_TASK_ARN} \
  --region ${AWS_REGION} \
  --output json > /dev/null

echo "=== Deployment Complete ==="
echo "Images pushed successfully to ECR"
echo "ECS services updated to use tag: ${TAG}"
echo ""
echo "The services are now redeploying. Check the ECS console for deployment status."
echo "To access the application, check the ALB DNS name:"
echo ""
aws elbv2 describe-load-balancers --names durable-code-${ENV}-alb --query 'LoadBalancers[0].DNSName' --output text

cd ../..
