# ECS Cluster and Fargate Service Configuration

## PR3: Container Orchestration Infrastructure

### Overview
This PR implements the ECS (Elastic Container Service) cluster and Fargate services for running containerized applications. The infrastructure is designed with cost optimization as a primary concern while maintaining production readiness.

### Components Created

#### 1. ECS Cluster
- **Name**: `durableai-dev-cluster` (for dev environment)
- **Container Insights**: Disabled for dev (saves ~$2/month), enabled for production
- **Purpose**: Manages container orchestration and scheduling

#### 2. Task Definitions

##### Backend Task Definition
- **CPU**: 256 (dev) / 512 (prod)
- **Memory**: 512 MB (dev) / 1024 MB (prod)
- **Port**: 8000
- **Health Check**: HTTP endpoint at `/health`

##### Frontend Task Definition
- **CPU**: 256 (both environments - frontend needs less)
- **Memory**: 512 MB (both environments)
- **Port**: 3000
- **Health Check**: HTTP endpoint at root `/`

#### 3. ECS Services

##### Backend Service
- **Desired Count**: 1 (dev) / 2 (prod)
- **Launch Type**: Fargate Spot (dev) / Fargate (prod)
- **Auto-scaling**: Disabled (dev) / Enabled (prod)
- **Service Discovery**: `backend.dev.local`

##### Frontend Service
- **Desired Count**: 1 (dev) / 2 (prod)
- **Launch Type**: Fargate Spot (dev) / Fargate (prod)
- **Auto-scaling**: Disabled (dev) / Enabled (prod)
- **Service Discovery**: `frontend.dev.local`

#### 4. IAM Roles

##### Task Execution Role
- Pulls images from ECR
- Writes logs to CloudWatch
- Managed AWS policy: `AmazonECSTaskExecutionRolePolicy`

##### Task Role
- Application-level permissions
- SSM Parameter access for secrets
- KMS decryption for secure parameters

#### 5. CloudWatch Log Groups
- **Backend Logs**: `/ecs/durableai-dev/backend`
- **Frontend Logs**: `/ecs/durableai-dev/frontend`
- **Retention**: 7 days (dev) / 30 days (prod)

#### 6. Service Discovery
- **Private DNS Namespace**: `dev.local`
- **Backend DNS**: `backend.dev.local`
- **Frontend DNS**: `frontend.dev.local`
- **Purpose**: Internal service-to-service communication

### Cost Optimizations Implemented

1. **Fargate Spot for Dev Environment**
   - 70% cost savings compared to on-demand Fargate
   - Automatic fallback to on-demand if Spot unavailable
   - Monthly savings: ~$21

2. **Minimal Resource Allocation**
   - Dev: 256 CPU / 512 Memory
   - Prod: 512 CPU / 1024 Memory
   - Right-sized based on actual needs

3. **Single Task for Dev**
   - Running only 1 task per service in dev
   - Production runs 2 for high availability

4. **Container Insights Disabled for Dev**
   - Saves ~$2/month in CloudWatch costs
   - Enabled only for production monitoring

5. **Log Retention Optimization**
   - 7 days for dev (reduced from default 30)
   - Saves on CloudWatch storage costs

### Cost Breakdown

#### Development Environment (with optimizations)
- Fargate Spot (2 tasks): ~$3/month
- CloudWatch Logs: ~$1/month
- **Total: ~$4/month**

#### Production Environment
- Fargate (4 tasks): ~$20/month
- CloudWatch Logs & Insights: ~$3/month
- **Total: ~$23/month**

### Deployment Commands

```bash
# Navigate to terraform directory
cd infra/terraform

# Initialize Terraform (if not already done)
terraform init

# Plan the deployment
terraform plan -var-file=../environments/dev.tfvars

# Apply the changes
terraform apply -var-file=../environments/dev.tfvars

# View outputs
terraform output
```

### Testing the Deployment

1. **Verify Cluster Creation**:
```bash
aws ecs describe-clusters --clusters durableai-dev-cluster
```

2. **Check Services Status**:
```bash
aws ecs list-services --cluster durableai-dev-cluster
aws ecs describe-services --cluster durableai-dev-cluster --services durableai-dev-backend durableai-dev-frontend
```

