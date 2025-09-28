# Base Infrastructure Workspace

This workspace manages persistent base infrastructure that is rarely modified and expensive to recreate.

## Resources Managed

### Networking
- **VPC** - Virtual Private Cloud with DNS support
- **Subnets** - Public and private subnets across availability zones
- **Internet Gateway** - For public subnet connectivity
- **NAT Gateways** - For private subnet internet access (optional)
- **Route Tables** - Public and private routing configurations
- **Security Groups** - ALB and ECS task security groups
- **VPC Endpoints** - S3, ECR, CloudWatch Logs endpoints when NAT disabled

### Container Registry
- **ECR Repositories** - Frontend and backend Docker image storage
- **ECR Lifecycle Policies** - Automated image cleanup rules
- **ECR Repository Policies** - Access control for push/pull operations

### DNS and Certificates
- **Route53 Hosted Zone** - DNS zone for custom domain (optional)
- **ACM Certificate** - SSL/TLS certificate with DNS validation (optional)

### Load Balancer
- **Application Load Balancer** - Entry point for all traffic
- **S3 Bucket for ALB Logs** - Access logs storage (production only)

## Outputs

All resources expose outputs for consumption by the runtime workspace:
- VPC and subnet IDs
- Security group IDs
- ECR repository URLs and ARNs
- ALB ARN and DNS name
- Route53 zone ID (if created)
- ACM certificate ARN (if created)

## Usage

### Initialize Workspace
```bash
./infra/scripts/workspace-init.sh base dev
```

### Deploy Infrastructure
```bash
./infra/scripts/workspace-deploy-base.sh dev
```

### Check Status
```bash
./infra/scripts/workspace-status.sh dev
```

### Destroy Infrastructure (DANGEROUS)
```bash
cd infra/terraform/workspaces/base
terraform destroy -var-file="../../environments/dev.tfvars"
```

## Cost Optimization

- NAT Gateways can be disabled for dev environments
- VPC Endpoints provide free alternatives for S3 access
- ALB access logs only enabled in production
- ECR lifecycle policies clean up old images automatically

## Tags

All resources are tagged with:
- `Environment` - dev/staging/prod
- `Workspace` - base-{env}
- `Scope` - base
- `ManagedBy` - Terraform

## Dependencies

The base workspace has no dependencies on other workspaces. The runtime workspace depends on outputs from this workspace.

## For More Information

See the comprehensive guide: [Terraform Workspaces Documentation](/.ai/howto/terraform-workspaces.md)