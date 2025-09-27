#!/bin/bash
# Purpose: Check domain name availability for the Durable Code Test project and provide registration guidance
# Scope: Domain availability checking, pricing research, and registration recommendations
# Overview: This script automates the process of checking domain availability for the project,
#     providing both AWS Route53 API-based checks and fallback whois lookups for comprehensive
#     availability verification. It includes a curated list of domain name suggestions optimized
#     for the project, checks availability across multiple TLDs (.dev, .tech, .app), and provides
#     pricing information and registration recommendations. The script handles rate limiting,
#     API authentication, and graceful fallbacks when AWS CLI is not configured. Results include
#     availability status, estimated pricing, and step-by-step registration instructions with
#     links to popular registrars and post-registration configuration guidance.
# Dependencies: AWS CLI (optional), whois utility (fallback), proper AWS credentials for Route53 Domains API
# Usage: ./check-domain-availability.sh (runs interactively with domain suggestions)
# Environment: Works with or without AWS CLI configuration, adapts checking method accordingly
# Related: Links to domain registrars, Route53 documentation, and infrastructure configuration files
# Implementation: Uses AWS Route53 Domains API when available, fallback to whois, includes rate limiting and error handling

set -e

echo "=========================================="
echo "Domain Availability Checker"
echo "=========================================="
echo ""

# List of domain suggestions
DOMAINS=(
    "codewithai.dev"
    "buildwithai.dev"
    "durablecode.dev"
    "aicodecraft.dev"
    "devwithai.dev"
    "aicodelab.dev"
    "codewithai.tech"
    "buildwithai.tech"
    "durablecode.tech"
    "codewithai.app"
    "buildwithai.app"
    "durablecode.app"
)

# Function to check domain availability
check_domain() {
    local domain=$1
    echo -n "Checking $domain... "

    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        echo "AWS CLI not found. Please install AWS CLI to check domains."
        return 1
    fi

    # Check domain availability using AWS Route53
    result=$(aws route53domains check-domain-availability --domain-name "$domain" --region us-east-1 2>/dev/null || echo "error")

    if [ "$result" == "error" ]; then
        echo "❌ Error checking (may need Route53 Domains access)"
    else
        availability=$(echo "$result" | grep -o '"Availability": "[^"]*"' | cut -d'"' -f4)

        if [ "$availability" == "AVAILABLE" ]; then
            echo "✅ AVAILABLE"

            # Try to get pricing (this might not work without proper permissions)
            price=$(aws route53domains list-prices --tld "${domain##*.}" --region us-east-1 2>/dev/null | \
                   grep -o '"Price": [0-9.]*' | head -1 | cut -d' ' -f2 || echo "check AWS console")

            if [ "$price" != "check AWS console" ]; then
                echo "   Price: ~\$$price/year"
            else
                echo "   Price: Check AWS Route53 console for pricing"
            fi
        elif [ "$availability" == "UNAVAILABLE" ]; then
            echo "❌ Taken"
        else
            echo "⚠️  Status: $availability"
        fi
    fi
}

# Alternative method using whois (if AWS CLI doesn't work)
check_domain_whois() {
    local domain=$1
    echo -n "Checking $domain (via whois)... "

    if ! command -v whois &> /dev/null; then
        echo "whois not installed. Install with: apt-get install whois (Linux) or brew install whois (Mac)"
        return 1
    fi

    # Check if domain exists in whois database
    if whois "$domain" 2>/dev/null | grep -q "No match\|NOT FOUND\|No Data Found\|available\|not found"; then
        echo "✅ Likely AVAILABLE"
    else
        echo "❌ Likely taken"
    fi
}

echo "Checking recommended domains for availability..."
echo ""

# Check if AWS CLI is configured
if aws sts get-caller-identity &>/dev/null; then
    echo "Using AWS Route53 Domains API..."
    echo ""
    for domain in "${DOMAINS[@]}"; do
        check_domain "$domain"
        sleep 1  # Rate limiting
    done
else
    echo "AWS CLI not configured. Falling back to whois lookup..."
    echo "Note: whois results may not be 100% accurate. Verify with registrar."
    echo ""
    for domain in "${DOMAINS[@]}"; do
        check_domain_whois "$domain"
    done
fi

echo ""
echo "=========================================="
echo "Domain Registration Recommendations:"
echo "=========================================="
echo ""
echo "🌟 TOP CHOICES (.dev ~\$12-15/year):"
echo "   1. codewithai.dev - Professional, clear purpose"
echo "   2. buildwithai.dev - Action-oriented"
echo "   3. durablecode.dev - Matches project name"
echo ""
echo "💰 BUDGET OPTIONS (.tech ~\$10/year):"
echo "   - codewithai.tech"
echo "   - buildwithai.tech"
echo ""
echo "🔒 SECURE OPTIONS (.app ~\$14/year, forces HTTPS):"
echo "   - codewithai.app"
echo "   - buildwithai.app"
echo ""
echo "To register a domain:"
echo "1. AWS Route53: https://console.aws.amazon.com/route53/domains"
echo "2. Namecheap: https://www.namecheap.com"
echo "3. Google Domains: https://domains.google"
echo ""
echo "After registration, update:"
echo "- infra/environments/*.tfvars with your domain name"
echo "- Set create_route53_zone = true in the appropriate environment"
echo ""
