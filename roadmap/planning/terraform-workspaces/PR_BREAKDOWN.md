# Terraform Workspaces Implementation - PR Breakdown

## PR1: Terraform Workspace Foundation

### Branch: `feat/terraform-workspaces-pr1-foundation`

### Files to Create/Modify:
1. `infra/terraform/workspaces/README.md`
2. `infra/terraform/backend-config/base-dev.hcl`
3. `infra/terraform/backend-config/runtime-dev.hcl`
4. `infra/scripts/workspace-init.sh`
5. `infra/terraform/.gitignore` (update)

### Implementation Steps:

#### 1. Create workspace directory structure
```bash
mkdir -p infra/terraform/workspaces/{base,runtime}
mkdir -p infra/terraform/backend-config
mkdir -p infra/terraform/modules
mkdir -p infra/terraform/shared
```

#### 2. Create backend configurations for workspaces
```hcl
# infra/terraform/backend-config/base-dev.hcl
bucket         = "durable-code-terraform-state"
key            = "base/dev/terraform.tfstate"
region         = "us-west-2"
encrypt        = true
dynamodb_table = "terraform-state-lock"

# infra/terraform/backend-config/runtime-dev.hcl
bucket         = "durable-code-terraform-state"
key            = "runtime/dev/terraform.tfstate"
region         = "us-west-2"
encrypt        = true
dynamodb_table = "terraform-state-lock"
```

#### 3. Create workspace initialization script
```bash
#!/bin/bash
# infra/scripts/workspace-init.sh

WORKSPACE=$1
ENV=$2

if [[ -z "$WORKSPACE" || -z "$ENV" ]]; then
  echo "Usage: ./workspace-init.sh [base|runtime] [dev|staging|prod]"
  exit 1
fi

cd infra/terraform/workspaces/$WORKSPACE
terraform init -backend-config="../../backend-config/${WORKSPACE}-${ENV}.hcl"
terraform workspace new ${WORKSPACE}-${ENV} 2>/dev/null || terraform workspace select ${WORKSPACE}-${ENV}
```

#### 4. Update .gitignore
```
# Terraform workspaces
*.tfstate
*.tfstate.backup
.terraform/
infra/terraform/workspaces/*/.terraform/
infra/terraform/workspaces/*/terraform.tfstate*
```

### Testing:
```bash
# Initialize base workspace
./infra/scripts/workspace-init.sh base dev

# Initialize runtime workspace
./infra/scripts/workspace-init.sh runtime dev

# Verify workspaces created
terraform workspace list
```

---

## PR2: Base Infrastructure Workspace

### Branch: `feat/terraform-workspaces-pr2-base`

### Files to Create/Modify:
1. `infra/terraform/workspaces/base/main.tf`
2. `infra/terraform/workspaces/base/variables.tf`
3. `infra/terraform/workspaces/base/outputs.tf`
4. `infra/terraform/workspaces/base/providers.tf`
5. Move files: `networking.tf`, `ecr.tf`, `route53.tf`, `acm.tf`

### Implementation Steps:

#### 1. Create base workspace main configuration
```hcl
# infra/terraform/workspaces/base/main.tf

terraform {
  required_version = ">= 1.0"

  backend "s3" {
    # Configured via backend-config file
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  workspace_name = terraform.workspace
  environment    = split("-", terraform.workspace)[1]

  common_tags = {
    Environment = local.environment
    Workspace   = local.workspace_name
    ManagedBy   = "Terraform"
    Scope       = "base"
  }
}
```

#### 2. Move base resources from existing files
```hcl
# Move these resources to base/main.tf:
# - aws_vpc
# - aws_subnet (public and private)
# - aws_internet_gateway
# - aws_nat_gateway
# - aws_eip
# - aws_route_table
# - aws_security_group (ALB and ECS)
# - aws_ecr_repository
# - aws_route53_zone
# - aws_acm_certificate
# - aws_lb (just the ALB itself, not targets/listeners)
```

#### 3. Create comprehensive outputs for runtime workspace
```hcl
# infra/terraform/workspaces/base/outputs.tf

output "vpc_id" {
  value       = aws_vpc.main.id
  description = "VPC ID for runtime resources"
}

output "public_subnet_ids" {
  value       = aws_subnet.public[*].id
  description = "Public subnet IDs for ALB"
}

output "private_subnet_ids" {
  value       = aws_subnet.private[*].id
  description = "Private subnet IDs for ECS tasks"
}

output "alb_security_group_id" {
  value       = aws_security_group.alb.id
  description = "ALB security group ID"
}

output "ecs_tasks_security_group_id" {
  value       = aws_security_group.ecs_tasks.id
  description = "ECS tasks security group ID"
}

output "backend_ecr_repository_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "Backend ECR repository URL"
}

output "frontend_ecr_repository_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "Frontend ECR repository URL"
}

output "alb_arn" {
  value       = aws_lb.main.arn
  description = "ALB ARN for target group attachment"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "ALB DNS name"
}

output "route53_zone_id" {
  value       = aws_route53_zone.main.zone_id
  description = "Route53 zone ID"
}
```

