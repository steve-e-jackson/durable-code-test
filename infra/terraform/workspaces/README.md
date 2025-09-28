# Terraform Workspaces

This directory contains Terraform workspace configurations for separating base (persistent) and runtime (ephemeral) infrastructure.

## Documentation

For comprehensive documentation on Terraform workspaces, including:
- Architecture overview
- Quick start guide
- Resource separation strategy
- Cost optimization approach
- Common operations
- Troubleshooting

See: [.ai/howto/terraform-workspaces.md](../../../.ai/howto/terraform-workspaces.md)

## Directory Structure

```
workspaces/
├── base/           # Base infrastructure workspace (VPC, NAT, ECR, Route53)
├── runtime/        # Runtime infrastructure workspace (ECS, ALB listeners)
└── README.md       # This file
```

## Quick Commands

```bash
# Initialize workspaces
./infra/scripts/workspace-init.sh base dev
./infra/scripts/workspace-init.sh runtime dev

# Check status
./infra/scripts/workspace-status.sh dev
```

**Note**: Full infrastructure will be added in PR2 (base) and PR3 (runtime). Currently contains workspace foundation only.