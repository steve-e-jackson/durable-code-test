# Application Load Balancer and DNS Configuration

## PR4: Load Balancing and DNS Infrastructure

### Overview
This PR implements the Application Load Balancer (ALB), SSL/TLS certificates via AWS Certificate Manager (ACM), and DNS configuration through Route53. The ALB serves as the entry point for all traffic, distributing requests between frontend and backend ECS services with health checking and automatic failover.

### Components Created

#### 1. Application Load Balancer
- **Name**: `durable-code-{environment}-alb`
- **Type**: Application Load Balancer (Layer 7)
- **Scheme**: Internet-facing
- **IP Address Type**: IPv4
- **Cross-Zone Load Balancing**: Disabled (cost optimization)
- **Access Logs**: Production only (cost optimization)
- **Estimated Cost**: ~$18/month (fixed)

#### 2. Target Groups

##### Frontend Target Group
- **Port**: 3000
- **Protocol**: HTTP
- **Target Type**: IP (required for Fargate)
- **Health Check Path**: `/`
- **Health Check Interval**: 30s (prod) / 60s (dev)
- **Stickiness**: Enabled (1 day cookie)
- **Deregistration Delay**: 30s (prod) / 10s (dev)

##### Backend Target Group
- **Port**: 8000
- **Protocol**: HTTP
- **Target Type**: IP (required for Fargate)
- **Health Check Path**: `/health`
- **Health Check Interval**: 30s (prod) / 60s (dev)
- **Stickiness**: Disabled (API is stateless)
- **Deregistration Delay**: 30s (prod) / 10s (dev)

#### 3. Listeners

##### HTTP Listener (Port 80)
- **Dev/No HTTPS**: Forwards to frontend target group
- **Production with HTTPS**: Redirects to HTTPS (301)
- **Routing Rules**:
  - `/api/*`, `/health`, `/docs` → Backend target group
  - Default → Frontend target group

##### HTTPS Listener (Port 443) - Production Only
- **SSL Policy**: ELBSecurityPolicy-TLS-1-2-2017-01
- **Certificate**: ACM certificate (when configured)
- **Default Action**: Forward to frontend
- **Same routing rules as HTTP

#### 4. SSL/TLS Certificate (ACM)

##### Certificate Configuration
- **Domain**: Primary domain + wildcards
- **Subject Alternative Names**:
  - `*.{domain}` - Wildcard for all subdomains
  - `{environment}.{domain}` - Environment-specific
  - `api.{domain}` - API subdomain
  - `api-{environment}.{domain}` - Environment-specific API
- **Validation Method**: DNS validation (automatic)
- **Renewal**: Automatic via ACM
- **Cost**: FREE

#### 5. Route53 DNS Configuration

##### Hosted Zone
- **Name**: Primary domain
- **Type**: Public hosted zone
- **Cost**: $0.50/month per zone

##### DNS Records Created
- **A Records**:
  - Apex domain → ALB
  - www subdomain → ALB
  - api subdomain → ALB
  - Environment subdomain → ALB (non-prod)
- **AAAA Records**: IPv6 equivalents
- **Validation Records**: For ACM certificate

##### Health Checks (Production Only)
- **Type**: HTTPS
- **Path**: `/`
- **Interval**: 30 seconds
- **Failure Threshold**: 3 checks
- **CloudWatch Alarm**: Triggers on failure

### Security Features

#### 1. Security Groups
- ALB allows inbound 80/443 from anywhere
- ALB allows outbound to ECS tasks only
- ECS tasks accept traffic only from ALB

#### 2. HTTPS/TLS
- Enforced redirect in production
- TLS 1.2 minimum
- Strong cipher suites
- Certificate auto-renewal

#### 3. WAF (Optional - Not Enabled)
- Can be added for DDoS protection
- Additional cost: ~$10-20/month

### Cost Optimization

#### Fixed Costs
- **ALB**: ~$18/month (always running)
- **Route53 Zone**: $0.50/month
- **Data Transfer**: $0.09/GB out

#### Variable Costs
- **Route53 Queries**: $0.40 per million
- **ALB LCUs**: Based on traffic volume

