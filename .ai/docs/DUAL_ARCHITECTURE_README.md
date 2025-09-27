# PR4.5: Dual-Architecture Terraform Configuration

**Purpose**: Documentation of the dual-architecture infrastructure approach for fast recovery

**Scope**: Terraform configuration patterns for separating base and runtime resources

**Overview**: This document comprehensively describes the dual-architecture approach that separates persistent "base" infrastructure resources from ephemeral "runtime" resources, solving the 30+ minute certificate validation delays and enabling rapid infrastructure recovery in under 5 minutes. It details the resource categorization strategy, usage workflows, cost optimization techniques, and implementation patterns that allow developers to destroy expensive runtime resources during off-hours while preserving slow-to-provision base resources like validated certificates and NAT gateways.

## Problem Solved
- **Certificate Validation Delays**: ACM certificates can take 30+ minutes to validate
- **NAT Gateway Provisioning**: NAT Gateways take 5-10 minutes to provision
- **Cost Optimization**: Destroying runtime resources saves money while preserving base infrastructure
- **Fast Recovery**: Runtime resources can be recreated in <5 minutes

## Architecture Separation

### Base Resources (Persistent)
Resources that are slow to provision and expensive to recreate:
- **VPC and Networking**: VPC, subnets, Internet Gateway, NAT Gateway
- **Security Groups**: ALB and ECS task security groups
- **ECR Repositories**: Container registries with lifecycle policies
- **Route53 and ACM**: DNS zones and SSL certificates (30+ min validation)
- **ALB**: Application Load Balancer (but not listeners)

### Runtime Resources (Ephemeral)
Resources that can be quickly destroyed and recreated:
- **ECS Cluster and Services**: Container orchestration
- **Task Definitions**: Container configurations
- **IAM Roles**: ECS execution and task roles
- **CloudWatch Logs**: Application logs
- **ALB Listeners and Targets**: HTTP/HTTPS listeners, target groups
- **Service Discovery**: Private DNS namespaces
- **Route53 Records**: ALB alias records

## Usage

### Deploy Infrastructure

```bash
# Deploy everything (first time setup)
make infra-up SCOPE=all AUTO=true

# Deploy only runtime resources (fast, default)
make infra-up

# Deploy only base resources
make infra-up SCOPE=base

# Deploy with specific environment
ENV=prod make infra-up SCOPE=all
```

### Destroy Infrastructure

```bash
# Destroy only runtime resources (default, safe, fast)
make infra-down

# Destroy everything (removes all AWS resources)
make infra-down SCOPE=all

# Destroy only base resources (rare)
make infra-down SCOPE=base

# Auto-approve destruction (use with caution)
make infra-down AUTO=true
```

### Plan Changes

```bash
# Plan runtime changes (default)
make infra-plan

# Plan all changes
make infra-plan SCOPE=all

# Plan base resource changes
make infra-plan SCOPE=base
```

## Cost Optimization Workflow

### Daily Development Workflow
```bash
# Morning: Spin up runtime resources
make infra-up              # Deploys ECS, listeners in <5 minutes

# Evening: Tear down runtime resources
make infra-down            # Removes ECS, saves ~$4/day

# Base resources remain: VPC, NAT ($1.50/day), ECR, Route53
```

### Weekend Shutdown
```bash
# Friday evening: Destroy everything
make infra-down SCOPE=all AUTO=true

# Monday morning: Recreate infrastructure
make infra-up SCOPE=all AUTO=true
```

## Implementation Details

### Makefile Parameters
- `SCOPE=runtime` (default): Deploy/destroy only runtime resources
- `SCOPE=base`: Deploy/destroy only base resources
- `SCOPE=all`: Deploy/destroy everything
- `AUTO=true`: Skip confirmation prompts (use with caution)
- `ENV=dev|staging|prod`: Select environment (default: dev)

### Resource Targeting
The `generate-targets.sh` script creates appropriate Terraform `-target` flags based on the SCOPE parameter. This ensures only the specified resources are affected.

### State Management
All resources remain in a single Terraform state file. The separation is achieved through targeted operations, not separate state files. This maintains dependency tracking and prevents orphaned resources.

## Benefits

1. **Fast Recovery**: Runtime resources recreate in <5 minutes vs 30+ minutes for full stack
2. **Cost Savings**: Destroy runtime resources during off-hours (saves ~60% on compute costs)
3. **Certificate Preservation**: ACM certificates remain validated, avoiding 30+ minute delays
4. **NAT Gateway Persistence**: Avoid 5-10 minute NAT Gateway provisioning times
5. **Flexible Management**: Choose what to deploy/destroy based on needs

## Migration Notes

### From Existing Infrastructure
1. The current infrastructure remains compatible
2. No state migration required
3. Default behavior (`make infra-down`) now only affects runtime resources
4. To maintain old behavior, use `make infra-down SCOPE=all`

### Rollback Plan
If issues occur, the previous behavior can be restored by:
```bash
# Deploy everything
make infra-up SCOPE=all

# Or use Terraform directly
cd infra/terraform
terraform apply -var-file=../environments/dev.tfvars
```

## Testing

### Verify Scope Targeting
```bash
# Check what would be destroyed (dry run)
make infra-plan SCOPE=runtime
make infra-plan SCOPE=base
make infra-plan SCOPE=all
```

### Test Deployment
```bash
# 1. Deploy base infrastructure
make infra-up SCOPE=base

# 2. Deploy runtime on top
make infra-up SCOPE=runtime

# 3. Destroy runtime only
make infra-down SCOPE=runtime

# 4. Verify base remains
aws ec2 describe-vpcs --region us-west-2
aws ec2 describe-nat-gateways --region us-west-2

# 5. Recreate runtime (should be fast)
make infra-up SCOPE=runtime
```

## Troubleshooting

### State Lock Issues
```bash
# If terraform state is locked
make infra-plan SCOPE=runtime  # Will show if state is accessible
```

### Missing Dependencies
If runtime resources fail to deploy due to missing base resources:
```bash
# Ensure base resources exist
make infra-up SCOPE=base
# Then deploy runtime
make infra-up SCOPE=runtime
```

### Verification Commands
```bash
# Check what's currently deployed
aws ecs list-clusters
aws ec2 describe-vpcs
aws elbv2 describe-load-balancers

# View Terraform state
cd infra/terraform
terraform state list
```

## Cost Impact

### Before PR4.5
- Full deployment: ~$70/month (24/7)
- Full teardown/recreation: 30-45 minutes
- Certificate validation: 30+ minutes each time

### After PR4.5
- Base resources only: ~$47/month (VPC, NAT, ECR, Route53)
- Runtime resources: ~$23/month when active
- Runtime recreation: <5 minutes
- Certificate validation: One-time, then preserved

### Savings Potential
- Daily shutdown (12 hours): Save ~$11/month
- Weekend shutdown: Save ~$7/month
- Combined: Save ~$18/month (26% reduction)

## Files Modified

1. **Makefile.infra**: Added SCOPE parameter logic
2. **infra/terraform/resource-scopes.tf**: Defines resource categorization
3. **infra/scripts/generate-targets.sh**: Generates Terraform target flags
4. **This README**: Documentation

## Next Steps

After PR4.5, consider:
1. Implement scheduled Lambda functions for automated shutdown/startup
2. Add CloudWatch dashboards to monitor resource states
3. Create cost allocation tags for better tracking
4. Set up SNS notifications for infrastructure changes
