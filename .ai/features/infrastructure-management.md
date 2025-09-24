# Infrastructure Management

Docker-based Terraform infrastructure management without local tool installation.

## Overview

The infrastructure management system provides comprehensive Make targets for managing AWS infrastructure using Terraform. All commands run in Docker containers, eliminating the need for local Terraform or AWS CLI installations.

## Key Features

- **Docker-based execution** - All Terraform commands run in containers
- **Auto-initialization** - Terraform automatically initializes on first use
- **Persistent caching** - Docker volumes cache `.terraform` directory
- **AWS profile support** - Easy switching between AWS accounts
- **Safety features** - Confirmation prompts for destructive operations
- **State management** - S3 backend with DynamoDB locking

## Architecture

### Components

1. **Makefile.infra** - Infrastructure Make targets
2. **Docker Containers** - Terraform and AWS CLI execution
3. **Docker Volumes** - Persistent `.terraform` cache
4. **S3 Backend** - Remote state storage
5. **DynamoDB** - State locking

### Directory Structure

```
infra/
├── terraform/              # Terraform configuration files
│   ├── backend.tf         # S3 backend configuration
│   ├── providers.tf       # AWS provider setup
│   ├── variables.tf       # Input variables
│   ├── outputs.tf         # Output values
│   ├── main.tf           # Main resource definitions
│   ├── networking.tf      # Network resources
│   └── locals.tf         # Local values
├── environments/          # Environment-specific configurations
│   ├── dev.tfvars        # Development environment
│   ├── staging.tfvars    # Staging environment
│   └── prod.tfvars       # Production environment
└── scripts/              # Helper scripts
    ├── setup-terraform-backend.sh    # Backend setup
    └── check-domain-availability.sh  # Domain checking

```

## Available Make Targets

### Core Commands
- `make infra-help` - Show all infrastructure management commands
- `make infra-init` - Initialize Terraform (auto-runs on first use)
- `make infra-plan` - Preview infrastructure changes
- `make infra-apply` - Apply infrastructure changes
- `make infra-destroy` - Destroy all infrastructure

### State Management
- `make infra-state-list` - List resources in state
- `make infra-state-show RESOURCE=<name>` - Show resource details
- `make infra-refresh` - Update state from real infrastructure
- `make infra-output` - Show Terraform outputs
- `make infra-output-json` - Show outputs in JSON format

### Workspace Management
- `make infra-workspace-list` - List workspaces
- `make infra-workspace-new WORKSPACE=<name>` - Create workspace
- `make infra-workspace-select WORKSPACE=<name>` - Select workspace

### Utilities
- `make infra-check-aws` - Verify AWS credentials
- `make infra-fmt` - Format Terraform files
- `make infra-validate` - Validate configuration
- `make infra-console` - Open Terraform console
- `make infra-graph` - Generate infrastructure graph
- `make infra-import RESOURCE=<name> ID=<id>` - Import existing resource
- `make infra-clean-cache` - Remove Terraform cache
- `make infra-reinit` - Clean and reinitialize

### Quick Commands
- `make infra-check` - Format and validate
- `make infra-up` - Initialize and apply
- `make infra-down` - Destroy infrastructure

## Configuration

### Environment Variables

- `AWS_PROFILE` - AWS profile to use (default: "default")
- `AWS_REGION` - AWS region (default: "us-west-2")
- `AUTO` - Skip confirmation prompts when "true"

### Examples

```bash
# Use specific AWS profile
AWS_PROFILE=production make infra-plan

# Use different region
AWS_REGION=eu-west-1 make infra-apply

# Skip confirmation
AUTO=true make infra-apply

# Combine options
AWS_PROFILE=staging AUTO=true make infra-destroy
```

## Auto-Initialization

The system automatically detects when Terraform needs initialization:

1. Checks if `terraform providers` command works
2. If not, automatically runs `make infra-init`
3. Creates Docker volume for `.terraform` cache
4. Downloads providers and configures backend
5. Proceeds with requested command

### Why Initialization is Required

Even with state on S3, initialization is necessary to:

- **Download provider plugins** - AWS provider and dependencies
- **Configure backend** - Connect to S3 and DynamoDB
- **Create local cache** - `.terraform` directory
- **Validate access** - Verify credentials and permissions

## Docker Implementation

### Volume Management

```makefile
# Unique volume per project based on path hash
TERRAFORM_VOLUME = terraform-cache-$(shell echo $(PWD) | md5sum | cut -d' ' -f1)
```

### Container Configuration

```makefile
# Base Docker run command
TERRAFORM_DOCKER_RUN = docker run --rm \
    -v $(PWD)/$(TERRAFORM_DIR):/terraform \
    -v $(TERRAFORM_VOLUME):/terraform/.terraform \
    -v $(HOME)/.aws:/root/.aws:ro \
    -w /terraform \
    -e AWS_PROFILE=$(AWS_PROFILE) \
    -e AWS_REGION=$(AWS_REGION) \
    $(TERRAFORM_IMAGE)
```

## Infrastructure Details

### AWS Resources

The infrastructure includes:

- **ECS Fargate** - Serverless container hosting
- **Application Load Balancer** - Traffic distribution
- **Route53** - DNS management
- **CloudWatch** - Logging and monitoring
- **VPC** - Network isolation
- **ECR** - Container registry

### Cost Optimization

Implemented strategies:

1. **Auto-shutdown scheduling** - 60-70% savings
   - Weekdays: 8 AM - 8 PM PST
   - Weekends: Shut down

2. **Fargate Spot** - 70% savings for dev/staging
   - Automatic fallback to on-demand

3. **Right-sizing** - Minimal resource allocation
   - Dev: 256 CPU / 512 MB
   - Staging: 512 CPU / 1024 MB
   - Prod: 512 CPU / 1024 MB

### Estimated Costs

| Environment | 24/7 Cost | With Scheduling | With Spot | Final Cost |
|-------------|-----------|-----------------|-----------|------------|
| Dev         | $30       | $10             | $3        | **$3**     |
| Staging     | $35       | $12             | N/A       | **$12**    |
| Prod        | $35       | $35             | N/A       | **$35**    |

## Security

### Current Measures
- ✅ State encrypted in S3
- ✅ State locking with DynamoDB
- ✅ S3 bucket versioning
- ✅ Public access blocked
- ✅ Read-only credential mounting

### Best Practices
- Never commit credentials
- Use IAM roles when possible
- Enable MFA on accounts
- Regularly rotate keys
- Minimize IAM permissions

## Troubleshooting

### Common Issues

**Backend initialization error**
```bash
make infra-reinit  # Clean cache and reinitialize
```

**AWS credentials error**
```bash
make infra-check-aws  # Verify credentials
AWS_PROFILE=myprofile make infra-check-aws
```

**State lock error**
- Wait for other operations to complete
- Check DynamoDB table for locks

**Docker permission error**
- Ensure Docker is running
- Check user has Docker permissions

## Integration

The infrastructure management integrates with:

- Main Makefile via `-include Makefile.infra`
- GitHub Actions for CI/CD (future)
- Development environment via Docker Compose
- Application deployment pipelines