### Testing:
```bash
# Deploy base infrastructure
cd infra/terraform/workspaces/base
terraform plan -var-file="../../environments/dev.tfvars"
terraform apply -var-file="../../environments/dev.tfvars"
```

---

## PR3: Runtime Infrastructure Workspace

### Branch: `feat/terraform-workspaces-pr3-runtime`

### Files to Create/Modify:
1. `infra/terraform/workspaces/runtime/main.tf`
2. `infra/terraform/workspaces/runtime/variables.tf`
3. `infra/terraform/workspaces/runtime/outputs.tf`
4. `infra/terraform/workspaces/runtime/providers.tf`
5. Move files: Parts of `ecs.tf`, `alb.tf`

### Implementation Steps:

#### 1. Create runtime workspace main configuration
```hcl
# infra/terraform/workspaces/runtime/main.tf

terraform {
  required_version = ">= 1.0"

  backend "s3" {
    # Configured via backend-config file
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  workspace_name = terraform.workspace
  environment    = split("-", terraform.workspace)[1]

  common_tags = {
    Environment = local.environment
    Workspace   = local.workspace_name
    ManagedBy   = "Terraform"
    Scope       = "runtime"
  }
}
```

#### 2. Move runtime resources
```hcl
# Move these resources to runtime/main.tf:
# - aws_ecs_cluster
# - aws_ecs_task_definition
# - aws_ecs_service
# - aws_lb_target_group
# - aws_lb_listener
# - aws_lb_listener_rule
# - aws_service_discovery_*
# - aws_cloudwatch_log_group
# - aws_iam_role (ECS specific)
```

### Testing:
```bash
# Deploy runtime infrastructure
cd infra/terraform/workspaces/runtime
terraform plan -var-file="../../environments/dev.tfvars"
terraform apply -var-file="../../environments/dev.tfvars"

# Test destroy
terraform destroy -var-file="../../environments/dev.tfvars"
```

---

## PR4: Data Sources and Cross-Workspace References

### Branch: `feat/terraform-workspaces-pr4-data-sources`

### Files to Create/Modify:
1. `infra/terraform/workspaces/runtime/data.tf`
2. `infra/terraform/workspaces/runtime/main.tf` (update references)
3. `infra/terraform/modules/base-lookup/main.tf` (optional module)

### Implementation Steps:

#### 1. Create comprehensive data sources
```hcl
# infra/terraform/workspaces/runtime/data.tf

# VPC lookup
data "aws_vpc" "main" {
  filter {
    name   = "tag:Environment"
    values = [local.environment]
  }

  filter {
    name   = "tag:Scope"
    values = ["base"]
  }
}

# Subnet lookups
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }

  filter {
    name   = "tag:Type"
    values = ["public"]
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }

  filter {
    name   = "tag:Type"
    values = ["private"]
  }
}

# Security group lookups
data "aws_security_group" "alb" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-${local.environment}-alb-sg"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

data "aws_security_group" "ecs_tasks" {
  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-${local.environment}-ecs-tasks-sg"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# ECR repository lookups
data "aws_ecr_repository" "backend" {
  name = "${var.product_domain}-${local.environment}-backend"
}

data "aws_ecr_repository" "frontend" {
  name = "${var.product_domain}-${local.environment}-frontend"
}

# ALB lookup
data "aws_lb" "main" {
  name = "${var.project_name}-${local.environment}-alb"
}

# Route53 zone lookup
data "aws_route53_zone" "main" {
  name = var.domain_name
}
```

#### 2. Update all references in runtime resources
```hcl
# Example updates in runtime/main.tf

resource "aws_lb_target_group" "frontend" {
  vpc_id = data.aws_vpc.main.id  # Instead of aws_vpc.main[0].id
  # ...
}

resource "aws_ecs_service" "frontend" {
  network_configuration {
    subnets         = data.aws_subnets.private.ids
    security_groups = [data.aws_security_group.ecs_tasks.id]
  }
  # ...
}
```

### Testing:
```bash
# Verify data sources work
cd infra/terraform/workspaces/runtime
terraform plan -var-file="../../environments/dev.tfvars"

# Should show no errors about missing resources
```

---

## PR5: Makefile Integration and Commands

