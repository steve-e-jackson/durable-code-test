# ECR (Elastic Container Registry) Configuration

## Overview
This module sets up AWS ECR repositories for the Durable Code Test application with cost-optimized lifecycle policies and security configurations.

## Created Resources

### Repositories
- **Frontend Repository**: `durableai-dev-frontend`
  - URL: `449870229058.dkr.ecr.us-west-2.amazonaws.com/durableai-dev-frontend`
  - Tag immutability enabled
  - Image scanning on push enabled

- **Backend Repository**: `durableai-dev-backend`
  - URL: `449870229058.dkr.ecr.us-west-2.amazonaws.com/durableai-dev-backend`
  - Tag immutability enabled
  - Image scanning on push enabled

### Lifecycle Policies
Both repositories have identical lifecycle policies for cost optimization:
1. **Production Images**: Keep last 10 images tagged with `v`, `release`, or `prod`
2. **Development Images**: Remove images tagged with `dev` or `staging` after 7 days
3. **Untagged Images**: Remove after 1 day

### Security Features
- **Image Scanning**: Automatic vulnerability scanning on push
- **Encryption**: AES256 encryption at rest
- **Tag Immutability**: Prevents overwriting existing image tags
- **IAM Policies**: Restricted access for GitHub Actions and ECS tasks only

## Usage

### Authenticate Docker with ECR
```bash
export AWS_PROFILE=terraform-deploy
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 449870229058.dkr.ecr.us-west-2.amazonaws.com
```

### Push Images

#### Frontend
```bash
docker build -t frontend-app ./frontend
docker tag frontend-app:latest 449870229058.dkr.ecr.us-west-2.amazonaws.com/durableai-dev-frontend:v1.0.0
docker push 449870229058.dkr.ecr.us-west-2.amazonaws.com/durableai-dev-frontend:v1.0.0
```

#### Backend
```bash
docker build -t backend-app ./backend
docker tag backend-app:latest 449870229058.dkr.ecr.us-west-2.amazonaws.com/durableai-dev-backend:v1.0.0
docker push 449870229058.dkr.ecr.us-west-2.amazonaws.com/durableai-dev-backend:v1.0.0
```

### Tag Conventions
- **Production**: `v1.0.0`, `release-1.0.0`, `prod`
- **Staging**: `staging`, `staging-v1.0.0`
- **Development**: `dev`, `dev-feature-name`

## Cost Optimization

### Monthly Cost Estimate
- **Storage**: ~$0.10/GB/month (first 500GB)
- **Data Transfer**: $0.00 within same region to ECS
- **Lifecycle Policies**: Automatically clean up old images to minimize storage costs
- **Estimated Total**: < $1/month for typical usage

### Cost Saving Features
1. **Lifecycle policies** automatically delete old images
2. **Tag immutability** prevents accidental storage waste from overwriting
3. **Single region** deployment (no cross-region replication costs)

## Testing

### Verify Repository Creation
```bash
aws ecr describe-repositories --region us-west-2 --profile terraform-deploy
```

### Check Image Scan Results
```bash
aws ecr describe-image-scan-findings \
  --repository-name durableai-dev-backend \
  --image-id imageTag=dev-test \
  --region us-west-2 \
  --profile terraform-deploy
```

### List Images
```bash
aws ecr list-images --repository-name durableai-dev-backend --region us-west-2 --profile terraform-deploy
```

## Terraform Outputs
The following outputs are available for use in other modules:
- `ecr_frontend_repository_url`: Full URL for frontend repository
- `ecr_backend_repository_url`: Full URL for backend repository
- `ecr_frontend_repository_arn`: ARN for IAM policies
- `ecr_backend_repository_arn`: ARN for IAM policies
- `ecr_frontend_repository_name`: Repository name
- `ecr_backend_repository_name`: Repository name

## Next Steps
- PR3: Configure ECS cluster and task definitions to use these repositories
- PR5: Set up GitHub Actions with permissions to push to these repositories

## Troubleshooting

### Push Denied
If you get permission denied when pushing:
1. Ensure AWS CLI is configured: `aws configure --profile terraform-deploy`
2. Re-authenticate Docker: `aws ecr get-login-password | docker login ...`
3. Check IAM permissions for your user/role

### Image Not Found
If ECS can't pull images:
1. Verify the image tag exists: `aws ecr list-images ...`
2. Check ECS task execution role has ECR permissions
3. Ensure repository policy allows ECS tasks

### Scan Results Not Available
Image scanning may take a few minutes. Check status with:
```bash
aws ecr describe-image-scan-findings --repository-name [repo] --image-id imageTag=[tag]
```