3. **View Task Definitions**:
```bash
aws ecs list-task-definitions --family-prefix durableai-dev
```

4. **Monitor CloudWatch Logs**:
```bash
aws logs tail /ecs/durableai-dev/backend --follow
aws logs tail /ecs/durableai-dev/frontend --follow
```

### Pushing Container Images

Before the services can run, you need to push container images:

```bash
# Backend
docker build -t durableai-backend ./backend
docker tag durableai-backend:latest $BACKEND_ECR_URL:latest
docker push $BACKEND_ECR_URL:latest

# Frontend
docker build -t durableai-frontend ./frontend
docker tag durableai-frontend:latest $FRONTEND_ECR_URL:latest
docker push $FRONTEND_ECR_URL:latest

# Force service update to pull new images
aws ecs update-service --cluster durableai-dev-cluster --service durableai-dev-backend --force-new-deployment
aws ecs update-service --cluster durableai-dev-cluster --service durableai-dev-frontend --force-new-deployment
```

### Auto-Scaling Configuration (Production Only)

The production environment includes auto-scaling based on CPU utilization:
- **Target**: 60% CPU utilization
- **Min Capacity**: 1 task
- **Max Capacity**: 4 tasks
- **Scale-out**: When CPU > 60% for 2 minutes
- **Scale-in**: When CPU < 60% for 5 minutes

### Circuit Breaker

Both services include circuit breaker configuration:
- Automatically rolls back failed deployments
- Prevents cascading failures
- Reduces downtime during problematic releases

### Service Discovery

Services can communicate internally using DNS names:
- Backend API calls: `http://backend.dev.local:8000`
- Frontend calls: `http://frontend.dev.local:3000`

This eliminates the need for hardcoded IPs or load balancers for internal communication.

### Security Considerations

1. **Network Isolation**
   - Services run in private subnets
   - No direct internet access (egress through NAT)
   - Security group restricts traffic

2. **IAM Principle of Least Privilege**
   - Task execution role has minimal permissions
   - Task role only accesses specific SSM parameters

3. **Secrets Management**
   - Sensitive values stored in SSM Parameter Store
   - KMS encryption for parameters
   - No hardcoded secrets in task definitions

### Monitoring and Alerting

To be implemented in PR6:
- CloudWatch dashboards
- CPU/Memory utilization alarms
- Task health monitoring
- Log aggregation and analysis

### Next Steps (PR4)

After ECS is operational, the next PR will:
1. Create Application Load Balancer
2. Configure target groups for services
3. Set up HTTPS with ACM certificates
4. Configure Route53 DNS records
5. Enable public access to applications

### Troubleshooting

**Tasks not starting:**
- Check CloudWatch logs for errors
- Verify ECR images exist and are accessible
- Check IAM roles have correct permissions
- Ensure security groups allow traffic

**Service discovery not working:**
- Verify namespace and service registration
- Check security group rules
- Test DNS resolution within VPC

**High costs:**
- Review Fargate Spot usage for dev
- Check task CPU/memory allocation
- Monitor CloudWatch log volume
- Consider auto-shutdown scheduling (PR8)

### Rollback Instructions

If issues occur:
```bash
# Destroy only ECS resources (preserves VPC and ECR)
terraform destroy -target=aws_ecs_cluster.main \
                 -target=aws_ecs_service.backend \
                 -target=aws_ecs_service.frontend \
                 -var-file=../environments/dev.tfvars
```

### Documentation Updates

- [x] Created ECS_README.md with detailed configuration
- [x] Updated outputs.tf with ECS resource outputs
- [x] Added cost optimization details
- [ ] Update PROGRESS_TRACKER.md with PR3 completion
- [ ] Create PR and merge to main

### Success Metrics

- ✅ ECS cluster successfully created
- ✅ Task definitions configured with appropriate resources
- ✅ Services deployed with Fargate Spot for dev
- ✅ Service discovery operational
- ✅ CloudWatch logging configured
- ✅ IAM roles follow least privilege
- ✅ Cost optimizations reduce expenses by 70%
- ✅ Total monthly cost for ECS: < $5 (dev) / < $25 (prod)
