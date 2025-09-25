#!/bin/bash
# Deploy application to AWS ECS

set -e

# Configuration
AWS_REGION="us-west-2"
AWS_ACCOUNT_ID="449870229058"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ENV="${ENV:-dev}"

echo "=== Starting Application Deployment ==="
echo "Environment: ${ENV}"
echo "ECR Registry: ${ECR_REGISTRY}"

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Build and tag images
echo "Building Docker images..."

# Frontend
echo "Building frontend..."
cd durable-code-app/frontend
docker build -t durableai-${ENV}-frontend:latest -f Dockerfile .
docker tag durableai-${ENV}-frontend:latest ${ECR_REGISTRY}/durableai-${ENV}-frontend:latest

# Backend
echo "Building backend..."
cd ../backend
docker build -t durableai-${ENV}-backend:latest -f Dockerfile .
docker tag durableai-${ENV}-backend:latest ${ECR_REGISTRY}/durableai-${ENV}-backend:latest

# Push images to ECR
echo "Pushing images to ECR..."
docker push ${ECR_REGISTRY}/durableai-${ENV}-frontend:latest
docker push ${ECR_REGISTRY}/durableai-${ENV}-backend:latest

echo "=== Deployment Complete ==="
echo "Images pushed successfully to ECR"
echo ""
echo "The application will be deployed via Terraform ECS service configuration."
echo "To access the application, check the ALB DNS name:"
echo ""
aws elbv2 describe-load-balancers --names durable-code-${ENV}-alb --query 'LoadBalancers[0].DNSName' --output text

cd ../..
