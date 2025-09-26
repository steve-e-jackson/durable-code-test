# Conditional Deployment with Terraform

## Overview

This infrastructure now supports conditional deployment based on deployment scope, allowing you to manage base (persistent) and runtime (ephemeral) resources independently. This replaces the previous approach that used `-target` flags, which Terraform explicitly warns against for routine operations.

## Implementation Details

### What Changed

1. **Removed Target-Based Approach**:
   - Deleted the `generate-targets.sh` script that generated `-target` flags
   - Removed target flag generation from Makefile

2. **Added Native Terraform Conditionals**:
   - All resources now use `count` parameter with conditional logic
   - Resources check `local.should_create_resource.<scope>` to determine if they should be created
   - Resource references updated to use `[0]` indexing for conditional resources

3. **Scope-Based Resource Management**:
   - Base resources: VPC, NAT, ECR, Route53 zones, ACM certificates, ALB itself
   - Runtime resources: ECS cluster/services, ALB listeners/targets, service discovery, CloudWatch logs

## Usage

### Deployment Scopes

The infrastructure supports three deployment scopes via the `deployment_scope` variable:

1. **`base`** - Deploy only persistent, expensive-to-recreate resources
   - VPC and networking infrastructure
   - NAT Gateways (most expensive component)
   - ECR repositories
   - Route53 hosted zones
   - ACM certificates
   - Application Load Balancer

2. **`runtime`** - Deploy only ephemeral, quick-to-recreate resources
   - ECS cluster and services
   - Task definitions
   - ALB listeners and target groups
   - Service discovery
   - CloudWatch log groups
   - Route53 A records pointing to ALB

3. **`all`** - Deploy everything (default)

### Make Commands

```bash
# Deploy only base infrastructure
make infra-up SCOPE=base

# Deploy only runtime infrastructure (assumes base exists)
make infra-up SCOPE=runtime

# Deploy everything (default)
make infra-up
make infra-up SCOPE=all

# Destroy only runtime (preserves base)
make infra-down SCOPE=runtime

# Destroy only base (requires confirmation)
make infra-down SCOPE=base CONFIRM=destroy-base

# Destroy everything (requires confirmation)
make infra-down SCOPE=all CONFIRM=destroy-all
```

### Planning Changes

Always plan before applying to see what will be changed:

```bash
# Plan base resources only
make infra-plan SCOPE=base

# Plan runtime resources only
make infra-plan SCOPE=runtime

# Plan all resources
make infra-plan SCOPE=all
```

## Cost Optimization Strategy

This approach enables significant cost savings:

1. **Daily Shutdown**: Destroy runtime resources at end of day
   ```bash
   make infra-down SCOPE=runtime
   ```

2. **Morning Startup**: Recreate runtime resources
   ```bash
   make infra-up SCOPE=runtime
   ```

3. **Cost Impact**:
   - NAT Gateway (base): ~$45/month if running 24/7
   - Runtime resources: ~$10-15/month if running 24/7
   - Savings: ~66% on runtime costs with daily shutdown

## Technical Implementation

### Resource Conditionals

Each resource uses a count parameter based on scope:

```hcl
resource "aws_ecs_cluster" "main" {
  count = local.should_create_resource.ecs_cluster ? 1 : 0
  # ... configuration ...
}
```

### Helper Variables

In `resource-scopes.tf`:

```hcl
locals {
  create_base_resources = var.deployment_scope == "base" || var.deployment_scope == "all"
  create_runtime_resources = var.deployment_scope == "runtime" || var.deployment_scope == "all"

  should_create_resource = {
    vpc               = local.create_base_resources
    networking        = local.create_base_resources
    ecr               = local.create_base_resources
    ecs_cluster       = local.create_runtime_resources
    ecs_services      = local.create_runtime_resources
    # ... etc
  }
}
```

### Resource References

All references to conditional resources use indexing:

```hcl
vpc_id = aws_vpc.main[0].id  # Reference to conditional VPC
```

### Outputs

Outputs handle conditional resources with ternary operators:

```hcl
output "vpc_id" {
  value = local.should_create_resource.vpc ? aws_vpc.main[0].id : ""
}
```

## Benefits

1. **Terraform Native**: Uses Terraform's built-in conditional features
2. **No Warnings**: Eliminates `-target` flag warnings
3. **Dependency Safety**: Terraform manages all dependencies correctly
4. **State Consistency**: Single source of truth in state file
5. **Cost Effective**: Easy to shut down expensive runtime resources
6. **Fast Recovery**: Runtime resources recreate in ~5 minutes

## Migration from Previous Infrastructure

If you have existing infrastructure created before this change:

1. **Take a backup of your state**:
   ```bash
   terraform state pull > terraform.tfstate.backup
   ```

2. **Plan with `SCOPE=all`** to see the changes:
   ```bash
   make infra-plan SCOPE=all
   ```

3. **Apply with `SCOPE=all`** to update resource indexing:
   ```bash
   make infra-up SCOPE=all
   ```

The resources will be updated in place to use the new indexing scheme.

## Troubleshooting

### Error: "index [0] is out of range"

This means you're trying to reference a resource that doesn't exist in the current scope. Check:
1. Your deployment scope matches what you expect
2. Base resources exist before deploying runtime-only

### Error: "Resource not found"

Runtime resources depend on base resources. Ensure base infrastructure is deployed:
```bash
make infra-up SCOPE=base
```

### State Issues

If you encounter state inconsistencies:
1. Refresh the state: `make infra-refresh`
2. Check current resources: `make infra-state-list`
3. As last resort: `make infra-reinit`

## Best Practices

1. **Always plan before applying** to understand changes
2. **Deploy base first** when starting fresh
3. **Use cost optimization** by destroying runtime when not needed
4. **Keep base resources minimal** to reduce always-on costs
5. **Document your deployment schedule** for team awareness
