# Purpose: Automate NS delegation from parent domain to subdomain for proper DNS hierarchy
# Scope: Route53 hosted zone delegation, NS record management, and DNS resolution chain
# Overview: This file automates the creation of NS (Name Server) delegation records in the parent
#     domain to properly delegate authority for subdomains to their respective hosted zones.
#     This is essential for ACM certificate DNS validation to work correctly and for proper
#     DNS resolution of subdomain resources. The configuration dynamically identifies the
#     parent domain zone and creates the appropriate NS records pointing to the subdomain's
#     name servers. This ensures a complete DNS resolution chain from root domain to subdomain,
#     enabling automated certificate validation and proper domain functionality. The delegation
#     is configured with appropriate TTL values for optimal DNS propagation and caching.
# Dependencies: Requires route53.tf for subdomain hosted zone creation, parent domain hosted zone must exist
# Configuration: Uses variables for domain names and conditional creation based on domain configuration
# Implementation: Creates NS delegation records automatically when subdomain hosted zones are created

# Data source to get parent domain's hosted zone
data "aws_route53_zone" "parent" {
  count = var.domain_name != "" && var.create_route53_zone ? 1 : 0
  name  = replace(var.domain_name, "/^[^.]+\\./", "") # Remove first subdomain part
}

# NS delegation records in parent domain
resource "aws_route53_record" "ns_delegation" {
  count = var.domain_name != "" && var.create_route53_zone && length(data.aws_route53_zone.parent) > 0 ? 1 : 0

  zone_id = data.aws_route53_zone.parent[0].zone_id
  name    = var.domain_name
  type    = "NS"
  ttl     = 300

  records = aws_route53_zone.main[0].name_servers
}
