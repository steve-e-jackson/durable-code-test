# AWS Infrastructure for Durable Code Test

This directory contains the Terraform infrastructure code for deploying the Durable Code Test application to AWS.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Domain Registration](#domain-registration)
- [Cost Optimization](#cost-optimization)
- [Directory Structure](#directory-structure)
- [Deployment Instructions](#deployment-instructions)
- [Environment Configuration](#environment-configuration)
- [Cost Breakdown](#cost-breakdown)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Overview

This infrastructure uses:
- **AWS ECS Fargate** for serverless container hosting
- **Terraform** for infrastructure as code
- **S3 + DynamoDB** for Terraform state management
- **Auto-shutdown scheduling** for cost optimization
- **GitHub Actions OIDC** for secure CI/CD (future PR)

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure the AWS CLI
   ```bash
   aws --version  # Should be 2.x or higher
   aws configure  # Set up your credentials
   ```
3. **Terraform**: Install Terraform 1.0 or higher
   ```bash
   terraform version  # Should be >= 1.0
   ```
4. **Domain Name**: Plan to register a domain (see recommendations below)

## Quick Start

### Step 1: Set Up AWS Account

1. Create or log into your AWS account
2. Set up billing alerts:
   ```bash
   # Go to AWS Console > Billing > Billing preferences
   # Enable "Receive Billing Alerts"
   # Create alarms at $25, $40, and $60
   ```
3. Enable MFA on root account for security
4. Create an IAM user for Terraform with AdministratorAccess (temporary, will be restricted later)

### Step 2: Configure AWS CLI

```bash
# Configure AWS credentials
aws configure
# Enter your Access Key ID, Secret Access Key, region (us-west-2), and output format (json)

# Verify configuration
aws sts get-caller-identity
```

### Step 3: Set Up Terraform Backend

```bash
# Run the setup script to create S3 bucket and DynamoDB table
cd infra/scripts
./setup-terraform-backend.sh

# This will create:
# - S3 bucket: durable-code-terraform-state
# - DynamoDB table: durable-code-terraform-locks
```

### Step 4: Initialize Terraform

```bash
cd ../terraform
terraform init

# You should see:
# "Terraform has been successfully initialized!"
```

## Domain Registration

### Recommended Domains (Check Availability)

**Top choices for .dev domains (~$12-15/year):**
1. `codewithai.dev` - Clear purpose, professional
2. `buildwithai.dev` - Action-oriented, memorable
3. `durablecode.dev` - Matches project name
4. `aicodecraft.dev` - Creative, unique
5. `devwithai.dev` - Developer-focused
6. `aicodelab.dev` - Experimental feel

**Alternative TLDs if .dev unavailable:**
- `.tech` domains: ~$10/year (affordable)
- `.app` domains: ~$14/year (forces HTTPS)
- `.io` domains: ~$35/year (more expensive)

### How to Register

#### Option 1: Register through Route53 (Recommended)
```bash
# Check availability
aws route53domains check-domain-availability --domain-name codewithai.dev

# Register through AWS Console
# 1. Go to Route53 > Registered domains
# 2. Click "Register domain"
# 3. Follow the wizard
# Benefits: Integrated DNS management, automatic hosted zone creation
```

#### Option 2: External Registrar
- Use Namecheap, GoDaddy, or Google Domains
- Will need to update nameservers to Route53 later
- Slightly more complex but may be cheaper

## Cost Optimization

### Implemented Strategies

1. **Auto-Shutdown Scheduling** (60-70% savings)
   - Weekdays: Running 8 AM - 8 PM PST (12 hours)
   - Weekends: Completely shut down
   - Manual override available via tags

2. **Fargate Spot for Dev/Staging** (70% savings)
   - Enabled in dev.tfvars
   - Automatic fallback to on-demand

3. **Minimal Resource Sizing**
   - Dev: 256 CPU / 512 MB Memory
   - Staging: 512 CPU / 1024 MB Memory
   - Prod: 512 CPU / 1024 MB Memory

### Estimated Monthly Costs

| Environment | 24/7 Cost | With Scheduling | With Spot | Final Cost |
|-------------|-----------|-----------------|-----------|------------|
| Dev         | $30       | $10             | $3        | **$3**     |
| Staging     | $35       | $12             | N/A       | **$12**    |
| Prod        | $35       | $35             | N/A       | **$35**    |

**Total for Dev only: ~$25/month (within budget!)**

## Directory Structure

```
infra/
├── terraform/                # Terraform configuration files
│   ├── backend.tf           # S3 backend configuration
│   ├── providers.tf         # AWS provider setup
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Output values
│   └── (future modules)     # To be added in subsequent PRs
├── environments/            # Environment-specific configurations
│   ├── dev.tfvars          # Development environment
│   ├── staging.tfvars      # Staging environment
│   └── prod.tfvars         # Production environment
├── scripts/                # Helper scripts
│   └── setup-terraform-backend.sh  # Backend setup script
└── README.md              # This file
```

## Deployment Instructions

### First Time Setup

1. **Set up backend (if not already done)**:
   ```bash
   cd infra/scripts
   ./setup-terraform-backend.sh
   ```

2. **Initialize Terraform**:
   ```bash
   cd ../terraform
   terraform init
   ```

3. **Review the plan**:
   ```bash
   terraform plan -var-file=../environments/dev.tfvars
   ```

4. **Apply infrastructure**:
   ```bash
   terraform apply -var-file=../environments/dev.tfvars
   ```

### Updating Infrastructure

```bash
# Always review changes first
terraform plan -var-file=../environments/dev.tfvars

# Apply if changes look good
terraform apply -var-file=../environments/dev.tfvars
```

### Destroying Infrastructure (Cost Savings)

```bash
# Destroy all resources (useful for stopping costs)
terraform destroy -var-file=../environments/dev.tfvars
```

## Environment Configuration

### Development (`dev.tfvars`)
- Auto-shutdown enabled (saves 66% on compute)
- Fargate Spot enabled (saves 70% on remaining costs)
- Minimal resources (256 CPU / 512 Memory)
- Single instance
- Budget: $10/month

### Staging (`staging.tfvars`)
- Auto-shutdown enabled
- On-demand Fargate (more stable)
- Moderate resources (512 CPU / 1024 Memory)
- Two instances for HA testing
- Budget: $15/month

### Production (`prod.tfvars`)
- Always on (no auto-shutdown)
- On-demand Fargate (maximum reliability)
- Production resources (512 CPU / 1024 Memory)
- Two instances minimum for HA
- Full monitoring and security
- Budget: $25/month

## Cost Breakdown

### Fixed Costs (Cannot be reduced)
- **ALB**: ~$18/month (always on)
- **Route53 Hosted Zone**: $0.50/month
- **Domain**: ~$1/month ($12-15/year)

### Variable Costs (Can be optimized)
- **Fargate Tasks**: $10-30/month (depending on size and schedule)
- **CloudWatch Logs**: $2-5/month
- **Data Transfer**: $1-3/month
- **ECR Storage**: $1-2/month

### Cost Monitoring

Set up billing alerts at these thresholds:
- $25 (target budget)
- $40 (warning)
- $60 (critical)

Check costs regularly:
```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

## Troubleshooting

### Common Issues

1. **"Error: Backend configuration changed"**
   ```bash
   # Re-initialize with new backend config
   terraform init -reconfigure
   ```

2. **"Error: AWS credentials not configured"**
   ```bash
   # Configure AWS CLI
   aws configure
   # Or export environment variables
   export AWS_ACCESS_KEY_ID="your-key"
   export AWS_SECRET_ACCESS_KEY="your-secret"
   ```

3. **"Error: S3 bucket already exists"**
   - S3 bucket names must be globally unique
   - Edit `backend.tf` and `setup-terraform-backend.sh` to use a different name
   - Consider adding your AWS account ID to the bucket name

4. **High unexpected costs**
   - Check for running resources:
     ```bash
     terraform state list
     terraform show
     ```
   - Ensure auto-shutdown is working
   - Verify Fargate Spot is enabled for dev

## Security Considerations

### Current Security Measures
- ✅ Terraform state encrypted in S3
- ✅ State locking with DynamoDB
- ✅ MFA on root account (recommended)
- ✅ S3 bucket versioning enabled
- ✅ Public access blocked on state bucket

### To Be Implemented (Future PRs)
- [ ] GitHub OIDC for passwordless deployments (PR5)
- [ ] AWS WAF for application protection (PR7)
- [ ] GuardDuty for threat detection (PR7)
- [ ] Security Hub for compliance (PR7)
- [ ] Secrets Manager for sensitive data (PR7)

### Best Practices
1. Never commit AWS credentials to git
2. Use IAM roles instead of access keys where possible
3. Enable MFA on all IAM users
4. Regularly rotate access keys
5. Review and minimize IAM permissions
6. Enable CloudTrail for audit logging

## Next Steps

After completing PR0 (this setup):

1. **PR1**: Create VPC and networking infrastructure
2. **PR2**: Set up ECR repositories for containers
3. **PR3**: Configure ECS cluster and services
4. **PR4**: Add Application Load Balancer and DNS
5. **PR5**: Implement CI/CD with GitHub Actions

## Support and Documentation

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Pricing Calculator](https://calculator.aws/)
- [Project Issues](https://github.com/steve-e-jackson/durable-code-test/issues)

## License

This infrastructure code is part of the Durable Code Test project.