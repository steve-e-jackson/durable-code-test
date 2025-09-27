#!/bin/bash
# Purpose: Initialize Terraform backend infrastructure for secure state management
# Scope: AWS S3 bucket and DynamoDB table creation for Terraform remote state storage
# Overview: Essential setup script that creates the required AWS infrastructure for Terraform remote state management.
#     Creates an S3 bucket with encryption, versioning, and public access blocking for state storage,
#     and a DynamoDB table for state locking to prevent concurrent modifications. Validates AWS credentials,
#     configures proper naming conventions, and ensures idempotent execution for reliable infrastructure setup.

set -e  # Exit on any error

# Configuration
PROJECT_NAME="durable-code"
AWS_REGION="${AWS_REGION:-us-west-2}"
AWS_PROFILE="${AWS_PROFILE:-terraform-deploy}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text 2>/dev/null || echo "")

# Validate AWS credentials
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "Error: AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# S3 bucket name (must be globally unique)
S3_BUCKET="${PROJECT_NAME}-terraform-state"
# Alternative with account ID for uniqueness: "${PROJECT_NAME}-${AWS_ACCOUNT_ID}-terraform-state"

# DynamoDB table name
DYNAMODB_TABLE="${PROJECT_NAME}-terraform-locks"

echo "=========================================="
echo "Terraform Backend Setup Script"
echo "=========================================="
echo "AWS Account ID: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "S3 Bucket: $S3_BUCKET"
echo "DynamoDB Table: $DYNAMODB_TABLE"
echo "=========================================="
echo ""

# Function to check if S3 bucket exists
bucket_exists() {
    aws s3api head-bucket --bucket "$1" --profile "$AWS_PROFILE" 2>/dev/null
    return $?
}

# Function to check if DynamoDB table exists
table_exists() {
    aws dynamodb describe-table --table-name "$1" --region "$AWS_REGION" --profile "$AWS_PROFILE" 2>/dev/null >/dev/null
    return $?
}

# Create S3 bucket for Terraform state
echo "Checking S3 bucket..."
if bucket_exists "$S3_BUCKET"; then
    echo "✓ S3 bucket '$S3_BUCKET' already exists"
else
    echo "Creating S3 bucket '$S3_BUCKET'..."

    if [ "$AWS_REGION" == "us-east-1" ]; then
        # Special case for us-east-1
        aws s3api create-bucket --profile "$AWS_PROFILE" \
            --bucket "$S3_BUCKET" \
            --region "$AWS_REGION"
    else
        aws s3api create-bucket --profile "$AWS_PROFILE" \
            --bucket "$S3_BUCKET" \
            --region "$AWS_REGION" \
            --create-bucket-configuration LocationConstraint="$AWS_REGION"
    fi

    echo "✓ S3 bucket created successfully"
fi

# Enable versioning on S3 bucket
echo "Enabling versioning on S3 bucket..."
aws s3api put-bucket-versioning --profile "$AWS_PROFILE" \
    --bucket "$S3_BUCKET" \
    --versioning-configuration Status=Enabled
echo "✓ Versioning enabled"

# Enable encryption on S3 bucket
echo "Enabling encryption on S3 bucket..."
aws s3api put-bucket-encryption --profile "$AWS_PROFILE" \
    --bucket "$S3_BUCKET" \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
echo "✓ Encryption enabled"

# Block public access to S3 bucket
echo "Blocking public access to S3 bucket..."
aws s3api put-public-access-block --profile "$AWS_PROFILE" \
    --bucket "$S3_BUCKET" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "✓ Public access blocked"

# Add lifecycle policy for old versions (optional, for cost optimization)
echo "Adding lifecycle policy for old state versions..."
aws s3api put-bucket-lifecycle-configuration --profile "$AWS_PROFILE" \
    --bucket "$S3_BUCKET" \
    --lifecycle-configuration '{
        "Rules": [
            {
                "ID": "delete-old-versions",
                "Status": "Enabled",
                "NoncurrentVersionExpiration": {
                    "NoncurrentDays": 90
                }
            }
        ]
    }'
echo "✓ Lifecycle policy added (old versions deleted after 90 days)"

# Create DynamoDB table for state locking
echo ""
echo "Checking DynamoDB table..."
if table_exists "$DYNAMODB_TABLE"; then
    echo "✓ DynamoDB table '$DYNAMODB_TABLE' already exists"
else
    echo "Creating DynamoDB table '$DYNAMODB_TABLE'..."
    aws dynamodb create-table --profile "$AWS_PROFILE" \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION" \
        --tags \
            Key=Project,Value="$PROJECT_NAME" \
            Key=Purpose,Value=TerraformStateLocking \
            Key=ManagedBy,Value=terraform

    echo "Waiting for DynamoDB table to become active..."
    aws dynamodb wait table-exists --profile "$AWS_PROFILE" --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"
    echo "✓ DynamoDB table created successfully"
fi

# Enable point-in-time recovery for DynamoDB table (optional)
echo "Enabling point-in-time recovery for DynamoDB table..."
aws dynamodb update-continuous-backups --profile "$AWS_PROFILE" \
    --table-name "$DYNAMODB_TABLE" \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region "$AWS_REGION" 2>/dev/null || echo "Note: Point-in-time recovery may already be enabled"
echo "✓ Point-in-time recovery configured"

echo ""
echo "=========================================="
echo "✓ Terraform Backend Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update backend.tf with the following values:"
echo "   - bucket = \"$S3_BUCKET\""
echo "   - dynamodb_table = \"$DYNAMODB_TABLE\""
echo "   - region = \"$AWS_REGION\""
echo ""
echo "2. Initialize Terraform:"
echo "   cd ../terraform"
echo "   terraform init"
echo ""
echo "3. Verify the setup:"
echo "   terraform plan"
echo ""
echo "Cost estimate:"
echo "- S3: ~\$0.023 per GB per month (minimal for state files)"
echo "- DynamoDB: Pay-per-request pricing (~\$0.00 for low usage)"
echo "- Total: < \$1/month for state management"
echo ""