### Branch: `feat/terraform-workspaces-pr5-makefile`

### Files to Modify:
1. `Makefile.infra`
2. `infra/scripts/workspace-deploy.sh`
3. `infra/scripts/workspace-destroy.sh`
4. `infra/scripts/workspace-status.sh`

### Implementation Steps:

#### 1. Update Makefile.infra with workspace commands
```makefile
# Workspace management targets
.PHONY: infra-workspace-init-base infra-workspace-init-runtime

infra-workspace-init-base: ## Initialize base infrastructure workspace
	@echo "$(CYAN)Initializing base workspace for $(ENV)...$(NC)"
	@./infra/scripts/workspace-init.sh base $(ENV)
	@echo "$(GREEN)✓ Base workspace initialized$(NC)"

infra-workspace-init-runtime: ## Initialize runtime infrastructure workspace
	@echo "$(CYAN)Initializing runtime workspace for $(ENV)...$(NC)"
	@./infra/scripts/workspace-init.sh runtime $(ENV)
	@echo "$(GREEN)✓ Runtime workspace initialized$(NC)"

infra-up-base: infra-workspace-init-base ## Deploy base infrastructure
	@echo "$(CYAN)Deploying base infrastructure...$(NC)"
	@cd infra/terraform/workspaces/base && \
		terraform apply -var-file="../../environments/$(ENV).tfvars" $(TF_ARGS)
	@echo "$(GREEN)✓ Base infrastructure deployed$(NC)"

infra-up-runtime: infra-workspace-init-runtime ## Deploy runtime infrastructure
	@echo "$(CYAN)Deploying runtime infrastructure...$(NC)"
	@cd infra/terraform/workspaces/runtime && \
		terraform apply -var-file="../../environments/$(ENV).tfvars" $(TF_ARGS)
	@echo "$(GREEN)✓ Runtime infrastructure deployed$(NC)"

infra-down-runtime: infra-workspace-init-runtime ## Destroy runtime infrastructure
	@echo "$(RED)Destroying runtime infrastructure...$(NC)"
	@cd infra/terraform/workspaces/runtime && \
		terraform destroy -var-file="../../environments/$(ENV).tfvars" $(TF_ARGS)
	@echo "$(GREEN)✓ Runtime infrastructure destroyed$(NC)"

infra-down-base: infra-workspace-init-base ## Destroy base infrastructure (DANGEROUS)
	@if [ "$(CONFIRM)" != "destroy-base" ]; then \
		echo "$(RED)ERROR: Base destruction requires CONFIRM=destroy-base$(NC)"; \
		exit 1; \
	fi
	@cd infra/terraform/workspaces/base && \
		terraform destroy -var-file="../../environments/$(ENV).tfvars" $(TF_ARGS)
	@echo "$(GREEN)✓ Base infrastructure destroyed$(NC)"

infra-status: ## Show workspace status
	@./infra/scripts/workspace-status.sh $(ENV)
```

#### 2. Create workspace status script
```bash
#!/bin/bash
# infra/scripts/workspace-status.sh

ENV=$1

echo "=== Terraform Workspace Status for $ENV ==="
echo ""

echo "Base Workspace (base-$ENV):"
cd infra/terraform/workspaces/base
terraform workspace select base-$ENV 2>/dev/null
terraform output -json | jq -r 'keys[]' | head -5
echo ""

echo "Runtime Workspace (runtime-$ENV):"
cd ../runtime
terraform workspace select runtime-$ENV 2>/dev/null
terraform output -json | jq -r 'keys[]' | head -5
```

### Testing:
```bash
# Test new commands
make infra-up-base ENV=dev
make infra-up-runtime ENV=dev
make infra-status ENV=dev
make infra-down-runtime ENV=dev
# Verify base still exists
make infra-status ENV=dev
```

---

## PR6: Documentation and Testing

### Branch: `feat/terraform-workspaces-pr6-docs`

### Files to Create/Modify:
1. `infra/terraform/WORKSPACES.md`
2. `infra/terraform/MIGRATION.md`
3. `infra/terraform/RUNBOOK.md`
4. `infra/terraform/TROUBLESHOOTING.md`
5. `infra/terraform/README.md` (update)
6. `.github/workflows/terraform-test.yml`

### Implementation Steps:

#### 1. Create comprehensive workspace documentation
```markdown
# infra/terraform/WORKSPACES.md

## Terraform Workspace Architecture

### Overview
We use Terraform workspaces to separate base (persistent) and runtime (ephemeral) infrastructure.

### Workspace Structure
- **base-{env}**: VPC, NAT, ECR, Route53 - rarely changed
- **runtime-{env}**: ECS, ALB listeners - frequently updated

### Common Operations

#### Deploy everything
```bash
make infra-up-base ENV=dev
make infra-up-runtime ENV=dev
```

#### Nightly shutdown
```bash
make infra-down-runtime ENV=dev
```

#### Morning startup
```bash
make infra-up-runtime ENV=dev
```
```