#### Cost Saving Measures
1. Cross-zone load balancing disabled
2. Access logs only in production
3. Health check intervals optimized
4. Deregistration delays minimized in dev

### Monitoring and Alarms

#### CloudWatch Alarms Created
1. **Unhealthy Hosts** - Triggers when targets unhealthy
2. **High Latency** - Triggers on >2s response time
3. **Certificate Expiry** - 30 days before expiration
4. **Route53 Health** - Domain availability

#### Metrics Available
- Request count
- Target response time
- HTTP error codes (4xx, 5xx)
- Active connection count
- Healthy/unhealthy host count

### Prerequisites

#### Before Deployment
1. AWS account with appropriate permissions
2. Domain name (optional - can use ALB DNS)
3. Valid email for certificate validation

#### After Deployment
1. Update nameservers at domain registrar
2. Wait for DNS propagation (up to 48 hours)
3. Validate certificate (automatic with DNS)

### Deployment Instructions

```bash
# 1. Review planned changes
make infra-plan ENV=dev

# 2. Deploy ALB and DNS infrastructure
make infra-up ENV=dev

# 3. Get ALB URL for testing
make infra-output ENV=dev | grep alb_url

# 4. Test without domain
curl http://<alb-dns-name>

# 5. When domain is ready, update variables
# Edit infra/environments/dev.tfvars:
# domain_name = "your-domain.com"
# create_route53_zone = true

# 6. Apply domain configuration
make infra-up ENV=dev

# 7. Get nameservers for domain registrar
make infra-output ENV=dev | grep name_servers
```

### Testing

#### Health Check Endpoints
```bash
# Frontend health
curl http://<alb-url>/

# Backend health
curl http://<alb-url>/health

# API documentation
curl http://<alb-url>/docs
```

#### DNS Verification
```bash
# Check DNS resolution (after propagation)
nslookup your-domain.com

# Verify certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Troubleshooting

#### Common Issues

**503 Service Unavailable**
- ECS tasks not running
- Health checks failing
- Security group misconfiguration
- Check: `aws ecs list-tasks`

**Certificate Validation Pending**
- DNS records not propagated
- Validation records incorrect
- Check: Route53 validation records

**High Latency**
- Tasks in wrong AZ
- Cross-zone traffic
- Check: CloudWatch metrics

**DNS Not Resolving**
- Nameservers not updated at registrar
- TTL not expired
- Check: `dig your-domain.com`

### Integration with ECS

The ALB automatically integrates with ECS services through:

1. **Target Group Attachments**: ECS manages registration/deregistration
2. **Health Checks**: ALB monitors task health
3. **Dynamic Ports**: Tasks use dynamic port mapping
4. **Service Discovery**: Internal DNS for service-to-service

### Future Enhancements

1. **CloudFront CDN** (PR7)
   - Global distribution
   - Static content caching
   - ~$5-10/month

2. **WAF Rules** (Future)
   - DDoS protection
   - Rate limiting
   - ~$10-20/month

3. **Custom Error Pages** (Future)
   - S3-hosted error pages
   - Better user experience

4. **Blue/Green Deployments** (PR5)
   - Zero-downtime deployments
   - Automatic rollback

### Cost Summary

| Resource | Dev Cost | Prod Cost | Notes |
|----------|----------|-----------|--------|
| ALB | $18/month | $18/month | Fixed cost |
| Route53 Zone | $0.50/month | $0.50/month | Per zone |
| ACM Certificate | FREE | FREE | Always free |
| Data Transfer | ~$1/month | ~$5/month | Depends on traffic |
| **Total** | **~$20/month** | **~$24/month** | Plus traffic |

### Architecture Diagram

```
Internet → Route53 → ALB → Target Groups → ECS Tasks
                      ↓
                   ACM Cert
                   (HTTPS)
```

### Next Steps

After ALB deployment:
1. **PR5**: GitHub Actions CI/CD Pipeline
2. **PR6**: Monitoring and CloudWatch Dashboards
3. **PR7**: CloudFront CDN (optional)

### Related Documentation

- [ECS Configuration](./ECS_README.md)
- [Networking Setup](./networking.tf)
- [AWS ALB Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [Route53 Documentation](https://docs.aws.amazon.com/route53/)