#### 2. Create migration guide
```markdown
# infra/terraform/MIGRATION.md

## Migration from Single State to Workspaces

### Prerequisites
1. Backup current state
2. No pending changes
3. Maintenance window scheduled

### Migration Steps

#### Step 1: Export current state
```bash
terraform state pull > backup.tfstate
```

#### Step 2: Import to base workspace
```bash
cd infra/terraform/workspaces/base
terraform import aws_vpc.main vpc-xxx
terraform import aws_subnet.public[0] subnet-xxx
# ... continue for all base resources
```

#### Step 3: Import to runtime workspace
```bash
cd infra/terraform/workspaces/runtime
terraform import aws_ecs_cluster.main arn:aws:ecs:xxx
# ... continue for all runtime resources
```

#### Step 4: Verify
```bash
make infra-status ENV=dev
```
```

#### 3. Create operational runbook
```markdown
# infra/terraform/RUNBOOK.md

## Operational Runbook

### Daily Operations

#### Morning Startup (8 AM)
```bash
make infra-up-runtime ENV=dev
make infra-status ENV=dev
```

#### Evening Shutdown (8 PM)
```bash
make infra-down-runtime ENV=dev
```

### Deployment Operations

#### Deploy Code Changes
```bash
# Only affects runtime workspace
make deploy ENV=dev
```

#### Infrastructure Updates
```bash
# Base changes (rare)
make infra-up-base ENV=dev

# Runtime changes (common)
make infra-up-runtime ENV=dev
```

### Emergency Procedures

#### Full Recovery
```bash
make infra-up-base ENV=dev
make infra-up-runtime ENV=dev
make deploy ENV=dev
```
```

#### 4. Create troubleshooting guide
```markdown
# infra/terraform/TROUBLESHOOTING.md

## Common Issues and Solutions

### Issue: "No matching VPC found"
**Cause**: Runtime workspace can't find base resources
**Solution**:
1. Verify base workspace deployed: `make infra-status ENV=dev`
2. Check tags on base resources
3. Redeploy base if needed: `make infra-up-base ENV=dev`

### Issue: "Backend initialization failed"
**Cause**: S3 backend not accessible
**Solution**:
1. Check AWS credentials
2. Verify S3 bucket exists
3. Check backend config file

### Issue: "Workspace already exists"
**Cause**: Trying to create existing workspace
**Solution**: Use `terraform workspace select` instead
```

#### 5. Add CI/CD tests
```yaml
# .github/workflows/terraform-test.yml

name: Terraform Workspace Tests

on:
  pull_request:
    paths:
      - 'infra/terraform/**'

jobs:
  test-workspaces:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Test Base Workspace Init
        run: |
          cd infra/terraform/workspaces/base
          terraform init -backend=false
          terraform validate

      - name: Test Runtime Workspace Init
        run: |
          cd infra/terraform/workspaces/runtime
          terraform init -backend=false
          terraform validate

      - name: Check Workspace Dependencies
        run: |
          ./infra/scripts/check-workspace-deps.sh
```

### Testing:
```bash
# Full integration test
make infra-up-base ENV=dev
make infra-up-runtime ENV=dev
make infra-down-runtime ENV=dev
make infra-up-runtime ENV=dev
make infra-status ENV=dev

# Verify documentation
grep -r "workspace" infra/terraform/*.md
```

---

## Success Criteria Checklist

After all PRs are complete, verify:

- [ ] Base and runtime in separate workspaces
- [ ] Each workspace has independent state
- [ ] Runtime references base via data sources
- [ ] `make infra-down-runtime` works without errors
- [ ] `make infra-up-runtime` restores service
- [ ] Base resources unchanged during runtime operations
- [ ] All Makefile commands updated
- [ ] Documentation complete
- [ ] Migration guide tested
- [ ] CI/CD pipeline updated
- [ ] Cost optimization verified

## Rollback Plan

If issues arise during implementation:

1. **Stop all changes immediately**
2. **Restore from backup**: `terraform state push backup.tfstate`
3. **Revert code changes**: `git revert HEAD~n`
4. **Verify infrastructure intact**: `terraform plan`
5. **Document lessons learned**
6. **Re-plan approach**

---
**Remember**: Each PR should be atomic and leave the infrastructure in a working state. Test thoroughly in dev before proceeding to the next PR.